// Módulo de Favoritos e Alertas

export const FAVORITES_CONFIG = {
  enabled: process.env.FEATURE_FAVORITES_ENABLED === "true",
  maxFavorites: 50, // Máximo de favoritos por usuário
  alertsEnabled: process.env.FAVORITES_ALERTS_ENABLED === "true",
};

export function isFavoritesEnabled(): boolean {
  return FAVORITES_CONFIG.enabled;
}

// Tipos
export interface Favorite {
  id: string;
  userId: string;
  ticketId?: string;
  eventName?: string; // Para alertas de evento
  alertPrice?: number; // Alertar quando ingresso abaixo deste preço
  createdAt: Date;
}

export interface FavoriteWithTicket extends Favorite {
  ticket?: {
    id: string;
    eventName: string;
    eventDate: Date;
    price: number;
    status: string;
    imageUrl?: string;
  };
}

// Schema Prisma (adicionar ao schema.prisma):
/*
model Favorite {
  id         String    @id @default(cuid())
  userId     String
  ticketId   String?
  eventName  String?   // Para alertas de evento específico
  alertPrice Float?    // Alertar quando preço <= este valor
  createdAt  DateTime  @default(now())

  user       User      @relation(fields: [userId], references: [id])
  ticket     Ticket?   @relation(fields: [ticketId], references: [id])

  @@unique([userId, ticketId])
  @@index([userId])
  @@index([eventName])
}
*/
