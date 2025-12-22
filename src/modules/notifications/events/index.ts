// Sistema de eventos para integração desacoplada
// Permite disparar notificações sem modificar código existente

import {
  notifyPaymentConfirmed,
  notifyTicketSold,
  notifyDisputeOpened,
  notifyDisputeResolved,
  notifyWelcome,
  notifyPaymentReleased,
} from "../services";
import type {
  NotificationRecipient,
  PaymentConfirmedData,
  TicketSoldData,
  DisputeOpenedData,
  DisputeResolvedData,
} from "../types";

// Tipo dos eventos
type EventType =
  | "payment:confirmed"
  | "ticket:sold"
  | "dispute:opened"
  | "dispute:resolved"
  | "user:registered"
  | "payment:released";

interface EventPayload {
  "payment:confirmed": {
    buyer: NotificationRecipient;
    data: PaymentConfirmedData;
  };
  "ticket:sold": {
    seller: NotificationRecipient;
    data: TicketSoldData;
  };
  "dispute:opened": {
    opener: NotificationRecipient;
    opponent: NotificationRecipient;
    data: DisputeOpenedData;
  };
  "dispute:resolved": {
    winner: NotificationRecipient;
    loser: NotificationRecipient;
    data: DisputeResolvedData;
    amount: number;
  };
  "user:registered": {
    user: NotificationRecipient;
  };
  "payment:released": {
    seller: NotificationRecipient;
    data: { transactionId: string; ticketName: string; eventName: string; amount: number };
  };
}

type EventHandler<T extends EventType> = (payload: EventPayload[T]) => Promise<void>;

// Registro de handlers por evento
const handlers: Partial<Record<EventType, EventHandler<EventType>[]>> = {};

/**
 * Registra um handler para um tipo de evento
 */
export function on<T extends EventType>(event: T, handler: EventHandler<T>): void {
  if (!handlers[event]) {
    handlers[event] = [];
  }
  handlers[event]!.push(handler as EventHandler<EventType>);
}

/**
 * Emite um evento para todos os handlers registrados
 */
export async function emit<T extends EventType>(
  event: T,
  payload: EventPayload[T]
): Promise<void> {
  const eventHandlers = handlers[event];
  if (!eventHandlers || eventHandlers.length === 0) {
    console.log(`[Events] Nenhum handler para: ${event}`);
    return;
  }

  console.log(`[Events] Emitindo: ${event}`);

  await Promise.all(
    eventHandlers.map((handler) =>
      handler(payload).catch((err) => {
        console.error(`[Events] Erro no handler de ${event}:`, err);
      })
    )
  );
}

// ============================================
// Handlers padrão de notificação
// ============================================

// Registra os handlers de notificação
export function registerNotificationHandlers(): void {
  on("payment:confirmed", async (payload) => {
    await notifyPaymentConfirmed(payload.buyer, payload.data);
  });

  on("ticket:sold", async (payload) => {
    await notifyTicketSold(payload.seller, payload.data);
  });

  on("dispute:opened", async (payload) => {
    await notifyDisputeOpened(payload.opener, payload.opponent, payload.data);
  });

  on("dispute:resolved", async (payload) => {
    await notifyDisputeResolved(payload.winner, payload.loser, payload.data, payload.amount);
  });

  on("user:registered", async (payload) => {
    await notifyWelcome(payload.user);
  });

  on("payment:released", async (payload) => {
    await notifyPaymentReleased(payload.seller, payload.data);
  });

  console.log("[Events] Handlers de notificação registrados");
}

// Exporta tipos para uso externo
export type { EventType, EventPayload };
