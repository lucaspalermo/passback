import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isSmartPricingEnabled } from "@/modules/pricing";
import prisma from "@/lib/prisma";

// GET - Análise de mercado para um evento
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

    if (!eventName) {
      return NextResponse.json(
        { error: "Nome do evento é obrigatório" },
        { status: 400 }
      );
    }

    // Busca ingressos disponíveis para este evento
    const tickets = await prisma.ticket.findMany({
      where: {
        eventName: { contains: eventName },
        status: "available",
      },
      select: { price: true, ticketType: true },
    });

    // Busca transações concluídas para este evento
    const transactions = await prisma.transaction.findMany({
      where: {
        ticket: { eventName: { contains: eventName } },
        status: { in: ["paid", "confirmed", "released"] },
      },
      select: { amount: true },
    });

    const marketAnalysis = {
      eventName,
      availableTickets: tickets.length,
      priceRange: tickets.length > 0 ? {
        min: Math.min(...tickets.map(t => t.price)),
        max: Math.max(...tickets.map(t => t.price)),
        avg: tickets.reduce((sum, t) => sum + t.price, 0) / tickets.length,
      } : null,
      completedSales: transactions.length,
      avgSalePrice: transactions.length > 0
        ? transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length
        : null,
    };

    return NextResponse.json({ market: marketAnalysis });
  } catch (error) {
    console.error("Erro ao analisar mercado:", error);
    return NextResponse.json(
      { error: "Erro ao analisar mercado" },
      { status: 500 }
    );
  }
}
