"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PixQrCode from "@/components/PixQrCode";

interface BuyButtonProps {
  ticketId: string;
  price: number;
}

interface PixQrCodeData {
  encodedImage: string;
  payload: string;
  expirationDate: string;
}

export default function BuyButton({ ticketId, price }: BuyButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [pixQrCode, setPixQrCode] = useState<PixQrCodeData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "CREDIT_CARD">("PIX");
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [showSimulate, setShowSimulate] = useState(false);

  const handleBuy = async (method: "PIX" | "CREDIT_CARD" = "PIX") => {
    setLoading(true);
    setError("");
    setPaymentMethod(method);

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, paymentMethod: method }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao iniciar compra");
        return;
      }

      setTransactionId(data.transaction.id);

      // Para cartão de crédito, redireciona para checkout Asaas
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      // Para PIX, exibe o QR Code
      if (data.pixQrCode) {
        setPixQrCode(data.pixQrCode);
      } else {
        // Sem Asaas configurado - mostrar opção de simular
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

  const handlePixExpired = () => {
    setPixQrCode(null);
    setError("O QR Code expirou. Clique em 'Tentar novamente' para gerar um novo.");
  };

  const handleRetry = async () => {
    if (!transactionId) return;
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/transactions/${transactionId}/retry`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao gerar novo pagamento");
        return;
      }

      if (data.pixQrCode) {
        setPixQrCode(data.pixQrCode);
      }
    } catch {
      setError("Erro ao gerar novo pagamento");
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

  // Se tem QR Code PIX, mostra ele
  if (pixQrCode) {
    return (
      <div className="space-y-4">
        <PixQrCode
          encodedImage={pixQrCode.encodedImage}
          payload={pixQrCode.payload}
          expirationDate={pixQrCode.expirationDate}
          transactionId={transactionId || undefined}
          onExpired={handlePixExpired}
        />

        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/compra/${transactionId}`)}
            className="flex-1 py-3 rounded-xl font-medium text-gray-300 border border-white/10 hover:bg-white/5 transition-all"
          >
            Ver detalhes
          </button>
          <button
            onClick={handleRetry}
            disabled={loading}
            className="flex-1 py-3 rounded-xl font-medium text-[#16C784] border border-[#16C784]/30 hover:bg-[#16C784]/10 transition-all disabled:opacity-50"
          >
            {loading ? "Gerando..." : "Novo QR Code"}
          </button>
        </div>
      </div>
    );
  }

  // Modo de simulação (desenvolvimento)
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
            Asaas nao configurado. Clique abaixo para simular.
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

  // Opções de pagamento
  if (showPaymentOptions) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-400 text-center mb-2">Escolha a forma de pagamento:</p>

        {/* PIX */}
        <button
          onClick={() => handleBuy("PIX")}
          disabled={loading}
          className="w-full py-4 rounded-xl font-semibold text-white bg-[#16C784] hover:bg-[#14b576] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {loading && paymentMethod === "PIX" ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processando...
            </span>
          ) : (
            <>
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h1v1h-1v-1zm-2 0h1v1h-1v-1zm2 2h1v1h-1v-1zm-2 2h1v3h-1v-3zm4-2v4h-1v-1h-1v-1h2zm0-2h1v2h-1v-2z" />
              </svg>
              PIX - {formatPrice(price)}
            </>
          )}
        </button>

        {/* Cartão de Crédito */}
        <button
          onClick={() => handleBuy("CREDIT_CARD")}
          disabled={loading}
          className="w-full py-4 rounded-xl font-semibold text-white bg-[#0F2A44] border border-white/10 hover:bg-[#1A3A5C] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {loading && paymentMethod === "CREDIT_CARD" ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processando...
            </span>
          ) : (
            <>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Cartao de Credito - {formatPrice(price)}
            </>
          )}
        </button>

        <button
          onClick={() => setShowPaymentOptions(false)}
          className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          Voltar
        </button>
      </div>
    );
  }

  // Botão inicial
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
        onClick={() => setShowPaymentOptions(true)}
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
        Pagamento seguro via PIX ou Cartao de Credito
      </p>
    </div>
  );
}
