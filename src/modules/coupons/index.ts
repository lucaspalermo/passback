// Módulo de Cupons - Sistema de descontos promocionais

export const COUPONS_CONFIG = {
  enabled: process.env.FEATURE_COUPONS_ENABLED === "true",
  maxDiscountPercent: 50, // Máximo 50% de desconto
  minPurchaseAmount: 0,   // Valor mínimo de compra
};

export function isCouponsEnabled(): boolean {
  return COUPONS_CONFIG.enabled;
}

// Tipos
export type CouponType = "percentage" | "fixed";

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number; // Porcentagem ou valor fixo
  minAmount?: number;
  maxUses?: number;
  usedCount: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface ApplyCouponResult {
  success: boolean;
  coupon?: Coupon;
  discount?: number;
  finalAmount?: number;
  error?: string;
}

// Schema Prisma (adicionar ao schema.prisma):
/*
model Coupon {
  id          String    @id @default(cuid())
  code        String    @unique
  type        String    // percentage, fixed
  value       Float
  minAmount   Float?
  maxUses     Int?
  usedCount   Int       @default(0)
  validFrom   DateTime
  validUntil  DateTime
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  usages      CouponUsage[]

  @@index([code])
  @@index([validUntil])
}

model CouponUsage {
  id            String   @id @default(cuid())
  couponId      String
  userId        String
  transactionId String
  discount      Float
  createdAt     DateTime @default(now())

  coupon        Coupon      @relation(fields: [couponId], references: [id])
  user          User        @relation(fields: [userId], references: [id])
  transaction   Transaction @relation(fields: [transactionId], references: [id])

  @@unique([couponId, userId])
}
*/
