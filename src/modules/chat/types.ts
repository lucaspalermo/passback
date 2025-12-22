// Tipos do módulo de chat

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  attachments?: ChatAttachment[];
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatAttachment {
  id: string;
  messageId: string;
  type: "image" | "pdf";
  url: string;
  filename: string;
  size: number;
}

export interface ChatConversation {
  id: string;
  ticketId: string;
  transactionId?: string | null;
  buyerId: string;
  sellerId: string;
  status: "active" | "closed" | "blocked";
  lastMessageAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Populated
  buyer?: ChatParticipant;
  seller?: ChatParticipant;
  ticket?: { id: string; eventName: string; ticketType: string };
  messages?: ChatMessage[];
  unreadCount?: number;
}

export interface ChatParticipant {
  id: string;
  name: string;
  image?: string | null;
}

export interface SendMessageParams {
  conversationId: string;
  senderId: string;
  content: string;
  attachments?: {
    type: "image" | "pdf";
    url: string;
    filename: string;
    size: number;
  }[];
}

export interface CreateConversationParams {
  ticketId: string;
  transactionId?: string;
  buyerId: string;
  sellerId: string;
}

export interface ConversationListItem {
  id: string;
  ticketId: string;
  transactionId?: string | null;
  otherParticipant: ChatParticipant;
  ticketName: string;
  eventName: string;
  lastMessage?: {
    content: string;
    createdAt: Date;
    isFromMe: boolean;
  };
  unreadCount: number;
  status: "active" | "closed" | "blocked";
}

export interface ChatNotification {
  conversationId: string;
  message: ChatMessage;
  sender: ChatParticipant;
}
