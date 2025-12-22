// Serviço de Analytics

import prisma from "@/lib/prisma";
import { isAnalyticsEnabled, ANALYTICS_CONFIG } from "../index";
import type {
  SellerDashboard,
  DashboardSummary,
  TicketPerformance,
  ActivityEvent,
  TicketView,
  AnalyticsFilters,
} from "../types";

/**
 * Gera dashboard completo do vendedor
 */
export async function getSellerDashboard(
  userId: string,
  filters?: AnalyticsFilters
): Promise<SellerDashboard | null> {
  if (!isAnalyticsEnabled()) {
    return null;
  }

  const period = filters?.period || "30d";
  const startDate = getStartDate(period);

  // Busca dados em paralelo
  const [summary, topTickets, recentActivity] = await Promise.all([
    getDashboardSummary(userId, startDate),
    getTopTickets(userId, startDate),
    getRecentActivity(userId, 20),
  ]);

  return {
    userId,
    period,
    summary,
    charts: [], // Gerar gráficos conforme necessário
    topTickets,
    recentActivity,
    generatedAt: new Date(),
  };
}

/**
 * Resumo do dashboard
 */
async function getDashboardSummary(
  userId: string,
  startDate: Date
): Promise<DashboardSummary> {
  // Visualizações
  const totalViews = await prisma.ticketView.count({
    where: {
      ticket: { sellerId: userId },
      createdAt: { gte: startDate },
    },
  });

  // Favoritos
  const totalFavorites = await prisma.favorite.count({
    where: {
      ticket: { sellerId: userId },
      createdAt: { gte: startDate },
    },
  });

  // Ofertas
  const totalOffers = await prisma.offer.count({
    where: {
      sellerId: userId,
      createdAt: { gte: startDate },
    },
  });

  // Vendas
  const sales = await prisma.transaction.findMany({
    where: {
      sellerId: userId,
      status: { in: ["paid", "confirmed", "released"] },
      createdAt: { gte: startDate },
    },
    select: { sellerAmount: true, createdAt: true },
  });

  const totalSales = sales.length;
  const totalRevenue = sales.reduce((sum, s) => sum + s.sellerAmount, 0);

  // Taxa de conversão
  const conversionRate = totalViews > 0 ? (totalSales / totalViews) * 100 : 0;

  // Tempo médio até venda (em horas)
  let avgTimeToSale = 0;
  if (totalSales > 0) {
    const ticketsWithSale = await prisma.transaction.findMany({
      where: {
        sellerId: userId,
        status: { in: ["paid", "confirmed", "released"] },
        createdAt: { gte: startDate },
      },
      include: { ticket: true },
    });

    const totalHours = ticketsWithSale.reduce((sum, t) => {
      const hours =
        (t.createdAt.getTime() - t.ticket.createdAt.getTime()) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);

    avgTimeToSale = totalHours / ticketsWithSale.length;
  }

  return {
    totalViews,
    totalFavorites,
    totalOffers,
    totalSales,
    totalRevenue,
    conversionRate: Math.round(conversionRate * 100) / 100,
    avgTimeToSale: Math.round(avgTimeToSale),
  };
}

/**
 * Top ingressos por performance
 */
async function getTopTickets(
  userId: string,
  startDate: Date
): Promise<TicketPerformance[]> {
  const tickets = await prisma.ticket.findMany({
    where: { sellerId: userId },
    include: {
      _count: {
        select: {
          favorites: true,
          offers: true,
        },
      },
      transaction: true,
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const performances: TicketPerformance[] = [];

  for (const ticket of tickets) {
    const views = await prisma.ticketView.count({
      where: { ticketId: ticket.id },
    });

    const daysListed = Math.floor(
      (Date.now() - ticket.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Score de conversão baseado em engajamento
    const engagementScore = Math.min(
      100,
      (views * 0.1 + ticket._count.favorites * 2 + ticket._count.offers * 5) * 10
    );

    performances.push({
      ticketId: ticket.id,
      eventName: ticket.eventName,
      ticketType: ticket.ticketType,
      price: ticket.price,
      views,
      favorites: ticket._count.favorites,
      offers: ticket._count.offers,
      status: ticket.status,
      daysListed,
      conversionScore: Math.round(engagementScore),
    });
  }

  return performances.sort((a, b) => b.conversionScore - a.conversionScore);
}

/**
 * Atividade recente
 */
async function getRecentActivity(
  userId: string,
  limit: number
): Promise<ActivityEvent[]> {
  const events: ActivityEvent[] = [];

  // Visualizações recentes
  const views = await prisma.ticketView.findMany({
    where: { ticket: { sellerId: userId } },
    include: { ticket: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  views.forEach((v) => {
    events.push({
      id: v.id,
      type: "view",
      ticketId: v.ticketId,
      eventName: v.ticket.eventName,
      createdAt: v.createdAt,
    });
  });

  // Favoritos recentes
  const favorites = await prisma.favorite.findMany({
    where: { ticket: { sellerId: userId } },
    include: { ticket: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  favorites.forEach((f) => {
    if (f.ticket) {
      events.push({
        id: f.id,
        type: "favorite",
        ticketId: f.ticketId!,
        eventName: f.ticket.eventName,
        createdAt: f.createdAt,
      });
    }
  });

  // Ofertas recentes
  const offers = await prisma.offer.findMany({
    where: { sellerId: userId },
    include: { ticket: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  offers.forEach((o) => {
    events.push({
      id: o.id,
      type: "offer",
      ticketId: o.ticketId,
      eventName: o.ticket.eventName,
      value: o.amount,
      createdAt: o.createdAt,
    });
  });

  // Ordena por data
  return events.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);
}

/**
 * Registra visualização de ingresso
 */
export async function recordTicketView(
  ticketId: string,
  viewerId?: string,
  sessionId?: string,
  source: TicketView["source"] = "direct"
): Promise<void> {
  if (!isAnalyticsEnabled()) {
    return;
  }

  try {
    await prisma.ticketView.create({
      data: {
        ticketId,
        viewerId,
        sessionId: sessionId || `anon-${Date.now()}`,
        source,
        duration: 0,
      },
    });
  } catch (error) {
    console.error("[Analytics] Erro ao registrar view:", error);
  }
}

/**
 * Calcula data de início baseado no período
 */
function getStartDate(period: string): Date {
  const now = new Date();
  switch (period) {
    case "7d":
      return new Date(now.setDate(now.getDate() - 7));
    case "30d":
      return new Date(now.setDate(now.getDate() - 30));
    case "90d":
      return new Date(now.setDate(now.getDate() - 90));
    case "1y":
      return new Date(now.setFullYear(now.getFullYear() - 1));
    default:
      return new Date(0); // all time
  }
}
