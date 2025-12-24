import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getPaymentByExternalReference } from "@/lib/asaas";
import { sendPaymentConfirmedBuyerEmail, sendNewSaleEmail } from "@/lib/email";

// Token secreto para proteger o endpoint
const CRON_SECRET = process.env.CRON_SECRET || "passback-cron-secret-2024";

// Formata data do evento
function formatEventDate(date: Date): string {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function GET(request: NextRequest) {
  try {
    // Verifica token de segurança
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (token !== CRON_SECRET) {
      console.log("[Reconcile] Token inválido");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    console.log("[Reconcile] Iniciando reconciliação de pagamentos...");

    // Busca transações pendentes com mais de 2 minutos (tempo para webhook chegar)
    // e menos de 24 horas (não verifica muito antigas)
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const pendingTransactions = await prisma.transaction.findMany({
      where: {
        status: "pending",
        createdAt: {
          lt: twoMinutesAgo,
          gt: twentyFourHoursAgo,
        },
      },
      include: {
        ticket: true,
        buyer: { select: { id: true, name: true, email: true, phone: true } },
        seller: { select: { id: true, name: true, email: true, phone: true } },
      },
      take: 50, // Limita para não sobrecarregar
    });

    console.log(`[Reconcile] ${pendingTransactions.length} transações pendentes encontradas`);

    const results = {
      checked: 0,
      confirmed: 0,
      expired: 0,
      stillPending: 0,
      errors: 0,
    };

    for (const transaction of pendingTransactions) {
      results.checked++;

      try {
        // Verifica se expirou (mais de 30 minutos sem pagamento)
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        if (transaction.createdAt < thirtyMinutesAgo) {
          // Marca como expirada
          await prisma.$transaction([
            prisma.transaction.update({
              where: { id: transaction.id },
              data: { status: "expired" },
            }),
            prisma.ticket.update({
              where: { id: transaction.ticketId },
              data: { status: "available" },
            }),
          ]);

          console.log(`[Reconcile] Transação ${transaction.id} expirada`);
          results.expired++;
          continue;
        }

        // Consulta o status no Asaas
        const payment = await getPaymentByExternalReference(transaction.id);

        if (!payment) {
          // Não encontrou pagamento no Asaas - ainda pendente
          results.stillPending++;
          continue;
        }

        // Verifica se o pagamento foi confirmado
        if (payment.status === "RECEIVED" || payment.status === "CONFIRMED") {
          console.log(`[Reconcile] Pagamento ${transaction.id} confirmado no Asaas!`);

          // Atualiza transação para pago
          await prisma.$transaction([
            prisma.transaction.update({
              where: { id: transaction.id },
              data: {
                status: "paid",
                asaasPaymentId: payment.id,
                paymentMethod: payment.billingType?.toLowerCase() || "pix",
                paidAt: new Date(),
              },
            }),
            prisma.ticket.update({
              where: { id: transaction.ticketId },
              data: { status: "sold" },
            }),
          ]);

          // Envia emails de notificação
          const eventDate = formatEventDate(transaction.ticket.eventDate);

          // Email para comprador
          sendPaymentConfirmedBuyerEmail(
            transaction.buyer.email,
            transaction.buyer.name,
            transaction.ticket.eventName,
            transaction.ticket.ticketType,
            eventDate,
            transaction.ticket.eventLocation,
            transaction.amount,
            transaction.seller.name,
            transaction.seller.phone,
            transaction.id
          ).catch((err) => console.error("[Reconcile] Erro email comprador:", err));

          // Email para vendedor
          sendNewSaleEmail(
            transaction.seller.email,
            transaction.seller.name,
            transaction.ticket.eventName,
            transaction.ticket.ticketType,
            transaction.amount,
            transaction.sellerAmount,
            transaction.buyer.name,
            transaction.buyer.phone,
            transaction.id
          ).catch((err) => console.error("[Reconcile] Erro email vendedor:", err));

          results.confirmed++;
        } else if (payment.status === "OVERDUE" || payment.status === "REFUNDED") {
          // Pagamento vencido ou reembolsado - expira a transação
          await prisma.$transaction([
            prisma.transaction.update({
              where: { id: transaction.id },
              data: { status: "expired" },
            }),
            prisma.ticket.update({
              where: { id: transaction.ticketId },
              data: { status: "available" },
            }),
          ]);

          console.log(`[Reconcile] Transação ${transaction.id} expirada (Asaas: ${payment.status})`);
          results.expired++;
        } else {
          // Ainda pendente no Asaas
          results.stillPending++;
        }
      } catch (error) {
        console.error(`[Reconcile] Erro ao verificar transação ${transaction.id}:`, error);
        results.errors++;
      }
    }

    console.log("[Reconcile] Resultado:", results);

    return NextResponse.json({
      success: true,
      message: "Reconciliação concluída",
      results,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Reconcile] Erro geral:", error);
    return NextResponse.json(
      { error: "Erro na reconciliação" },
      { status: 500 }
    );
  }
}

// Também aceita POST para flexibilidade
export async function POST(request: NextRequest) {
  return GET(request);
}
