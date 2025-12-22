// Módulo: Analytics Dashboard
// Dashboard de analytics para vendedores

// Feature flag
export function isAnalyticsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MODULE_ANALYTICS === "true";
}

// Configurações do módulo
export const ANALYTICS_CONFIG = {
  // Período padrão de análise (dias)
  defaultPeriodDays: 30,

  // Atualizar cache a cada N minutos
  cacheRefreshMinutes: 15,

  // Máximo de eventos no histórico
  maxHistoryEvents: 1000,

  // Exportar relatórios em PDF
  enablePdfExport: true,

  // Mostrar comparativo com período anterior
  showComparison: true,
};

// Tipos de métricas
export type MetricType =
  | "views"           // Visualizações do ingresso
  | "favorites"       // Favoritos recebidos
  | "offers"          // Ofertas recebidas
  | "conversions"     // Vendas concluídas
  | "revenue"         // Receita total
  | "avg_time"        // Tempo médio até venda
  | "price_trend";    // Tendência de preço

// Período de análise
export type AnalyticsPeriod = "7d" | "30d" | "90d" | "1y" | "all";

export * from "./types";
