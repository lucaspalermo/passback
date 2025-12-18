import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getPayment } from "@/lib/mercadopago";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Mercado Pago envia diferentes tipos de notificação
    if (body.type === "payment") {
      const paymentId = body.data?.id;

      if (!paymentId) {
        return NextResponse.json({ received: true });
      }

      // Busca detalhes do pagamento
      const payment = await getPayment(paymentId);

      if (!payment) {
        console.error("Pagamento nao encontrado:", paymentId);
        return NextResponse.json({ received: true });
      }

      const transactionId = payment.external_reference;

      if (!transactionId) {
        console.error("Transacao nao encontrada no pagamento");
        return NextResponse.json({ received: true });
      }

      // Busca a transação
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { ticket: true },
      });

      if (!transaction) {
        console.error("Transacao nao encontrada:", transactionId);
        return NextResponse.json({ received: true });
      }

      // Atualiza status baseado no pagamento
      if (payment.status === "approved") {
        await prisma.$transaction([
          prisma.transaction.update({
            where: { id: transactionId },
            data: {
              status: "paid",
              mercadoPagoId: String(paymentId),
              paymentMethod: payment.payment_type_id || "unknown",
              paidAt: new Date(),
            },
          }),
          prisma.ticket.update({
            where: { id: transaction.ticketId },
            data: { status: "sold" },
          }),
        ]);

        console.log(`Pagamento aprovado para transacao ${transactionId}`);
      } else if (
        payment.status === "rejected" ||
        payment.status === "cancelled"
      ) {
        await prisma.$transaction([
          prisma.transaction.update({
            where: { id: transactionId },
            data: { status: "pending" },
          }),
          prisma.ticket.update({
            where: { id: transaction.ticketId },
            data: { status: "available" },
          }),
        ]);

        console.log(`Pagamento rejeitado para transacao ${transactionId}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Erro no webhook:", error);
    return NextResponse.json({ received: true });
  }
}

// Mercado Pago também pode fazer GET para validar a URL
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
