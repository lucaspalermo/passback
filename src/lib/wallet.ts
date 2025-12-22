import prisma from "@/lib/prisma";

/**
 * Credita valor pendente na carteira do vendedor (quando pagamento e confirmado)
 */
export async function creditPendingBalance(
  sellerId: string,
  amount: number,
  transactionId: string,
  eventName: string
) {
  // Busca ou cria carteira
  let wallet = await prisma.wallet.findUnique({
    where: { userId: sellerId },
  });

  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: { userId: sellerId },
    });
  }

  // Adiciona ao saldo pendente
  await prisma.$transaction([
    prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        pendingBalance: { increment: amount },
      },
    }),
    prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "pending_credit",
        amount,
        description: `Venda: ${eventName} (aguardando liberacao)`,
        referenceType: "transaction",
        referenceId: transactionId,
        balanceBefore: wallet.pendingBalance,
        balanceAfter: wallet.pendingBalance + amount,
      },
    }),
  ]);

  return wallet;
}

/**
 * Libera valor pendente para disponivel (quando comprador confirma entrada ou apos 24h)
 */
export async function releaseToAvailableBalance(
  sellerId: string,
  amount: number,
  transactionId: string,
  eventName: string,
  reason: "confirmed" | "auto_release"
) {
  const wallet = await prisma.wallet.findUnique({
    where: { userId: sellerId },
  });

  if (!wallet) {
    console.error("Carteira nao encontrada para usuario:", sellerId);
    return null;
  }

  const description =
    reason === "confirmed"
      ? `Liberado: ${eventName} (comprador confirmou)`
      : `Liberado: ${eventName} (liberacao automatica 24h)`;

  // Move do pendente para disponivel
  await prisma.$transaction([
    prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        pendingBalance: { decrement: amount },
        availableBalance: { increment: amount },
        totalEarned: { increment: amount },
      },
    }),
    prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "pending_to_available",
        amount,
        description,
        referenceType: "transaction",
        referenceId: transactionId,
        balanceBefore: wallet.availableBalance,
        balanceAfter: wallet.availableBalance + amount,
      },
    }),
  ]);

  return wallet;
}

/**
 * Processa liberacao automatica de transacoes com mais de 24h
 */
export async function processAutoReleases() {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Busca transacoes pagas ha mais de 24h que ainda nao foram liberadas
  const transactionsToRelease = await prisma.transaction.findMany({
    where: {
      status: "paid",
      paidAt: {
        not: null,
        lte: twentyFourHoursAgo,
      },
      releasedAt: null,
    },
    include: {
      ticket: { select: { eventName: true } },
      seller: { select: { id: true, name: true } },
    },
  });

  console.log(`[AutoRelease] Encontradas ${transactionsToRelease.length} transacoes para liberar`);

  for (const transaction of transactionsToRelease) {
    try {
      // Libera o saldo
      await releaseToAvailableBalance(
        transaction.sellerId,
        transaction.sellerAmount,
        transaction.id,
        transaction.ticket?.eventName || "Ingresso",
        "auto_release"
      );

      // Atualiza a transacao
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "released",
          releasedAt: new Date(),
        },
      });

      console.log(`[AutoRelease] Liberado: ${transaction.id} - R$ ${transaction.sellerAmount}`);
    } catch (error) {
      console.error(`[AutoRelease] Erro ao liberar ${transaction.id}:`, error);
    }
  }

  return transactionsToRelease.length;
}
