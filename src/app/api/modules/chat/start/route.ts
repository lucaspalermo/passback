import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Inicia ou retorna conversa existente
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { ticketId, transactionId } = await request.json();

    if (!ticketId && !transactionId) {
      return NextResponse.json({ error: "ticketId ou transactionId é obrigatório" }, { status: 400 });
    }

    let ticket;
    let transaction;

    if (transactionId) {
      // Busca transação
      transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { ticket: { include: { seller: true } } },
      });

      if (!transaction) {
        return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });
      }

      // Verifica se usuário é parte da transação
      if (transaction.buyerId !== session.user.id && transaction.ticket.sellerId !== session.user.id) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
      }

      ticket = transaction.ticket;
    } else {
      // Busca ticket
      ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: { seller: true },
      });

      if (!ticket) {
        return NextResponse.json({ error: "Ingresso não encontrado" }, { status: 404 });
      }
    }

    // Determina buyer e seller
    const buyerId = transaction?.buyerId || session.user.id;
    const sellerId = ticket.sellerId;

    // Não pode conversar consigo mesmo
    if (buyerId === sellerId) {
      return NextResponse.json({ error: "Não é possível iniciar conversa consigo mesmo" }, { status: 400 });
    }

    // Verifica se já existe conversa
    let conversation = await prisma.chatConversation.findFirst({
      where: {
        ticketId: ticket.id,
        buyerId,
        sellerId,
      },
    });

    // Cria conversa se não existir
    if (!conversation) {
      conversation = await prisma.chatConversation.create({
        data: {
          ticketId: ticket.id,
          buyerId,
          sellerId,
          transactionId: transaction?.id,
        },
      });
    }

    return NextResponse.json({ conversationId: conversation.id });
  } catch (error) {
    console.error("Erro ao iniciar conversa:", error);
    return NextResponse.json({ error: "Erro ao iniciar conversa" }, { status: 500 });
  }
}
