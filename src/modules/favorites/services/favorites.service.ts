// Serviço de favoritos

import prisma from "@/lib/prisma";
import { isFavoritesEnabled, FAVORITES_CONFIG } from "../index";
import type { Favorite, FavoriteWithTicket } from "../index";

/**
 * Adiciona ingresso aos favoritos
 */
export async function addFavorite(
  userId: string,
  ticketId: string
): Promise<{ success: boolean; favorite?: Favorite; error?: string }> {
  if (!isFavoritesEnabled()) {
    return { success: false, error: "Módulo desabilitado" };
  }

  // Verifica limite
  const count = await prisma.favorite.count({
    where: { userId },
  });

  if (count >= FAVORITES_CONFIG.maxFavorites) {
    return { success: false, error: `Limite de ${FAVORITES_CONFIG.maxFavorites} favoritos atingido` };
  }

  try {
    const favorite = await prisma.favorite.create({
      data: { userId, ticketId },
    });

    return { success: true, favorite: favorite as unknown as Favorite };
  } catch {
    return { success: false, error: "Ingresso já está nos favoritos" };
  }
}

/**
 * Remove dos favoritos
 */
export async function removeFavorite(
  userId: string,
  ticketId: string
): Promise<boolean> {
  if (!isFavoritesEnabled()) {
    return false;
  }

  const result = await prisma.favorite.deleteMany({
    where: { userId, ticketId },
  });

  return result.count > 0;
}

/**
 * Lista favoritos do usuário
 */
export async function listFavorites(userId: string): Promise<FavoriteWithTicket[]> {
  if (!isFavoritesEnabled()) {
    return [];
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId },
    include: {
      ticket: {
        select: {
          id: true,
          eventName: true,
          eventDate: true,
          price: true,
          status: true,
          imageUrl: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return favorites as unknown as FavoriteWithTicket[];
}

/**
 * Verifica se ingresso está nos favoritos
 */
export async function isFavorite(userId: string, ticketId: string): Promise<boolean> {
  if (!isFavoritesEnabled()) {
    return false;
  }

  const favorite = await prisma.favorite.findUnique({
    where: {
      userId_ticketId: { userId, ticketId },
    },
  });

  return !!favorite;
}

/**
 * Toggle favorito
 */
export async function toggleFavorite(
  userId: string,
  ticketId: string
): Promise<{ isFavorite: boolean }> {
  const exists = await isFavorite(userId, ticketId);

  if (exists) {
    await removeFavorite(userId, ticketId);
    return { isFavorite: false };
  } else {
    await addFavorite(userId, ticketId);
    return { isFavorite: true };
  }
}

/**
 * Cria alerta de preço para evento
 */
export async function createPriceAlert(
  userId: string,
  eventName: string,
  alertPrice: number
): Promise<{ success: boolean; error?: string }> {
  if (!isFavoritesEnabled() || !FAVORITES_CONFIG.alertsEnabled) {
    return { success: false, error: "Alertas desabilitados" };
  }

  try {
    await prisma.favorite.create({
      data: {
        userId,
        eventName,
        alertPrice,
      },
    });

    return { success: true };
  } catch {
    return { success: false, error: "Alerta já existe" };
  }
}
