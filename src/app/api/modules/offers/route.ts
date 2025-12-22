// API Route: /api/modules/offers
// Lista e cria ofertas

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isOffersEnabled, OFFERS_CONFIG } from "@/modules/offers";
import {
  createOffer,
  getReceivedOffers,
  getSentOffers,
  getOfferCounts,
  processExpiredOffers,
} from "@/modules/offers/services";

// GET /api/modules/offers - Lista ofertas do usuário
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
    const type = searchParams.get("type") || "received"; // received | sent | counts

    // Processa ofertas expiradas antes de listar
    await processExpiredOffers();

    if (type === "counts") {
      const counts = await getOfferCounts(session.user.id);
      return NextResponse.json({ counts });
    }

    if (type === "sent") {
      const result = await getSentOffers(session.user.id);
      return NextResponse.json(result);
    }

    // Default: received
    const result = await getReceivedOffers(session.user.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[Offers API] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao listar ofertas" },
      { status: 500 }
    );
  }
}

// POST /api/modules/offers - Cria nova oferta
export async function POST(request: NextRequest) {
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
    const { ticketId, amount, message } = await request.json();

    if (!ticketId || !amount) {
      return NextResponse.json(
        { error: "ticketId e amount são obrigatórios" },
        { status: 400 }
      );
    }

    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Valor da oferta inválido" },
        { status: 400 }
      );
    }

    const result = await createOffer({
      ticketId,
      buyerId: session.user.id,
      amount,
      message,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      offer: result.offer,
      config: {
        expirationHours: OFFERS_CONFIG.offerExpirationHours,
        paymentTimeoutMinutes: OFFERS_CONFIG.paymentTimeoutMinutes,
      },
    });
  } catch (error) {
    console.error("[Offers API] Erro ao criar oferta:", error);
    return NextResponse.json(
      { error: "Erro ao criar oferta" },
      { status: 500 }
    );
  }
}
