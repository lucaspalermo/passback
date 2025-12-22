// Configuração do módulo de notificações
// Feature flag e configurações isoladas

export const NOTIFICATIONS_CONFIG = {
  // Feature flag - ativar/desativar módulo
  enabled: process.env.FEATURE_NOTIFICATIONS_ENABLED === "true",

  // Configurações de email
  email: {
    enabled: process.env.NOTIFICATIONS_EMAIL_ENABLED === "true",
    provider: process.env.NOTIFICATIONS_EMAIL_PROVIDER || "resend", // resend, sendgrid, smtp
    from: process.env.NOTIFICATIONS_EMAIL_FROM || "Passback <noreply@passback.com.br>",
    replyTo: process.env.NOTIFICATIONS_EMAIL_REPLY_TO || "suporte@passback.com.br",
  },

  // Configurações de push (futuro)
  push: {
    enabled: process.env.NOTIFICATIONS_PUSH_ENABLED === "true",
  },

  // Configurações de SMS (futuro)
  sms: {
    enabled: process.env.NOTIFICATIONS_SMS_ENABLED === "true",
  },

  // Templates ativos
  templates: {
    paymentConfirmed: true,
    ticketSold: true,
    disputeOpened: true,
    disputeResolved: true,
    ticketReleased: true,
    welcome: true,
  },
};

// Verifica se o módulo está habilitado
export function isNotificationsEnabled(): boolean {
  return NOTIFICATIONS_CONFIG.enabled;
}

// Verifica se email está habilitado
export function isEmailEnabled(): boolean {
  return NOTIFICATIONS_CONFIG.enabled && NOTIFICATIONS_CONFIG.email.enabled;
}
