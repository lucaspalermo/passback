// Serviço de Precificação Inteligente

import prisma from "@/lib/prisma";
import { isSmartPricingEnabled, PRICING_CONFIG, ConfidenceLevel } from "../index";
import type {
  PriceSuggestion,
  PriceFactorAnalysis,
  EventDemand,
  PriceSuggestionParams,
  PricingResult,
} from "../types";

/**
 * Gera sugestão de preço para um ingresso
 */
export async function getSuggestedPrice(
  params: PriceSuggestionParams
): Promise<PricingResult> {
  if (!isSmartPricingEnabled()) {
    return { success: false, error: "Módulo de precificação desabilitado" };
  }

  try {
    const factors: PriceFactorAnalysis[] = [];
    let priceMultiplier = 1;
    let totalWeight = 0;

    // 1. Fator: Proximidade do evento
    const daysUntilEvent = Math.max(
      0,
      Math.floor(
        (params.eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    );

    let proximityImpact: PriceFactorAnalysis["impact"] = "neutral";
    let proximityMultiplier = 1;

    if (daysUntilEvent <= 3) {
      // Muito próximo - pode aumentar se há demanda
      proximityMultiplier = 1.15;
      proximityImpact = "positive";
    } else if (daysUntilEvent <= 7) {
      proximityMultiplier = 1.1;
      proximityImpact = "positive";
    } else if (daysUntilEvent > 60) {
      // Muito longe - pode precisar reduzir
      proximityMultiplier = 0.95;
      proximityImpact = "negative";
    }

    factors.push({
      factor: "event_proximity",
      impact: proximityImpact,
      weight: PRICING_CONFIG.dateProximityWeight,
      value: proximityMultiplier,
      description: `${daysUntilEvent} dias até o evento`,
    });

    priceMultiplier += (proximityMultiplier - 1) * PRICING_CONFIG.dateProximityWeight;
    totalWeight += PRICING_CONFIG.dateProximityWeight;

    // 2. Fator: Demanda (buscas, favoritos, waitlist)
    const demand = await getEventDemand(params.eventName, params.eventDate);
    let demandMultiplier = 1;
    let demandImpact: PriceFactorAnalysis["impact"] = "neutral";

    if (demand.demandScore >= 80) {
      demandMultiplier = 1.2;
      demandImpact = "positive";
    } else if (demand.demandScore >= 50) {
      demandMultiplier = 1.1;
      demandImpact = "positive";
    } else if (demand.demandScore < 20) {
      demandMultiplier = 0.9;
      demandImpact = "negative";
    }

    factors.push({
      factor: "demand_level",
      impact: demandImpact,
      weight: PRICING_CONFIG.demandWeight,
      value: demandMultiplier,
      description: `Score de demanda: ${demand.demandScore}/100`,
    });

    priceMultiplier += (demandMultiplier - 1) * PRICING_CONFIG.demandWeight;
    totalWeight += PRICING_CONFIG.demandWeight;

    // 3. Fator: Histórico de preços similares
    const historicalPrice = await getHistoricalAvgPrice(
      params.eventName,
      params.ticketType
    );

    let historicalMultiplier = 1;
    let historicalImpact: PriceFactorAnalysis["impact"] = "neutral";

    if (historicalPrice) {
      const priceDiff = (params.originalPrice - historicalPrice) / historicalPrice;

      if (priceDiff > 0.2) {
        // Preço muito acima da média
        historicalMultiplier = 0.9;
        historicalImpact = "negative";
      } else if (priceDiff < -0.2) {
        // Preço muito abaixo - pode aumentar
        historicalMultiplier = 1.1;
        historicalImpact = "positive";
      }

      factors.push({
        factor: "historical_price",
        impact: historicalImpact,
        weight: PRICING_CONFIG.historicalWeight,
        value: historicalMultiplier,
        description: `Média histórica: R$ ${historicalPrice.toFixed(2)}`,
      });

      priceMultiplier += (historicalMultiplier - 1) * PRICING_CONFIG.historicalWeight;
      totalWeight += PRICING_CONFIG.historicalWeight;
    }

    // Calcula preço sugerido
    const basePrice = params.currentPrice || params.originalPrice;
    let suggestedPrice = basePrice * priceMultiplier;

    // Aplica limites de margem
    const minPrice = params.originalPrice * (1 + PRICING_CONFIG.minMarginPercent / 100);
    const maxPrice = params.originalPrice * (1 + PRICING_CONFIG.maxMarginPercent / 100);

    suggestedPrice = Math.max(minPrice, Math.min(maxPrice, suggestedPrice));
    suggestedPrice = Math.round(suggestedPrice * 100) / 100; // Arredonda para centavos

    // Determina confiança
    let confidence: ConfidenceLevel = "low";
    if (factors.length >= 3 && totalWeight >= 0.8) {
      confidence = "high";
    } else if (factors.length >= 2) {
      confidence = "medium";
    }

    // Gera reasoning
    const reasoning = generateReasoning(factors, suggestedPrice, basePrice);

    const suggestion: PriceSuggestion = {
      eventName: params.eventName,
      eventDate: params.eventDate,
      ticketType: params.ticketType,
      originalPrice: params.originalPrice,
      currentPrice: params.currentPrice,
      suggestedPrice,
      minPrice,
      maxPrice,
      confidence,
      factors,
      reasoning,
      validUntil: new Date(Date.now() + PRICING_CONFIG.suggestionCacheMinutes * 60 * 1000),
      generatedAt: new Date(),
    };

    return { success: true, suggestion };
  } catch (error) {
    console.error("[Pricing] Erro ao gerar sugestão:", error);
    return { success: false, error: "Erro ao calcular sugestão de preço" };
  }
}

/**
 * Obtém demanda do evento
 */
async function getEventDemand(
  eventName: string,
  eventDate: Date
): Promise<EventDemand> {
  // Conta favoritos para este evento
  const favoritesCount = await prisma.favorite.count({
    where: {
      OR: [
        { eventName: { contains: eventName } },
        { ticket: { eventName: { contains: eventName } } },
      ],
    },
  });

  // Conta na waitlist
  const waitlistCount = await prisma.waitlistEntry.count({
    where: {
      eventName: { contains: eventName },
      status: "waiting",
    },
  });

  // Conta ingressos disponíveis
  const availableTickets = await prisma.ticket.count({
    where: {
      eventName: { contains: eventName },
      status: "available",
    },
  });

  // Calcula score de demanda (0-100)
  let demandScore = 0;
  demandScore += Math.min(30, favoritesCount * 3);
  demandScore += Math.min(40, waitlistCount * 4);
  demandScore += availableTickets === 0 ? 30 : Math.max(0, 20 - availableTickets * 2);

  return {
    eventName,
    eventDate,
    demandScore: Math.min(100, demandScore),
    searchVolume: 0, // TODO: implementar tracking de buscas
    favoritesCount,
    waitlistCount,
    availableTickets,
    trend: demandScore > 50 ? "increasing" : "stable",
  };
}

/**
 * Obtém preço médio histórico
 */
async function getHistoricalAvgPrice(
  eventName: string,
  ticketType: string
): Promise<number | null> {
  const transactions = await prisma.transaction.findMany({
    where: {
      ticket: {
        eventName: { contains: eventName },
        ticketType: { contains: ticketType },
      },
      status: { in: ["paid", "confirmed", "released"] },
    },
    select: { amount: true },
    take: 20,
  });

  if (transactions.length === 0) {
    return null;
  }

  const total = transactions.reduce((sum, t) => sum + t.amount, 0);
  return total / transactions.length;
}

/**
 * Gera texto explicativo da sugestão
 */
function generateReasoning(
  factors: PriceFactorAnalysis[],
  suggestedPrice: number,
  basePrice: number
): string {
  const parts: string[] = [];

  const diff = ((suggestedPrice - basePrice) / basePrice) * 100;
  const direction = diff > 0 ? "aumentar" : diff < 0 ? "reduzir" : "manter";

  parts.push(
    `Sugerimos ${direction} o preço em ${Math.abs(diff).toFixed(0)}%.`
  );

  factors.forEach((f) => {
    if (f.impact === "positive") {
      parts.push(`${f.description} favorece um preço maior.`);
    } else if (f.impact === "negative") {
      parts.push(`${f.description} sugere um preço menor.`);
    }
  });

  return parts.join(" ");
}

/**
 * Verifica se preço está dentro do recomendado
 */
export async function validatePrice(
  eventName: string,
  eventDate: Date,
  ticketType: string,
  originalPrice: number,
  proposedPrice: number
): Promise<{ valid: boolean; message?: string }> {
  if (!isSmartPricingEnabled()) {
    return { valid: true };
  }

  const result = await getSuggestedPrice({
    eventName,
    eventDate,
    ticketType,
    originalPrice,
  });

  if (!result.success || !result.suggestion) {
    return { valid: true }; // Em caso de erro, permite
  }

  const { minPrice, maxPrice } = result.suggestion;

  if (proposedPrice < minPrice) {
    return {
      valid: false,
      message: `Preço muito baixo. Mínimo sugerido: R$ ${minPrice.toFixed(2)}`,
    };
  }

  if (proposedPrice > maxPrice) {
    return {
      valid: false,
      message: `Preço muito alto. Máximo sugerido: R$ ${maxPrice.toFixed(2)}`,
    };
  }

  return { valid: true };
}
