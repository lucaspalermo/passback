"use client";

import { useEffect } from "react";
import { useChat } from "../hooks/useChat";
import type { ConversationListItem } from "../types";

interface ConversationListProps {
  onSelect: (conversation: ConversationListItem) => void;
  selectedId?: string;
}

export function ConversationList({ onSelect, selectedId }: ConversationListProps) {
  const { conversations, loading, loadConversations } = useChat();

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const formatTime = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
      return d.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return "Ontem";
    } else if (diffDays < 7) {
      return d.toLocaleDateString("pt-BR", { weekday: "short" });
    } else {
      return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    }
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-6 h-6 border-2 border-[#16C784] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <svg
          className="w-16 h-16 text-gray-600 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <p className="text-gray-500">Nenhuma conversa</p>
        <p className="text-sm text-gray-600 mt-1">
          As conversas aparecerao aqui quando voce comprar ou vender ingressos
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/5">
      {conversations.map((conversation) => (
        <button
          key={conversation.id}
          onClick={() => onSelect(conversation)}
          className={`w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left ${
            selectedId === conversation.id ? "bg-white/10" : ""
          }`}
        >
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-[#1A3A5C] flex items-center justify-center text-white font-medium">
              {conversation.otherParticipant.name.charAt(0).toUpperCase()}
            </div>
            {conversation.unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-[#16C784] text-white text-xs font-bold rounded-full">
                {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-medium text-white truncate">
                {conversation.otherParticipant.name}
              </h4>
              {conversation.lastMessage && (
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {formatTime(conversation.lastMessage.createdAt)}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 truncate">
              {conversation.ticketName} - {conversation.eventName}
            </p>
            {conversation.lastMessage && (
              <p
                className={`text-sm truncate mt-0.5 ${
                  conversation.unreadCount > 0
                    ? "text-white font-medium"
                    : "text-gray-500"
                }`}
              >
                {conversation.lastMessage.isFromMe && (
                  <span className="text-gray-500">Voce: </span>
                )}
                {conversation.lastMessage.content}
              </p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
