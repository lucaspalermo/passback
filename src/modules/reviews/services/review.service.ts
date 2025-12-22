// Serviço de avaliações

import prisma from "@/lib/prisma";
import { isReviewsEnabled, REVIEWS_CONFIG } from "../index";
import type { Review, UserRating } from "../index";

/**
 * Cria uma avaliação
 */
export async function createReview(params: {
  transactionId: string;
  reviewerId: string;
  reviewedId: string;
  rating: number;
  comment?: string;
  type: "buyer_to_seller" | "seller_to_buyer";
}): Promise<{ success: boolean; review?: Review; error?: string }> {
  if (!isReviewsEnabled()) {
    return { success: false, error: "Módulo desabilitado" };
  }

  // Valida rating
  if (params.rating < REVIEWS_CONFIG.minRating || params.rating > REVIEWS_CONFIG.maxRating) {
    return { success: false, error: `Avaliação deve ser entre ${REVIEWS_CONFIG.minRating} e ${REVIEWS_CONFIG.maxRating}` };
  }

  try {
    // Verifica se já existe
    const existing = await prisma.review.findUnique({
      where: {
        transactionId_type: {
          transactionId: params.transactionId,
          type: params.type,
        },
      },
    });

    if (existing) {
      return { success: false, error: "Você já avaliou esta transação" };
    }

    const review = await prisma.review.create({
      data: {
        transactionId: params.transactionId,
        reviewerId: params.reviewerId,
        reviewedId: params.reviewedId,
        rating: params.rating,
        comment: params.comment,
        type: params.type,
      },
    });

    return { success: true, review: review as unknown as Review };
  } catch (error) {
    console.error("[Reviews] Erro:", error);
    return { success: false, error: "Erro ao criar avaliação" };
  }
}

/**
 * Obtém avaliação média de um usuário
 */
export async function getUserRating(userId: string): Promise<UserRating> {
  if (!isReviewsEnabled()) {
    return { average: 0, count: 0, distribution: {} };
  }

  const reviews = await prisma.review.findMany({
    where: { reviewedId: userId },
    select: { rating: true },
  });

  if (reviews.length === 0) {
    return { average: 0, count: 0, distribution: {} };
  }

  const distribution: { [key: number]: number } = {};
  let sum = 0;

  for (const review of reviews) {
    sum += review.rating;
    distribution[review.rating] = (distribution[review.rating] || 0) + 1;
  }

  return {
    average: Math.round((sum / reviews.length) * 10) / 10,
    count: reviews.length,
    distribution,
  };
}

/**
 * Lista avaliações de um usuário
 */
export async function getUserReviews(
  userId: string,
  limit = 10
): Promise<Review[]> {
  if (!isReviewsEnabled()) {
    return [];
  }

  const reviews = await prisma.review.findMany({
    where: { reviewedId: userId },
    include: {
      reviewer: { select: { id: true, name: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return reviews as unknown as Review[];
}

/**
 * Verifica se pode avaliar uma transação
 */
export async function canReviewTransaction(
  transactionId: string,
  userId: string,
  type: "buyer_to_seller" | "seller_to_buyer"
): Promise<boolean> {
  if (!isReviewsEnabled()) {
    return false;
  }

  // Verifica se transação existe e está concluída
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      status: { in: ["released", "confirmed"] },
      OR: [{ buyerId: userId }, { sellerId: userId }],
    },
  });

  if (!transaction) {
    return false;
  }

  // Verifica se já avaliou
  const existing = await prisma.review.findUnique({
    where: {
      transactionId_type: { transactionId, type },
    },
  });

  return !existing;
}
