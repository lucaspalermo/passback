// Configuração do módulo de chat
// Feature flag e configurações isoladas

export const CHAT_CONFIG = {
  // Feature flag - ativar/desativar módulo
  enabled: process.env.FEATURE_CHAT_ENABLED === "true",

  // Limites
  maxMessageLength: 1000,
  maxMessagesPerHour: 50,
  maxFileSize: 5 * 1024 * 1024, // 5MB

  // Tipos de arquivo permitidos
  allowedFileTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],

  // Retenção de mensagens (dias)
  messageRetentionDays: 90,

  // Notificar por email quando receber mensagem
  emailNotifications: process.env.CHAT_EMAIL_NOTIFICATIONS === "true",

  // Palavras bloqueadas (anti-fraude)
  blockedPatterns: [
    /whatsapp/i,
    /telegram/i,
    /\+55\s?\d{2}\s?\d{4,5}[-\s]?\d{4}/i, // Telefone BR
    /pix.*fora/i,
    /paga.*direto/i,
  ],
};

// Verifica se o módulo está habilitado
export function isChatEnabled(): boolean {
  return CHAT_CONFIG.enabled;
}

// Valida se mensagem contém conteúdo bloqueado
export function containsBlockedContent(message: string): boolean {
  return CHAT_CONFIG.blockedPatterns.some((pattern) => pattern.test(message));
}
