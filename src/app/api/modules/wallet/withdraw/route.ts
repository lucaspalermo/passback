import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendWithdrawalRequestedEmail } from "@/lib/email";
import { strictLimiter, checkRateLimit, getIdentifier, rateLimitResponse } from "@/lib/ratelimit";
import { logWithdrawalEvent, logSecurityEvent } from "@/lib/audit";

// POST - Solicitar saque
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  // Rate limiting (3 por minuto para operações financeiras)
  const identifier = getIdentifier(request, session.user.id);
  const rateLimit = await checkRateLimit(strictLimiter(), identifier);
  if (!rateLimit.success) {
    logSecurityEvent("rate_limited", request, session.user.id, { route: "/api/modules/wallet/withdraw" });
    return rateLimitResponse(rateLimit.reset);
  }

  try {
    const { amount, pixKey, pixKeyType } = await request.json();

    // Validacoes
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Valor invalido" }, { status: 400 });
    }

    if (!pixKey || !pixKeyType) {
      return NextResponse.json({ error: "Chave PIX obrigatoria" }, { status: 400 });
    }

    // Valor minimo de saque: R$ 5,00
    if (amount < 5) {
      return NextResponse.json({ error: "Valor minimo para saque: R$ 5,00" }, { status: 400 });
    }

    // Busca carteira e dados do usuario
    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
      include: { user: { select: { name: true, email: true } } },
    });

    if (!wallet) {
      return NextResponse.json({ error: "Carteira nao encontrada" }, { status: 404 });
    }

    // Verifica saldo disponivel
    if (wallet.availableBalance < amount) {
      return NextResponse.json(
        { error: `Saldo insuficiente. Disponivel: R$ ${wallet.availableBalance.toFixed(2)}` },
        { status: 400 }
      );
    }

    // Verifica se nao tem saque pendente
    const pendingWithdrawal = await prisma.withdrawal.findFirst({
      where: {
        walletId: wallet.id,
        status: { in: ["pending", "processing"] },
      },
    });

    if (pendingWithdrawal) {
      return NextResponse.json(
        { error: "Voce ja tem um saque pendente. Aguarde a conclusao." },
        { status: 400 }
      );
    }

    // Cria o saque e atualiza o saldo em transacao
    const [withdrawal] = await prisma.$transaction([
      // Cria o saque
      prisma.withdrawal.create({
        data: {
          walletId: wallet.id,
          amount,
          pixKey,
          pixKeyType,
          status: "pending",
        },
      }),
      // Debita o saldo
      prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          availableBalance: { decrement: amount },
        },
      }),
      // Registra a transacao na carteira
      prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "debit",
          amount: -amount,
          description: "Solicitacao de saque",
          referenceType: "withdrawal",
          balanceBefore: wallet.availableBalance,
          balanceAfter: wallet.availableBalance - amount,
        },
      }),
    ]);

    // Envia email de confirmação do saque
    sendWithdrawalRequestedEmail(
      wallet.user.email,
      wallet.user.name,
      amount,
      pixKey
    ).catch((err) => console.error("[Email] Erro saque solicitado:", err));

    // Log de auditoria
    logWithdrawalEvent("requested", session.user.id, withdrawal.id, amount, { pixKeyType });

    return NextResponse.json({
      message: "Saque solicitado com sucesso",
      withdrawal: {
        id: withdrawal.id,
        amount: withdrawal.amount,
        status: withdrawal.status,
        pixKey: withdrawal.pixKey,
        requestedAt: withdrawal.requestedAt,
      },
    });
  } catch (error) {
    console.error("Erro ao solicitar saque:", error);
    return NextResponse.json({ error: "Erro ao solicitar saque" }, { status: 500 });
  }
}

// GET - Lista saques do usuario
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  try {
    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    });

    if (!wallet) {
      return NextResponse.json({ withdrawals: [] });
    }

    const withdrawals = await prisma.withdrawal.findMany({
      where: { walletId: wallet.id },
      orderBy: { requestedAt: "desc" },
    });

    return NextResponse.json({ withdrawals });
  } catch (error) {
    console.error("Erro ao listar saques:", error);
    return NextResponse.json({ error: "Erro ao listar saques" }, { status: 500 });
  }
}
