import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getPaymentByExternalReference } from "@/lib/asaas";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        ticket: true,
        seller: { select: { phone: true, name: true } },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transacao nao encontrada" },
        { status: 404 }
      );
    }

    // Se ainda está pendente, verifica na API do Asaas
    if (transaction.status === "pending") {
      try {
        const asaasPayment = await getPaymentByExternalReference(id);

        if (asaasPayment) {
          // Verifica se o pagamento foi confirmado no Asaas
          const paidStatuses = ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"];

          if (paidStatuses.includes(asaasPayment.status)) {
            // Atualiza a transação no banco
            await prisma.transaction.update({
              where: { id },
              data: {
                status: "paid",
                asaasPaymentId: asaasPayment.id,
                paymentMethod: "pix",
                paidAt: new Date(),
              },
            });

            // Atualiza o ingresso
            await prisma.ticket.update({
              where: { id: transaction.ticketId },
              data: { status: "sold" },
            });

            return NextResponse.json({
              status: "paid",
              sellerPhone: transaction.seller?.phone,
              sellerName: transaction.seller?.name,
              eventName: transaction.ticket?.eventName,
            });
          }
        }
      } catch (asaasError) {
        console.error("Erro ao verificar pagamento no Asaas:", asaasError);
        // Continua e retorna o status do banco
      }
    }

    return NextResponse.json({
      status: transaction.status,
      sellerPhone: transaction.seller?.phone,
      sellerName: transaction.seller?.name,
      eventName: transaction.ticket?.eventName,
    });
  } catch (error) {
    console.error("Erro ao verificar status:", error);
    return NextResponse.json(
      { error: "Erro ao verificar status" },
      { status: 500 }
    );
  }
}
