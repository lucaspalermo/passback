// Serviço de Lista de Espera

import prisma from "@/lib/prisma";
import { isWaitlistEnabled, WAITLIST_CONFIG } from "../index";
import type {
  WaitlistEntry,
  WaitlistResult,
  JoinWaitlistParams,
  WaitlistStats,
} from "../types";

/**
 * Entra na lista de espera para um evento
 */
export async function joinWaitlist(params: JoinWaitlistParams): Promise<WaitlistResult> {
  if (!isWaitlistEnabled()) {
    return { success: false, error: "Módulo de lista de espera desabilitado" };
  }

  try {
    // Verifica se já está na lista
    const existing = await prisma.waitlistEntry.findFirst({
      where: {
        userId: params.userId,
        eventName: params.eventName,
        status: "waiting",
      },
    });

    if (existing) {
      return {
        success: false,
        error: "Você já está na lista de espera para este evento",
      };
    }

    // Conta quantos já estão na lista
    const currentCount = await prisma.waitlistEntry.count({
      where: {
        eventName: params.eventName,
        status: "waiting",
      },
    });

    if (currentCount >= WAITLIST_CONFIG.maxWaitlistSize) {
      return {
        success: false,
        error: "Lista de espera cheia para este evento",
      };
    }

    // Calcula expiração
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + WAITLIST_CONFIG.positionExpirationHours);

    // Cria entrada
    const entry = await prisma.waitlistEntry.create({
      data: {
        eventName: params.eventName,
        eventDate: params.eventDate,
        ticketType: params.ticketType,
        userId: params.userId,
        maxPrice: params.maxPrice,
        status: "waiting",
        position: currentCount + 1,
        expiresAt,
      },
    });

    return {
      success: true,
      entry: entry as unknown as WaitlistEntry,
      position: currentCount + 1,
    };
  } catch (error) {
    console.error("[Waitlist] Erro ao entrar na lista:", error);
    return { success: false, error: "Erro ao entrar na lista de espera" };
  }
}

/**
 * Sai da lista de espera
 */
export async function leaveWaitlist(entryId: string, userId: string): Promise<WaitlistResult> {
  if (!isWaitlistEnabled()) {
    return { success: false, error: "Módulo desabilitado" };
  }

  try {
    const entry = await prisma.waitlistEntry.findFirst({
      where: { id: entryId, userId },
    });

    if (!entry) {
      return { success: false, error: "Entrada não encontrada" };
    }

    await prisma.waitlistEntry.update({
      where: { id: entryId },
      data: { status: "cancelled" },
    });

    // Reposiciona outros na fila
    await prisma.waitlistEntry.updateMany({
      where: {
        eventName: entry.eventName,
        position: { gt: entry.position },
        status: "waiting",
      },
      data: { position: { decrement: 1 } },
    });

    return { success: true };
  } catch (error) {
    console.error("[Waitlist] Erro ao sair da lista:", error);
    return { success: false, error: "Erro ao sair da lista" };
  }
}

/**
 * Notifica usuários da lista quando ingresso fica disponível
 */
export async function notifyWaitlist(
  eventName: string,
  ticketId: string,
  price: number
): Promise<number> {
  if (!isWaitlistEnabled()) {
    return 0;
  }

  try {
    // Busca os próximos na fila
    const entries = await prisma.waitlistEntry.findMany({
      where: {
        eventName,
        status: "waiting",
        OR: [{ maxPrice: null }, { maxPrice: { gte: price } }],
      },
      orderBy: { position: "asc" },
      take: WAITLIST_CONFIG.notifyNextUsers,
    });

    const notifyExpiration = new Date();
    notifyExpiration.setMinutes(
      notifyExpiration.getMinutes() + WAITLIST_CONFIG.acceptanceTimeoutMinutes
    );

    // Atualiza status para notificado
    for (const entry of entries) {
      await prisma.waitlistEntry.update({
        where: { id: entry.id },
        data: {
          status: "notified",
          notifiedAt: new Date(),
          // Poderia salvar ticketId e expiração em campos adicionais
        },
      });

      // TODO: Enviar notificação por email/push
    }

    return entries.length;
  } catch (error) {
    console.error("[Waitlist] Erro ao notificar:", error);
    return 0;
  }
}

/**
 * Lista entradas do usuário
 */
export async function getUserWaitlist(userId: string): Promise<WaitlistEntry[]> {
  if (!isWaitlistEnabled()) {
    return [];
  }

  const entries = await prisma.waitlistEntry.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return entries as unknown as WaitlistEntry[];
}

/**
 * Estatísticas da lista de espera de um evento
 */
export async function getWaitlistStats(eventName: string): Promise<WaitlistStats | null> {
  if (!isWaitlistEnabled()) {
    return null;
  }

  const entries = await prisma.waitlistEntry.findMany({
    where: { eventName, status: "waiting" },
    orderBy: { createdAt: "asc" },
  });

  if (entries.length === 0) {
    return null;
  }

  const avgMaxPrice =
    entries.filter((e) => e.maxPrice).reduce((sum, e) => sum + (e.maxPrice || 0), 0) /
    entries.filter((e) => e.maxPrice).length || undefined;

  return {
    eventName,
    totalWaiting: entries.length,
    avgMaxPrice,
    oldestEntry: entries[0].createdAt,
  };
}

/**
 * Processa entradas expiradas
 */
export async function processExpiredWaitlist(): Promise<number> {
  if (!isWaitlistEnabled()) {
    return 0;
  }

  try {
    const result = await prisma.waitlistEntry.updateMany({
      where: {
        status: { in: ["waiting", "notified"] },
        expiresAt: { lt: new Date() },
      },
      data: { status: "expired" },
    });

    return result.count;
  } catch (error) {
    console.error("[Waitlist] Erro ao processar expirados:", error);
    return 0;
  }
}
