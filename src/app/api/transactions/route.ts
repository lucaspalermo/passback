import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { createPaymentPreference } from "@/lib/mercadopago";

const PLATFORM_FEE_PERCENTAGE = 0.10; // 10%

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Voce precisa estar logado para comprar" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { ticketId } = body;

    if (!ticketId) {
      return NextResponse.json(
        { error: "ID do ingresso e obrigatorio" },
        { status: 400 }
      );
    }

    // Busca o ingresso
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { seller: true },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ingresso nao encontrado" },
        { status: 404 }
      );
    }

    if (ticket.status !== "available") {
      return NextResponse.json(
        { error: "Este ingresso nao esta mais disponivel" },
        { status: 400 }
      );
    }

    if (ticket.sellerId === session.user.id) {
      return NextResponse.json(
        { error: "Voce nao pode comprar seu proprio ingresso" },
        { status: 400 }
      );
    }

    // Busca dados do comprador
    const buyer = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!buyer) {
      return NextResponse.json(
        { error: "Usuario nao encontrado" },
        { status: 404 }
      );
    }

    // Calcula taxas
    const amount = ticket.price;
    const platformFee = amount * PLATFORM_FEE_PERCENTAGE;
    const sellerAmount = amount - platformFee;

    // Cria a transação
    const transaction = await prisma.transaction.create({
      data: {
        amount,
        platformFee,
        sellerAmount,
        status: "pending",
        ticketId: ticket.id,
        buyerId: session.user.id,
        sellerId: ticket.sellerId,
      },
    });

    // Atualiza status do ingresso
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: "reserved" },
    });

    // Cria preferência de pagamento no Mercado Pago
    try {
      const preference = await createPaymentPreference({
        transactionId: transaction.id,
        ticketName: ticket.eventName,
        ticketType: ticket.ticketType,
        price: amount,
        buyerEmail: buyer.email,
        buyerName: buyer.name,
      });

      return NextResponse.json({
        transaction,
        checkoutUrl: preference.init_point,
        preferenceId: preference.id,
      });
    } catch (mpError) {
      console.error("Erro Mercado Pago:", mpError);

      // Se falhar no MP, ainda retorna a transação para fluxo manual
      return NextResponse.json({
        transaction,
        checkoutUrl: null,
        message: "Pagamento sera configurado manualmente",
      });
    }
  } catch (error) {
    console.error("Erro ao criar transacao:", error);
    return NextResponse.json(
      { error: "Erro ao processar compra" },
      { status: 500 }
    );
  }
}
