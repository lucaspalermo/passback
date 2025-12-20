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

    // Verifica se há transações expiradas ou pendentes antigas e remove
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        ticketId: ticket.id,
      },
    });

    if (existingTransaction) {
      const now = new Date();
      const isExpired = existingTransaction.status === "expired" ||
        (existingTransaction.status === "pending" && existingTransaction.expiresAt && new Date(existingTransaction.expiresAt) < now);

      if (isExpired) {
        // Deleta a transação expirada para permitir nova compra
        await prisma.transaction.delete({
          where: { id: existingTransaction.id },
        });

        // Libera o ingresso
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: { status: "available" },
        });

        // Atualiza o ticket local
        ticket.status = "available";
      } else if (existingTransaction.status === "pending") {
        // Transação pendente ainda válida
        return NextResponse.json(
          { error: "Este ingresso já está sendo comprado por outra pessoa" },
          { status: 400 }
        );
      } else if (["paid", "confirmed", "released"].includes(existingTransaction.status)) {
        // Transação já concluída
        return NextResponse.json(
          { error: "Este ingresso já foi vendido" },
          { status: 400 }
        );
      }
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

    // Define expiração em 5 minutos
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Cria a transação
    const transaction = await prisma.transaction.create({
      data: {
        amount,
        platformFee,
        sellerAmount,
        status: "pending",
        expiresAt,
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
