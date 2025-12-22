import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isSmartPricingEnabled } from "@/modules/pricing";
import { getSuggestedPrice } from "@/modules/pricing/services";
import prisma from "@/lib/prisma";

// GET - Obter sugestão de preço
export async function GET(request: NextRequest) {
  try {
    if (!isSmartPricingEnabled()) {
      return NextResponse.json(
        { error: "Módulo de precificação desabilitado" },
        { status: 403 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventName = searchParams.get("eventName");
    const eventDate = searchParams.get("eventDate");
    const ticketType = searchParams.get("ticketType");
    const originalPrice = searchParams.get("originalPrice");

    if (!eventName || !eventDate || !originalPrice) {
      return NextResponse.json(
        { error: "Nome do evento, data e preço original são obrigatórios" },
        { status: 400 }
      );
    }

    const result = await getSuggestedPrice({
      eventName,
      eventDate: new Date(eventDate),
      ticketType: ticketType || "Geral",
      originalPrice: parseFloat(originalPrice),
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ suggestion: result.suggestion });
  } catch (error) {
    console.error("Erro ao sugerir preço:", error);
    return NextResponse.json(
      { error: "Erro ao sugerir preço" },
      { status: 500 }
    );
  }
}

// POST - Análise de preço para ingresso existente
export async function POST(request: NextRequest) {
  try {
    if (!isSmartPricingEnabled()) {
      return NextResponse.json(
        { error: "Módulo de precificação desabilitado" },
        { status: 403 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { ticketId } = body;

    if (!ticketId) {
      return NextResponse.json(
        { error: "ID do ingresso é obrigatório" },
        { status: 400 }
      );
    }

    // Busca o ingresso
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ingresso não encontrado" }, { status: 404 });
    }

    if (ticket.sellerId !== session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const result = await getSuggestedPrice({
      eventName: ticket.eventName,
      eventDate: ticket.eventDate,
      ticketType: ticket.ticketType,
      originalPrice: ticket.originalPrice || ticket.price,
      currentPrice: ticket.price,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ analysis: result.suggestion });
  } catch (error) {
    console.error("Erro ao analisar preço:", error);
    return NextResponse.json(
      { error: "Erro ao analisar preço" },
      { status: 500 }
    );
  }
}
