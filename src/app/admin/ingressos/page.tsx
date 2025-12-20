import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const statusConfig: Record<string, { label: string; bgColor: string; textColor: string }> = {
  available: { label: "Disponivel", bgColor: "bg-[#16C784]/10", textColor: "text-[#16C784]" },
  reserved: { label: "Reservado", bgColor: "bg-[#FF8A00]/10", textColor: "text-[#FF8A00]" },
  sold: { label: "Vendido", bgColor: "bg-blue-500/10", textColor: "text-blue-400" },
  completed: { label: "Finalizado", bgColor: "bg-gray-500/10", textColor: "text-gray-400" },
  cancelled: { label: "Cancelado", bgColor: "bg-red-500/10", textColor: "text-red-400" },
};

export default async function AdminIngressosPage() {
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

  const tickets = await prisma.ticket.findMany({
    include: {
      seller: {
        select: { id: true, name: true, email: true, phone: true },
      },
      transaction: {
        include: {
          buyer: { select: { name: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const stats = {
    total: tickets.length,
    available: tickets.filter((t) => t.status === "available").length,
    sold: tickets.filter((t) => ["sold", "completed"].includes(t.status)).length,
    totalValue: tickets.reduce((acc, t) => acc + t.price, 0),
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
          <h1 className="text-2xl md:text-3xl font-bold text-white">Todos os Ingressos</h1>
          <p className="text-gray-400 mt-1">Visualize todos os ingressos cadastrados na plataforma</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#0F2A44] rounded-xl p-4 border border-white/5">
            <p className="text-gray-400 text-xs">Total</p>
            <p className="text-xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-[#0F2A44] rounded-xl p-4 border border-white/5">
            <p className="text-[#16C784] text-xs">Disponiveis</p>
            <p className="text-xl font-bold text-[#16C784]">{stats.available}</p>
          </div>
          <div className="bg-[#0F2A44] rounded-xl p-4 border border-white/5">
            <p className="text-blue-400 text-xs">Vendidos</p>
            <p className="text-xl font-bold text-blue-400">{stats.sold}</p>
          </div>
          <div className="bg-[#0F2A44] rounded-xl p-4 border border-white/5">
            <p className="text-[#FF8A00] text-xs">Valor Total</p>
            <p className="text-lg font-bold text-[#FF8A00]">{formatPrice(stats.totalValue)}</p>
          </div>
        </div>

        {/* Tickets List */}
        {tickets.length === 0 ? (
          <div className="bg-[#0F2A44] rounded-2xl p-12 border border-white/5 text-center">
            <p className="text-gray-400">Nenhum ingresso encontrado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => {
              const statusInfo = statusConfig[ticket.status] || statusConfig.available;
              const lastTransaction = ticket.transaction;

              return (
                <div
                  key={ticket.id}
                  className="bg-[#0F2A44] rounded-xl border border-white/5 overflow-hidden"
                >
                  <div className="p-4 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                        {statusInfo.label}
                      </span>
                      <Link
                        href={`/ingressos/${ticket.id}`}
                        className="text-[#16C784] hover:underline text-sm"
                      >
                        Ver pagina
                      </Link>
                    </div>
                    <p className="text-xl font-bold text-white">{formatPrice(ticket.price)}</p>
                  </div>

                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Event Info */}
                      <div>
                        <p className="text-xs text-gray-500 mb-2">EVENTO</p>
                        <p className="font-semibold text-white">{ticket.eventName}</p>
                        <p className="text-sm text-gray-400">{ticket.ticketType}</p>
                        <p className="text-sm text-gray-500 mt-1">{ticket.eventLocation}</p>
                        <p className="text-sm text-gray-500">{formatDate(ticket.eventDate)}</p>
                      </div>

                      {/* Seller Info */}
                      <div>
                        <p className="text-xs text-gray-500 mb-2">VENDEDOR</p>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#2DFF88]/20 flex items-center justify-center">
                            <span className="text-xs font-bold text-[#2DFF88]">
                              {ticket.seller.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-white text-sm">{ticket.seller.name}</p>
                            <p className="text-xs text-gray-400">{ticket.seller.email}</p>
                          </div>
                        </div>
                        {ticket.seller.phone && (
                          <p className="text-xs text-gray-500 mt-1">{ticket.seller.phone}</p>
                        )}
                      </div>

                      {/* Buyer Info (if sold) */}
                      <div>
                        <p className="text-xs text-gray-500 mb-2">COMPRADOR</p>
                        {lastTransaction ? (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                              <span className="text-xs font-bold text-blue-400">
                                {lastTransaction.buyer.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-white text-sm">{lastTransaction.buyer.name}</p>
                              <p className="text-xs text-gray-400">{lastTransaction.buyer.email}</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">Ainda nao vendido</p>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {ticket.description && (
                      <div className="mt-4 pt-4 border-t border-white/5">
                        <p className="text-xs text-gray-500 mb-1">DESCRICAO</p>
                        <p className="text-sm text-gray-400">{ticket.description}</p>
                      </div>
                    )}

                    {/* Dates */}
                    <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-6 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs">Cadastrado em</p>
                        <p className="text-gray-300">{formatDate(ticket.createdAt)}</p>
                      </div>
                      {ticket.originalPrice && ticket.originalPrice !== ticket.price && (
                        <div>
                          <p className="text-gray-500 text-xs">Preco Original</p>
                          <p className="text-gray-400 line-through">{formatPrice(ticket.originalPrice)}</p>
                        </div>
                      )}
                    </div>

                    {/* ID */}
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <p className="text-xs text-gray-600">ID: {ticket.id}</p>
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
