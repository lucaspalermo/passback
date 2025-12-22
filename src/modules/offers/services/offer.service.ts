// Serviço de Ofertas
// Gerencia criação, aceite, rejeição e expiração de ofertas

import prisma from "@/lib/prisma";
import { isOffersEnabled, OFFERS_CONFIG, OfferStatus, OfferLogAction } from "../index";
import type { Offer, OfferResult, CreateOfferParams, OffersListResponse, OfferCounts } from "../types";

/**
 * Cria uma nova oferta em um ingresso
 */
export async function createOffer(params: CreateOfferParams): Promise<OfferResult> {
  if (!isOffersEnabled()) {
    return { success: false, error: "Módulo de ofertas desabilitado" };
  }

  try {
    // Busca o ingresso
    const ticket = await prisma.ticket.findUnique({
      where: { id: params.ticketId },
      include: { seller: true },
    });

    if (!ticket) {
      return { success: false, error: "Ingresso não encontrado" };
    }

    if (ticket.status !== "available") {
      return { success: false, error: "Ingresso não está disponível" };
    }

    if (ticket.sellerId === params.buyerId) {
      return { success: false, error: "Você não pode fazer oferta no seu próprio ingresso" };
    }

    // Valida valor mínimo
    const minAmount = ticket.price * (OFFERS_CONFIG.minOfferPercentage / 100);
    if (params.amount < minAmount) {
      return {
        success: false,
        error: `Oferta mínima: R$ ${minAmount.toFixed(2)} (${OFFERS_CONFIG.minOfferPercentage}% do preço)`,
      };
    }

    // Verifica se já tem oferta ativa neste ingresso
    const existingOffer = await prisma.offer.findFirst({
      where: {
        ticketId: params.ticketId,
        buyerId: params.buyerId,
        status: { in: ["pending", "accepted"] },
      },
    });

    if (existingOffer) {
      return { success: false, error: "Você já tem uma oferta ativa neste ingresso" };
    }

    // Verifica limite de ofertas por ingresso
    const offerCount = await prisma.offer.count({
      where: {
        ticketId: params.ticketId,
        status: "pending",
      },
    });

    if (offerCount >= OFFERS_CONFIG.maxOffersPerTicket) {
      return { success: false, error: "Este ingresso atingiu o limite de ofertas" };
    }

    // Calcula expiração
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + OFFERS_CONFIG.offerExpirationHours);

    // Cria a oferta
    const offer = await prisma.offer.create({
      data: {
        ticketId: params.ticketId,
        buyerId: params.buyerId,
        sellerId: ticket.sellerId,
        amount: params.amount,
        message: params.message,
        status: "pending",
        expiresAt,
      },
      include: {
        ticket: true,
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
      },
    });

    // Log
    await logOfferAction(offer.id, "created", `Oferta de R$ ${params.amount.toFixed(2)}`);

    return { success: true, offer: offer as unknown as Offer };
  } catch (error) {
    console.error("[Offers] Erro ao criar oferta:", error);
    return { success: false, error: "Erro ao criar oferta" };
  }
}

/**
 * Aceita uma oferta
 */
export async function acceptOffer(offerId: string, sellerId: string): Promise<OfferResult> {
  if (!isOffersEnabled()) {
    return { success: false, error: "Módulo de ofertas desabilitado" };
  }

  try {
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: { ticket: true },
    });

    if (!offer) {
      return { success: false, error: "Oferta não encontrada" };
    }

    if (offer.sellerId !== sellerId) {
      return { success: false, error: "Você não tem permissão para aceitar esta oferta" };
    }

    if (offer.status !== "pending") {
      return { success: false, error: "Esta oferta não pode ser aceita" };
    }

    if (new Date() > offer.expiresAt) {
      await expireOffer(offerId);
      return { success: false, error: "Esta oferta expirou" };
    }

    // Calcula prazo de pagamento
    const paymentDeadline = new Date();
    paymentDeadline.setMinutes(paymentDeadline.getMinutes() + OFFERS_CONFIG.paymentTimeoutMinutes);

    // Atualiza oferta
    const updatedOffer = await prisma.offer.update({
      where: { id: offerId },
      data: {
        status: "accepted",
        paymentDeadline,
      },
      include: {
        ticket: true,
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
      },
    });

    // Reserva o ingresso
    await prisma.ticket.update({
      where: { id: offer.ticketId },
      data: { status: "reserved" },
    });

    // Rejeita outras ofertas pendentes
    await prisma.offer.updateMany({
      where: {
        ticketId: offer.ticketId,
        id: { not: offerId },
        status: "pending",
      },
      data: { status: "rejected" },
    });

    // Log
    await logOfferAction(offerId, "accepted", `Prazo para pagamento: ${OFFERS_CONFIG.paymentTimeoutMinutes} minutos`);

    return { success: true, offer: updatedOffer as unknown as Offer };
  } catch (error) {
    console.error("[Offers] Erro ao aceitar oferta:", error);
    return { success: false, error: "Erro ao aceitar oferta" };
  }
}

/**
 * Rejeita uma oferta
 */
export async function rejectOffer(offerId: string, sellerId: string): Promise<OfferResult> {
  if (!isOffersEnabled()) {
    return { success: false, error: "Módulo de ofertas desabilitado" };
  }

  try {
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
    });

    if (!offer) {
      return { success: false, error: "Oferta não encontrada" };
    }

    if (offer.sellerId !== sellerId) {
      return { success: false, error: "Você não tem permissão para rejeitar esta oferta" };
    }

    if (offer.status !== "pending") {
      return { success: false, error: "Esta oferta não pode ser rejeitada" };
    }

    const updatedOffer = await prisma.offer.update({
      where: { id: offerId },
      data: { status: "rejected" },
      include: {
        ticket: true,
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
      },
    });

    // Log
    await logOfferAction(offerId, "rejected");

    return { success: true, offer: updatedOffer as unknown as Offer };
  } catch (error) {
    console.error("[Offers] Erro ao rejeitar oferta:", error);
    return { success: false, error: "Erro ao rejeitar oferta" };
  }
}

/**
 * Cancela uma oferta (pelo comprador)
 */
export async function cancelOffer(offerId: string, buyerId: string): Promise<OfferResult> {
  if (!isOffersEnabled()) {
    return { success: false, error: "Módulo de ofertas desabilitado" };
  }

  try {
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
    });

    if (!offer) {
      return { success: false, error: "Oferta não encontrada" };
    }

    if (offer.buyerId !== buyerId) {
      return { success: false, error: "Você não tem permissão para cancelar esta oferta" };
    }

    if (!["pending", "accepted"].includes(offer.status)) {
      return { success: false, error: "Esta oferta não pode ser cancelada" };
    }

    // Se estava aceita, libera o ingresso
    if (offer.status === "accepted") {
      await prisma.ticket.update({
        where: { id: offer.ticketId },
        data: { status: "available" },
      });
    }

    const updatedOffer = await prisma.offer.update({
      where: { id: offerId },
      data: { status: "cancelled" },
      include: {
        ticket: true,
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
      },
    });

    // Log
    await logOfferAction(offerId, "cancelled");

    return { success: true, offer: updatedOffer as unknown as Offer };
  } catch (error) {
    console.error("[Offers] Erro ao cancelar oferta:", error);
    return { success: false, error: "Erro ao cancelar oferta" };
  }
}

/**
 * Marca oferta como paga e cria transação
 */
export async function markOfferAsPaid(offerId: string, transactionId: string): Promise<OfferResult> {
  if (!isOffersEnabled()) {
    return { success: false, error: "Módulo de ofertas desabilitado" };
  }

  try {
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
    });

    if (!offer) {
      return { success: false, error: "Oferta não encontrada" };
    }

    if (offer.status !== "accepted") {
      return { success: false, error: "Esta oferta não está aguardando pagamento" };
    }

    const updatedOffer = await prisma.offer.update({
      where: { id: offerId },
      data: {
        status: "paid",
        transactionId,
      },
      include: {
        ticket: true,
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
      },
    });

    // Log
    await logOfferAction(offerId, "payment_completed", `Transação: ${transactionId}`);

    return { success: true, offer: updatedOffer as unknown as Offer };
  } catch (error) {
    console.error("[Offers] Erro ao marcar oferta como paga:", error);
    return { success: false, error: "Erro ao processar pagamento" };
  }
}

/**
 * Expira uma oferta
 */
export async function expireOffer(offerId: string): Promise<void> {
  try {
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
    });

    if (!offer || !["pending", "accepted"].includes(offer.status)) {
      return;
    }

    // Se estava aceita, libera o ingresso
    if (offer.status === "accepted") {
      await prisma.ticket.update({
        where: { id: offer.ticketId },
        data: { status: "available" },
      });

      await logOfferAction(offerId, "payment_timeout");
    } else {
      await logOfferAction(offerId, "expired");
    }

    await prisma.offer.update({
      where: { id: offerId },
      data: { status: "expired" },
    });
  } catch (error) {
    console.error("[Offers] Erro ao expirar oferta:", error);
  }
}

/**
 * Processa ofertas expiradas (para ser chamado por cron/scheduler)
 */
export async function processExpiredOffers(): Promise<number> {
  if (!isOffersEnabled()) {
    return 0;
  }

  try {
    const now = new Date();

    // Ofertas pendentes expiradas
    const expiredPending = await prisma.offer.findMany({
      where: {
        status: "pending",
        expiresAt: { lt: now },
      },
    });

    // Ofertas aceitas com prazo de pagamento expirado
    const expiredPayment = await prisma.offer.findMany({
      where: {
        status: "accepted",
        paymentDeadline: { lt: now },
      },
    });

    const allExpired = [...expiredPending, ...expiredPayment];

    for (const offer of allExpired) {
      await expireOffer(offer.id);
    }

    return allExpired.length;
  } catch (error) {
    console.error("[Offers] Erro ao processar ofertas expiradas:", error);
    return 0;
  }
}

/**
 * Lista ofertas recebidas (vendedor)
 */
export async function getReceivedOffers(sellerId: string): Promise<OffersListResponse> {
  if (!isOffersEnabled()) {
    return { offers: [], stats: { pending: 0, accepted: 0, total: 0 } };
  }

  const offers = await prisma.offer.findMany({
    where: { sellerId },
    include: {
      ticket: true,
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const stats = {
    pending: offers.filter((o) => o.status === "pending").length,
    accepted: offers.filter((o) => o.status === "accepted").length,
    total: offers.length,
  };

  return { offers: offers as unknown as Offer[], stats };
}

/**
 * Lista ofertas enviadas (comprador)
 */
export async function getSentOffers(buyerId: string): Promise<OffersListResponse> {
  if (!isOffersEnabled()) {
    return { offers: [], stats: { pending: 0, accepted: 0, total: 0 } };
  }

  const offers = await prisma.offer.findMany({
    where: { buyerId },
    include: {
      ticket: true,
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const stats = {
    pending: offers.filter((o) => o.status === "pending").length,
    accepted: offers.filter((o) => o.status === "accepted").length,
    total: offers.length,
  };

  return { offers: offers as unknown as Offer[], stats };
}

/**
 * Busca oferta por ID
 */
export async function getOfferById(offerId: string, userId: string): Promise<Offer | null> {
  if (!isOffersEnabled()) {
    return null;
  }

  const offer = await prisma.offer.findFirst({
    where: {
      id: offerId,
      OR: [{ buyerId: userId }, { sellerId: userId }],
    },
    include: {
      ticket: true,
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
      logs: { orderBy: { createdAt: "desc" } },
    },
  });

  return offer as unknown as Offer;
}

/**
 * Busca ofertas de um ingresso
 */
export async function getTicketOffers(ticketId: string): Promise<Offer[]> {
  if (!isOffersEnabled()) {
    return [];
  }

  const offers = await prisma.offer.findMany({
    where: {
      ticketId,
      status: { in: ["pending", "accepted"] },
    },
    include: {
      buyer: { select: { id: true, name: true } },
    },
    orderBy: { amount: "desc" },
  });

  return offers as unknown as Offer[];
}

/**
 * Conta ofertas do usuário
 */
export async function getOfferCounts(userId: string): Promise<OfferCounts> {
  if (!isOffersEnabled()) {
    return { received: 0, sent: 0, pendingPayment: 0 };
  }

  const [received, sent, pendingPayment] = await Promise.all([
    prisma.offer.count({
      where: { sellerId: userId, status: "pending" },
    }),
    prisma.offer.count({
      where: { buyerId: userId, status: "pending" },
    }),
    prisma.offer.count({
      where: { buyerId: userId, status: "accepted" },
    }),
  ]);

  return { received, sent, pendingPayment };
}

/**
 * Registra log de ação
 */
async function logOfferAction(
  offerId: string,
  action: OfferLogAction,
  details?: string
): Promise<void> {
  try {
    await prisma.offerLog.create({
      data: {
        offerId,
        action,
        details,
      },
    });
  } catch (error) {
    console.error("[Offers] Erro ao registrar log:", error);
  }
}
