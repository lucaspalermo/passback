import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const statusConfig: Record<string, { label: string; bgColor: string; textColor: string }> = {
  pending: { label: "Pendente", bgColor: "bg-gray-500/10", textColor: "text-gray-400" },
  paid: { label: "Pago", bgColor: "bg-blue-500/10", textColor: "text-blue-400" },
  confirmed: { label: "Confirmado", bgColor: "bg-green-500/10", textColor: "text-green-400" },
  released: { label: "Liberado", bgColor: "bg-[#16C784]/10", textColor: "text-[#16C784]" },
  disputed: { label: "Em Disputa", bgColor: "bg-red-500/10", textColor: "text-red-400" },
  refunded: { label: "Reembolsado", bgColor: "bg-[#FF8A00]/10", textColor: "text-[#FF8A00]" },
};

const disputeStatusConfig: Record<string, { label: string; bgColor: string; textColor: string }> = {
  open: { label: "Aberta", bgColor: "bg-[#FF8A00]/10", textColor: "text-[#FF8A00]" },
  under_review: { label: "Em Analise", bgColor: "bg-blue-500/10", textColor: "text-blue-400" },
  resolved_buyer: { label: "Favor Comprador", bgColor: "bg-[#16C784]/10", textColor: "text-[#16C784]" },
  resolved_seller: { label: "Favor Vendedor", bgColor: "bg-purple-500/10", textColor: "text-purple-400" },
  closed: { label: "Encerrada", bgColor: "bg-gray-500/10", textColor: "text-gray-400" },
};

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user?.isAdmin) {
    redirect("/");
  }

  // Get all data
  const [transactions, disputes, users] = await Promise.all([
    prisma.transaction.findMany({
      include: {
        ticket: true,
        buyer: { select: { id: true, name: true, email: true, phone: true } },
        seller: { select: { id: true, name: true, email: true, phone: true, pixKey: true } },
        dispute: { select: { id: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.dispute.findMany({
      include: {
        transaction: {
          include: {
            ticket: true,
            buyer: { select: { id: true, name: true, email: true, phone: true } },
            seller: { select: { id: true, name: true, email: true, phone: true, pixKey: true } },
          },
        },
        evidences: true,
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count(),
  ]);

  // Calculate stats
  const stats = {
    totalUsers: users,
    totalTransactions: transactions.length,
    totalVolume: transactions.reduce((acc, t) => acc + t.amount, 0),
    totalFees: transactions.filter(t => t.status === "released").reduce((acc, t) => acc + t.platformFee, 0),
    pending: transactions.filter(t => t.status === "pending").length,
    paid: transactions.filter(t => t.status === "paid").length,
    released: transactions.filter(t => t.status === "released").length,
    disputed: transactions.filter(t => t.status === "disputed").length,
    refunded: transactions.filter(t => t.status === "refunded").length,
    openDisputes: disputes.filter(d => ["open", "under_review"].includes(d.status)).length,
    resolvedDisputes: disputes.filter(d => ["resolved_buyer", "resolved_seller", "closed"].includes(d.status)).length,
  };

  const formatPrice = (value: number) => {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const formatDateShort = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen py-8 bg-[#0B1F33]">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#16C784] to-[#2DFF88] flex items-center justify-center shadow-lg shadow-[#16C784]/20">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-white">Painel Administrativo</h1>
                <span className="px-2 py-1 rounded bg-[#16C784]/10 text-[#16C784] text-xs font-medium">ADMIN</span>
              </div>
              <p className="text-gray-400">Gerencie vendas, compras e disputas da plataforma</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
          <div className="bg-[#0F2A44] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#16C784]/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#16C784]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs text-gray-400">Receita</span>
            </div>
            <p className="text-xl font-bold text-[#16C784]">{formatPrice(stats.totalFees)}</p>
          </div>

          <div className="bg-[#0F2A44] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#2DFF88]/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#2DFF88]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="text-xs text-gray-400">Volume</span>
            </div>
            <p className="text-xl font-bold text-[#2DFF88]">{formatPrice(stats.totalVolume)}</p>
          </div>

          <div className="bg-[#0F2A44] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="text-xs text-gray-400">Transacoes</span>
            </div>
            <p className="text-xl font-bold text-blue-400">{stats.totalTransactions}</p>
          </div>

          <div className="bg-[#0F2A44] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#16C784]/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#16C784]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs text-gray-400">Liberadas</span>
            </div>
            <p className="text-xl font-bold text-[#16C784]">{stats.released}</p>
          </div>

          <div className="bg-[#0F2A44] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#FF8A00]/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#FF8A00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs text-gray-400">Em Andamento</span>
            </div>
            <p className="text-xl font-bold text-[#FF8A00]">{stats.paid}</p>
          </div>

          <div className="bg-[#0F2A44] rounded-xl p-4 border border-white/5 border-red-500/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <span className="text-xs text-gray-400">Disputas Abertas</span>
              {stats.openDisputes > 0 && <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>}
            </div>
            <p className="text-xl font-bold text-red-400">{stats.openDisputes}</p>
          </div>
        </div>

        {/* Disputes Section - Priority */}
        {stats.openDisputes > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
                Disputas Aguardando Resolucao ({stats.openDisputes})
              </h2>
              <Link href="/admin/disputas" className="text-[#16C784] hover:underline text-sm">
                Ver todas
              </Link>
            </div>
            <div className="space-y-3">
              {disputes.filter(d => ["open", "under_review"].includes(d.status)).slice(0, 5).map((dispute) => {
                const dStatus = disputeStatusConfig[dispute.status] || disputeStatusConfig.open;
                return (
                  <div key={dispute.id} className="bg-[#0F2A44] rounded-xl p-4 border border-red-500/30">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${dStatus.bgColor} ${dStatus.textColor}`}>
                            {dStatus.label}
                          </span>
                          <span className="text-xs text-gray-500">{formatDateShort(dispute.createdAt)}</span>
                          <span className="text-xs text-gray-600">|</span>
                          <span className="text-xs text-gray-400">{dispute.evidences.length} evidencia(s)</span>
                        </div>
                        <p className="font-semibold text-white">{dispute.transaction.ticket.eventName}</p>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm">
                          <span className="text-gray-400">
                            <span className="text-gray-500">Valor:</span> <span className="text-white font-medium">{formatPrice(dispute.transaction.amount)}</span>
                          </span>
                          <span className="text-gray-400">
                            <span className="text-gray-500">Comprador:</span> {dispute.transaction.buyer.name}
                          </span>
                          <span className="text-gray-400">
                            <span className="text-gray-500">Vendedor:</span> {dispute.transaction.seller.name}
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`/admin/disputas/${dispute.id}`}
                        className="btn-gradient px-6 py-2 rounded-xl font-semibold text-white text-center"
                      >
                        Resolver
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All Transactions */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Todas as Transacoes</h2>
            <div className="flex gap-2 text-xs">
              <span className="px-2 py-1 rounded bg-gray-500/10 text-gray-400">{stats.pending} pendentes</span>
              <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400">{stats.paid} pagas</span>
              <span className="px-2 py-1 rounded bg-[#16C784]/10 text-[#16C784]">{stats.released} liberadas</span>
              <span className="px-2 py-1 rounded bg-red-500/10 text-red-400">{stats.disputed} disputas</span>
            </div>
          </div>

          <div className="bg-[#0F2A44] rounded-xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left p-4 text-xs font-medium text-gray-400">STATUS</th>
                    <th className="text-left p-4 text-xs font-medium text-gray-400">EVENTO</th>
                    <th className="text-left p-4 text-xs font-medium text-gray-400">COMPRADOR</th>
                    <th className="text-left p-4 text-xs font-medium text-gray-400">VENDEDOR</th>
                    <th className="text-right p-4 text-xs font-medium text-gray-400">VALOR</th>
                    <th className="text-right p-4 text-xs font-medium text-gray-400">TAXA</th>
                    <th className="text-right p-4 text-xs font-medium text-gray-400">VENDEDOR RECEBE</th>
                    <th className="text-left p-4 text-xs font-medium text-gray-400">DATA</th>
                    <th className="text-left p-4 text-xs font-medium text-gray-400">ACOES</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => {
                    const tStatus = statusConfig[t.status] || statusConfig.pending;
                    return (
                      <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${tStatus.bgColor} ${tStatus.textColor}`}>
                            {tStatus.label}
                          </span>
                        </td>
                        <td className="p-4">
                          <p className="text-white font-medium text-sm">{t.ticket.eventName}</p>
                          <p className="text-gray-500 text-xs">{t.ticket.ticketType}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-white text-sm">{t.buyer.name}</p>
                          <p className="text-gray-500 text-xs">{t.buyer.phone || t.buyer.email}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-white text-sm">{t.seller.name}</p>
                          <p className="text-gray-500 text-xs">{t.seller.phone || t.seller.email}</p>
                          {t.seller.pixKey && <p className="text-[#16C784] text-xs">PIX: {t.seller.pixKey}</p>}
                        </td>
                        <td className="p-4 text-right">
                          <p className="text-white font-medium">{formatPrice(t.amount)}</p>
                        </td>
                        <td className="p-4 text-right">
                          <p className="text-[#FF8A00] text-sm">{formatPrice(t.platformFee)}</p>
                        </td>
                        <td className="p-4 text-right">
                          <p className="text-[#16C784] font-medium">{formatPrice(t.sellerAmount)}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-gray-400 text-xs">{formatDateShort(t.createdAt)}</p>
                          {t.releasedAt && <p className="text-[#16C784] text-xs">Lib: {formatDateShort(t.releasedAt)}</p>}
                        </td>
                        <td className="p-4">
                          {t.dispute ? (
                            <Link
                              href={`/admin/disputas/${t.dispute.id}`}
                              className="text-red-400 hover:underline text-xs"
                            >
                              Ver disputa
                            </Link>
                          ) : (
                            <Link
                              href={`/compra/${t.id}`}
                              className="text-[#16C784] hover:underline text-xs"
                            >
                              Detalhes
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Resolved Disputes */}
        {stats.resolvedDisputes > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Disputas Resolvidas ({stats.resolvedDisputes})</h2>
            </div>
            <div className="space-y-3">
              {disputes.filter(d => ["resolved_buyer", "resolved_seller", "closed"].includes(d.status)).map((dispute) => {
                const dStatus = disputeStatusConfig[dispute.status] || disputeStatusConfig.closed;
                return (
                  <div key={dispute.id} className="bg-[#0F2A44] rounded-xl p-4 border border-white/5">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${dStatus.bgColor} ${dStatus.textColor}`}>
                            {dStatus.label}
                          </span>
                          <span className="text-xs text-gray-500">{formatDateShort(dispute.createdAt)}</span>
                          {dispute.resolvedAt && (
                            <span className="text-xs text-[#16C784]">Resolvida: {formatDateShort(dispute.resolvedAt)}</span>
                          )}
                        </div>
                        <p className="font-semibold text-white">{dispute.transaction.ticket.eventName}</p>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm">
                          <span className="text-gray-400">
                            <span className="text-gray-500">Valor:</span> <span className="text-white">{formatPrice(dispute.transaction.amount)}</span>
                          </span>
                          <span className="text-gray-400">
                            <span className="text-gray-500">Transacao:</span> <span className={dispute.transaction.status === "released" ? "text-[#16C784]" : "text-[#FF8A00]"}>{dispute.transaction.status}</span>
                          </span>
                        </div>
                        {dispute.resolution && (
                          <p className="text-gray-500 text-sm mt-2 italic">"{dispute.resolution.substring(0, 100)}..."</p>
                        )}
                      </div>
                      <Link
                        href={`/admin/disputas/${dispute.id}`}
                        className="px-4 py-2 rounded-xl bg-[#1A3A5C] text-gray-300 hover:bg-[#234B6E] text-sm text-center transition-colors"
                      >
                        Ver detalhes
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
