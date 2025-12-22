// Módulo: Waitlist (Lista de Espera)
// Permite usuários entrarem em lista de espera para ingressos esgotados

// Feature flag
export function isWaitlistEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MODULE_WAITLIST === "true";
}

// Configurações do módulo
export const WAITLIST_CONFIG = {
  // Máximo de pessoas na lista por evento
  maxWaitlistSize: 100,

  // Tempo de expiração da posição na lista (em horas)
  positionExpirationHours: 48,

  // Tempo para aceitar oferta quando ingresso disponível (em minutos)
  acceptanceTimeoutMinutes: 30,

  // Notificar próximos N usuários quando ingresso disponível
  notifyNextUsers: 3,

  // Permitir definir preço máximo
  allowMaxPrice: true,
};

// Status da posição na lista
export type WaitlistStatus =
  | "waiting"      // Aguardando na fila
  | "notified"     // Notificado sobre disponibilidade
  | "accepted"     // Aceitou e está comprando
  | "purchased"    // Comprou com sucesso
  | "expired"      // Expirou o tempo
  | "cancelled";   // Cancelou manualmente

export * from "./types";
