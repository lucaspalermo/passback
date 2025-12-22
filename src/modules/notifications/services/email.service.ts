// Serviço de envio de emails
// Suporta múltiplos providers: Resend, SendGrid, SMTP

import { NOTIFICATIONS_CONFIG, isEmailEnabled } from "../config";
import type { EmailPayload, NotificationResult } from "../types";

interface EmailProvider {
  send(payload: EmailPayload): Promise<NotificationResult>;
}

// Provider: Resend (recomendado)
class ResendProvider implements EmailProvider {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || "";
  }

  async send(payload: EmailPayload): Promise<NotificationResult> {
    if (!this.apiKey) {
      console.warn("[Email] Resend API key não configurada");
      return { success: false, channel: "email", error: "API key não configurada" };
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          from: NOTIFICATIONS_CONFIG.email.from,
          to: payload.to,
          subject: payload.subject,
          html: payload.html,
          text: payload.text,
          reply_to: payload.replyTo || NOTIFICATIONS_CONFIG.email.replyTo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("[Email] Erro Resend:", data);
        return {
          success: false,
          channel: "email",
          error: data.message || "Erro ao enviar email",
        };
      }

      console.log("[Email] Enviado com sucesso:", data.id);
      return {
        success: true,
        channel: "email",
        messageId: data.id,
      };
    } catch (error) {
      console.error("[Email] Erro ao enviar:", error);
      return {
        success: false,
        channel: "email",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }
}

// Provider: SendGrid
class SendGridProvider implements EmailProvider {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || "";
  }

  async send(payload: EmailPayload): Promise<NotificationResult> {
    if (!this.apiKey) {
      console.warn("[Email] SendGrid API key não configurada");
      return { success: false, channel: "email", error: "API key não configurada" };
    }

    try {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: payload.to }] }],
          from: { email: NOTIFICATIONS_CONFIG.email.from },
          subject: payload.subject,
          content: [
            { type: "text/plain", value: payload.text || "" },
            { type: "text/html", value: payload.html },
          ],
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("[Email] Erro SendGrid:", text);
        return { success: false, channel: "email", error: text };
      }

      const messageId = response.headers.get("x-message-id") || "";
      console.log("[Email] Enviado com sucesso:", messageId);
      return { success: true, channel: "email", messageId };
    } catch (error) {
      console.error("[Email] Erro ao enviar:", error);
      return {
        success: false,
        channel: "email",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }
}

// Provider: Console (desenvolvimento)
class ConsoleProvider implements EmailProvider {
  async send(payload: EmailPayload): Promise<NotificationResult> {
    console.log("\n========== EMAIL (DEV MODE) ==========");
    console.log(`Para: ${payload.to}`);
    console.log(`Assunto: ${payload.subject}`);
    console.log("---------------------------------------");
    console.log(payload.text || "");
    console.log("=======================================\n");

    return {
      success: true,
      channel: "email",
      messageId: `dev-${Date.now()}`,
    };
  }
}

// Factory para criar o provider correto
function createEmailProvider(): EmailProvider {
  const provider = NOTIFICATIONS_CONFIG.email.provider;

  switch (provider) {
    case "resend":
      return new ResendProvider();
    case "sendgrid":
      return new SendGridProvider();
    case "console":
    default:
      return new ConsoleProvider();
  }
}

// Instância única do provider
let emailProvider: EmailProvider | null = null;

function getEmailProvider(): EmailProvider {
  if (!emailProvider) {
    emailProvider = createEmailProvider();
  }
  return emailProvider;
}

/**
 * Envia um email usando o provider configurado
 */
export async function sendEmail(payload: EmailPayload): Promise<NotificationResult> {
  if (!isEmailEnabled()) {
    console.log("[Email] Módulo desabilitado, pulando envio");
    return { success: false, channel: "email", error: "Módulo desabilitado" };
  }

  const provider = getEmailProvider();
  return provider.send(payload);
}

/**
 * Envia email para múltiplos destinatários
 */
export async function sendEmailBatch(
  payloads: EmailPayload[]
): Promise<NotificationResult[]> {
  const results = await Promise.all(payloads.map((p) => sendEmail(p)));
  return results;
}
