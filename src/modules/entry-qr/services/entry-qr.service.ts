// Serviço de QR Code de Entrada

import prisma from "@/lib/prisma";
import { isEntryQrEnabled, generateEntryCode, validateEntryCode, ENTRY_QR_CONFIG } from "../index";
import type { EntryQrCode } from "../index";

/**
 * Gera QR Code para uma transação confirmada
 */
export async function generateEntryQr(
  transactionId: string
): Promise<{ success: boolean; qrCode?: EntryQrCode; error?: string }> {
  if (!isEntryQrEnabled()) {
    return { success: false, error: "Módulo desabilitado" };
  }

  // Busca transação
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { ticket: true },
  });

  if (!transaction) {
    return { success: false, error: "Transação não encontrada" };
  }

  if (!["paid", "released", "confirmed"].includes(transaction.status)) {
    return { success: false, error: "Transação não confirmada" };
  }

  // Verifica se já existe
  const existing = await prisma.entryQrCode.findUnique({
    where: { transactionId },
  });

  if (existing) {
    return { success: true, qrCode: existing as unknown as EntryQrCode };
  }

  // Gera código
  const code = generateEntryCode(transactionId, transaction.ticket.eventDate);

  // Calcula expiração (data do evento + X horas)
  const expiresAt = new Date(transaction.ticket.eventDate);
  expiresAt.setHours(expiresAt.getHours() + ENTRY_QR_CONFIG.expirationHours);

  // Cria QR Code
  const qrCode = await prisma.entryQrCode.create({
    data: {
      transactionId,
      code,
      expiresAt,
    },
  });

  return { success: true, qrCode: qrCode as unknown as EntryQrCode };
}

/**
 * Valida um QR Code no evento
 */
export async function validateEntryQr(
  code: string,
  validatorId: string
): Promise<{
  success: boolean;
  valid?: boolean;
  message: string;
  ticket?: { eventName: string; ticketType: string; buyerName: string };
}> {
  if (!isEntryQrEnabled()) {
    return { success: false, message: "Módulo desabilitado" };
  }

  const qrCode = await prisma.entryQrCode.findUnique({
    where: { code },
    include: {
      transaction: {
        include: {
          ticket: true,
          buyer: { select: { name: true } },
        },
      },
    },
  });

  if (!qrCode) {
    return { success: true, valid: false, message: "QR Code inválido ou não encontrado" };
  }

  // Verifica expiração
  if (new Date() > qrCode.expiresAt) {
    return { success: true, valid: false, message: "QR Code expirado" };
  }

  // Verifica se já foi usado
  if (qrCode.isUsed) {
    return {
      success: true,
      valid: false,
      message: `QR Code já utilizado em ${qrCode.usedAt?.toLocaleString("pt-BR")}`,
    };
  }

  // Valida autenticidade
  const isValid = validateEntryCode(
    code,
    qrCode.transactionId,
    qrCode.transaction.ticket.eventDate
  );

  if (!isValid) {
    return { success: true, valid: false, message: "QR Code adulterado" };
  }

  // Marca como usado
  await prisma.entryQrCode.update({
    where: { id: qrCode.id },
    data: {
      isUsed: true,
      usedAt: new Date(),
      usedBy: validatorId,
    },
  });

  return {
    success: true,
    valid: true,
    message: "Entrada liberada!",
    ticket: {
      eventName: qrCode.transaction.ticket.eventName,
      ticketType: qrCode.transaction.ticket.ticketType,
      buyerName: qrCode.transaction.buyer.name,
    },
  };
}

/**
 * Busca QR Code do comprador
 */
export async function getMyEntryQr(
  transactionId: string,
  userId: string
): Promise<EntryQrCode | null> {
  if (!isEntryQrEnabled()) {
    return null;
  }

  const qrCode = await prisma.entryQrCode.findFirst({
    where: {
      transactionId,
      transaction: { buyerId: userId },
    },
  });

  return qrCode as unknown as EntryQrCode;
}
