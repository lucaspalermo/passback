"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ResolveDisputeFormProps {
  disputeId: string;
}

export default function ResolveDisputeForm({ disputeId }: ResolveDisputeFormProps) {
  const router = useRouter();
  const [decision, setDecision] = useState<string>("");
  const [resolution, setResolution] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!decision) {
      setError("Selecione uma decisao");
      return;
    }

    if (resolution.length < 10) {
      setError("A justificativa deve ter pelo menos 10 caracteres");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/disputes/${disputeId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, resolution }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao resolver disputa");
      }

      router.push("/admin/disputas");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao resolver disputa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-3">
        <label className="text-base font-semibold text-white">Decisao Final</label>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setDecision("buyer")}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              decision === "buyer"
                ? "border-[#16C784] bg-[#16C784]/10"
                : "border-white/10 bg-[#1A3A5C] hover:border-[#16C784]/50"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#16C784]/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#16C784]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="font-semibold text-[#16C784]">Favor do Comprador</span>
            </div>
            <p className="text-sm text-gray-400">
              Reembolso total ao comprador. Vendedor perde o valor e sofre penalidade na reputacao.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setDecision("seller")}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              decision === "seller"
                ? "border-[#2DFF88] bg-[#2DFF88]/10"
                : "border-white/10 bg-[#1A3A5C] hover:border-[#2DFF88]/50"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#2DFF88]/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#2DFF88]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <span className="font-semibold text-[#2DFF88]">Favor do Vendedor</span>
            </div>
            <p className="text-sm text-gray-400">
              Pagamento liberado ao vendedor. Comprador marcado como suspeito.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setDecision("split")}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              decision === "split"
                ? "border-[#FF8A00] bg-[#FF8A00]/10"
                : "border-white/10 bg-[#1A3A5C] hover:border-[#FF8A00]/50"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#FF8A00]/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#FF8A00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <span className="font-semibold text-[#FF8A00]">Divisao (Split)</span>
            </div>
            <p className="text-sm text-gray-400">
              Caso ambiguo. Pagamento liberado, mas sem penalidades. Requer tratamento manual.
            </p>
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="resolution" className="text-base font-semibold text-white block">
          Justificativa da Decisao
        </label>
        <textarea
          id="resolution"
          placeholder="Descreva detalhadamente os motivos da sua decisao. Esta justificativa sera visivel para ambas as partes..."
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
          rows={5}
          className="w-full px-4 py-3 bg-[#1A3A5C] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#16C784]/50 focus:ring-1 focus:ring-[#16C784]/50 resize-none"
        />
        <p className="text-xs text-gray-500">
          Minimo 10 caracteres. Seja claro e objetivo.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading || !decision}
          className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            decision === "buyer"
              ? "bg-[#16C784] hover:bg-[#16C784]/80 text-white"
              : decision === "seller"
              ? "bg-[#2DFF88] hover:bg-[#2DFF88]/80 text-black"
              : decision === "split"
              ? "bg-[#FF8A00] hover:bg-[#FF8A00]/80 text-white"
              : "btn-gradient text-white"
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processando...
            </span>
          ) : (
            "Confirmar Decisao"
          )}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={loading}
          className="px-6 py-3 rounded-xl font-semibold bg-[#1A3A5C] text-gray-300 hover:bg-[#0F2A44] transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>

      {decision && (
        <div className={`p-4 rounded-xl flex items-start gap-3 ${
          decision === "buyer"
            ? "bg-[#16C784]/10 border border-[#16C784]/30"
            : decision === "seller"
            ? "bg-[#2DFF88]/10 border border-[#2DFF88]/30"
            : "bg-[#FF8A00]/10 border border-[#FF8A00]/30"
        }`}>
          <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
            decision === "buyer" ? "text-[#16C784]" : decision === "seller" ? "text-[#2DFF88]" : "text-[#FF8A00]"
          }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className={`text-sm ${
            decision === "buyer" ? "text-[#16C784]" : decision === "seller" ? "text-[#2DFF88]" : "text-[#FF8A00]"
          }`}>
            {decision === "buyer" && (
              <>
                Ao confirmar, o comprador sera reembolsado e o vendedor tera sua reputacao penalizada em 15 pontos.
              </>
            )}
            {decision === "seller" && (
              <>
                Ao confirmar, o pagamento sera liberado ao vendedor e o comprador sera marcado como SUSPEITO com penalidade de 20 pontos.
              </>
            )}
            {decision === "split" && (
              <>
                Ao confirmar, o pagamento sera liberado ao vendedor sem penalidades. Use esta opcao apenas em casos muito ambiguos.
              </>
            )}
          </p>
        </div>
      )}
    </form>
  );
}
