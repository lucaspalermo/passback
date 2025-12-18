import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// APENAS PARA TESTE - Simula pagamento aprovado
// Remover em producao!

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Nao disponivel em producao" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { transactionId } = body;

    if (!transactionId) {
      return NextResponse.json(
        { error: "transactionId e obrigatorio" },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transacao nao encontrada" },
        { status: 404 }
      );
    }

    // Simula pagamento aprovado
    await prisma.$transaction([
      prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: "paid",
          mercadoPagoId: "TESTE-" + Date.now(),
          paymentMethod: "pix",
          paidAt: new Date(),
        },
      }),
      prisma.ticket.update({
        where: { id: transaction.ticketId },
        data: { status: "sold" },
      }),
    ]);

    return NextResponse.json({
      message: "Pagamento simulado com sucesso!",
      redirectUrl: `/compra/${transactionId}?status=success`,
    });
  } catch (error) {
    console.error("Erro ao simular pagamento:", error);
    return NextResponse.json(
      { error: "Erro ao simular pagamento" },
      { status: 500 }
    );
  }
}
