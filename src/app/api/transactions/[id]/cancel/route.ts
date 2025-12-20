import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

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
      include: { ticket: true },
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
        { error: "Voce nao tem permissao para cancelar esta transacao" },
        { status: 403 }
      );
    }

    // Verifica se a transação está pendente
    if (transaction.status !== "pending") {
      return NextResponse.json(
        { error: "Apenas transacoes pendentes podem ser canceladas" },
        { status: 400 }
      );
    }

    // Cancela a transação e libera o ingresso
    await prisma.transaction.update({
      where: { id },
      data: { status: "cancelled" },
    });

    await prisma.ticket.update({
      where: { id: transaction.ticketId },
      data: { status: "available" },
    });

    return NextResponse.json({
      success: true,
      message: "Compra cancelada com sucesso. O ingresso voltou a ficar disponivel.",
    });
  } catch (error) {
    console.error("Erro ao cancelar transacao:", error);
    return NextResponse.json(
      { error: "Erro ao cancelar compra" },
      { status: 500 }
    );
  }
}
