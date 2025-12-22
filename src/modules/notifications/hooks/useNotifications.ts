// Hook para disparar notificações do lado do cliente
// Integração sem modificar código existente

"use client";

import { useState } from "react";

interface NotificationRequest {
  type: string;
  recipient: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  data?: Record<string, unknown>;
  opponent?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

interface UseNotificationsReturn {
  send: (request: NotificationRequest) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export function useNotifications(): UseNotificationsReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async (request: NotificationRequest): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/modules/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Erro ao enviar notificação");
        return false;
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { send, loading, error };
}
