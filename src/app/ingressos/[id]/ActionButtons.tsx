"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PixQrCode from "@/components/PixQrCode";

interface ActionButtonsProps {
  ticketId: string;
  price: number;
  eventName: string;
  sellerId: string;
  eventDate: Date;
}

interface PixQrCodeData {
  encodedImage: string;
  payload: string;
  expirationDate: string;
}

const RESERVATION_TIME = 5 * 60; // 5 minutos em segundos

export default function ActionButtons({ ticketId, price, eventName, sellerId, eventDate }: ActionButtonsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [pixQrCode, setPixQrCode] = useState<PixQrCodeData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "CREDIT_CARD">("PIX");
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [showSimulate, setShowSimulate] = useState(false);

  // Estados para Oferta
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerLoading, setOfferLoading] = useState(false);
  const [offerSuccess, setOfferSuccess] = useState(false);

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

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      if (data.pixQrCode) {
        setPixQrCode(data.pixQrCode);
      } else {
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

  const handleSubmitOffer = async () => {
    const amount = parseFloat(offerAmount.replace(/[^\d,]/g, "").replace(",", "."));

    if (isNaN(amount) || amount <= 0) {
      setError("Digite um valor valido para a oferta");
      return;
    }

    if (amount >= price) {
      setError("A oferta deve ser menor que o preco atual");
      return;
    }

    setOfferLoading(true);
    setError("");

    try {
      const response = await fetch("/api/modules/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId,
          amount,
          message: `Oferta de ${formatPrice(amount)} para ${eventName}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao enviar oferta");
        return;
      }

      setOfferSuccess(true);
      setTimeout(() => {
        setShowOfferModal(false);
        setOfferSuccess(false);
        setOfferAmount("");
      }, 2000);
    } catch {
      setError("Erro ao enviar oferta");
    } finally {
      setOfferLoading(false);
    }
  };

  const formatPrice = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const handleOfferInput = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, "");
    // Converte para centavos e formata
    const amount = parseInt(numbers) / 100;
    if (isNaN(amount) || amount === 0) {
      setOfferAmount("");
    } else {
      setOfferAmount(formatPrice(amount));
    }
  };

  // Modal de Oferta
  if (showOfferModal) {
    return (
      <div className="space-y-4">
        <div className="bg-[#1A3A5C] rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Fazer uma Oferta</h3>
            <button
              onClick={() => {
                setShowOfferModal(false);
                setError("");
              }}
              className="text-gray-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-gray-400 text-sm mb-4">
            Preco atual: <span className="text-white font-semibold">{formatPrice(price)}</span>
          </p>

          {offerSuccess ? (
            <div className="bg-[#16C784]/10 border border-[#16C784]/20 p-4 rounded-xl text-center">
              <svg className="w-12 h-12 text-[#16C784] mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-[#16C784] font-semibold">Oferta enviada!</p>
              <p className="text-gray-400 text-sm mt-1">O vendedor sera notificado</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Sua oferta</label>
                <input
                  type="text"
                  value={offerAmount}
                  onChange={(e) => handleOfferInput(e.target.value)}
                  placeholder="R$ 0,00"
                  className="w-full bg-[#0F2A44] border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-semibold focus:outline-none focus:border-[#16C784] transition-colors"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm mb-4">
                  {error}
                </div>
              )}

              <div className="bg-[#FF8A00]/10 border border-[#FF8A00]/20 p-3 rounded-xl mb-4">
                <p className="text-[#FF8A00] text-sm flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    Se o vendedor aceitar, voce tera <strong>5 minutos</strong> para efetuar o pagamento.
                  </span>
                </p>
              </div>

              <button
                onClick={handleSubmitOffer}
                disabled={offerLoading || !offerAmount}
                className="w-full py-4 rounded-xl font-semibold text-white bg-[#FF8A00] hover:bg-[#e67a00] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {offerLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Enviando...
                  </span>
                ) : (
                  "Enviar Oferta"
                )}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Se tem QR Code PIX, mostra ele
  if (pixQrCode) {
    return (
      <div className="space-y-4">
        <PixQrCode
          encodedImage={pixQrCode.encodedImage}
          payload={pixQrCode.payload}
          expirationDate={pixQrCode.expirationDate}
          onExpired={handlePixExpired}
        />

        <div className="bg-[#FF8A00]/10 border border-[#FF8A00]/20 p-3 rounded-xl">
          <p className="text-[#FF8A00] text-sm flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Voce tem <strong>5 minutos</strong> para efetuar o pagamento</span>
          </p>
        </div>

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

  // Modo de simulação
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

        <div className="bg-[#FF8A00]/10 border border-[#FF8A00]/20 p-3 rounded-xl mb-2">
          <p className="text-[#FF8A00] text-sm flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Voce tera <strong>5 minutos</strong> para concluir o pagamento</span>
          </p>
        </div>

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

  // Botões iniciais - Comprar + Fazer Oferta
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

      {/* Botão principal - Comprar */}
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

      {/* Botão secundário - Fazer Oferta */}
      <button
        onClick={() => setShowOfferModal(true)}
        className="w-full py-3 rounded-xl font-semibold text-[#FF8A00] border-2 border-[#FF8A00] hover:bg-[#FF8A00]/10 transition-all flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        Fazer uma Oferta
      </button>

      <p className="text-xs text-gray-500 text-center">
        Pagamento seguro via PIX ou Cartao de Credito
      </p>

      {/* Informativo sobre prazos */}
      <div className="bg-[#1A3A5C]/50 p-3 rounded-xl mt-4">
        <p className="text-xs text-gray-400 flex items-start gap-2">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#16C784]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>
            Apos o evento, voce tem <strong className="text-white">24 horas</strong> para confirmar a entrada ou abrir uma disputa. Caso contrario, o pagamento sera liberado automaticamente para o vendedor.
          </span>
        </p>
      </div>
    </div>
  );
}
