// Serviço principal de chat
// Gerencia conversas e mensagens

import prisma from "@/lib/prisma";
import { isChatEnabled, containsBlockedContent, CHAT_CONFIG } from "../config";
import type {
  ChatConversation,
  ChatMessage,
  SendMessageParams,
  CreateConversationParams,
  ConversationListItem,
} from "../types";

/**
 * Cria ou retorna uma conversa existente para um ticket
 */
export async function getOrCreateConversation(
  params: CreateConversationParams
): Promise<ChatConversation | null> {
  if (!isChatEnabled()) {
    return null;
  }

  // Verifica se já existe
  const existing = await prisma.chatConversation.findFirst({
    where: {
      ticketId: params.ticketId,
      buyerId: params.buyerId,
      sellerId: params.sellerId,
    },
    include: {
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
    },
  });

  if (existing) {
    return existing as unknown as ChatConversation;
  }

  // Cria nova conversa
  const conversation = await prisma.chatConversation.create({
    data: {
      ticketId: params.ticketId,
      transactionId: params.transactionId,
      buyerId: params.buyerId,
      sellerId: params.sellerId,
      status: "active",
    },
    include: {
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
    },
  });

  return conversation as unknown as ChatConversation;
}

/**
 * Busca uma conversa por ID
 */
export async function getConversation(
  conversationId: string,
  userId: string
): Promise<ChatConversation | null> {
  if (!isChatEnabled()) {
    return null;
  }

  const conversation = await prisma.chatConversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ buyerId: userId }, { sellerId: userId }],
    },
    include: {
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
      ticket: { select: { id: true, eventName: true, ticketType: true } },
    },
  });

  return conversation as unknown as ChatConversation;
}

/**
 * Lista conversas de um usuário
 */
export async function listConversations(
  userId: string
): Promise<ConversationListItem[]> {
  if (!isChatEnabled()) {
    return [];
  }

  const conversations = await prisma.chatConversation.findMany({
    where: {
      OR: [{ buyerId: userId }, { sellerId: userId }],
    },
    include: {
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
      ticket: { select: { id: true, eventName: true, ticketType: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: {
        select: {
          messages: {
            where: {
              senderId: { not: userId },
              readAt: null,
            },
          },
        },
      },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  return conversations.map((conv) => {
    const isBuyer = conv.buyerId === userId;
    const otherParticipant = isBuyer ? conv.seller : conv.buyer;
    const lastMessage = conv.messages[0];

    return {
      id: conv.id,
      ticketId: conv.ticketId,
      transactionId: conv.transactionId,
      otherParticipant: {
        id: otherParticipant.id,
        name: otherParticipant.name,
      },
      ticketName: conv.ticket.ticketType,
      eventName: conv.ticket.eventName,
      lastMessage: lastMessage
        ? {
            content: lastMessage.content,
            createdAt: lastMessage.createdAt,
            isFromMe: lastMessage.senderId === userId,
          }
        : undefined,
      unreadCount: conv._count.messages,
      status: conv.status as "active" | "closed" | "blocked",
    };
  });
}

/**
 * Busca mensagens de uma conversa
 */
export async function getMessages(
  conversationId: string,
  userId: string,
  limit = 50,
  before?: string
): Promise<ChatMessage[]> {
  if (!isChatEnabled()) {
    return [];
  }

  // Verifica se usuário tem acesso
  const conversation = await prisma.chatConversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ buyerId: userId }, { sellerId: userId }],
    },
  });

  if (!conversation) {
    return [];
  }

  const messages = await prisma.chatMessage.findMany({
    where: {
      conversationId,
      ...(before && { createdAt: { lt: new Date(before) } }),
    },
    include: {
      attachments: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return messages.reverse() as unknown as ChatMessage[];
}

/**
 * Envia uma mensagem
 */
export async function sendMessage(
  params: SendMessageParams
): Promise<{ success: boolean; message?: ChatMessage; error?: string }> {
  if (!isChatEnabled()) {
    return { success: false, error: "Chat desabilitado" };
  }

  // Valida conteúdo bloqueado
  if (containsBlockedContent(params.content)) {
    return {
      success: false,
      error: "Mensagem contém conteúdo não permitido. Mantenha a negociação pela plataforma.",
    };
  }

  // Valida tamanho
  if (params.content.length > CHAT_CONFIG.maxMessageLength) {
    return {
      success: false,
      error: `Mensagem muito longa. Máximo ${CHAT_CONFIG.maxMessageLength} caracteres.`,
    };
  }

  // Verifica se conversa existe e usuário tem acesso
  const conversation = await prisma.chatConversation.findFirst({
    where: {
      id: params.conversationId,
      OR: [{ buyerId: params.senderId }, { sellerId: params.senderId }],
      status: "active",
    },
  });

  if (!conversation) {
    return { success: false, error: "Conversa não encontrada ou fechada" };
  }

  // Cria mensagem
  const message = await prisma.chatMessage.create({
    data: {
      conversationId: params.conversationId,
      senderId: params.senderId,
      content: params.content,
      attachments: params.attachments
        ? {
            create: params.attachments.map((a) => ({
              type: a.type,
              url: a.url,
              filename: a.filename,
              size: a.size,
            })),
          }
        : undefined,
    },
    include: {
      attachments: true,
    },
  });

  // Atualiza última mensagem da conversa
  await prisma.chatConversation.update({
    where: { id: params.conversationId },
    data: { lastMessageAt: new Date() },
  });

  return { success: true, message: message as unknown as ChatMessage };
}

/**
 * Marca mensagens como lidas
 */
export async function markAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  if (!isChatEnabled()) {
    return;
  }

  await prisma.chatMessage.updateMany({
    where: {
      conversationId,
      senderId: { not: userId },
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });
}

/**
 * Conta mensagens não lidas do usuário
 */
export async function countUnread(userId: string): Promise<number> {
  if (!isChatEnabled()) {
    return 0;
  }

  const count = await prisma.chatMessage.count({
    where: {
      conversation: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
      senderId: { not: userId },
      readAt: null,
    },
  });

  return count;
}

/**
 * Fecha uma conversa
 */
export async function closeConversation(
  conversationId: string,
  userId: string
): Promise<boolean> {
  if (!isChatEnabled()) {
    return false;
  }

  const result = await prisma.chatConversation.updateMany({
    where: {
      id: conversationId,
      OR: [{ buyerId: userId }, { sellerId: userId }],
    },
    data: {
      status: "closed",
    },
  });

  return result.count > 0;
}
