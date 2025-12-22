// API Route: /api/modules/offers/[offerId]
// Operações em uma oferta específica

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isOffersEnabled } from "@/modules/offers";
import {
  getOfferById,
  acceptOffer,
  rejectOffer,
  cancelOffer,
} from "@/modules/offers/services";

interface RouteParams {
  params: Promise<{ offerId: string }>;
}

// GET /api/modules/offers/[offerId] - Detalhes da oferta
export async function GET(request: NextRequest, { params }: RouteParams) {
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
    const { offerId } = await params;
    const offer = await getOfferById(offerId, session.user.id);

    if (!offer) {
      return NextResponse.json(
        { error: "Oferta não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ offer });
  } catch (error) {
    console.error("[Offers API] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao buscar oferta" },
      { status: 500 }
    );
  }
}

// POST /api/modules/offers/[offerId] - Ações na oferta
export async function POST(request: NextRequest, { params }: RouteParams) {
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
    const { offerId } = await params;
    const { action } = await request.json();

    if (!action) {
      return NextResponse.json(
        { error: "Ação é obrigatória" },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case "accept":
        result = await acceptOffer(offerId, session.user.id);
        break;

      case "reject":
        result = await rejectOffer(offerId, session.user.id);
        break;

      case "cancel":
        result = await cancelOffer(offerId, session.user.id);
        break;

      default:
        return NextResponse.json(
          { error: "Ação inválida" },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      offer: result.offer,
    });
  } catch (error) {
    console.error("[Offers API] Erro na ação:", error);
    return NextResponse.json(
      { error: "Erro ao processar ação" },
      { status: 500 }
    );
  }
}
