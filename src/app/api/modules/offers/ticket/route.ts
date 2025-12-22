// API Route: /api/modules/offers/ticket
// Ofertas de um ingresso específico

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isOffersEnabled } from "@/modules/offers";
import { getTicketOffers } from "@/modules/offers/services";
import prisma from "@/lib/prisma";

// GET /api/modules/offers/ticket?ticketId=xxx
export async function GET(request: NextRequest) {
  if (!isOffersEnabled()) {
    return NextResponse.json(
      { error: "Módulo de ofertas desabilitado" },
      { status: 503 }
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get("ticketId");

    if (!ticketId) {
      return NextResponse.json(
        { error: "ticketId é obrigatório" },
        { status: 400 }
      );
    }

    // Verifica se usuário é o vendedor do ingresso
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ingresso não encontrado" },
        { status: 404 }
      );
    }

    // Só o vendedor pode ver todas as ofertas
    if (ticket.sellerId !== session.user.id) {
      // Comprador só vê a própria oferta
      const myOffer = await prisma.offer.findFirst({
        where: {
          ticketId,
          buyerId: session.user.id,
          status: { in: ["pending", "accepted"] },
        },
      });

      return NextResponse.json({
        offers: myOffer ? [myOffer] : [],
        isOwner: false,
      });
    }

    const offers = await getTicketOffers(ticketId);

    return NextResponse.json({
      offers,
      isOwner: true,
    });
  } catch (error) {
    console.error("[Offers API] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao buscar ofertas" },
      { status: 500 }
    );
  }
}
