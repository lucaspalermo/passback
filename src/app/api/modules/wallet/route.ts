import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Retorna saldo e historico da carteira
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  try {
    // Busca ou cria a carteira do usuario
    let wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        withdrawals: {
          orderBy: { requestedAt: "desc" },
          take: 10,
        },
      },
    });

    // Se nao existe, cria
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId: session.user.id },
        include: {
          transactions: {
            orderBy: { createdAt: "desc" },
            take: 20,
          },
          withdrawals: {
            orderBy: { requestedAt: "desc" },
            take: 10,
          },
        },
      });
    }

    // Busca transacoes liberadas (released) para calcular pendentes de 24h
    const pendingReleases = await prisma.transaction.findMany({
      where: {
        sellerId: session.user.id,
        status: "paid",
        paidAt: { not: null },
      },
      select: {
        id: true,
        sellerAmount: true,
        paidAt: true,
        ticket: { select: { eventName: true } },
      },
    });

    // Calcula quanto sera liberado automaticamente (apos 24h)
    const now = new Date();
    const pendingAutoRelease = pendingReleases
      .filter((t) => {
        if (!t.paidAt) return false;
        const hoursSincePaid = (now.getTime() - t.paidAt.getTime()) / (1000 * 60 * 60);
        return hoursSincePaid < 24;
      })
      .reduce((sum, t) => sum + t.sellerAmount, 0);

    return NextResponse.json({
      wallet: {
        availableBalance: wallet.availableBalance,
        pendingBalance: wallet.pendingBalance,
        totalEarned: wallet.totalEarned,
        totalWithdrawn: wallet.totalWithdrawn,
        pendingAutoRelease,
      },
      transactions: wallet.transactions,
      withdrawals: wallet.withdrawals,
      pendingReleases: pendingReleases.map((t) => ({
        id: t.id,
        amount: t.sellerAmount,
        paidAt: t.paidAt,
        eventName: t.ticket?.eventName,
        hoursRemaining: t.paidAt
          ? Math.max(0, 24 - (now.getTime() - t.paidAt.getTime()) / (1000 * 60 * 60))
          : 24,
      })),
    });
  } catch (error) {
    console.error("Erro ao buscar carteira:", error);
    return NextResponse.json({ error: "Erro ao buscar carteira" }, { status: 500 });
  }
}
