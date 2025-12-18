// Configuracoes centralizadas da plataforma Passback

export const config = {
  // Nome da plataforma
  platformName: "Passback",

  // WhatsApp do suporte (formato: 55 + DDD + numero, sem espacos)
  whatsapp: {
    support: "5511999999999", // Altere para o numero real do suporte

    // Mensagens pre-definidas
    messages: {
      forgotPassword: "Olá, esqueci minha senha do Passback. Meu email é: ",
      generalSupport: "Olá, preciso de ajuda com o Passback.",
      disputeHelp: "Olá, preciso de ajuda com uma disputa. ID da transação: ",
    },
  },

  // Taxa da plataforma (10%)
  platformFee: 0.10,

  // URLs
  urls: {
    terms: "/termos",
    privacy: "/privacidade",
  },

  // Configuracoes de tempo
  timing: {
    // Horas para liberacao automatica apos evento
    autoReleaseHours: 48,
    // Dias para abrir disputa apos pagamento
    disputeWindowDays: 7,
  },
};

// Funcao helper para gerar link do WhatsApp
export function getWhatsAppLink(number: string, message?: string): string {
  const encodedMessage = message ? encodeURIComponent(message) : "";
  return `https://wa.me/${number}${encodedMessage ? `?text=${encodedMessage}` : ""}`;
}

// Links rapidos do WhatsApp
export const whatsappLinks = {
  forgotPassword: () =>
    getWhatsAppLink(config.whatsapp.support, config.whatsapp.messages.forgotPassword),

  support: () =>
    getWhatsAppLink(config.whatsapp.support, config.whatsapp.messages.generalSupport),

  dispute: (transactionId?: string) =>
    getWhatsAppLink(
      config.whatsapp.support,
      config.whatsapp.messages.disputeHelp + (transactionId || "")
    ),

  seller: (sellerPhone: string, ticketName?: string) =>
    getWhatsAppLink(
      sellerPhone,
      ticketName ? `Olá! Vi seu ingresso "${ticketName}" no Passback.` : undefined
    ),
};
