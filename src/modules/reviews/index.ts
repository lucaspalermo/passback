// Módulo de Avaliações - Sistema de reviews pós-transação

export const REVIEWS_CONFIG = {
  enabled: process.env.FEATURE_REVIEWS_ENABLED === "true",
  minRating: 1,
  maxRating: 5,
  requireComment: false,
  editWindowHours: 24, // Pode editar avaliação em até 24h
};

export function isReviewsEnabled(): boolean {
  return REVIEWS_CONFIG.enabled;
}

// Tipos
export interface Review {
  id: string;
  transactionId: string;
  reviewerId: string;
  reviewedId: string;
  rating: number;
  comment?: string;
  type: "buyer_to_seller" | "seller_to_buyer";
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRating {
  average: number;
  count: number;
  distribution: { [key: number]: number };
}

// Schema Prisma (adicionar ao schema.prisma):
/*
model Review {
  id            String   @id @default(cuid())
  transactionId String
  reviewerId    String
  reviewedId    String
  rating        Int
  comment       String?
  type          String   // buyer_to_seller, seller_to_buyer
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  transaction   Transaction @relation(fields: [transactionId], references: [id])
  reviewer      User        @relation("ReviewAuthor", fields: [reviewerId], references: [id])
  reviewed      User        @relation("ReviewTarget", fields: [reviewedId], references: [id])

  @@unique([transactionId, type])
  @@index([reviewedId])
}
*/
