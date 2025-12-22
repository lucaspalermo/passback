// Template de email para vendedor quando ingresso é vendido
import { baseEmailTemplate, formatCurrency } from "./base";
import type { TicketSoldData } from "../types";

export function ticketSoldTemplate(
  recipientName: string,
  data: TicketSoldData
): { subject: string; html: string; text: string } {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const subject = `Ingresso vendido! - ${data.eventName}`;

  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 24px;">Voce vendeu um ingresso!</h2>

    <p>Ola, <strong>${recipientName}</strong>!</p>

    <div class="success">
      <strong>Otima noticia!</strong> Seu ingresso foi comprado por <strong>${data.buyerName}</strong>.
      O pagamento ja foi confirmado e esta em custodia.
    </div>

    <div class="highlight">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 8px 0; color: #9CA3AF; font-size: 14px;">Evento</td>
          <td style="padding: 8px 0; text-align: right; color: #fff; font-weight: 500;">${data.eventName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #9CA3AF; font-size: 14px;">Ingresso</td>
          <td style="padding: 8px 0; text-align: right; color: #fff; font-weight: 500;">${data.ticketName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #9CA3AF; font-size: 14px;">Valor da venda</td>
          <td style="padding: 8px 0; text-align: right; color: #fff; font-weight: 500;">${formatCurrency(data.amount)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #9CA3AF; font-size: 14px; border-top: 1px solid rgba(255,255,255,0.1);">Voce recebera</td>
          <td style="padding: 8px 0; text-align: right; color: #16C784; font-weight: 700; font-size: 20px; border-top: 1px solid rgba(255,255,255,0.1);">${formatCurrency(data.sellerAmount)}</td>
        </tr>
      </table>
    </div>

    <p style="color: #9CA3AF; font-size: 14px;">
      <strong>Proximo passo:</strong> Entre em contato com o comprador pela plataforma
      para combinar a entrega do ingresso. O pagamento sera liberado apos a confirmacao
      de recebimento pelo comprador.
    </p>

    <div style="text-align: center;">
      <a href="${appUrl}/minhas-vendas" class="button">
        Ver minhas vendas
      </a>
    </div>

    <div class="warning">
      <strong>Lembrete:</strong> O comprador tem ate 7 dias apos o evento para confirmar
      o recebimento ou abrir uma disputa. Apos esse prazo, o valor e liberado automaticamente.
    </div>
  `;

  const text = `
Voce vendeu um ingresso!

Ola, ${recipientName}!

Otima noticia! Seu ingresso foi comprado por ${data.buyerName}.

Detalhes:
- Evento: ${data.eventName}
- Ingresso: ${data.ticketName}
- Valor da venda: ${formatCurrency(data.amount)}
- Voce recebera: ${formatCurrency(data.sellerAmount)}

Proximo passo: Entre em contato com o comprador pela plataforma.

Ver vendas: ${appUrl}/minhas-vendas

--
Passback - Revenda segura de ingressos
  `.trim();

  return {
    subject,
    html: baseEmailTemplate(content, `Seu ingresso para ${data.eventName} foi vendido!`),
    text,
  };
}
