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
    const { id: disputeId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { message } = body;

    if (!message || message.trim().length < 5) {
      return NextResponse.json(
        { error: "Mensagem deve ter pelo menos 5 caracteres" },
        { status: 400 }
      );
    }

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        transaction: true,
      },
    });

    if (!dispute) {
      return NextResponse.json(
        { error: "Disputa nao encontrada" },
        { status: 404 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    // Verifica se usuario e parte da transacao ou admin
    const isBuyer = dispute.transaction.buyerId === session.user.id;
    const isSeller = dispute.transaction.sellerId === session.user.id;
    const isAdmin = user?.isAdmin;

    if (!isBuyer && !isSeller && !isAdmin) {
      return NextResponse.json(
        { error: "Voce nao tem permissao para enviar mensagens" },
        { status: 403 }
      );
    }

    // Verifica se a disputa ainda esta aberta
    if (!["open", "under_review"].includes(dispute.status)) {
      return NextResponse.json(
        { error: "Esta disputa ja foi encerrada" },
        { status: 400 }
      );
    }

    let sender = "buyer";
    if (isSeller) sender = "seller";
    if (isAdmin) sender = "admin";

    const disputeMessage = await prisma.disputeMessage.create({
      data: {
        message: message.trim(),
        sender,
        senderId: session.user.id,
        disputeId,
      },
    });

    // Se admin respondeu, muda status para under_review
    if (isAdmin && dispute.status === "open") {
      await prisma.dispute.update({
        where: { id: disputeId },
        data: { status: "under_review" },
      });
    }

    return NextResponse.json({
      message: "Mensagem enviada com sucesso",
      disputeMessage,
    });
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    return NextResponse.json(
      { error: "Erro ao enviar mensagem" },
      { status: 500 }
    );
  }
}
