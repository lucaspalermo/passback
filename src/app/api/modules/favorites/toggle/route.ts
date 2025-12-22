import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { ticketId } = await request.json();

    if (!ticketId) {
      return NextResponse.json({ error: "ticketId é obrigatório" }, { status: 400 });
    }

    // Verifica se já é favorito
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_ticketId: {
          userId: session.user.id,
          ticketId,
        },
      },
    });

    if (existing) {
      // Remove
      await prisma.favorite.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ isFavorite: false });
    } else {
      // Adiciona
      await prisma.favorite.create({
        data: {
          userId: session.user.id,
          ticketId,
        },
      });
      return NextResponse.json({ isFavorite: true });
    }
  } catch (error) {
    console.error("Erro ao toggle favorito:", error);
    return NextResponse.json({ error: "Erro ao processar" }, { status: 500 });
  }
}
