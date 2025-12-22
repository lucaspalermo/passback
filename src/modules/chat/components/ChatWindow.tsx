"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "../hooks/useChat";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import type { ChatParticipant } from "../types";

interface ChatWindowProps {
  conversationId: string;
  currentUserId: string;
  otherParticipant: ChatParticipant;
  ticketName?: string;
  eventName?: string;
}

export function ChatWindow({
  conversationId,
  currentUserId,
  otherParticipant,
  ticketName,
  eventName,
}: ChatWindowProps) {
  const { messages, loading, sending, error, sendMessage } = useChat({
    conversationId,
    pollingInterval: 3000,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");

  // Scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || sending) return;

    const content = inputValue;
    setInputValue("");

    const success = await sendMessage(content);
    if (!success) {
      setInputValue(content); // Restaura se falhar
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0F2A44] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/10">
        <div className="w-10 h-10 rounded-full bg-[#1A3A5C] flex items-center justify-center text-white font-medium">
          {otherParticipant.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white truncate">
            {otherParticipant.name}
          </h3>
          {ticketName && (
            <p className="text-sm text-gray-400 truncate">
              {ticketName} - {eventName}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin w-6 h-6 border-2 border-[#16C784] border-t-transparent rounded-full" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
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
            <p className="text-gray-500">Nenhuma mensagem ainda</p>
            <p className="text-sm text-gray-600 mt-1">
              Inicie a conversa sobre o ingresso
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isOwn={message.senderId === currentUserId}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Input */}
      <ChatInput
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSend}
        disabled={sending}
        placeholder="Digite sua mensagem..."
      />
    </div>
  );
}
