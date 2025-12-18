import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import Navbar from "@/components/Navbar";

const statusConfig: Record<string, { label: string; bgColor: string; textColor: string }> = {
  available: { label: "Disponivel", bgColor: "bg-[#16C784]/10", textColor: "text-[#16C784]" },
  reserved: { label: "Reservado", bgColor: "bg-[#FF8A00]/10", textColor: "text-[#FF8A00]" },
  sold: { label: "Vendido", bgColor: "bg-blue-500/10", textColor: "text-blue-400" },
  completed: { label: "Finalizado", bgColor: "bg-gray-500/10", textColor: "text-gray-400" },
  cancelled: { label: "Cancelado", bgColor: "bg-red-500/10", textColor: "text-red-400" },
};

export default async function MeusIngressosPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const tickets = await prisma.ticket.findMany({
    where: { sellerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      transaction: {
        select: { id: true, status: true },
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
    total: tickets.length,
    available: tickets.filter((t) => t.status === "available").length,
    sold: tickets.filter((t) => ["sold", "completed"].includes(t.status)).length,
  };

  return (
    <div className="min-h-screen bg-[#0B1F33]">
      <Navbar />
      <div className="pt-20 pb-8">
        <div className="max-w-5xl mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Meus Ingressos</h1>
              <p className="text-gray-400 mt-1">Gerencie seus ingressos anunciados</p>
            </div>
            <Link
              href="/ingressos/novo"
              className="btn-gradient px-6 py-3 rounded-xl font-semibold text-white text-center hover:opacity-90 transition-all"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Vender Ingresso
              </span>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-[#0F2A44] rounded-xl p-4 border border-white/5">
              <p className="text-gray-400 text-sm">Total</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="bg-[#0F2A44] rounded-xl p-4 border border-white/5">
              <p className="text-gray-400 text-sm">Disponiveis</p>
              <p className="text-2xl font-bold text-[#16C784]">{stats.available}</p>
            </div>
            <div className="bg-[#0F2A44] rounded-xl p-4 border border-white/5">
              <p className="text-gray-400 text-sm">Vendidos</p>
              <p className="text-2xl font-bold text-[#FF8A00]">{stats.sold}</p>
            </div>
          </div>

          {tickets.length === 0 ? (
            <div className="bg-[#0F2A44] rounded-2xl p-12 border border-white/5 text-center">
              <div className="w-16 h-16 rounded-full bg-[#1A3A5C] flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <p className="text-gray-400 mb-6">Voce ainda nao anunciou nenhum ingresso.</p>
              <Link
                href="/ingressos/novo"
                className="inline-flex items-center gap-2 btn-gradient px-6 py-3 rounded-xl font-semibold text-white hover:opacity-90 transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Anunciar meu primeiro ingresso
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => {
                const statusInfo = statusConfig[ticket.status] || {
                  label: ticket.status,
                  bgColor: "bg-gray-500/10",
                  textColor: "text-gray-400",
                };

                return (
                  <div
                    key={ticket.id}
                    className="bg-[#0F2A44] rounded-xl p-5 border border-white/5 hover:border-white/10 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-white truncate">{ticket.eventName}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                            </svg>
                            {ticket.ticketType}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            {ticket.eventLocation}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formatDate(ticket.eventDate)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xl font-bold text-white">{formatPrice(ticket.price)}</p>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/ingressos/${ticket.id}`}
                            className="px-4 py-2 rounded-lg bg-[#1A3A5C] text-gray-300 hover:bg-[#234B6E] transition-all text-sm font-medium"
                          >
                            Ver
                          </Link>
                          {ticket.transaction && (
                            <Link
                              href={`/compra/${ticket.transaction.id}`}
                              className="px-4 py-2 rounded-lg bg-[#16C784]/10 text-[#16C784] hover:bg-[#16C784]/20 transition-all text-sm font-medium"
                            >
                              Transacao
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
