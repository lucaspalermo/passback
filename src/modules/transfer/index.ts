// Módulo de Transferência de Ingresso
// Permite transferir ingresso comprado para outro usuário

export const TRANSFER_CONFIG = {
  enabled: process.env.FEATURE_TRANSFER_ENABLED === "true",
  maxTransfersPerTicket: 3, // Máximo de transferências
  requireVerification: false, // Exigir verificação de identidade
};

export function isTransferEnabled(): boolean {
  return TRANSFER_CONFIG.enabled;
}

// Tipos
export type TransferStatus = "pending" | "accepted" | "rejected" | "cancelled" | "expired";

export interface TicketTransfer {
  id: string;
  transactionId: string;
  fromUserId: string;
  toUserId?: string;
  toEmail: string;
  status: TransferStatus;
  transferCode: string;
  acceptedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
}

export interface TransferRequest {
  transactionId: string;
  fromUserId: string;
  toEmail: string;
}

// Schema Prisma (adicionar ao schema.prisma):
/*
model TicketTransfer {
  id            String    @id @default(cuid())
  transactionId String
  fromUserId    String
  toUserId      String?
  toEmail       String
  status        String    @default("pending") // pending, accepted, rejected, cancelled, expired
  transferCode  String    @unique
  acceptedAt    DateTime?
  expiresAt     DateTime
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  transaction   Transaction @relation(fields: [transactionId], references: [id])
  fromUser      User        @relation("TransferFrom", fields: [fromUserId], references: [id])
  toUser        User?       @relation("TransferTo", fields: [toUserId], references: [id])

  @@index([transactionId])
  @@index([transferCode])
  @@index([toEmail])
}
*/
