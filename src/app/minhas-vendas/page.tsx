"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  AnimatedPage,
  AnimatedHeader,
  AnimatedWalletCard,
} from "@/components/ui/PageAnimations";

interface Transaction {
  id: string;
  amount: number;
  sellerAmount: number;
  status: string;
  expiresAt: string | null;
  createdAt: string;
  ticket: {
    eventName: string;
    ticketType: string;
    eventLocation: string;
  };
  buyer: {
    name: string;
  };
}

interface Wallet {
  availableBalance: number;
  pendingBalance: number;
}

const statusConfig: Record<string, { label: string; bgColor: string; textColor: string }> = {
  awaiting_seller: { label: "Aguardando sua confirmacao", bgColor: "bg-purple-500/10", textColor: "text-purple-400" },
  pending: { label: "Aguardando pagamento", bgColor: "bg-[#FF8A00]/10", textColor: "text-[#FF8A00]" },
  paid: { label: "Pago - Entregar", bgColor: "bg-blue-500/10", textColor: "text-blue-400" },
  confirmed: { label: "Confirmado", bgColor: "bg-[#16C784]/10", textColor: "text-[#16C784]" },
  released: { label: "Liberado", bgColor: "bg-[#16C784]/10", textColor: "text-[#16C784]" },
  disputed: { label: "Em disputa", bgColor: "bg-red-500/10", textColor: "text-red-400" },
  refunded: { label: "Reembolsado", bgColor: "bg-gray-500/10", textColor: "text-gray-400" },
  seller_rejected: { label: "Rejeitado por voce", bgColor: "bg-gray-500/10", textColor: "text-gray-400" },
  expired: { label: "Expirado", bgColor: "bg-gray-500/10", textColor: "text-gray-400" },
};

export default function MinhasVendasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sales, setSales] = useState<Transaction[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchData();
    }
  }, [session]);

  async function fetchData() {
    try {
      const [salesRes, walletRes] = await Promise.all([
        fetch("/api/transactions?role=seller"),
        fetch("/api/modules/wallet"),
      ]);

      if (salesRes.ok) {
        const salesData = await salesRes.json();
        setSales(salesData.transactions || []);
      }

      if (walletRes.ok) {
        const walletData = await walletRes.json();
        setWallet(walletData.wallet);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSellerAction(transactionId: string, action: "confirm" | "reject") {
    setActionLoading(transactionId);
    try {
      const res = await fetch(`/api/transactions/${transactionId}/seller-confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (res.ok) {
        // Atualiza a lista
        fetchData();
        // Mostra mensagem de sucesso
        alert(data.message);
      } else {
        alert(data.error || "Erro ao processar acao");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao processar acao");
    } finally {
      setActionLoading(null);
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatPrice = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return "Expirado";

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Separa as transacoes em pendentes de confirmacao e outras
  const awaitingConfirmation = sales.filter((s) => s.status === "awaiting_seller");
  const otherSales = sales.filter((s) => s.status !== "awaiting_seller");

  const stats = {
    total: sales.length,
    released: sales.filter((s) => s.status === "released").length,
    pending: sales.filter((s) => ["pending", "paid", "awaiting_seller"].includes(s.status)).length,
    totalEarnings: sales
      .filter((s) => s.status === "released")
      .reduce((acc, s) => acc + s.sellerAmount, 0),
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#0B1F33] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#16C784]"></div>
      </div>
    );
  }

  return (
    <AnimatedPage className="min-h-screen bg-[#0B1F33]">
      <Navbar />
      <div className="pt-20 pb-8">
        <div className="max-w-5xl mx-auto px-4">
          {/* Header */}
          <AnimatedHeader className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Minhas Vendas</h1>
            <p className="text-gray-400 mt-1">Acompanhe suas vendas e ganhos</p>
          </AnimatedHeader>

          {/* Wallet Card */}
          <AnimatedWalletCard className="mb-6">
            <Link
              href="/carteira"
              className="block bg-gradient-to-r from-[#16C784]/20 to-[#2DFF88]/10 rounded-2xl p-6 border border-[#16C784]/30 hover:border-[#16C784]/50 transition-all group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-[#16C784]/20 flex items-center justify-center">
                    <svg className="w-7 h-7 text-[#16C784]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Saldo disponivel para saque</p>
                    <p className="text-3xl font-bold text-[#16C784]">
                      {formatPrice(wallet?.availableBalance || 0)}
                    </p>
                    {(wallet?.pendingBalance || 0) > 0 && (
                      <p className="text-sm text-yellow-400 mt-1">
                        + {formatPrice(wallet?.pendingBalance || 0)} pendente
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[#16C784] group-hover:translate-x-1 transition-transform">
                  <span className="font-medium">Sacar agora</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </Link>
          </AnimatedWalletCard>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#0F2A44] rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-[#2DFF88]/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#2DFF88]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Total vendas</p>
                  <p className="text-xl font-bold text-white">{stats.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-[#0F2A44] rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-[#16C784]/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#16C784]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Finalizadas</p>
                  <p className="text-xl font-bold text-[#16C784]">{stats.released}</p>
                </div>
              </div>
            </div>
            <div className="bg-[#0F2A44] rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Em andamento</p>
                  <p className="text-xl font-bold text-blue-400">{stats.pending}</p>
                </div>
              </div>
            </div>
            <div className="bg-[#0F2A44] rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-[#FF8A00]/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#FF8A00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Total recebido</p>
                  <p className="text-xl font-bold text-[#FF8A00]">{formatPrice(stats.totalEarnings)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Reservas aguardando confirmacao */}
          {awaitingConfirmation.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-500 animate-pulse"></span>
                Reservas Aguardando sua Confirmacao ({awaitingConfirmation.length})
              </h2>
              <div className="space-y-4">
                {awaitingConfirmation.map((sale) => (
                  <div
                    key={sale.id}
                    className="bg-gradient-to-r from-purple-500/10 to-purple-500/5 rounded-xl p-5 border border-purple-500/30 animate-pulse-subtle"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-white truncate">{sale.ticket.eventName}</h3>
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">
                            Acao necessaria
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                            </svg>
                            {sale.ticket.ticketType}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {sale.buyer.name}
                          </span>
                          {sale.expiresAt && (
                            <span className="flex items-center gap-1 text-purple-400 font-medium">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Expira em: {getTimeRemaining(sale.expiresAt)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right mr-4">
                          <p className="text-xl font-bold text-white">{formatPrice(sale.sellerAmount)}</p>
                          <p className="text-xs text-gray-500">voce recebera</p>
                        </div>
                        <button
                          onClick={() => handleSellerAction(sale.id, "reject")}
                          disabled={actionLoading === sale.id}
                          className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-sm font-medium disabled:opacity-50"
                        >
                          {actionLoading === sale.id ? "..." : "Rejeitar"}
                        </button>
                        <button
                          onClick={() => handleSellerAction(sale.id, "confirm")}
                          disabled={actionLoading === sale.id}
                          className="px-4 py-2 rounded-lg bg-[#16C784] text-white hover:bg-[#16C784]/80 transition-all text-sm font-medium disabled:opacity-50"
                        >
                          {actionLoading === sale.id ? "..." : "Confirmar Venda"}
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <p className="text-sm text-purple-300">
                        <strong>Atencao:</strong> Ao confirmar, voce garante que ainda possui o ingresso e se compromete a entrega-lo ao comprador apos o pagamento.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Outras vendas */}
          {sales.length === 0 ? (
            <div className="bg-[#0F2A44] rounded-2xl p-12 border border-white/5 text-center">
              <div className="w-16 h-16 rounded-full bg-[#1A3A5C] flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-400 mb-6">Voce ainda nao realizou nenhuma venda.</p>
              <Link
                href="/meus-ingressos"
                className="inline-flex items-center gap-2 btn-gradient px-6 py-3 rounded-xl font-semibold text-white hover:opacity-90 transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Anunciar um ingresso
              </Link>
            </div>
          ) : otherSales.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white mb-4">Historico de Vendas</h2>
              {otherSales.map((sale) => {
                const statusInfo = statusConfig[sale.status] || {
                  label: sale.status,
                  bgColor: "bg-gray-500/10",
                  textColor: "text-gray-400",
                };

                return (
                  <div
                    key={sale.id}
                    className="bg-[#0F2A44] rounded-xl p-5 border border-white/5 hover:border-white/10 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-white truncate">{sale.ticket.eventName}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                            </svg>
                            {sale.ticket.ticketType}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            {sale.ticket.eventLocation}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {sale.buyer.name}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xl font-bold text-white">{formatPrice(sale.sellerAmount)}</p>
                          <p className="text-xs text-gray-500">valor liquido</p>
                          <p className="text-xs text-gray-500">{formatDate(sale.createdAt)}</p>
                        </div>
                        <Link
                          href={`/compra/${sale.id}`}
                          className="px-4 py-2 rounded-lg bg-[#16C784]/10 text-[#16C784] hover:bg-[#16C784]/20 transition-all text-sm font-medium"
                        >
                          Ver detalhes
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </AnimatedPage>
  );
}
