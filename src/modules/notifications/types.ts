// Tipos do módulo de notificações

export type NotificationType =
  | "payment_confirmed"
  | "ticket_sold"
  | "dispute_opened"
  | "dispute_resolved"
  | "ticket_released"
  | "welcome"
  | "ticket_reserved"
  | "payment_expired"
  | "refund_processed";

export type NotificationChannel = "email" | "push" | "sms";

export interface NotificationRecipient {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface NotificationPayload {
  type: NotificationType;
  recipient: NotificationRecipient;
  data: Record<string, unknown>;
  channels?: NotificationChannel[];
}

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface NotificationResult {
  success: boolean;
  channel: NotificationChannel;
  messageId?: string;
  error?: string;
}

export interface NotificationEvent {
  id: string;
  type: NotificationType;
  recipientId: string;
  channel: NotificationChannel;
  status: "pending" | "sent" | "failed";
  sentAt?: Date;
  error?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

// Dados específicos por tipo de notificação
export interface PaymentConfirmedData {
  transactionId: string;
  ticketName: string;
  eventName: string;
  amount: number;
  paymentMethod: string;
}

export interface TicketSoldData {
  transactionId: string;
  ticketName: string;
  eventName: string;
  amount: number;
  sellerAmount: number;
  buyerName: string;
}

export interface DisputeOpenedData {
  disputeId: string;
  transactionId: string;
  ticketName: string;
  reason: string;
  openedBy: "buyer" | "seller";
}

export interface DisputeResolvedData {
  disputeId: string;
  transactionId: string;
  ticketName: string;
  resolution: string;
  winner: "buyer" | "seller";
}

export interface TicketReleasedData {
  transactionId: string;
  ticketName: string;
  eventName: string;
  amount: number;
}

export interface WelcomeData {
  userName: string;
}
