// Template de email para quando uma disputa é aberta
import { baseEmailTemplate } from "./base";
import type { DisputeOpenedData } from "../types";

export function disputeOpenedTemplate(
  recipientName: string,
  data: DisputeOpenedData,
  isOpener: boolean
): { subject: string; html: string; text: string } {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const subject = isOpener
    ? `Disputa aberta - Acompanhe o processo`
    : `Uma disputa foi aberta na sua transacao`;

  const content = isOpener
    ? `
    <h2 style="margin: 0 0 16px 0; font-size: 24px;">Disputa registrada</h2>

    <p>Ola, <strong>${recipientName}</strong>!</p>

    <p>Sua disputa foi registrada com sucesso. Nossa equipe ira analisar o caso
    e entrar em contato em breve.</p>

    <div class="highlight">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 8px 0; color: #9CA3AF; font-size: 14px;">Ingresso</td>
          <td style="padding: 8px 0; text-align: right; color: #fff; font-weight: 500;">${data.ticketName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #9CA3AF; font-size: 14px;">Motivo</td>
          <td style="padding: 8px 0; text-align: right; color: #fff; font-weight: 500;">${data.reason}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #9CA3AF; font-size: 14px;">Protocolo</td>
          <td style="padding: 8px 0; text-align: right; color: #FF8A00; font-weight: 500;">${data.disputeId.substring(0, 8).toUpperCase()}</td>
        </tr>
      </table>
    </div>

    <p style="color: #9CA3AF; font-size: 14px;">
      <strong>O que acontece agora:</strong>
      <br>1. Nossa equipe vai analisar as evidencias
      <br>2. O vendedor sera notificado e podera responder
      <br>3. Uma decisao sera tomada em ate 72 horas
    </p>

    <div style="text-align: center;">
      <a href="${appUrl}/disputas/${data.disputeId}" class="button">
        Acompanhar disputa
      </a>
    </div>
    `
    : `
    <h2 style="margin: 0 0 16px 0; font-size: 24px; color: #FF8A00;">Disputa aberta</h2>

    <p>Ola, <strong>${recipientName}</strong>!</p>

    <div class="warning">
      <strong>Atencao:</strong> O comprador abriu uma disputa referente a uma transacao sua.
      O valor esta retido ate a resolucao.
    </div>

    <div class="highlight">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 8px 0; color: #9CA3AF; font-size: 14px;">Ingresso</td>
          <td style="padding: 8px 0; text-align: right; color: #fff; font-weight: 500;">${data.ticketName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #9CA3AF; font-size: 14px;">Motivo alegado</td>
          <td style="padding: 8px 0; text-align: right; color: #fff; font-weight: 500;">${data.reason}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #9CA3AF; font-size: 14px;">Protocolo</td>
          <td style="padding: 8px 0; text-align: right; color: #FF8A00; font-weight: 500;">${data.disputeId.substring(0, 8).toUpperCase()}</td>
        </tr>
      </table>
    </div>

    <p style="color: #9CA3AF; font-size: 14px;">
      <strong>O que voce deve fazer:</strong>
      <br>1. Acesse a disputa e veja os detalhes
      <br>2. Envie sua defesa com evidencias
      <br>3. Aguarde a analise da nossa equipe
    </p>

    <div style="text-align: center;">
      <a href="${appUrl}/disputas/${data.disputeId}" class="button">
        Responder disputa
      </a>
    </div>
    `;

  const text = isOpener
    ? `
Disputa registrada

Ola, ${recipientName}!

Sua disputa foi registrada com sucesso.

Detalhes:
- Ingresso: ${data.ticketName}
- Motivo: ${data.reason}
- Protocolo: ${data.disputeId.substring(0, 8).toUpperCase()}

Acompanhe: ${appUrl}/disputas/${data.disputeId}

--
Passback - Revenda segura de ingressos
    `.trim()
    : `
Disputa aberta

Ola, ${recipientName}!

O comprador abriu uma disputa referente a uma transacao sua.

Detalhes:
- Ingresso: ${data.ticketName}
- Motivo alegado: ${data.reason}
- Protocolo: ${data.disputeId.substring(0, 8).toUpperCase()}

Responda em: ${appUrl}/disputas/${data.disputeId}

--
Passback - Revenda segura de ingressos
    `.trim();

  return {
    subject,
    html: baseEmailTemplate(content, subject),
    text,
  };
}
