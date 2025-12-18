import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            phone: true,
            verified: true,
            createdAt: true,
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ingresso nao encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("Erro ao buscar ingresso:", error);
    return NextResponse.json(
      { error: "Erro ao buscar ingresso" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ingresso nao encontrado" },
        { status: 404 }
      );
    }

    if (ticket.sellerId !== session.user.id) {
      return NextResponse.json(
        { error: "Voce nao tem permissao para excluir este ingresso" },
        { status: 403 }
      );
    }

    if (ticket.status !== "available") {
      return NextResponse.json(
        { error: "Apenas ingressos disponiveis podem ser excluidos" },
        { status: 400 }
      );
    }

    await prisma.ticket.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Ingresso excluido com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir ingresso:", error);
    return NextResponse.json(
      { error: "Erro ao excluir ingresso" },
      { status: 500 }
    );
  }
}
