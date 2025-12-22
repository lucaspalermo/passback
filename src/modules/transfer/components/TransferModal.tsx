"use client";

import { useState } from "react";

interface TransferModalProps {
  transactionId: string;
  ticketName: string;
  eventName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function TransferModal({
  transactionId,
  ticketName,
  eventName,
  isOpen,
  onClose,
  onSuccess,
}: TransferModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/modules/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, toEmail: email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao iniciar transferência");
        return;
      }

      setSuccess(true);
      onSuccess?.();
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#0F2A44] rounded-2xl p-6 w-full max-w-md">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {success ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-[#16C784]/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#16C784]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-white mb-2">Convite enviado!</h3>
            <p className="text-gray-400 mb-4">
              Enviamos um email para <strong>{email}</strong> com as instruções para aceitar a transferência.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-[#16C784] hover:bg-[#14b576] text-white rounded-xl font-medium transition-colors"
            >
              Fechar
            </button>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-medium text-white mb-2">Transferir ingresso</h3>
            <p className="text-gray-400 text-sm mb-4">
              {ticketName} - {eventName}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Email do destinatário
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  required
                  className="w-full bg-[#1A3A5C] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#16C784]/50"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <div className="p-3 bg-[#FF8A00]/10 border border-[#FF8A00]/20 rounded-lg">
                <p className="text-xs text-[#FF8A00]">
                  Após a transferência, você perderá o acesso a este ingresso.
                  O destinatário terá 48 horas para aceitar.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl font-medium text-gray-300 border border-white/10 hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="flex-1 py-3 rounded-xl font-medium text-white bg-[#16C784] hover:bg-[#14b576] disabled:bg-gray-600 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? "Enviando..." : "Transferir"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
