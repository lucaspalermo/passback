// Tipos do módulo Offers

import type { OfferStatus, OfferLogAction } from "./index";

// Oferta
export interface Offer {
  id: string;
  ticketId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  message?: string;
  status: OfferStatus;
  expiresAt: Date;
  paymentDeadline?: Date;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;

  // Relações
  ticket?: {
    id: string;
    eventName: string;
    ticketType: string;
    price: number;
    imageUrl?: string;
  };
  buyer?: {
    id: string;
    name: string;
  };
  seller?: {
    id: string;
    name: string;
  };
}

// Log de oferta
export interface OfferLog {
  id: string;
  offerId: string;
  action: OfferLogAction;
  details?: string;
  createdAt: Date;
}

// Parâmetros para criar oferta
export interface CreateOfferParams {
  ticketId: string;
  buyerId: string;
  amount: number;
  message?: string;
}

// Resultado de operação
export interface OfferResult {
  success: boolean;
  offer?: Offer;
  error?: string;
}

// Lista de ofertas com contadores
export interface OffersListResponse {
  offers: Offer[];
  stats: {
    pending: number;
    accepted: number;
    total: number;
  };
}

// Oferta para exibição em card
export interface OfferCardData {
  id: string;
  amount: number;
  originalPrice: number;
  discount: number;
  status: OfferStatus;
  buyerName: string;
  ticketName: string;
  eventName: string;
  expiresAt: Date;
  paymentDeadline?: Date;
  createdAt: Date;
}

// Contagem de ofertas
export interface OfferCounts {
  received: number;
  sent: number;
  pendingPayment: number;
}
