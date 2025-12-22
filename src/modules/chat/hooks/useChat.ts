"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ChatMessage, ConversationListItem } from "../types";

interface UseChatOptions {
  conversationId?: string;
  pollingInterval?: number;
}

interface UseChatReturn {
  messages: ChatMessage[];
  conversations: ConversationListItem[];
  loading: boolean;
  sending: boolean;
  error: string | null;
  unreadCount: number;
  sendMessage: (content: string) => Promise<boolean>;
  loadMessages: () => Promise<void>;
  loadConversations: () => Promise<void>;
  loadUnreadCount: () => Promise<void>;
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const { conversationId, pollingInterval = 5000 } = options;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Carrega mensagens de uma conversa
  const loadMessages = useCallback(async () => {
    if (!conversationId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/modules/chat/messages?conversationId=${conversationId}`
      );
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao carregar mensagens");
        return;
      }

      setMessages(data.messages || []);
    } catch (err) {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  // Carrega lista de conversas
  const loadConversations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/modules/chat/conversations");
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao carregar conversas");
        return;
      }

      setConversations(data.conversations || []);
    } catch (err) {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }, []);

  // Carrega contagem de não lidas
  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await fetch("/api/modules/chat/unread");
      const data = await response.json();
      setUnreadCount(data.count || 0);
    } catch {
      // Silencia erro
    }
  }, []);

  // Envia uma mensagem
  const sendMessage = useCallback(
    async (content: string): Promise<boolean> => {
      if (!conversationId || !content.trim()) return false;

      setSending(true);
      setError(null);

      try {
        const response = await fetch("/api/modules/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, content }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Erro ao enviar mensagem");
          return false;
        }

        // Adiciona mensagem à lista local
        setMessages((prev) => [...prev, data.message]);
        return true;
      } catch (err) {
        setError("Erro de conexão");
        return false;
      } finally {
        setSending(false);
      }
    },
    [conversationId]
  );

  // Polling para novas mensagens
  useEffect(() => {
    if (!conversationId || pollingInterval <= 0) return;

    loadMessages();

    pollingRef.current = setInterval(() => {
      loadMessages();
    }, pollingInterval);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [conversationId, pollingInterval, loadMessages]);

  // Carrega contagem inicial
  useEffect(() => {
    loadUnreadCount();
  }, [loadUnreadCount]);

  return {
    messages,
    conversations,
    loading,
    sending,
    error,
    unreadCount,
    sendMessage,
    loadMessages,
    loadConversations,
    loadUnreadCount,
  };
}
