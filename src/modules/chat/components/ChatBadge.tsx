"use client";

import { useEffect } from "react";
import { useChat } from "../hooks/useChat";

interface ChatBadgeProps {
  className?: string;
}

/**
 * Badge que mostra contagem de mensagens não lidas
 * Pode ser usado no menu/navbar
 */
export function ChatBadge({ className = "" }: ChatBadgeProps) {
  const { unreadCount, loadUnreadCount } = useChat();

  // Atualiza contagem a cada 30 segundos
  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [loadUnreadCount]);

  if (unreadCount === 0) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold text-white bg-[#16C784] rounded-full ${className}`}
    >
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  );
}
