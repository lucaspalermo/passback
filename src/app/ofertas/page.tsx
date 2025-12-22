"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Offer {
  id: string;
  amount: number;
  message?: string;
  status: string;
  expiresAt: string;
  paymentDeadline?: string;
  createdAt: string;
  ticket: {
    id: string;
    eventName: string;
    ticketType: string;
    price: number;
    imageUrl?: string;
  };
  buyer: { id: string; name: string };
  seller: { id: string; name: string };
}

interface OffersResponse {
  offers: Offer[];
  stats: {
    pending: number;
    accepted: number;
    total: number;
  };
}

export default function OfertasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<"received" | "sent">("received");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [stats, setStats] = useState({ pending: 0, accepted: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      loadOffers();
    }
  }, [session, tab]);

  async function loadOffers() {
    setLoading(true);
    try {
      const response = await fetch(`/api/modules/offers?type=${tab}`);
      if (response.ok) {
        const data: OffersResponse = await response.json();
        setOffers(data.offers);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Erro ao carregar ofertas:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(offerId: string, action: "accept" | "reject" | "cancel") {
    setActionLoading(offerId);
    try {
      const response = await fetch(`/api/modules/offers/${offerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        loadOffers();
      } else {
        const data = await response.json();
        alert(data.error || "Erro ao processar ação");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao processar ação");
    } finally {
      setActionLoading(null);
    }
  }

  async function handlePay(offerId: string) {
    setActionLoading(offerId);
    try {
      const response = await fetch("/api/modules/offers/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId }),
      });

      const data = await response.json();

      if (response.ok && data.transaction) {
        router.push(`/compra/${data.transaction.id}`);
      } else {
        alert(data.error || "Erro ao processar pagamento");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao processar pagamento");
    } finally {
      setActionLoading(null);
    }
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      accepted: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      rejected: "bg-red-500/20 text-red-400 border-red-500/30",
      paid: "bg-green-500/20 text-green-400 border-green-500/30",
      expired: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      cancelled: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    };

    const labels: Record<string, string> = {
      pending: "Pendente",
      accepted: "Aceita",
      rejected: "Rejeitada",
      paid: "Paga",
      expired: "Expirada",
      cancelled: "Cancelada",
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getTimeRemaining(deadline: string) {
    const now = new Date();
    const end = new Date(deadline);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return "Expirado";

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#0B1F33] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#16C784] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1F33] py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Minhas Ofertas</h1>
          <p className="text-gray-400">Gerencie suas ofertas recebidas e enviadas</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("received")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              tab === "received"
                ? "bg-[#16C784] text-white"
                : "bg-[#1A3A5C] text-gray-400 hover:text-white"
            }`}
          >
            Recebidas
            {stats.pending > 0 && tab === "received" && (
              <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {stats.pending}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("sent")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              tab === "sent"
                ? "bg-[#16C784] text-white"
                : "bg-[#1A3A5C] text-gray-400 hover:text-white"
            }`}
          >
            Enviadas
          </button>
        </div>

        {/* Stats */}
        {stats.total > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-[#0F2A44] rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
              <div className="text-sm text-gray-400">Pendentes</div>
            </div>
            <div className="bg-[#0F2A44] rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.accepted}</div>
              <div className="text-sm text-gray-400">Aceitas</div>
            </div>
            <div className="bg-[#0F2A44] rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-sm text-gray-400">Total</div>
            </div>
          </div>
        )}

        {/* Offers List */}
        {offers.length === 0 ? (
          <div className="bg-[#0F2A44] rounded-xl p-8 text-center">
            <div className="text-gray-400 mb-4">
              {tab === "received"
                ? "Você não tem ofertas recebidas"
                : "Você não enviou nenhuma oferta ainda"}
            </div>
            <Link
              href="/"
              className="inline-block px-4 py-2 bg-[#16C784] text-white rounded-lg hover:bg-[#14b576] transition-colors"
            >
              Ver ingressos
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="bg-[#0F2A44] border border-white/10 rounded-xl p-4 hover:border-[#16C784]/30 transition-colors"
              >
                <div className="flex gap-4">
                  {/* Ticket Image */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-[#1A3A5C] flex-shrink-0">
                    {offer.ticket.imageUrl ? (
                      <img
                        src={offer.ticket.imageUrl}
                        alt={offer.ticket.eventName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-medium text-white truncate">
                          {offer.ticket.eventName}
                        </h3>
                        <p className="text-sm text-gray-400">{offer.ticket.ticketType}</p>
                      </div>
                      {getStatusBadge(offer.status)}
                    </div>

                    <div className="flex items-center gap-4 text-sm mb-3">
                      <div>
                        <span className="text-gray-500">Oferta: </span>
                        <span className="text-[#16C784] font-bold">
                          R$ {offer.amount.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Original: </span>
                        <span className="text-gray-400 line-through">
                          R$ {offer.ticket.price.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-green-400 text-xs">
                        {Math.round((1 - offer.amount / offer.ticket.price) * 100)}% OFF
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        {tab === "received" ? (
                          <>De: {offer.buyer.name}</>
                        ) : (
                          <>Para: {offer.seller.name}</>
                        )}
                        {" • "}
                        {formatDate(offer.createdAt)}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {/* Seller actions for received offers */}
                        {tab === "received" && offer.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleAction(offer.id, "accept")}
                              disabled={actionLoading === offer.id}
                              className="px-3 py-1.5 bg-[#16C784] text-white text-sm rounded-lg hover:bg-[#14b576] disabled:opacity-50 transition-colors"
                            >
                              Aceitar
                            </button>
                            <button
                              onClick={() => handleAction(offer.id, "reject")}
                              disabled={actionLoading === offer.id}
                              className="px-3 py-1.5 bg-red-500/20 text-red-400 text-sm rounded-lg hover:bg-red-500/30 disabled:opacity-50 transition-colors"
                            >
                              Recusar
                            </button>
                          </>
                        )}

                        {/* Buyer actions for sent offers */}
                        {tab === "sent" && offer.status === "pending" && (
                          <button
                            onClick={() => handleAction(offer.id, "cancel")}
                            disabled={actionLoading === offer.id}
                            className="px-3 py-1.5 bg-gray-500/20 text-gray-400 text-sm rounded-lg hover:bg-gray-500/30 disabled:opacity-50 transition-colors"
                          >
                            Cancelar
                          </button>
                        )}

                        {/* Pay button for accepted offers */}
                        {tab === "sent" && offer.status === "accepted" && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-yellow-400">
                              Pague em: {offer.paymentDeadline && getTimeRemaining(offer.paymentDeadline)}
                            </span>
                            <button
                              onClick={() => handlePay(offer.id)}
                              disabled={actionLoading === offer.id}
                              className="px-4 py-1.5 bg-[#16C784] text-white text-sm font-medium rounded-lg hover:bg-[#14b576] disabled:opacity-50 transition-colors animate-pulse"
                            >
                              Pagar Agora
                            </button>
                          </div>
                        )}

                        {/* View ticket link */}
                        <Link
                          href={`/ingressos/${offer.ticket.id}`}
                          className="px-3 py-1.5 bg-[#1A3A5C] text-gray-400 text-sm rounded-lg hover:text-white transition-colors"
                        >
                          Ver
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Message if exists */}
                {offer.message && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <p className="text-sm text-gray-400 italic">"{offer.message}"</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
