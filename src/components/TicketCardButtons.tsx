"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface TicketCardButtonsProps {
  ticketId: string;
  price: number;
  eventName: string;
}

export default function TicketCardButtons({ ticketId, price, eventName }: TicketCardButtonsProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const formatPrice = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const handleOfferInput = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    const amount = parseInt(numbers) / 100;
    if (isNaN(amount) || amount === 0) {
      setOfferAmount("");
    } else {
      setOfferAmount(formatPrice(amount));
    }
  };

  const handleBuyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/ingressos/${ticketId}`);
  };

  const handleOfferClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session) {
      router.push("/login");
      return;
    }

    setShowOfferModal(true);
  };

  const handleCloseModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowOfferModal(false);
    setError("");
    setOfferAmount("");
    setSuccess(false);
  };

  const handleSubmitOffer = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const amount = parseFloat(offerAmount.replace(/[^\d,]/g, "").replace(",", "."));

    if (isNaN(amount) || amount <= 0) {
      setError("Digite um valor valido");
      return;
    }

    if (amount >= price) {
      setError("A oferta deve ser menor que o preco");
      return;
    }

    setLoading(true);
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

      setSuccess(true);
      setTimeout(() => {
        setShowOfferModal(false);
        setSuccess(false);
        setOfferAmount("");
      }, 2000);
    } catch {
      setError("Erro ao enviar oferta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Botao Oferta */}
        <button
          onClick={handleOfferClick}
          className="flex-1 bg-[#FF8A00]/10 text-[#FF8A00] px-3 py-2 rounded-lg font-semibold text-sm hover:bg-[#FF8A00] hover:text-white transition-all flex items-center justify-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          Oferta
        </button>

        {/* Botao Comprar */}
        <button
          onClick={handleBuyClick}
          className="flex-1 bg-[#16C784]/10 text-[#16C784] px-3 py-2 rounded-lg font-semibold text-sm hover:bg-[#16C784] hover:text-white transition-all"
        >
          Comprar
        </button>
      </div>

      {/* Modal de Oferta */}
      {showOfferModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={handleCloseModal}
        >
          <div
            className="bg-[#0F2A44] rounded-2xl p-6 max-w-sm w-full border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Fazer Oferta</h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-gray-400 mb-2">
              {eventName}
            </p>
            <p className="text-gray-400 text-sm mb-4">
              Preco atual: <span className="text-white font-semibold">{formatPrice(price)}</span>
            </p>

            {success ? (
              <div className="bg-[#16C784]/10 border border-[#16C784]/20 p-4 rounded-xl text-center">
                <svg className="w-12 h-12 text-[#16C784] mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-[#16C784] font-semibold">Oferta enviada!</p>
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
                    className="w-full bg-[#1A3A5C] border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-semibold focus:outline-none focus:border-[#16C784] transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm mb-4">
                    {error}
                  </div>
                )}

                <div className="bg-[#FF8A00]/10 border border-[#FF8A00]/20 p-3 rounded-xl mb-4">
                  <p className="text-[#FF8A00] text-xs flex items-start gap-2">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Se aceita, voce tera <strong>5 minutos</strong> para pagar.</span>
                  </p>
                </div>

                <button
                  onClick={handleSubmitOffer}
                  disabled={loading || !offerAmount}
                  className="w-full py-3 rounded-xl font-semibold text-white bg-[#FF8A00] hover:bg-[#e67a00] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Enviando..." : "Enviar Oferta"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
