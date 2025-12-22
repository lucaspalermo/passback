// Template de email para quando uma disputa é resolvida
import { baseEmailTemplate, formatCurrency } from "./base";
import type { DisputeResolvedData } from "../types";

export function disputeResolvedTemplate(
  recipientName: string,
  data: DisputeResolvedData,
  isWinner: boolean,
  amount: number
): { subject: string; html: string; text: string } {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const subject = isWinner
    ? `Disputa resolvida a seu favor`
    : `Disputa resolvida`;

  const content = isWinner
    ? `
    <h2 style="margin: 0 0 16px 0; font-size: 24px;">Disputa resolvida a seu favor</h2>

    <p>Ola, <strong>${recipientName}</strong>!</p>

    <div class="success">
      <strong>Boa noticia!</strong> Apos analise do nosso time, a disputa foi resolvida a seu favor.
    </div>

    <div class="highlight">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 8px 0; color: #9CA3AF; font-size: 14px;">Ingresso</td>
          <td style="padding: 8px 0; text-align: right; color: #fff; font-weight: 500;">${data.ticketName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #9CA3AF; font-size: 14px;">Resolucao</td>
          <td style="padding: 8px 0; text-align: right; color: #fff; font-weight: 500;">${data.resolution}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #9CA3AF; font-size: 14px; border-top: 1px solid rgba(255,255,255,0.1);">${data.winner === "buyer" ? "Valor reembolsado" : "Valor liberado"}</td>
          <td style="padding: 8px 0; text-align: right; color: #16C784; font-weight: 700; font-size: 20px; border-top: 1px solid rgba(255,255,255,0.1);">${formatCurrency(amount)}</td>
        </tr>
      </table>
    </div>

    <p style="color: #9CA3AF; font-size: 14px;">
      ${data.winner === "buyer"
        ? "O valor sera estornado para o metodo de pagamento original em ate 5 dias uteis."
        : "O valor foi liberado e estara disponivel na sua conta em breve."
      }
    </p>

    <div style="text-align: center;">
      <a href="${appUrl}/disputas/${data.disputeId}" class="button">
        Ver detalhes
      </a>
    </div>
    `
    : `
    <h2 style="margin: 0 0 16px 0; font-size: 24px;">Disputa resolvida</h2>

    <p>Ola, <strong>${recipientName}</strong>!</p>

    <p>Apos analise cuidadosa do nosso time, a disputa foi resolvida.</p>

    <div class="highlight">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 8px 0; color: #9CA3AF; font-size: 14px;">Ingresso</td>
          <td style="padding: 8px 0; text-align: right; color: #fff; font-weight: 500;">${data.ticketName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #9CA3AF; font-size: 14px;">Resolucao</td>
          <td style="padding: 8px 0; text-align: right; color: #fff; font-weight: 500;">${data.resolution}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #9CA3AF; font-size: 14px;">Decisao</td>
          <td style="padding: 8px 0; text-align: right; color: #FF8A00; font-weight: 500;">Favoravel ao ${data.winner === "buyer" ? "comprador" : "vendedor"}</td>
        </tr>
      </table>
    </div>

    <p style="color: #9CA3AF; font-size: 14px;">
      Se voce discorda da decisao, entre em contato com nosso suporte em ate 48 horas.
    </p>

    <div style="text-align: center;">
      <a href="${appUrl}/disputas/${data.disputeId}" class="button">
        Ver detalhes
      </a>
    </div>
    `;

  const text = `
Disputa resolvida

Ola, ${recipientName}!

A disputa foi resolvida ${isWinner ? "a seu favor" : ""}.

Detalhes:
- Ingresso: ${data.ticketName}
- Resolucao: ${data.resolution}
- Decisao: Favoravel ao ${data.winner === "buyer" ? "comprador" : "vendedor"}

Ver detalhes: ${appUrl}/disputas/${data.disputeId}

--
Passback - Revenda segura de ingressos
  `.trim();

  return {
    subject,
    html: baseEmailTemplate(content, subject),
    text,
  };
}
