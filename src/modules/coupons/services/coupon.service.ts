// Serviço de cupons

import prisma from "@/lib/prisma";
import { isCouponsEnabled, COUPONS_CONFIG } from "../index";
import type { Coupon, ApplyCouponResult } from "../index";

/**
 * Valida e aplica um cupom
 */
export async function applyCoupon(
  code: string,
  userId: string,
  amount: number
): Promise<ApplyCouponResult> {
  if (!isCouponsEnabled()) {
    return { success: false, error: "Cupons desabilitados" };
  }

  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (!coupon) {
    return { success: false, error: "Cupom não encontrado" };
  }

  // Validações
  const now = new Date();

  if (!coupon.isActive) {
    return { success: false, error: "Cupom inativo" };
  }

  if (now < coupon.validFrom) {
    return { success: false, error: "Cupom ainda não é válido" };
  }

  if (now > coupon.validUntil) {
    return { success: false, error: "Cupom expirado" };
  }

  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    return { success: false, error: "Cupom esgotado" };
  }

  if (coupon.minAmount && amount < coupon.minAmount) {
    return {
      success: false,
      error: `Valor mínimo para este cupom: R$ ${coupon.minAmount.toFixed(2)}`,
    };
  }

  // Verifica se usuário já usou
  const alreadyUsed = await prisma.couponUsage.findUnique({
    where: {
      couponId_userId: { couponId: coupon.id, userId: userId },
    },
  });

  if (alreadyUsed) {
    return { success: false, error: "Você já usou este cupom" };
  }

  // Calcula desconto
  let discount = 0;
  if (coupon.type === "percentage") {
    discount = amount * (coupon.value / 100);
    // Limita ao máximo configurado
    const maxDiscount = amount * (COUPONS_CONFIG.maxDiscountPercent / 100);
    discount = Math.min(discount, maxDiscount);
  } else {
    discount = Math.min(coupon.value, amount);
  }

  const finalAmount = amount - discount;

  return {
    success: true,
    coupon: coupon as unknown as Coupon,
    discount,
    finalAmount,
  };
}

/**
 * Registra uso de cupom
 */
export async function recordCouponUsage(
  couponId: string,
  userId: string,
  transactionId: string,
  discount: number
): Promise<boolean> {
  if (!isCouponsEnabled()) {
    return false;
  }

  try {
    await prisma.$transaction([
      prisma.couponUsage.create({
        data: {
          couponId,
          userId,
          transactionId,
          discount,
        },
      }),
      prisma.coupon.update({
        where: { id: couponId },
        data: { usedCount: { increment: 1 } },
      }),
    ]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Cria um cupom (admin)
 */
export async function createCoupon(params: {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minAmount?: number;
  maxUses?: number;
  validFrom: Date;
  validUntil: Date;
}): Promise<{ success: boolean; coupon?: Coupon; error?: string }> {
  if (!isCouponsEnabled()) {
    return { success: false, error: "Módulo desabilitado" };
  }

  try {
    const coupon = await prisma.coupon.create({
      data: {
        code: params.code.toUpperCase(),
        type: params.type,
        value: params.value,
        minAmount: params.minAmount,
        maxUses: params.maxUses,
        validFrom: params.validFrom,
        validUntil: params.validUntil,
      },
    });

    return { success: true, coupon: coupon as unknown as Coupon };
  } catch {
    return { success: false, error: "Código já existe" };
  }
}
