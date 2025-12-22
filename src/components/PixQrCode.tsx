"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface PixQrCodeProps {
  encodedImage: string;
  payload: string;
  expirationDate: string;
  transactionId?: string;
  onExpired?: () => void;
  onPaymentConfirmed?: () => void;
}

export default function PixQrCode({
  encodedImage,
  payload,
  expirationDate,
  transactionId,
  onExpired,
  onPaymentConfirmed,
}: PixQrCodeProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isExpired, setIsExpired] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);

  // Polling para verificar se o pagamento foi confirmado
  useEffect(() => {
    if (!transactionId || isExpired) return;

    const checkPaymentStatus = async () => {
      try {
        setCheckingPayment(true);
        const response = await fetch(`/api/transactions/${transactionId}/status`);
        const data = await response.json();

        if (data.status === "paid" || data.status === "confirmed" || data.status === "released") {
          onPaymentConfirmed?.();
          router.push(`/compra/${transactionId}?status=success`);
        }
      } catch (error) {
        console.error("Erro ao verificar pagamento:", error);
      } finally {
        setCheckingPayment(false);
      }
    };

    // Verifica a cada 3 segundos
    const interval = setInterval(checkPaymentStatus, 3000);

    // Verifica imediatamente na primeira vez
    checkPaymentStatus();

    return () => clearInterval(interval);
  }, [transactionId, isExpired, router, onPaymentConfirmed]);

  useEffect(() => {
    const updateTimer = () => {
      const expiration = new Date(expirationDate);
      const now = new Date();
      const diff = expiration.getTime() - now.getTime();

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft("Expirado");
        onExpired?.();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expirationDate, onExpired]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error("Erro ao copiar:", err);
    }
  };

  if (isExpired) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
        <svg
          className="w-12 h-12 mx-auto text-red-400 mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h4 className="text-lg font-medium text-red-400 mb-2">QR Code Expirado</h4>
        <p className="text-sm text-red-300/80">
          O tempo para pagamento expirou. Clique em &quot;Tentar novamente&quot; para gerar um novo QR Code.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#1A3A5C]/50 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg
            className="w-6 h-6 text-[#16C784]"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h1v1h-1v-1zm-2 0h1v1h-1v-1zm2 2h1v1h-1v-1zm-2 2h1v3h-1v-3zm4-2v4h-1v-1h-1v-1h2zm0-2h1v2h-1v-2z" />
          </svg>
          <span className="font-medium text-white">Pague com PIX</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <svg
            className="w-4 h-4 text-[#FF8A00]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-[#FF8A00] font-medium">{timeLeft}</span>
        </div>
      </div>

      {/* QR Code */}
      <div className="bg-white rounded-xl p-4 mb-4">
        <img
          src={`data:image/png;base64,${encodedImage}`}
          alt="QR Code PIX"
          className="w-full max-w-[200px] mx-auto"
        />
      </div>

      {/* Instruções */}
      <div className="space-y-3 mb-4">
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#16C784]/20 text-[#16C784] text-sm font-medium flex items-center justify-center">
            1
          </span>
          <p className="text-sm text-gray-300">
            Abra o app do seu banco ou carteira digital
          </p>
        </div>
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#16C784]/20 text-[#16C784] text-sm font-medium flex items-center justify-center">
            2
          </span>
          <p className="text-sm text-gray-300">
            Escolha pagar com PIX e escaneie o QR Code ou cole o codigo
          </p>
        </div>
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#16C784]/20 text-[#16C784] text-sm font-medium flex items-center justify-center">
            3
          </span>
          <p className="text-sm text-gray-300">
            Confirme o pagamento e aguarde a confirmacao
          </p>
        </div>
      </div>

      {/* Código Copia e Cola */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400 uppercase tracking-wide">
          Codigo Copia e Cola
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={payload}
            readOnly
            className="flex-1 bg-[#0F2A44] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-300 truncate"
          />
          <button
            onClick={handleCopy}
            className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
              copied
                ? "bg-[#16C784] text-white"
                : "bg-[#16C784]/20 text-[#16C784] hover:bg-[#16C784]/30"
            }`}
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copiado!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copiar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status de verificação */}
      <div className="mt-4 p-3 bg-[#16C784]/10 border border-[#16C784]/20 rounded-lg">
        <p className="text-xs text-[#16C784] flex items-center gap-2">
          {checkingPayment ? (
            <svg className="w-4 h-4 flex-shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          Aguardando confirmacao do pagamento... Voce sera redirecionado automaticamente.
        </p>
      </div>
    </div>
  );
}
