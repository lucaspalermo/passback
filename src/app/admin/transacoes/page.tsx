import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const statusConfig: Record<string, { label: string; bgColor: string; textColor: string }> = {
  pending: { label: "Pendente", bgColor: "bg-gray-500/10", textColor: "text-gray-400" },
  paid: { label: "Pago", bgColor: "bg-blue-500/10", textColor: "text-blue-400" },
  confirmed: { label: "Confirmado", bgColor: "bg-[#16C784]/10", textColor: "text-[#16C784]" },
  released: { label: "Liberado", bgColor: "bg-[#16C784]/10", textColor: "text-[#16C784]" },
  disputed: { label: "Em Disputa", bgColor: "bg-red-500/10", textColor: "text-red-400" },
  refunded: { label: "Reembolsado", bgColor: "bg-[#FF8A00]/10", textColor: "text-[#FF8A00]" },
};

export default async function AdminTransacoesPage() {
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

  const transactions = await prisma.transaction.findMany({
    include: {
      ticket: true,
      buyer: {
        select: { id: true, name: true, email: true, phone: true },
      },
      seller: {
        select: { id: true, name: true, email: true, phone: true, pixKey: true },
      },
      dispute: {
        select: { id: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const stats = {
    total: transactions.length,
    pending: transactions.filter((t) => t.status === "pending").length,
    paid: transactions.filter((t) => t.status === "paid").length,
    released: transactions.filter((t) => t.status === "released").length,
    disputed: transactions.filter((t) => t.status === "disputed").length,
    totalValue: transactions.reduce((acc, t) => acc + t.amount, 0),
    totalFees: transactions.filter((t) => t.status === "released").reduce((acc, t) => acc + t.platformFee, 0),
  };

  const formatPrice = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-[#0B1F33] py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar ao painel
          </Link>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 rounded bg-[#16C784]/10 text-[#16C784] text-xs font-medium">ADMIN</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Todas as Transacoes</h1>
          <p className="text-gray-400 mt-1">Visualize todas as compras e vendas da plataforma</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
          <div className="bg-[#0F2A44] rounded-xl p-4 border border-white/5">
            <p className="text-gray-400 text-xs">Total</p>
            <p className="text-xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-[#0F2A44] rounded-xl p-4 border border-white/5">
            <p className="text-gray-400 text-xs">Pendentes</p>
            <p className="text-xl font-bold text-gray-400">{stats.pending}</p>
          </div>
          <div className="bg-[#0F2A44] rounded-xl p-4 border border-white/5">
            <p className="text-blue-400 text-xs">Pagas</p>
            <p className="text-xl font-bold text-blue-400">{stats.paid}</p>
          </div>
          <div className="bg-[#0F2A44] rounded-xl p-4 border border-white/5">
            <p className="text-[#16C784] text-xs">Liberadas</p>
            <p className="text-xl font-bold text-[#16C784]">{stats.released}</p>
          </div>
          <div className="bg-[#0F2A44] rounded-xl p-4 border border-white/5">
            <p className="text-red-400 text-xs">Em Disputa</p>
            <p className="text-xl font-bold text-red-400">{stats.disputed}</p>
          </div>
          <div className="bg-[#0F2A44] rounded-xl p-4 border border-white/5">
            <p className="text-[#FF8A00] text-xs">Volume Total</p>
            <p className="text-lg font-bold text-[#FF8A00]">{formatPrice(stats.totalValue)}</p>
          </div>
          <div className="bg-[#0F2A44] rounded-xl p-4 border border-white/5">
            <p className="text-[#16C784] text-xs">Taxas Recebidas</p>
            <p className="text-lg font-bold text-[#16C784]">{formatPrice(stats.totalFees)}</p>
          </div>
        </div>

        {/* Transactions List */}
        {transactions.length === 0 ? (
          <div className="bg-[#0F2A44] rounded-2xl p-12 border border-white/5 text-center">
            <p className="text-gray-400">Nenhuma transacao encontrada</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => {
              const statusInfo = statusConfig[transaction.status] || statusConfig.pending;

              return (
                <div
                  key={transaction.id}
                  className="bg-[#0F2A44] rounded-xl border border-white/5 overflow-hidden"
                >
                  {/* Transaction Header */}
                  <div className="p-4 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                        {statusInfo.label}
                      </span>
                      {transaction.dispute && (
                        <Link
                          href={`/admin/disputas/${transaction.dispute.id}`}
                          className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                          Ver Disputa
                        </Link>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-white">{formatPrice(transaction.amount)}</p>
                      <p className="text-xs text-gray-500">Taxa: {formatPrice(transaction.platformFee)}</p>
                    </div>
                  </div>

                  {/* Transaction Body */}
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Event Info */}
                      <div>
                        <p className="text-xs text-gray-500 mb-2">EVENTO</p>
                        <p className="font-semibold text-white">{transaction.ticket.eventName}</p>
                        <p className="text-sm text-gray-400">{transaction.ticket.ticketType}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDate(transaction.ticket.eventDate)}
                        </p>
                      </div>

                      {/* Buyer Info */}
                      <div>
                        <p className="text-xs text-gray-500 mb-2">COMPRADOR</p>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-400">
                              {transaction.buyer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-white text-sm">{transaction.buyer.name}</p>
                            <p className="text-xs text-gray-400">{transaction.buyer.email}</p>
                          </div>
                        </div>
                        {transaction.buyer.phone && (
                          <p className="text-xs text-gray-500 mt-1">{transaction.buyer.phone}</p>
                        )}
                      </div>

                      {/* Seller Info */}
                      <div>
                        <p className="text-xs text-gray-500 mb-2">VENDEDOR</p>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#2DFF88]/20 flex items-center justify-center">
                            <span className="text-xs font-bold text-[#2DFF88]">
                              {transaction.seller.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-white text-sm">{transaction.seller.name}</p>
                            <p className="text-xs text-gray-400">{transaction.seller.email}</p>
                          </div>
                        </div>
                        {transaction.seller.phone && (
                          <p className="text-xs text-gray-500 mt-1">{transaction.seller.phone}</p>
                        )}
                        {transaction.seller.pixKey && (
                          <p className="text-xs text-[#16C784] mt-1">PIX: {transaction.seller.pixKey}</p>
                        )}
                      </div>
                    </div>

                    {/* Values and Dates */}
                    <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs">Vendedor recebe</p>
                        <p className="text-[#16C784] font-semibold">{formatPrice(transaction.sellerAmount)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Criada em</p>
                        <p className="text-gray-300">{formatDate(transaction.createdAt)}</p>
                      </div>
                      {transaction.paidAt && (
                        <div>
                          <p className="text-gray-500 text-xs">Paga em</p>
                          <p className="text-gray-300">{formatDate(transaction.paidAt)}</p>
                        </div>
                      )}
                      {transaction.releasedAt && (
                        <div>
                          <p className="text-gray-500 text-xs">Liberada em</p>
                          <p className="text-gray-300">{formatDate(transaction.releasedAt)}</p>
                        </div>
                      )}
                    </div>

                    {/* Transaction ID */}
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <p className="text-xs text-gray-600">ID: {transaction.id}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
