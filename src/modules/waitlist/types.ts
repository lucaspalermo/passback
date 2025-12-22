// Tipos do módulo Waitlist

import type { WaitlistStatus } from "./index";

// Entrada na lista de espera
export interface WaitlistEntry {
  id: string;
  eventName: string;
  eventDate: Date;
  ticketType?: string;
  userId: string;
  maxPrice?: number;
  status: WaitlistStatus;
  position: number;
  notifiedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;

  // Relações
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

// Parâmetros para entrar na lista
export interface JoinWaitlistParams {
  eventName: string;
  eventDate: Date;
  ticketType?: string;
  userId: string;
  maxPrice?: number;
}

// Resultado de operação
export interface WaitlistResult {
  success: boolean;
  entry?: WaitlistEntry;
  position?: number;
  error?: string;
}

// Estatísticas da lista de espera
export interface WaitlistStats {
  eventName: string;
  totalWaiting: number;
  avgMaxPrice?: number;
  oldestEntry: Date;
}

// Notificação de disponibilidade
export interface AvailabilityNotification {
  entryId: string;
  ticketId: string;
  price: number;
  expiresAt: Date;
}
