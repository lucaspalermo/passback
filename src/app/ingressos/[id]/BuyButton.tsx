"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface BuyButtonProps {
  ticketId: string;
  price: number;
}

export default function BuyButton({ ticketId, price }: BuyButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [showSimulate, setShowSimulate] = useState(false);

  const handleBuy = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao iniciar compra");
        return;
      }

      // Redireciona para o checkout do Mercado Pago
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        // Sem Mercado Pago configurado - mostrar opcao de simular
        setTransactionId(data.transaction.id);
        setShowSimulate(true);
      }
    } catch {
      setError("Erro ao processar compra");
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!transactionId) return;
    setLoading(true);

    try {
      const response = await fetch("/api/test/simulate-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(data.redirectUrl);
      } else {
        setError(data.error || "Erro ao simular pagamento");
      }
    } catch {
      setError("Erro ao simular pagamento");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  if (showSimulate) {
    return (
      <div className="space-y-3">
        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl">
          <p className="text-yellow-400 text-sm font-medium mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Modo de Teste
          </p>
          <p className="text-yellow-300/80 text-sm">
            Mercado Pago nao configurado. Clique abaixo para simular.
          </p>
        </div>
        <button
          onClick={handleSimulatePayment}
          disabled={loading}
          className="w-full py-4 rounded-xl font-semibold text-white bg-green-600 hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processando...
            </span>
          ) : (
            "Simular Pagamento Aprovado"
          )}
        </button>
        <button
          onClick={() => router.push(`/compra/${transactionId}`)}
          className="w-full py-3 rounded-xl font-medium text-gray-300 border border-white/10 hover:bg-white/5 transition-all"
        >
          Ver detalhes da transacao
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}
      <button
        onClick={handleBuy}
        disabled={loading}
        className="w-full btn-gradient py-4 rounded-xl font-semibold text-white text-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processando...
          </span>
        ) : (
          `Comprar por ${formatPrice(price)}`
        )}
      </button>
      <p className="text-xs text-gray-500 text-center">
        Pagamento seguro via Mercado Pago
      </p>
    </div>
  );
}
