import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ favorites: [] });
  }

  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: session.user.id },
      include: {
        ticket: {
          select: {
            id: true,
            eventName: true,
            eventDate: true,
            eventLocation: true,
            ticketType: true,
            price: true,
            status: true,
            imageUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ favorites });
  } catch (error) {
    console.error("Erro ao buscar favoritos:", error);
    return NextResponse.json({ favorites: [] });
  }
}
