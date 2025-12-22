// API Route: /api/cron/transactions
// Processa transações expiradas e auto-liberação após evento

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/cron/transactions - Processa transações
// Pode ser chamado por Vercel Cron, GitHub Actions, PM2, ou qualquer scheduler
export async function GET(request: NextRequest) {
  // Verifica token de autorização
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Não autorizado" },
      { status: 401 }
    );
  }

  try {
    const now = new Date();

    // 1. Expira transações pendentes que passaram do tempo (5 minutos)
    const expiredTransactions = await prisma.transaction.findMany({
      where: {
        status: "pending",
        expiresAt: {
          lt: now,
        },
      },
      include: {
        ticket: true,
      },
    });

    let expiredCount = 0;
    for (const transaction of expiredTransactions) {
      await prisma.$transaction([
        // Marca transação como expirada
        prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: "expired" },
        }),
        // Libera o ingresso novamente
        prisma.ticket.update({
          where: { id: transaction.ticketId },
          data: { status: "available" },
        }),
      ]);
      expiredCount++;
    }

    // 2. Auto-libera pagamentos 24h após o evento
    // Busca transações "paid" onde o evento já passou há mais de 24h
    // e não há disputa aberta nem confirmação do comprador
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const paidTransactions = await prisma.transaction.findMany({
      where: {
        status: "paid",
      },
      include: {
        ticket: true,
        dispute: true,
      },
    });

    let autoReleasedCount = 0;
    for (const transaction of paidTransactions) {
      // Verifica se o evento já passou há mais de 24h
      const eventDate = new Date(transaction.ticket.eventDate);
      const releaseDeadline = new Date(eventDate.getTime() + 24 * 60 * 60 * 1000);

      // Se passou 24h do evento e não tem disputa ativa
      if (now > releaseDeadline && !transaction.dispute) {
        await prisma.$transaction([
          // Libera o pagamento para o vendedor
          prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              status: "released",
              confirmedAt: now,
            },
          }),
          // Marca ingresso como vendido
          prisma.ticket.update({
            where: { id: transaction.ticketId },
            data: { status: "sold" },
          }),
        ]);
        autoReleasedCount++;

        console.log(`[Cron] Auto-liberado: Transação ${transaction.id} - Evento: ${transaction.ticket.eventName}`);
      }
    }

    // 3. Expira ofertas aceitas sem pagamento (5 minutos)
    // Busca ofertas aceitas onde o prazo de pagamento expirou
    const expiredOffers = await prisma.offer.findMany({
      where: {
        status: "accepted",
        paymentDeadline: {
          lt: now,
        },
      },
      include: {
        ticket: true,
      },
    });

    let expiredOffersCount = 0;
    for (const offer of expiredOffers) {
      await prisma.$transaction([
        // Marca oferta como expirada
        prisma.offer.update({
          where: { id: offer.id },
          data: { status: "expired" },
        }),
        // Se o ingresso estava reservado por esta oferta, libera
        prisma.ticket.update({
          where: { id: offer.ticketId },
          data: { status: "available" },
        }),
      ]);
      expiredOffersCount++;
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results: {
        expiredTransactions: expiredCount,
        autoReleasedPayments: autoReleasedCount,
        expiredOffers: expiredOffersCount,
      },
    });
  } catch (error) {
    console.error("[Cron Transactions] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao processar transações" },
      { status: 500 }
    );
  }
}

// Configuração para Vercel Cron (executar a cada 1 minuto)
export const dynamic = "force-dynamic";
export const maxDuration = 30;
