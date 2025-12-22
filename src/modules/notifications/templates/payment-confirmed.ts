// Template de email para pagamento confirmado
import { baseEmailTemplate, formatCurrency } from "./base";
import type { PaymentConfirmedData } from "../types";

export function paymentConfirmedTemplate(
  recipientName: string,
  data: PaymentConfirmedData
): { subject: string; html: string; text: string } {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const subject = `Pagamento confirmado - ${data.eventName}`;

  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 24px;">Pagamento confirmado!</h2>

    <p>Ola, <strong>${recipientName}</strong>!</p>

    <div class="success">
      <strong>Seu pagamento foi aprovado com sucesso.</strong><br>
      O vendedor foi notificado e voce recebera o ingresso em breve.
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
          <td style="padding: 8px 0; color: #9CA3AF; font-size: 14px;">Forma de pagamento</td>
          <td style="padding: 8px 0; text-align: right; color: #fff; font-weight: 500;">${data.paymentMethod === "pix" ? "PIX" : "Cartao de Credito"}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #9CA3AF; font-size: 14px; border-top: 1px solid rgba(255,255,255,0.1);">Valor pago</td>
          <td style="padding: 8px 0; text-align: right; color: #16C784; font-weight: 700; font-size: 20px; border-top: 1px solid rgba(255,255,255,0.1);">${formatCurrency(data.amount)}</td>
        </tr>
      </table>
    </div>

    <p style="color: #9CA3AF; font-size: 14px;">
      <strong>Proximo passo:</strong> Aguarde o vendedor enviar o ingresso. Apos receber
      e validar no evento, confirme o recebimento na plataforma para liberar o pagamento.
    </p>

    <div style="text-align: center;">
      <a href="${appUrl}/compra/${data.transactionId}" class="button">
        Ver detalhes da compra
      </a>
    </div>

    <div class="warning">
      <strong>Importante:</strong> Nunca compartilhe dados pessoais fora da plataforma.
      Todo o processo de entrega do ingresso deve ser feito pelo Passback.
    </div>
  `;

  const text = `
Pagamento confirmado!

Ola, ${recipientName}!

Seu pagamento foi aprovado com sucesso.

Detalhes:
- Evento: ${data.eventName}
- Ingresso: ${data.ticketName}
- Forma de pagamento: ${data.paymentMethod === "pix" ? "PIX" : "Cartao de Credito"}
- Valor pago: ${formatCurrency(data.amount)}

Proximo passo: Aguarde o vendedor enviar o ingresso.

Ver detalhes: ${appUrl}/compra/${data.transactionId}

--
Passback - Revenda segura de ingressos
  `.trim();

  return {
    subject,
    html: baseEmailTemplate(content, "Seu pagamento foi confirmado!"),
    text,
  };
}
