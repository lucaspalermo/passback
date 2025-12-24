import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendWithdrawalCompletedEmail } from "@/lib/email";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Detalhes de um saque
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  });

  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id },
      include: {
        wallet: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                cpf: true,
                pixKey: true,
              },
            },
          },
        },
      },
    });

    if (!withdrawal) {
      return NextResponse.json({ error: "Saque nao encontrado" }, { status: 404 });
    }

    return NextResponse.json({ withdrawal });
  } catch (error) {
    console.error("Erro ao buscar saque:", error);
    return NextResponse.json({ error: "Erro ao buscar saque" }, { status: 500 });
  }
}

// PUT - Processar saque (confirmar ou rejeitar)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  });

  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const { action, notes, rejectionReason, proofUrl } = await request.json();

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id },
      include: {
        wallet: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
    });

    if (!withdrawal) {
      return NextResponse.json({ error: "Saque nao encontrado" }, { status: 404 });
    }

    if (withdrawal.status === "completed") {
      return NextResponse.json({ error: "Saque ja foi concluido" }, { status: 400 });
    }

    if (withdrawal.status === "rejected") {
      return NextResponse.json({ error: "Saque ja foi rejeitado" }, { status: 400 });
    }

    if (action === "process") {
      // Marcar como em processamento
      const updated = await prisma.withdrawal.update({
        where: { id },
        data: {
          status: "processing",
          processedAt: new Date(),
          processedBy: session.user.id,
          notes,
        },
      });

      return NextResponse.json({
        message: "Saque marcado como em processamento",
        withdrawal: updated,
      });
    }

    if (action === "complete") {
      // Confirmar deposito realizado
      const updated = await prisma.$transaction([
        prisma.withdrawal.update({
          where: { id },
          data: {
            status: "completed",
            completedAt: new Date(),
            processedBy: session.user.id,
            proofUrl,
            notes,
          },
        }),
        prisma.wallet.update({
          where: { id: withdrawal.walletId },
          data: {
            totalWithdrawn: { increment: withdrawal.amount },
          },
        }),
      ]);

      // Envia email notificando o usuário que o saque foi concluído
      sendWithdrawalCompletedEmail(
        withdrawal.wallet.user.email,
        withdrawal.wallet.user.name,
        withdrawal.amount,
        withdrawal.pixKey
      ).catch((err) => console.error("[Email] Erro saque concluido:", err));

      return NextResponse.json({
        message: "Saque concluido com sucesso",
        withdrawal: updated[0],
      });
    }

    if (action === "reject") {
      if (!rejectionReason) {
        return NextResponse.json({ error: "Motivo da rejeicao obrigatorio" }, { status: 400 });
      }

      // Rejeitar e devolver saldo
      const updated = await prisma.$transaction([
        prisma.withdrawal.update({
          where: { id },
          data: {
            status: "rejected",
            rejectedAt: new Date(),
            rejectionReason,
            processedBy: session.user.id,
            notes,
          },
        }),
        // Devolve o saldo
        prisma.wallet.update({
          where: { id: withdrawal.walletId },
          data: {
            availableBalance: { increment: withdrawal.amount },
          },
        }),
        // Registra a devolucao
        prisma.walletTransaction.create({
          data: {
            walletId: withdrawal.walletId,
            type: "credit",
            amount: withdrawal.amount,
            description: `Saque rejeitado: ${rejectionReason}`,
            referenceType: "withdrawal",
            referenceId: id,
            balanceBefore: withdrawal.wallet.availableBalance,
            balanceAfter: withdrawal.wallet.availableBalance + withdrawal.amount,
          },
        }),
      ]);

      return NextResponse.json({
        message: "Saque rejeitado e saldo devolvido",
        withdrawal: updated[0],
      });
    }

    return NextResponse.json({ error: "Acao invalida" }, { status: 400 });
  } catch (error) {
    console.error("Erro ao processar saque:", error);
    return NextResponse.json({ error: "Erro ao processar saque" }, { status: 500 });
  }
}
