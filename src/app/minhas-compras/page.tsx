import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import PurchaseActions from "@/components/PurchaseActions";
import {
  AnimatedPage,
  AnimatedHeader,
  AnimatedStatCard,
  AnimatedList,
  AnimatedListItem,
  AnimatedEmptyState,
} from "@/components/ui/PageAnimations";

const statusConfig: Record<string, { label: string; bgColor: string; textColor: string; icon: string }> = {
  pending: { label: "Aguardando pagamento", bgColor: "bg-[#FF8A00]/10", textColor: "text-[#FF8A00]", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  paid: { label: "Pago", bgColor: "bg-blue-500/10", textColor: "text-blue-400", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  confirmed: { label: "Confirmado", bgColor: "bg-[#16C784]/10", textColor: "text-[#16C784]", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  released: { label: "Finalizado", bgColor: "bg-[#16C784]/10", textColor: "text-[#16C784]", icon: "M5 13l4 4L19 7" },
  disputed: { label: "Em disputa", bgColor: "bg-red-500/10", textColor: "text-red-400", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
  refunded: { label: "Reembolsado", bgColor: "bg-gray-500/10", textColor: "text-gray-400", icon: "M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" },
  cancelled: { label: "Cancelado", bgColor: "bg-gray-500/10", textColor: "text-gray-400", icon: "M6 18L18 6M6 6l12 12" },
  expired: { label: "Expirado", bgColor: "bg-gray-500/10", textColor: "text-gray-400", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
};

export default async function MinhasComprasPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const purchases = await prisma.transaction.findMany({
    where: { buyerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      ticket: true,
      seller: {
        select: { name: true },
      },
    },
  });

  const formatDate = (date: Date) => {
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

  const stats = {
    total: purchases.length,
    active: purchases.filter((p) => ["paid", "confirmed"].includes(p.status)).length,
    completed: purchases.filter((p) => p.status === "released").length,
  };

  return (
    <AnimatedPage className="min-h-screen bg-[#0B1F33]">
      <Navbar />
      <div className="pt-20 pb-8">
        <div className="max-w-5xl mx-auto px-4">
          {/* Header */}
          <AnimatedHeader className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Minhas Compras</h1>
            <p className="text-gray-400 mt-1">Acompanhe seus ingressos comprados</p>
          </AnimatedHeader>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <AnimatedStatCard delay={0.1}>
              <p className="text-gray-400 text-sm">Total</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </AnimatedStatCard>
            <AnimatedStatCard delay={0.2}>
              <p className="text-gray-400 text-sm">Em andamento</p>
              <p className="text-2xl font-bold text-blue-400">{stats.active}</p>
            </AnimatedStatCard>
            <AnimatedStatCard delay={0.3}>
              <p className="text-gray-400 text-sm">Finalizadas</p>
              <p className="text-2xl font-bold text-[#16C784]">{stats.completed}</p>
            </AnimatedStatCard>
          </div>

          {purchases.length === 0 ? (
            <div className="bg-[#0F2A44] rounded-2xl p-12 border border-white/5 text-center">
              <div className="w-16 h-16 rounded-full bg-[#1A3A5C] flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="text-gray-400 mb-6">Voce ainda nao comprou nenhum ingresso.</p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 btn-gradient px-6 py-3 rounded-xl font-semibold text-white hover:opacity-90 transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Ver ingressos disponiveis
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {purchases.map((purchase) => {
                const statusInfo = statusConfig[purchase.status] || {
                  label: purchase.status,
                  bgColor: "bg-gray-500/10",
                  textColor: "text-gray-400",
                  icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                };

                return (
                  <div
                    key={purchase.id}
                    className="bg-[#0F2A44] rounded-xl p-5 border border-white/5 hover:border-white/10 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-white truncate">{purchase.ticket.eventName}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={statusInfo.icon} />
                            </svg>
                            {statusInfo.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                            </svg>
                            {purchase.ticket.ticketType}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            {purchase.ticket.eventLocation}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {purchase.seller.name}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Evento: {formatDate(purchase.ticket.eventDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xl font-bold text-white">{formatPrice(purchase.amount)}</p>
                          <p className="text-xs text-gray-500">{formatDate(purchase.createdAt)}</p>
                        </div>
                        <Link
                          href={`/compra/${purchase.id}`}
                          className="px-4 py-2 rounded-lg bg-[#16C784]/10 text-[#16C784] hover:bg-[#16C784]/20 transition-all text-sm font-medium"
                        >
                          Ver detalhes
                        </Link>
                      </div>
                    </div>

                    {/* Ações para transações pendentes */}
                    <PurchaseActions
                      transactionId={purchase.id}
                      status={purchase.status}
                      expiresAt={purchase.expiresAt}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AnimatedPage>
  );
}
