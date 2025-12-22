// Módulo: Offers (Sistema de Ofertas)
// Permite usuários fazerem ofertas em ingressos

// Feature flag
export function isOffersEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MODULE_OFFERS === "true";
}

// Configurações do módulo
export const OFFERS_CONFIG = {
  // Tempo limite para pagamento após aceite (em minutos)
  paymentTimeoutMinutes: 5,

  // Valor mínimo da oferta em relação ao preço (porcentagem)
  minOfferPercentage: 50,

  // Máximo de ofertas ativas por usuário por ingresso
  maxOffersPerUserPerTicket: 1,

  // Máximo de ofertas ativas por ingresso
  maxOffersPerTicket: 10,

  // Tempo de expiração de oferta pendente (em horas)
  offerExpirationHours: 24,
};

// Status possíveis de uma oferta
export type OfferStatus =
  | "pending"      // Aguardando resposta do vendedor
  | "accepted"     // Aceita, aguardando pagamento
  | "rejected"     // Rejeitada pelo vendedor
  | "paid"         // Paga, transação criada
  | "expired"      // Expirou (tempo de pagamento ou oferta)
  | "cancelled";   // Cancelada pelo comprador

// Logs de ações
export type OfferLogAction =
  | "created"
  | "accepted"
  | "rejected"
  | "payment_started"
  | "payment_completed"
  | "payment_timeout"
  | "expired"
  | "cancelled";

export * from "./types";
