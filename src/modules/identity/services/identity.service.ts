// Serviço de verificação de identidade

import prisma from "@/lib/prisma";
import {
  isIdentityEnabled,
  requiresSellerVerification,
  requiresPurchaseVerification,
  IDENTITY_CONFIG,
} from "../config";
import type {
  IdentityVerification,
  SubmitVerificationParams,
  VerificationResult,
  UserVerificationStatus,
  VerificationStatus,
} from "../types";

/**
 * Obtém o status de verificação do usuário
 */
export async function getUserVerificationStatus(
  userId: string
): Promise<UserVerificationStatus> {
  if (!isIdentityEnabled()) {
    return {
      isVerified: true, // Módulo desabilitado = todos verificados
      status: null,
      canSell: true,
      canBuy: true,
    };
  }

  const verification = await prisma.identityVerification.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (!verification) {
    return {
      isVerified: false,
      status: null,
      canSell: !requiresSellerVerification(),
      canBuy: true,
      message: "Você ainda não enviou documentos para verificação",
    };
  }

  const isExpired = Boolean(
    verification.expiresAt && new Date(verification.expiresAt) < new Date()
  );
  const isApproved = verification.status === "approved" && !isExpired;

  return {
    isVerified: isApproved,
    status: isExpired ? "expired" : (verification.status as VerificationStatus),
    canSell: isApproved || !requiresSellerVerification(),
    canBuy: true,
    verification: verification as unknown as IdentityVerification,
    message: getStatusMessage(verification.status as VerificationStatus, isExpired),
  };
}

function getStatusMessage(status: VerificationStatus, isExpired: boolean): string {
  if (isExpired) {
    return "Sua verificação expirou. Envie novos documentos.";
  }

  switch (status) {
    case "pending":
      return "Seus documentos estão aguardando análise.";
    case "under_review":
      return "Seus documentos estão sendo analisados.";
    case "approved":
      return "Sua identidade foi verificada com sucesso!";
    case "rejected":
      return "Seus documentos foram rejeitados. Envie novamente.";
    default:
      return "";
  }
}

/**
 * Submete documentos para verificação
 */
export async function submitVerification(
  params: SubmitVerificationParams
): Promise<VerificationResult> {
  if (!isIdentityEnabled()) {
    return { success: false, error: "Módulo desabilitado" };
  }

  try {
    // Verifica se já tem verificação pendente
    const existing = await prisma.identityVerification.findFirst({
      where: {
        userId: params.userId,
        status: { in: ["pending", "under_review"] },
      },
    });

    if (existing) {
      return {
        success: false,
        error: "Você já tem uma verificação em andamento",
      };
    }

    // Calcula data de expiração
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + IDENTITY_CONFIG.verificationValidityDays);

    // Cria nova verificação
    const verification = await prisma.identityVerification.create({
      data: {
        userId: params.userId,
        status: "pending",
        documentType: params.documentType,
        documentNumber: params.documentNumber,
        documentFrontUrl: params.documentFrontUrl,
        documentBackUrl: params.documentBackUrl,
        selfieUrl: params.selfieUrl,
        expiresAt,
      },
    });

    return {
      success: true,
      verification: verification as unknown as IdentityVerification,
    };
  } catch (error) {
    console.error("[Identity] Erro ao submeter:", error);
    return { success: false, error: "Erro ao processar verificação" };
  }
}

/**
 * Aprova uma verificação (admin)
 */
export async function approveVerification(
  verificationId: string,
  adminId: string
): Promise<VerificationResult> {
  if (!isIdentityEnabled()) {
    return { success: false, error: "Módulo desabilitado" };
  }

  try {
    const verification = await prisma.identityVerification.update({
      where: { id: verificationId },
      data: {
        status: "approved",
        verifiedAt: new Date(),
        reviewedBy: adminId,
      },
    });

    // Atualiza flag no usuário
    await prisma.user.update({
      where: { id: verification.userId },
      data: { isIdentityVerified: true },
    });

    return {
      success: true,
      verification: verification as unknown as IdentityVerification,
    };
  } catch (error) {
    console.error("[Identity] Erro ao aprovar:", error);
    return { success: false, error: "Erro ao aprovar verificação" };
  }
}

/**
 * Rejeita uma verificação (admin)
 */
export async function rejectVerification(
  verificationId: string,
  adminId: string,
  reason: string
): Promise<VerificationResult> {
  if (!isIdentityEnabled()) {
    return { success: false, error: "Módulo desabilitado" };
  }

  try {
    const verification = await prisma.identityVerification.update({
      where: { id: verificationId },
      data: {
        status: "rejected",
        rejectionReason: reason,
        reviewedBy: adminId,
      },
    });

    return {
      success: true,
      verification: verification as unknown as IdentityVerification,
    };
  } catch (error) {
    console.error("[Identity] Erro ao rejeitar:", error);
    return { success: false, error: "Erro ao rejeitar verificação" };
  }
}

/**
 * Lista verificações pendentes (admin)
 */
export async function listPendingVerifications(): Promise<IdentityVerification[]> {
  if (!isIdentityEnabled()) {
    return [];
  }

  const verifications = await prisma.identityVerification.findMany({
    where: {
      status: { in: ["pending", "under_review"] },
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return verifications as unknown as IdentityVerification[];
}

/**
 * Verifica se usuário pode vender
 */
export async function canUserSell(userId: string): Promise<boolean> {
  if (!requiresSellerVerification()) {
    return true;
  }

  const status = await getUserVerificationStatus(userId);
  return status.canSell;
}

/**
 * Verifica se usuário pode comprar (baseado no valor)
 */
export async function canUserBuy(
  userId: string,
  amount: number
): Promise<boolean> {
  if (!requiresPurchaseVerification(amount)) {
    return true;
  }

  const status = await getUserVerificationStatus(userId);
  return status.isVerified;
}
