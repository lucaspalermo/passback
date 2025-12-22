// Template de email de boas-vindas
import { baseEmailTemplate } from "./base";
import type { WelcomeData } from "../types";

export function welcomeTemplate(
  data: WelcomeData
): { subject: string; html: string; text: string } {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const subject = `Bem-vindo ao Passback!`;

  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 24px;">Bem-vindo ao Passback!</h2>

    <p>Ola, <strong>${data.userName}</strong>!</p>

    <p>Sua conta foi criada com sucesso. Agora voce faz parte da plataforma mais segura
    de revenda de ingressos do Brasil.</p>

    <div class="highlight">
      <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #16C784;">O que voce pode fazer:</h3>

      <div style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
        <strong style="color: #fff;">Comprar com seguranca</strong>
        <p style="margin: 8px 0 0 0; color: #9CA3AF; font-size: 14px;">
          O pagamento fica retido ate voce confirmar que recebeu o ingresso e entrou no evento.
        </p>
      </div>

      <div style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
        <strong style="color: #fff;">Vender seus ingressos</strong>
        <p style="margin: 8px 0 0 0; color: #9CA3AF; font-size: 14px;">
          Nao vai mais ao evento? Venda seu ingresso de forma segura e receba apos a confirmacao.
        </p>
      </div>

      <div style="padding: 12px 0;">
        <strong style="color: #fff;">Protecao total</strong>
        <p style="margin: 8px 0 0 0; color: #9CA3AF; font-size: 14px;">
          Sistema de disputas com mediacao para resolver qualquer problema.
        </p>
      </div>
    </div>

    <div style="text-align: center;">
      <a href="${appUrl}/ingressos" class="button">
        Explorar ingressos
      </a>
    </div>

    <p style="color: #9CA3AF; font-size: 14px; margin-top: 24px;">
      <strong>Dica:</strong> Complete seu perfil adicionando seu CPF para poder comprar
      ingressos via PIX ou Cartao de Credito.
    </p>
  `;

  const text = `
Bem-vindo ao Passback!

Ola, ${data.userName}!

Sua conta foi criada com sucesso. Agora voce faz parte da plataforma mais segura de revenda de ingressos do Brasil.

O que voce pode fazer:

- Comprar com seguranca: O pagamento fica retido ate voce confirmar que recebeu o ingresso.
- Vender seus ingressos: Venda de forma segura e receba apos a confirmacao.
- Protecao total: Sistema de disputas com mediacao.

Explorar ingressos: ${appUrl}/ingressos

Dica: Complete seu perfil adicionando seu CPF para poder comprar.

--
Passback - Revenda segura de ingressos
  `.trim();

  return {
    subject,
    html: baseEmailTemplate(content, "Sua conta foi criada com sucesso!"),
    text,
  };
}
