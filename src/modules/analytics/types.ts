// Tipos do módulo Analytics

import type { MetricType, AnalyticsPeriod } from "./index";

// Dashboard de vendedor
export interface SellerDashboard {
  userId: string;
  period: AnalyticsPeriod;
  summary: DashboardSummary;
  charts: ChartData[];
  topTickets: TicketPerformance[];
  recentActivity: ActivityEvent[];
  generatedAt: Date;
}

// Resumo do dashboard
export interface DashboardSummary {
  totalViews: number;
  totalFavorites: number;
  totalOffers: number;
  totalSales: number;
  totalRevenue: number;
  conversionRate: number;
  avgTimeToSale: number; // em horas
  comparison?: {
    viewsChange: number;
    salesChange: number;
    revenueChange: number;
  };
}

// Dados para gráfico
export interface ChartData {
  type: "line" | "bar" | "pie" | "area";
  metric: MetricType;
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
  }[];
}

// Performance de ingresso individual
export interface TicketPerformance {
  ticketId: string;
  eventName: string;
  ticketType: string;
  price: number;
  views: number;
  favorites: number;
  offers: number;
  status: string;
  daysListed: number;
  conversionScore: number; // 0-100
}

// Evento de atividade
export interface ActivityEvent {
  id: string;
  type: "view" | "favorite" | "offer" | "sale" | "price_change";
  ticketId: string;
  eventName: string;
  details?: string;
  value?: number;
  createdAt: Date;
}

// Registro de visualização
export interface TicketView {
  id: string;
  ticketId: string;
  viewerId?: string; // null se anônimo
  sessionId: string;
  source: "direct" | "search" | "recommendation" | "share";
  duration: number; // segundos na página
  createdAt: Date;
}

// Filtros de analytics
export interface AnalyticsFilters {
  period: AnalyticsPeriod;
  ticketIds?: string[];
  eventName?: string;
  startDate?: Date;
  endDate?: Date;
}

// Exportação de relatório
export interface ReportExport {
  format: "pdf" | "csv" | "json";
  period: AnalyticsPeriod;
  sections: ("summary" | "charts" | "tickets" | "activity")[];
}
