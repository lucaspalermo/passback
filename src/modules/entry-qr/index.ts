// Módulo de QR Code de Entrada
// Gera QR Code único pós-compra para validação no evento

import crypto from "crypto";

export const ENTRY_QR_CONFIG = {
  enabled: process.env.FEATURE_ENTRY_QR_ENABLED === "true",
  secretKey: process.env.ENTRY_QR_SECRET || "passback-secret-key",
  expirationHours: 24, // QR expira 24h após evento
};

export function isEntryQrEnabled(): boolean {
  return ENTRY_QR_CONFIG.enabled;
}

// Tipos
export interface EntryQrCode {
  id: string;
  transactionId: string;
  code: string; // Hash único
  isUsed: boolean;
  usedAt?: Date;
  usedBy?: string; // ID do validador
  expiresAt: Date;
  createdAt: Date;
}

/**
 * Gera código único para o QR
 */
export function generateEntryCode(transactionId: string, eventDate: Date): string {
  const data = `${transactionId}-${eventDate.toISOString()}-${ENTRY_QR_CONFIG.secretKey}`;
  return crypto.createHash("sha256").update(data).digest("hex").substring(0, 16).toUpperCase();
}

/**
 * Valida se o código é autêntico
 */
export function validateEntryCode(
  code: string,
  transactionId: string,
  eventDate: Date
): boolean {
  const expectedCode = generateEntryCode(transactionId, eventDate);
  return code === expectedCode;
}

// Schema Prisma (adicionar ao schema.prisma):
/*
model EntryQrCode {
  id            String    @id @default(cuid())
  transactionId String    @unique
  code          String    @unique
  isUsed        Boolean   @default(false)
  usedAt        DateTime?
  usedBy        String?
  expiresAt     DateTime
  createdAt     DateTime  @default(now())

  transaction   Transaction @relation(fields: [transactionId], references: [id])
  validator     User?       @relation(fields: [usedBy], references: [id])

  @@index([code])
}
*/
