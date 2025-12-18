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
    const { type, description, url } = body;

    if (!type || !url) {
      return NextResponse.json(
        { error: "Tipo e URL sao obrigatorios" },
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

    // Verifica se usuario e parte da transacao
    const isBuyer = dispute.transaction.buyerId === session.user.id;
    const isSeller = dispute.transaction.sellerId === session.user.id;

    if (!isBuyer && !isSeller) {
      return NextResponse.json(
        { error: "Voce nao tem permissao para adicionar evidencias" },
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

    const evidence = await prisma.evidence.create({
      data: {
        type,
        description,
        url,
        uploadedBy: isBuyer ? "buyer" : "seller",
        disputeId,
      },
    });

    return NextResponse.json({
      message: "Evidencia adicionada com sucesso",
      evidence,
    });
  } catch (error) {
    console.error("Erro ao adicionar evidencia:", error);
    return NextResponse.json(
      { error: "Erro ao adicionar evidencia" },
      { status: 500 }
    );
  }
}
