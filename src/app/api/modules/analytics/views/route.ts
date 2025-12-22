import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAnalyticsEnabled } from "@/modules/analytics";
import { recordTicketView } from "@/modules/analytics/services";
import prisma from "@/lib/prisma";

// GET - Buscar views de um ingresso (dono do ingresso ou admin)
export async function GET(request: NextRequest) {
  try {
    if (!isAnalyticsEnabled()) {
      return NextResponse.json(
        { error: "Módulo de analytics desabilitado" },
        { status: 403 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get("ticketId");

    if (!ticketId) {
      return NextResponse.json(
        { error: "ID do ingresso é obrigatório" },
        { status: 400 }
      );
    }

    // Verifica se o usuário é dono do ingresso ou admin
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { sellerId: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ingresso não encontrado" }, { status: 404 });
    }

    if (ticket.sellerId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const views = await prisma.ticketView.count({
      where: { ticketId },
    });

    return NextResponse.json({ stats: { ticketId, views } });
  } catch (error) {
    console.error("Erro ao buscar views:", error);
    return NextResponse.json(
      { error: "Erro ao buscar views" },
      { status: 500 }
    );
  }
}

// POST - Registrar visualização de ingresso
export async function POST(request: NextRequest) {
  try {
    if (!isAnalyticsEnabled()) {
      return NextResponse.json(
        { error: "Módulo de analytics desabilitado" },
        { status: 403 }
      );
    }

    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { ticketId, sessionId, source } = body;

    if (!ticketId || !sessionId) {
      return NextResponse.json(
        { error: "Dados da visualização são obrigatórios" },
        { status: 400 }
      );
    }

    await recordTicketView(ticketId, session?.user?.id, sessionId, source || "direct");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao registrar view:", error);
    return NextResponse.json(
      { error: "Erro ao registrar view" },
      { status: 500 }
    );
  }
}
