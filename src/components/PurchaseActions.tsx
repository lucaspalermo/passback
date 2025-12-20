"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PurchaseActionsProps {
  transactionId: string;
  status: string;
  expiresAt: Date | null;
}

export default function PurchaseActions({ transactionId, status, expiresAt }: PurchaseActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"retry" | "cancel" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Verifica se está expirado
  const isExpired = expiresAt && new Date(expiresAt) < new Date();

  if (status !== "pending" || isExpired) {
    return null;
  }

  // Calcula tempo restante
  const timeLeft = expiresAt ? Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)) : 0;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const handleRetry = async () => {
    setLoading("retry");
    setError(null);
    try {
      const response = await fetch(`/api/transactions/${transactionId}/retry`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao gerar link de pagamento");
        return;
      }

      if (data.checkoutUrl) {
        window.open(data.checkoutUrl, "_blank");
      }
    } catch {
      setError("Erro ao processar solicitacao");
    } finally {
      setLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Tem certeza que deseja cancelar esta compra? O ingresso voltara a ficar disponivel para outras pessoas.")) {
      return;
    }

    setLoading("cancel");
    setError(null);
    try {
      const response = await fetch(`/api/transactions/${transactionId}/cancel`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao cancelar compra");
        return;
      }

      router.refresh();
    } catch {
      setError("Erro ao processar solicitacao");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-white/5">
      {error && (
        <p className="text-red-400 text-sm mb-2">{error}</p>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-[#FF8A00]">
          Tempo restante: {minutes}:{seconds.toString().padStart(2, "0")}
        </p>

        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            disabled={loading !== null}
            className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-sm font-medium disabled:opacity-50"
          >
            {loading === "cancel" ? "Cancelando..." : "Cancelar"}
          </button>
          <button
            onClick={handleRetry}
            disabled={loading !== null}
            className="px-3 py-1.5 rounded-lg bg-[#16C784] text-white hover:bg-[#16C784]/80 transition-all text-sm font-medium disabled:opacity-50 flex items-center gap-1"
          >
            {loading === "retry" ? (
              "Gerando..."
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Continuar Pagamento
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
