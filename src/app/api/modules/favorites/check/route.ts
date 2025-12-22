import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ isFavorite: false });
  }

  const { searchParams } = new URL(request.url);
  const ticketId = searchParams.get("ticketId");

  if (!ticketId) {
    return NextResponse.json({ isFavorite: false });
  }

  try {
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_ticketId: {
          userId: session.user.id,
          ticketId,
        },
      },
    });

    return NextResponse.json({ isFavorite: !!favorite });
  } catch (error) {
    console.error("Erro ao verificar favorito:", error);
    return NextResponse.json({ isFavorite: false });
  }
}
