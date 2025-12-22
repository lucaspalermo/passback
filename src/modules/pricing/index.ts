// Módulo: Smart Pricing (Precificação Inteligente)
// Sugere preço ideal baseado em dados do evento

// Feature flag
export function isSmartPricingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MODULE_PRICING === "true";
}

// Configurações do módulo
export const PRICING_CONFIG = {
  // Margem mínima sugerida (%)
  minMarginPercent: -20, // Pode sugerir até 20% abaixo do original

  // Margem máxima sugerida (%)
  maxMarginPercent: 50, // Máximo 50% acima do original

  // Peso da proximidade do evento
  dateProximityWeight: 0.3,

  // Peso da demanda (buscas/favoritos)
  demandWeight: 0.4,

  // Peso do histórico de preços similares
  historicalWeight: 0.3,

  // Dias mínimos para o evento para sugerir aumento
  minDaysForPremium: 7,

  // Cache de sugestões (minutos)
  suggestionCacheMinutes: 60,
};

// Fatores que influenciam o preço
export type PricingFactor =
  | "event_proximity"    // Proximidade da data do evento
  | "demand_level"       // Nível de demanda
  | "supply_level"       // Quantidade disponível
  | "historical_price"   // Preços históricos similares
  | "competitor_price"   // Preços de outros vendedores
  | "event_popularity"   // Popularidade do evento
  | "seat_location";     // Localização do assento

// Confiança da sugestão
export type ConfidenceLevel = "low" | "medium" | "high";

export * from "./types";
