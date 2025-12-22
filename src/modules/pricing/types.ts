// Tipos do módulo Smart Pricing

import type { PricingFactor, ConfidenceLevel } from "./index";

// Sugestão de preço
export interface PriceSuggestion {
  ticketId?: string;
  eventName: string;
  eventDate: Date;
  ticketType: string;
  originalPrice: number;
  currentPrice?: number;
  suggestedPrice: number;
  minPrice: number;
  maxPrice: number;
  confidence: ConfidenceLevel;
  factors: PriceFactorAnalysis[];
  reasoning: string;
  validUntil: Date;
  generatedAt: Date;
}

// Análise de fator de preço
export interface PriceFactorAnalysis {
  factor: PricingFactor;
  impact: "positive" | "negative" | "neutral";
  weight: number;
  value: number;
  description: string;
}

// Histórico de preços do evento
export interface EventPriceHistory {
  eventName: string;
  ticketType: string;
  entries: PriceHistoryEntry[];
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  pricesTrend: "rising" | "falling" | "stable";
}

// Entrada no histórico de preços
export interface PriceHistoryEntry {
  price: number;
  soldAt?: Date;
  daysBeforeEvent: number;
  source: "passback" | "external";
}

// Demanda do evento
export interface EventDemand {
  eventName: string;
  eventDate: Date;
  demandScore: number; // 0-100
  searchVolume: number;
  favoritesCount: number;
  waitlistCount: number;
  availableTickets: number;
  trend: "increasing" | "decreasing" | "stable";
}

// Análise de mercado
export interface MarketAnalysis {
  eventName: string;
  ticketType: string;
  competitors: CompetitorPrice[];
  marketPosition: "below" | "average" | "above";
  priceRange: {
    min: number;
    max: number;
    avg: number;
    median: number;
  };
}

// Preço de competidor
export interface CompetitorPrice {
  source: string;
  price: number;
  ticketType: string;
  listedAt: Date;
}

// Parâmetros para sugestão de preço
export interface PriceSuggestionParams {
  eventName: string;
  eventDate: Date;
  ticketType: string;
  originalPrice: number;
  currentPrice?: number;
  seatLocation?: string;
}

// Resultado de precificação
export interface PricingResult {
  success: boolean;
  suggestion?: PriceSuggestion;
  error?: string;
}
