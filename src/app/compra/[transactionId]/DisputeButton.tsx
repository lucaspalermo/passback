"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DisputeButtonProps {
  transactionId: string;
  existingDisputeId?: string | null;
}

const reasonOptions = [
  { value: "ingresso_invalido", label: "Ingresso Invalido" },
  { value: "nao_recebeu", label: "Nao Recebeu o Ingresso" },
  { value: "ingresso_diferente", label: "Ingresso Diferente do Anunciado" },
  { value: "vendedor_nao_responde", label: "Vendedor Nao Responde" },
  { value: "outro", label: "Outro Motivo" },
];

export default function DisputeButton({ transactionId, existingDisputeId }: DisputeButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");

  // Se ja existe disputa, redireciona para ela
  if (existingDisputeId) {
    return (
      <button
        onClick={() => router.push(`/disputa/${existingDisputeId}`)}
        className="w-full py-3 px-4 rounded-xl font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/20 transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        Ver Disputa Aberta
      </button>
    );
  }

  const handleDispute = async () => {
    if (!reason) {
      setError("Selecione o motivo da disputa");
      return;
    }

    if (description.length < 10) {
      setError("Descreva o problema com pelo menos 10 caracteres");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, reason, description }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao abrir disputa");
        return;
      }

      // Redireciona para a pagina da disputa
      router.push(`/disputa/${data.disputeId}`);
    } catch {
      setError("Erro ao abrir disputa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3 px-4 rounded-xl font-semibold bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        Abrir Disputa
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Modal content */}
          <div className="relative w-full max-w-lg mx-4 bg-[#1a1425] rounded-2xl border border-white/10 shadow-xl overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-white/5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Abrir Disputa</h2>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-400 text-sm mt-1">
                Selecione o motivo e descreva o problema. Nossa equipe analisara o caso com base nas evidencias fornecidas.
              </p>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Motivo */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Motivo da Disputa</label>
                <div className="relative">
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-4 py-3 bg-[#2d2438] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#e91e63]/50 appearance-none cursor-pointer"
                  >
                    <option value="">Selecione o motivo</option>
                    {reasonOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Descricao */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Descreva o problema</label>
                <textarea
                  placeholder="Explique detalhadamente o que aconteceu..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-[#2d2438] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#e91e63]/50 resize-none"
                />
                <p className="text-xs text-gray-500">
                  Seja o mais detalhado possivel. Inclua datas, horarios e qualquer informacao relevante.
                </p>
              </div>

              {/* Aviso */}
              <div className="p-4 bg-yellow-500/10 rounded-xl space-y-2">
                <p className="text-sm text-yellow-400 font-medium flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Importante:
                </p>
                <ul className="text-sm text-yellow-300/80 list-disc list-inside space-y-1">
                  <li>O pagamento ficara retido ate a resolucao</li>
                  <li>Voce podera enviar evidencias (prints, fotos) apos abrir a disputa</li>
                  <li>Disputas falsas podem resultar em suspensao da conta</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-white/5 flex gap-3">
              <button
                onClick={() => setOpen(false)}
                disabled={loading}
                className="flex-1 py-3 px-4 rounded-xl font-semibold bg-[#2d2438] text-gray-300 hover:bg-[#3d3448] transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDispute}
                disabled={loading}
                className="flex-1 py-3 px-4 rounded-xl font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Abrindo...
                  </>
                ) : (
                  "Abrir Disputa"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
