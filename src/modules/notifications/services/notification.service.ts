// Serviço principal de notificações
// Orquestra o envio por diferentes canais (email, push, sms)

import { isNotificationsEnabled, NOTIFICATIONS_CONFIG } from "../config";
import { sendEmail } from "./email.service";
import {
  paymentConfirmedTemplate,
  ticketSoldTemplate,
  disputeOpenedTemplate,
  disputeResolvedTemplate,
  welcomeTemplate,
} from "../templates";
import type {
  NotificationPayload,
  NotificationResult,
  NotificationRecipient,
  PaymentConfirmedData,
  TicketSoldData,
  DisputeOpenedData,
  DisputeResolvedData,
  WelcomeData,
} from "../types";

/**
 * Envia uma notificação genérica
 */
export async function sendNotification(
  payload: NotificationPayload
): Promise<NotificationResult[]> {
  if (!isNotificationsEnabled()) {
    console.log("[Notifications] Módulo desabilitado");
    return [];
  }

  const results: NotificationResult[] = [];
  const channels = payload.channels || ["email"];

  for (const channel of channels) {
    if (channel === "email" && NOTIFICATIONS_CONFIG.email.enabled) {
      // Implementar lógica baseada no tipo
      console.log(`[Notifications] Enviando ${payload.type} para ${payload.recipient.email}`);
    }
    // Futuro: push, sms
  }

  return results;
}

// ============================================
// Notificações específicas - API de alto nível
// ============================================

/**
 * Notifica o comprador que o pagamento foi confirmado
 */
export async function notifyPaymentConfirmed(
  buyer: NotificationRecipient,
  data: PaymentConfirmedData
): Promise<NotificationResult> {
  if (!isNotificationsEnabled() || !NOTIFICATIONS_CONFIG.templates.paymentConfirmed) {
    return { success: false, channel: "email", error: "Desabilitado" };
  }

  const template = paymentConfirmedTemplate(buyer.name, data);

  return sendEmail({
    to: buyer.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Notifica o vendedor que seu ingresso foi vendido
 */
export async function notifyTicketSold(
  seller: NotificationRecipient,
  data: TicketSoldData
): Promise<NotificationResult> {
  if (!isNotificationsEnabled() || !NOTIFICATIONS_CONFIG.templates.ticketSold) {
    return { success: false, channel: "email", error: "Desabilitado" };
  }

  const template = ticketSoldTemplate(seller.name, data);

  return sendEmail({
    to: seller.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Notifica sobre abertura de disputa (para ambas as partes)
 */
export async function notifyDisputeOpened(
  opener: NotificationRecipient,
  opponent: NotificationRecipient,
  data: DisputeOpenedData
): Promise<NotificationResult[]> {
  if (!isNotificationsEnabled() || !NOTIFICATIONS_CONFIG.templates.disputeOpened) {
    return [{ success: false, channel: "email", error: "Desabilitado" }];
  }

  const openerTemplate = disputeOpenedTemplate(opener.name, data, true);
  const opponentTemplate = disputeOpenedTemplate(opponent.name, data, false);

  const results = await Promise.all([
    sendEmail({
      to: opener.email,
      subject: openerTemplate.subject,
      html: openerTemplate.html,
      text: openerTemplate.text,
    }),
    sendEmail({
      to: opponent.email,
      subject: opponentTemplate.subject,
      html: opponentTemplate.html,
      text: opponentTemplate.text,
    }),
  ]);

  return results;
}

/**
 * Notifica sobre resolução de disputa (para ambas as partes)
 */
export async function notifyDisputeResolved(
  winner: NotificationRecipient,
  loser: NotificationRecipient,
  data: DisputeResolvedData,
  amount: number
): Promise<NotificationResult[]> {
  if (!isNotificationsEnabled() || !NOTIFICATIONS_CONFIG.templates.disputeResolved) {
    return [{ success: false, channel: "email", error: "Desabilitado" }];
  }

  const winnerTemplate = disputeResolvedTemplate(winner.name, data, true, amount);
  const loserTemplate = disputeResolvedTemplate(loser.name, data, false, amount);

  const results = await Promise.all([
    sendEmail({
      to: winner.email,
      subject: winnerTemplate.subject,
      html: winnerTemplate.html,
      text: winnerTemplate.text,
    }),
    sendEmail({
      to: loser.email,
      subject: loserTemplate.subject,
      html: loserTemplate.html,
      text: loserTemplate.text,
    }),
  ]);

  return results;
}

/**
 * Envia email de boas-vindas para novo usuário
 */
export async function notifyWelcome(
  user: NotificationRecipient
): Promise<NotificationResult> {
  if (!isNotificationsEnabled() || !NOTIFICATIONS_CONFIG.templates.welcome) {
    return { success: false, channel: "email", error: "Desabilitado" };
  }

  const data: WelcomeData = { userName: user.name };
  const template = welcomeTemplate(data);

  return sendEmail({
    to: user.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Notifica sobre liberação de pagamento ao vendedor
 */
export async function notifyPaymentReleased(
  seller: NotificationRecipient,
  data: { transactionId: string; ticketName: string; eventName: string; amount: number }
): Promise<NotificationResult> {
  if (!isNotificationsEnabled() || !NOTIFICATIONS_CONFIG.templates.ticketReleased) {
    return { success: false, channel: "email", error: "Desabilitado" };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const html = `
    <h2>Pagamento liberado!</h2>
    <p>Ola, <strong>${seller.name}</strong>!</p>
    <p>O comprador confirmou o recebimento do ingresso. Seu pagamento foi liberado!</p>
    <div class="highlight">
      <p><strong>Evento:</strong> ${data.eventName}</p>
      <p><strong>Ingresso:</strong> ${data.ticketName}</p>
      <p><strong>Valor liberado:</strong> R$ ${data.amount.toFixed(2)}</p>
    </div>
    <p><a href="${appUrl}/minhas-vendas" class="button">Ver minhas vendas</a></p>
  `;

  return sendEmail({
    to: seller.email,
    subject: `Pagamento liberado - ${data.eventName}`,
    html,
    text: `Pagamento liberado! O comprador confirmou o recebimento. Valor: R$ ${data.amount.toFixed(2)}`,
  });
}
