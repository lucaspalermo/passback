import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const statusConfig: Record<string, { label: string; bgColor: string; textColor: string }> = {
  open: { label: "Aberta", bgColor: "bg-[#FF8A00]/10", textColor: "text-[#FF8A00]" },
  under_review: { label: "Em Analise", bgColor: "bg-blue-500/10", textColor: "text-blue-400" },
  resolved_buyer: { label: "Favor Comprador", bgColor: "bg-[#16C784]/10", textColor: "text-[#16C784]" },
  resolved_seller: { label: "Favor Vendedor", bgColor: "bg-[#2DFF88]/10", textColor: "text-[#2DFF88]" },
  closed: { label: "Encerrada", bgColor: "bg-gray-500/10", textColor: "text-gray-400" },
};

const reasonLabels: Record<string, string> = {
  ingresso_invalido: "Ingresso Invalido",
  nao_recebeu: "Nao Recebeu o Ingresso",
  ingresso_diferente: "Ingresso Diferente do Anunciado",
  vendedor_nao_responde: "Vendedor Nao Responde",
  outro: "Outro Motivo",
};

export default async function AdminDisputasPage() {
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

  const disputes = await prisma.dispute.findMany({
    include: {
      transaction: {
        include: {
          ticket: true,
          buyer: {
            select: { id: true, name: true, email: true },
          },
          seller: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      user: {
        select: { id: true, name: true },
      },
      evidences: true,
      _count: {
        select: { messages: true, evidences: true },
      },
    },
    orderBy: [
      { status: "asc" },
      { createdAt: "desc" },
    ],
  });

  const stats = {
    total: disputes.length,
    open: disputes.filter((d) => d.status === "open").length,
    underReview: disputes.filter((d) => d.status === "under_review").length,
    resolved: disputes.filter((d) =>
      ["resolved_buyer", "resolved_seller", "closed"].includes(d.status)
    ).length,
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  return (
    <div className="min-h-screen bg-[#0B1F33] py-8">
      <div className="max-w-6xl mx-auto px-4">
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
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <span className="px-2 py-1 rounded bg-[#16C784]/10 text-[#16C784] text-xs font-medium">ADMIN</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Painel de Disputas</h1>
          <p className="text-gray-400 mt-1">Gerencie e resolva disputas entre compradores e vendedores</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#0F2A44] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#2DFF88]/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#2DFF88]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Total</p>
                <p className="text-xl font-bold text-white">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#0F2A44] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#FF8A00]/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#FF8A00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Abertas</p>
                <p className="text-xl font-bold text-[#FF8A00]">{stats.open}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#0F2A44] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Em Analise</p>
                <p className="text-xl font-bold text-blue-400">{stats.underReview}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#0F2A44] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#16C784]/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#16C784]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Resolvidas</p>
                <p className="text-xl font-bold text-[#16C784]">{stats.resolved}</p>
              </div>
            </div>
          </div>
        </div>

        {disputes.length === 0 ? (
          <div className="bg-[#0F2A44] rounded-2xl p-12 border border-white/5 text-center">
            <div className="w-16 h-16 rounded-full bg-[#1A3A5C] flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-400">Nenhuma disputa encontrada</p>
          </div>
        ) : (
          <div className="space-y-4">
            {disputes.map((dispute) => {
              const statusInfo = statusConfig[dispute.status] || {
                label: dispute.status,
                bgColor: "bg-gray-500/10",
                textColor: "text-gray-400",
              };

              const isUrgent = dispute.status === "open";

              return (
                <div
                  key={dispute.id}
                  className={`bg-[#0F2A44] rounded-xl p-5 border transition-all ${
                    isUrgent ? "border-[#FF8A00]/50 hover:border-[#FF8A00]" : "border-white/5 hover:border-white/10"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                          {statusInfo.label}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#1A3A5C] text-gray-300">
                          {reasonLabels[dispute.reason] || dispute.reason}
                        </span>
                        {isUrgent && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
                            Urgente
                          </span>
                        )}
                      </div>

                      <h3 className="font-semibold text-white mb-2">
                        {dispute.transaction.ticket.eventName}
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-400">
                        <p>
                          <span className="text-gray-500">Valor:</span>{" "}
                          <span className="text-white font-medium">{formatPrice(dispute.transaction.amount)}</span>
                        </p>
                        <p>
                          <span className="text-gray-500">Comprador:</span>{" "}
                          {dispute.transaction.buyer.name}
                        </p>
                        <p>
                          <span className="text-gray-500">Vendedor:</span>{" "}
                          {dispute.transaction.seller.name}
                        </p>
                        <p>
                          <span className="text-gray-500">Aberta por:</span>{" "}
                          {dispute.user.name} em {formatDate(dispute.createdAt)}
                        </p>
                      </div>

                      <div className="flex gap-4 mt-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {dispute._count.evidences} evidencia(s)
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          {dispute._count.messages} mensagem(ns)
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/admin/disputas/${dispute.id}`}
                      className={`px-6 py-3 rounded-xl font-semibold text-center transition-all ${
                        ["open", "under_review"].includes(dispute.status)
                          ? "btn-gradient text-white"
                          : "bg-[#1A3A5C] text-gray-300 hover:bg-[#234B6E]"
                      }`}
                    >
                      {["open", "under_review"].includes(dispute.status) ? "Analisar" : "Ver Detalhes"}
                    </Link>
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
