import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { createPaymentPreference } from "@/lib/mercadopago";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Voce precisa estar logado" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Busca a transação
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        ticket: true,
        buyer: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transacao nao encontrada" },
        { status: 404 }
      );
    }

    // Verifica se o usuário é o comprador
    if (transaction.buyerId !== session.user.id) {
      return NextResponse.json(
        { error: "Voce nao tem permissao para acessar esta transacao" },
        { status: 403 }
      );
    }

    // Verifica se a transação está pendente
    if (transaction.status !== "pending") {
      return NextResponse.json(
        { error: "Esta transacao nao esta mais pendente" },
        { status: 400 }
      );
    }

    // Verifica se a transação expirou
    const now = new Date();
    if (transaction.expiresAt && new Date(transaction.expiresAt) < now) {
      // Marca como expirada e libera o ingresso
      await prisma.transaction.update({
        where: { id },
        data: { status: "expired" },
      });
      await prisma.ticket.update({
        where: { id: transaction.ticketId },
        data: { status: "available" },
      });

      return NextResponse.json(
        { error: "Esta transacao expirou. O ingresso voltou a ficar disponivel." },
        { status: 400 }
      );
    }

    // Recria a preferência de pagamento no Mercado Pago
    try {
      const preference = await createPaymentPreference({
        transactionId: transaction.id,
        ticketName: transaction.ticket.eventName,
        ticketType: transaction.ticket.ticketType,
        price: transaction.amount,
        buyerEmail: transaction.buyer.email,
        buyerName: transaction.buyer.name,
      });

      return NextResponse.json({
        success: true,
        checkoutUrl: preference.init_point,
        preferenceId: preference.id,
        expiresAt: transaction.expiresAt,
      });
    } catch (mpError) {
      console.error("Erro ao criar preferencia Mercado Pago:", mpError);
      return NextResponse.json(
        { error: "Erro ao gerar link de pagamento" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Erro ao retomar pagamento:", error);
    return NextResponse.json(
      { error: "Erro ao processar solicitacao" },
      { status: 500 }
    );
  }
}
