// Serviço de transferência de ingressos

import crypto from "crypto";
import prisma from "@/lib/prisma";
import { isTransferEnabled, TRANSFER_CONFIG } from "../index";
import type { TicketTransfer, TransferRequest } from "../index";

/**
 * Gera código de transferência único
 */
function generateTransferCode(): string {
  return crypto.randomBytes(6).toString("hex").toUpperCase();
}

/**
 * Inicia uma transferência de ingresso
 */
export async function initiateTransfer(
  request: TransferRequest
): Promise<{ success: boolean; transfer?: TicketTransfer; error?: string }> {
  if (!isTransferEnabled()) {
    return { success: false, error: "Transferências desabilitadas" };
  }

  // Busca transação
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: request.transactionId,
      buyerId: request.fromUserId,
      status: { in: ["paid", "released", "confirmed"] },
    },
    include: { ticket: true },
  });

  if (!transaction) {
    return { success: false, error: "Ingresso não encontrado ou não pertence a você" };
  }

  // Verifica limite de transferências
  const transferCount = await prisma.ticketTransfer.count({
    where: {
      transactionId: request.transactionId,
      status: "accepted",
    },
  });

  if (transferCount >= TRANSFER_CONFIG.maxTransfersPerTicket) {
    return { success: false, error: "Limite de transferências atingido para este ingresso" };
  }

  // Verifica se já tem transferência pendente
  const pendingTransfer = await prisma.ticketTransfer.findFirst({
    where: {
      transactionId: request.transactionId,
      status: "pending",
    },
  });

  if (pendingTransfer) {
    return { success: false, error: "Já existe uma transferência pendente" };
  }

  // Cria transferência
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 48); // Expira em 48h

  const transfer = await prisma.ticketTransfer.create({
    data: {
      transactionId: request.transactionId,
      fromUserId: request.fromUserId,
      toEmail: request.toEmail.toLowerCase(),
      status: "pending",
      transferCode: generateTransferCode(),
      expiresAt,
    },
  });

  // TODO: Enviar email para destinatário via módulo de notificações

  return { success: true, transfer: transfer as unknown as TicketTransfer };
}

/**
 * Aceita uma transferência
 */
export async function acceptTransfer(
  transferCode: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isTransferEnabled()) {
    return { success: false, error: "Transferências desabilitadas" };
  }

  const transfer = await prisma.ticketTransfer.findUnique({
    where: { transferCode },
    include: {
      transaction: {
        include: { buyer: true },
      },
    },
  });

  if (!transfer) {
    return { success: false, error: "Código de transferência inválido" };
  }

  if (transfer.status !== "pending") {
    return { success: false, error: "Esta transferência não está mais disponível" };
  }

  if (new Date() > transfer.expiresAt) {
    await prisma.ticketTransfer.update({
      where: { id: transfer.id },
      data: { status: "expired" },
    });
    return { success: false, error: "Transferência expirada" };
  }

  // Verifica email do usuário
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.email.toLowerCase() !== transfer.toEmail.toLowerCase()) {
    return { success: false, error: "Este ingresso foi transferido para outro email" };
  }

  // Efetua a transferência
  await prisma.$transaction([
    // Atualiza transferência
    prisma.ticketTransfer.update({
      where: { id: transfer.id },
      data: {
        status: "accepted",
        toUserId: userId,
        acceptedAt: new Date(),
      },
    }),
    // Atualiza transação com novo comprador
    prisma.transaction.update({
      where: { id: transfer.transactionId },
      data: { buyerId: userId },
    }),
  ]);

  return { success: true };
}

/**
 * Cancela uma transferência
 */
export async function cancelTransfer(
  transferId: string,
  userId: string
): Promise<boolean> {
  if (!isTransferEnabled()) {
    return false;
  }

  const result = await prisma.ticketTransfer.updateMany({
    where: {
      id: transferId,
      fromUserId: userId,
      status: "pending",
    },
    data: { status: "cancelled" },
  });

  return result.count > 0;
}

/**
 * Lista transferências de um usuário
 */
export async function listMyTransfers(
  userId: string
): Promise<{ sent: TicketTransfer[]; received: TicketTransfer[] }> {
  if (!isTransferEnabled()) {
    return { sent: [], received: [] };
  }

  const [sent, received] = await Promise.all([
    prisma.ticketTransfer.findMany({
      where: { fromUserId: userId },
      include: {
        transaction: {
          include: { ticket: { select: { eventName: true, ticketType: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.ticketTransfer.findMany({
      where: { toUserId: userId, status: "accepted" },
      include: {
        transaction: {
          include: { ticket: { select: { eventName: true, ticketType: true } } },
        },
        fromUser: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    sent: sent as unknown as TicketTransfer[],
    received: received as unknown as TicketTransfer[],
  };
}
