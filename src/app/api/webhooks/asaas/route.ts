import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  generateWhatsAppLink,
  WHATSAPP_TEMPLATES,
} from "@/modules/notifications/services/whatsapp.service";
import {
  sendPaymentConfirmedBuyerEmail,
  sendNewSaleEmail,
} from "@/lib/email";

// Formata valor para moeda BRL
function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Eventos de pagamento do Asaas
type AsaasEvent =
  | "PAYMENT_CREATED"
  | "PAYMENT_UPDATED"
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_RECEIVED"
  | "PAYMENT_OVERDUE"
  | "PAYMENT_DELETED"
  | "PAYMENT_REFUNDED"
  | "PAYMENT_PARTIALLY_REFUNDED"
  | "PAYMENT_CHARGEBACK_REQUESTED"
  | "PAYMENT_CHARGEBACK_DISPUTE"
  | "PAYMENT_AWAITING_CHARGEBACK_REVERSAL";

interface AsaasWebhookPayload {
  event: AsaasEvent;
  payment: {
    id: string;
    customer: string;
    value: number;
    netValue: number;
    status: string;
    billingType: string;
    externalReference?: string;
    paymentDate?: string;
    confirmedDate?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Validação do token de webhook (opcional mas recomendado)
    const webhookToken = request.headers.get("asaas-access-token");
    const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;

    if (expectedToken && webhookToken !== expectedToken) {
      console.warn("Webhook token inválido");
      // Ainda retorna 200 para não expor informação
      return NextResponse.json({ received: true });
    }

    const body: AsaasWebhookPayload = await request.json();

    console.log(`[Asaas Webhook] Evento: ${body.event}`, {
      paymentId: body.payment?.id,
      status: body.payment?.status,
      externalReference: body.payment?.externalReference,
    });

    // Verifica se é um evento de pagamento
    if (!body.payment || !body.payment.externalReference) {
      return NextResponse.json({ received: true });
    }

    const transactionId = body.payment.externalReference;

    // Busca a transação pelo ID (external reference)
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        ticket: true,
        buyer: { select: { id: true, name: true, phone: true, email: true } },
        seller: { select: { id: true, name: true, phone: true, email: true } },
      },
    });

    if (!transaction) {
      console.error("Transação não encontrada:", transactionId);
      return NextResponse.json({ received: true });
    }

    // Processa baseado no evento
    switch (body.event) {
      case "PAYMENT_CONFIRMED":
      case "PAYMENT_RECEIVED": {
        // Pagamento confirmado/recebido - atualiza para "paid"
        if (transaction.status === "pending") {
          await prisma.$transaction([
            prisma.transaction.update({
              where: { id: transactionId },
              data: {
                status: "paid",
                asaasPaymentId: body.payment.id,
                paymentMethod: body.payment.billingType.toLowerCase(),
                paidAt: new Date(),
              },
            }),
            prisma.ticket.update({
              where: { id: transaction.ticketId },
              data: { status: "sold" },
            }),
          ]);

          console.log(`Pagamento aprovado para transação ${transactionId}`);

          // Formata data do evento
          const eventDate = new Date(transaction.ticket.eventDate).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          // Envia email para o comprador
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
            transactionId
          ).catch((err) => console.error("[Email] Erro comprador:", err));

          // Envia email para o vendedor
          sendNewSaleEmail(
            transaction.seller.email,
            transaction.seller.name,
            transaction.ticket.eventName,
            transaction.ticket.ticketType,
            transaction.amount,
            transaction.sellerAmount,
            transaction.buyer.name,
            transaction.buyer.phone,
            transactionId
          ).catch((err) => console.error("[Email] Erro vendedor:", err));

          // Gera link de notificação para o vendedor (WhatsApp)
          if (transaction.seller.phone) {
            const notificationMessage = WHATSAPP_TEMPLATES.newPurchase(
              transaction.buyer.name,
              transaction.ticket.eventName,
              formatCurrency(transaction.amount)
            );
            const whatsappLink = generateWhatsAppLink(
              transaction.seller.phone,
              notificationMessage
            );
            console.log(`[Notificação Vendedor] ${transaction.seller.name}: ${whatsappLink}`);
          }
        }
        break;
      }

      case "PAYMENT_OVERDUE": {
        // Pagamento vencido - mantém pendente mas pode notificar
        console.log(`Pagamento vencido para transação ${transactionId}`);
        break;
      }

      case "PAYMENT_REFUNDED":
      case "PAYMENT_PARTIALLY_REFUNDED": {
        // Reembolso processado
        if (["paid", "disputed"].includes(transaction.status)) {
          await prisma.$transaction([
            prisma.transaction.update({
              where: { id: transactionId },
              data: { status: "refunded" },
            }),
            prisma.ticket.update({
              where: { id: transaction.ticketId },
              data: { status: "available" },
            }),
          ]);

          console.log(`Reembolso processado para transação ${transactionId}`);
        }
        break;
      }

      case "PAYMENT_DELETED": {
        // Pagamento deletado - volta ao status available
        if (transaction.status === "pending") {
          await prisma.$transaction([
            prisma.transaction.update({
              where: { id: transactionId },
              data: { status: "cancelled" },
            }),
            prisma.ticket.update({
              where: { id: transaction.ticketId },
              data: { status: "available" },
            }),
          ]);

          console.log(`Pagamento cancelado para transação ${transactionId}`);
        }
        break;
      }

      case "PAYMENT_CHARGEBACK_REQUESTED":
      case "PAYMENT_CHARGEBACK_DISPUTE": {
        // Chargeback/disputa iniciada pelo gateway
        if (transaction.status === "paid") {
          await prisma.transaction.update({
            where: { id: transactionId },
            data: { status: "disputed" },
          });

          console.log(`Chargeback iniciado para transação ${transactionId}`);
        }
        break;
      }

      default:
        console.log(`Evento não tratado: ${body.event}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Erro no webhook Asaas:", error);
    // Retorna 200 mesmo em erro para evitar retentativas desnecessárias
    return NextResponse.json({ received: true });
  }
}

// Asaas pode fazer GET para validar a URL do webhook
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
