"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface MakeOfferButtonProps {
  ticketId: string;
  ticketPrice: number;
  sellerId: string;
  minOfferPercentage?: number;
}

export default function MakeOfferButton({
  ticketId,
  ticketPrice,
  sellerId,
  minOfferPercentage = 50,
}: MakeOfferButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const minAmount = ticketPrice * (minOfferPercentage / 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!session?.user) {
      router.push("/login");
      return;
    }

    const offerAmount = parseFloat(amount.replace(",", "."));

    if (isNaN(offerAmount) || offerAmount <= 0) {
      setError("Digite um valor válido");
      return;
    }

    if (offerAmount < minAmount) {
      setError(`Oferta mínima: R$ ${minAmount.toFixed(2)}`);
      return;
    }

    if (offerAmount >= ticketPrice) {
      setError("Para pagar o preço cheio, use o botão Comprar");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/modules/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId,
          amount: offerAmount,
          message: message.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao enviar oferta");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setAmount("");
        setMessage("");
      }, 2000);
    } catch {
      setError("Erro ao enviar oferta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Não mostra se é o próprio vendedor
  if (session?.user?.id === sellerId) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-3 bg-[#1A3A5C] border border-[#16C784]/30 text-[#16C784] font-medium rounded-xl hover:bg-[#16C784]/10 transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
          />
        </svg>
        Fazer Oferta
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-[#0F2A44] rounded-2xl p-6 w-full max-w-md border border-white/10">
            {success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#16C784]/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#16C784]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Oferta Enviada!</h3>
                <p className="text-gray-400">O vendedor será notificado</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Fazer Oferta</h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mb-6 p-4 bg-[#1A3A5C] rounded-xl">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Preço do ingresso</span>
                    <span className="text-white font-medium">R$ {ticketPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Oferta mínima ({minOfferPercentage}%)</span>
                    <span className="text-yellow-400">R$ {minAmount.toFixed(2)}</span>
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Sua oferta (R$)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        R$
                      </span>
                      <input
                        type="text"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value.replace(/[^0-9,\.]/g, ""))}
                        placeholder={minAmount.toFixed(2)}
                        className="w-full pl-12 pr-4 py-3 bg-[#1A3A5C] border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#16C784] focus:border-transparent"
                      />
                    </div>
                    {amount && parseFloat(amount.replace(",", ".")) < ticketPrice && (
                      <p className="text-xs text-green-400 mt-1">
                        Desconto de {Math.round((1 - parseFloat(amount.replace(",", ".")) / ticketPrice) * 100)}%
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Mensagem (opcional)
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Ex: Posso pagar à vista agora..."
                      maxLength={200}
                      rows={2}
                      className="w-full px-4 py-3 bg-[#1A3A5C] border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#16C784] focus:border-transparent resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">{message.length}/200</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="flex-1 py-3 bg-[#1A3A5C] text-gray-400 font-medium rounded-xl hover:text-white transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !amount}
                      className="flex-1 py-3 bg-[#16C784] text-white font-medium rounded-xl hover:bg-[#14b576] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? "Enviando..." : "Enviar Oferta"}
                    </button>
                  </div>
                </form>

                <p className="text-xs text-gray-500 text-center mt-4">
                  A oferta expira em 24 horas se não for respondida
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
