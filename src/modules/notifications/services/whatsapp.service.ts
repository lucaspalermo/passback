// Serviço de notificação por WhatsApp
// Por enquanto gera apenas links de WhatsApp - pode ser integrado com API WhatsApp Business no futuro

export interface WhatsAppNotification {
  phone: string;
  message: string;
  type: "purchase" | "offer" | "offer_accepted" | "offer_rejected" | "payment_released" | "dispute";
}

// Formata telefone para WhatsApp
export function formatPhoneForWhatsApp(phone: string): string {
  const numbers = phone.replace(/\D/g, "");
  // Adiciona 55 se não tiver código do país
  if (numbers.length <= 11) {
    return `55${numbers}`;
  }
  return numbers;
}

// Gera link de WhatsApp
export function generateWhatsAppLink(phone: string, message: string): string {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}

// Templates de mensagens
export const WHATSAPP_TEMPLATES = {
  // Vendedor recebe notificação de nova compra
  newPurchase: (buyerName: string, eventName: string, amount: string) =>
    `🎟️ *Nova venda no Passback!*\n\n${buyerName} comprou seu ingresso para "${eventName}" por ${amount}.\n\nEntre em contato para combinar a entrega do ingresso.`,

  // Vendedor recebe notificação de nova oferta
  newOffer: (buyerName: string, eventName: string, offerAmount: string, originalPrice: string) =>
    `💰 *Nova oferta recebida!*\n\n${buyerName} fez uma oferta de ${offerAmount} (preço: ${originalPrice}) para seu ingresso "${eventName}".\n\nAcesse o Passback para aceitar ou recusar.`,

  // Comprador notificado que oferta foi aceita
  offerAccepted: (sellerName: string, eventName: string, amount: string) =>
    `✅ *Oferta aceita!*\n\n${sellerName} aceitou sua oferta de ${amount} para "${eventName}".\n\n⚠️ Voce tem 5 minutos para efetuar o pagamento no Passback!`,

  // Comprador notificado que oferta foi recusada
  offerRejected: (sellerName: string, eventName: string) =>
    `❌ *Oferta recusada*\n\n${sellerName} recusou sua oferta para "${eventName}".\n\nVoce pode fazer outra oferta ou comprar pelo preco atual.`,

  // Vendedor notificado que pagamento foi liberado
  paymentReleased: (eventName: string, amount: string) =>
    `💸 *Pagamento liberado!*\n\nO pagamento de ${amount} pela venda do ingresso "${eventName}" foi liberado para voce.\n\nObrigado por usar o Passback!`,

  // Notificação de disputa
  disputeOpened: (eventName: string) =>
    `⚠️ *Disputa aberta*\n\nFoi aberta uma disputa para a transação do ingresso "${eventName}".\n\nAcompanhe pelo Passback e envie evidencias se necessario.`,
};

// Função auxiliar para criar notificação de compra para vendedor
export function createPurchaseNotification(
  sellerPhone: string,
  buyerName: string,
  eventName: string,
  amount: string
): WhatsAppNotification {
  return {
    phone: sellerPhone,
    message: WHATSAPP_TEMPLATES.newPurchase(buyerName, eventName, amount),
    type: "purchase",
  };
}

// Função auxiliar para criar notificação de oferta para vendedor
export function createOfferNotification(
  sellerPhone: string,
  buyerName: string,
  eventName: string,
  offerAmount: string,
  originalPrice: string
): WhatsAppNotification {
  return {
    phone: sellerPhone,
    message: WHATSAPP_TEMPLATES.newOffer(buyerName, eventName, offerAmount, originalPrice),
    type: "offer",
  };
}

// Função auxiliar para criar notificação de oferta aceita para comprador
export function createOfferAcceptedNotification(
  buyerPhone: string,
  sellerName: string,
  eventName: string,
  amount: string
): WhatsAppNotification {
  return {
    phone: buyerPhone,
    message: WHATSAPP_TEMPLATES.offerAccepted(sellerName, eventName, amount),
    type: "offer_accepted",
  };
}
