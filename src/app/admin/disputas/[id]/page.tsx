import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import ResolveDisputeForm from "./ResolveDisputeForm";

interface DisputaPageProps {
  params: Promise<{ id: string }>;
}

const reasonLabels: Record<string, string> = {
  ingresso_invalido: "Ingresso Invalido",
  nao_recebeu: "Nao Recebeu o Ingresso",
  ingresso_diferente: "Ingresso Diferente do Anunciado",
  vendedor_nao_responde: "Vendedor Nao Responde",
  outro: "Outro Motivo",
};

export default async function DisputaDetailPage({ params }: DisputaPageProps) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user?.isAdmin) {
    redirect("/");
  }

  const dispute = await prisma.dispute.findUnique({
    where: { id },
    include: {
      transaction: {
        include: {
          ticket: true,
          buyer: {
            include: { reputation: true },
          },
          seller: {
            include: { reputation: true },
          },
        },
      },
      user: true,
      evidences: {
        orderBy: { createdAt: "asc" },
      },
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!dispute) {
    notFound();
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
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

  const canResolve = ["open", "under_review"].includes(dispute.status);

  const buyerRep = dispute.transaction.buyer.reputation;
  const sellerRep = dispute.transaction.seller.reputation;

  return (
    <div className="min-h-screen bg-[#0B1F33] py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/disputas"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar para disputas
          </Link>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 rounded bg-[#16C784]/10 text-[#16C784] text-xs font-medium">ADMIN</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Analise de Disputa</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Info da Transacao */}
          <div className="bg-[#0F2A44] rounded-2xl border border-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-[#16C784]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                Transacao
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Evento</p>
                <p className="font-medium text-white">{dispute.transaction.ticket.eventName}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Tipo</p>
                  <p className="text-gray-300">{dispute.transaction.ticket.ticketType}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Data do Evento</p>
                  <p className="text-gray-300">{formatDate(dispute.transaction.ticket.eventDate)}</p>
                </div>
              </div>
              <div className="border-t border-white/5 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Valor Total</p>
                    <p className="text-2xl font-bold text-[#16C784]">{formatPrice(dispute.transaction.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Vendedor receberia</p>
                    <p className="text-xl font-semibold text-white">{formatPrice(dispute.transaction.sellerAmount)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Info da Disputa */}
          <div className="bg-[#0F2A44] rounded-2xl border border-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Disputa
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Motivo</p>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400">
                  {reasonLabels[dispute.reason] || dispute.reason}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Descricao</p>
                <p className="text-sm text-gray-300 bg-[#1A3A5C] p-3 rounded-xl">{dispute.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Aberta por</p>
                  <p className="text-gray-300">
                    {dispute.user.name}{" "}
                    <span className="text-gray-500">
                      ({dispute.userId === dispute.transaction.buyerId ? "Comprador" : "Vendedor"})
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Data de Abertura</p>
                  <p className="text-gray-300">{formatDate(dispute.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reputacao dos Usuarios */}
        <div className="bg-[#0F2A44] rounded-2xl border border-white/5 overflow-hidden mb-6">
          <div className="p-4 border-b border-white/5">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-[#2DFF88]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Analise de Reputacao
            </h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Comprador */}
              <div className="bg-[#1A3A5C]/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-white flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-400">C</span>
                    </div>
                    {dispute.transaction.buyer.name}
                  </h4>
                  {buyerRep?.isSuspicious && (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-red-500/10 text-red-400">SUSPEITO</span>
                  )}
                </div>
                <div className="text-sm space-y-2">
                  <p className="text-gray-400">Email: <span className="text-gray-300">{dispute.transaction.buyer.email}</span></p>
                  <p className="text-gray-400">Telefone: <span className="text-gray-300">{dispute.transaction.buyer.phone || "Nao informado"}</span></p>
                  {buyerRep ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Trust Score:</span>
                        <span className={`font-bold ${buyerRep.trustScore < 70 ? "text-red-400" : "text-green-400"}`}>
                          {buyerRep.trustScore}/100
                        </span>
                      </div>
                      <p className="text-gray-400">Compras: <span className="text-gray-300">{buyerRep.completedPurchases}</span></p>
                      <p className="text-gray-400">Disputas abertas: <span className="text-gray-300">{buyerRep.disputesOpened}</span></p>
                      <p className="text-gray-400">Disputas perdidas: <span className={buyerRep.disputesLost > 0 ? "text-red-400 font-bold" : "text-gray-300"}>{buyerRep.disputesLost}</span></p>
                    </>
                  ) : (
                    <p className="text-gray-500 italic">Sem historico</p>
                  )}
                </div>
              </div>

              {/* Vendedor */}
              <div className="bg-[#1A3A5C]/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-white flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#2DFF88]/20 flex items-center justify-center">
                      <span className="text-sm font-bold text-[#2DFF88]">V</span>
                    </div>
                    {dispute.transaction.seller.name}
                  </h4>
                  {sellerRep?.isSuspicious && (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-red-500/10 text-red-400">SUSPEITO</span>
                  )}
                </div>
                <div className="text-sm space-y-2">
                  <p className="text-gray-400">Email: <span className="text-gray-300">{dispute.transaction.seller.email}</span></p>
                  <p className="text-gray-400">Telefone: <span className="text-gray-300">{dispute.transaction.seller.phone || "Nao informado"}</span></p>
                  {sellerRep ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Trust Score:</span>
                        <span className={`font-bold ${sellerRep.trustScore < 70 ? "text-red-400" : "text-green-400"}`}>
                          {sellerRep.trustScore}/100
                        </span>
                      </div>
                      <p className="text-gray-400">Vendas: <span className="text-gray-300">{sellerRep.completedSales}</span></p>
                      <p className="text-gray-400">Disputas abertas: <span className="text-gray-300">{sellerRep.disputesOpened}</span></p>
                      <p className="text-gray-400">Disputas perdidas: <span className={sellerRep.disputesLost > 0 ? "text-red-400 font-bold" : "text-gray-300"}>{sellerRep.disputesLost}</span></p>
                    </>
                  ) : (
                    <p className="text-gray-500 italic">Sem historico</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Evidencias */}
        <div className="bg-[#0F2A44] rounded-2xl border border-white/5 overflow-hidden mb-6">
          <div className="p-4 border-b border-white/5">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Evidencias ({dispute.evidences.length})
            </h3>
          </div>
          <div className="p-4">
            {dispute.evidences.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhuma evidencia enviada</p>
            ) : (
              <div className="space-y-4">
                {dispute.evidences.map((evidence) => (
                  <div
                    key={evidence.id}
                    className={`p-4 rounded-xl border-l-4 ${
                      evidence.uploadedBy === "buyer"
                        ? "bg-blue-500/5 border-blue-500"
                        : "bg-[#2DFF88]/5 border-[#2DFF88]"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        evidence.uploadedBy === "buyer" ? "bg-blue-500/10 text-blue-400" : "bg-[#2DFF88]/10 text-[#2DFF88]"
                      }`}>
                        {evidence.uploadedBy === "buyer" ? "Comprador" : "Vendedor"}
                      </span>
                      <span className="text-xs text-gray-500">{formatDate(evidence.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-400 mb-1">Tipo: <span className="text-gray-300">{evidence.type}</span></p>
                    {evidence.description && (
                      <p className="text-sm text-gray-300 mb-2">{evidence.description}</p>
                    )}
                    {evidence.url.startsWith("data:image") ? (
                      <img src={evidence.url} alt="Evidencia" className="max-w-full h-auto rounded-lg border border-white/10" />
                    ) : (
                      <a href={evidence.url} target="_blank" rel="noopener noreferrer" className="text-[#16C784] hover:underline text-sm">
                        Ver arquivo
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mensagens */}
        <div className="bg-[#0F2A44] rounded-2xl border border-white/5 overflow-hidden mb-6">
          <div className="p-4 border-b border-white/5">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Historico de Mensagens ({dispute.messages.length})
            </h3>
          </div>
          <div className="p-4">
            {dispute.messages.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhuma mensagem</p>
            ) : (
              <div className="space-y-3">
                {dispute.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-xl border-l-4 ${
                      msg.sender === "admin"
                        ? "bg-yellow-500/5 border-yellow-500"
                        : msg.sender === "buyer"
                        ? "bg-blue-500/5 border-blue-500"
                        : "bg-[#2DFF88]/5 border-[#2DFF88]"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        msg.sender === "admin"
                          ? "bg-yellow-500/10 text-yellow-400"
                          : msg.sender === "buyer"
                          ? "bg-blue-500/10 text-blue-400"
                          : "bg-[#2DFF88]/10 text-[#2DFF88]"
                      }`}>
                        {msg.sender === "admin" ? "ADMIN" : msg.sender === "buyer" ? "Comprador" : "Vendedor"}
                      </span>
                      <span className="text-xs text-gray-500">{formatDate(msg.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-300">{msg.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Checklist e Resolucao */}
        {canResolve && (
          <div className="bg-[#0F2A44] rounded-2xl border-2 border-yellow-500/50 overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-yellow-500/5">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Resolver Disputa
              </h3>
            </div>
            <div className="p-4">
              <div className="bg-[#1A3A5C] p-4 rounded-xl mb-6">
                <h4 className="font-semibold text-yellow-400 mb-3">Checklist de Analise:</h4>
                <ul className="space-y-3 text-sm">
                  {[
                    "Vendedor enviou prints da conversa do WhatsApp?",
                    "Comprador apresentou evidencias do problema?",
                    "O evento ja aconteceu? (verificar data)",
                    "Historico de disputas do comprador foi analisado?",
                    "Historico de disputas do vendedor foi analisado?",
                    "Ha indicios de ma-fe de alguma parte?",
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-0.5 w-4 h-4 rounded border-white/20 bg-[#0F2A44] text-[#16C784] focus:ring-[#16C784]/50"
                      />
                      <span className="text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <ResolveDisputeForm disputeId={dispute.id} />
            </div>
          </div>
        )}

        {!canResolve && dispute.resolution && (
          <div className="bg-[#0F2A44] rounded-2xl border-2 border-green-500/50 overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-green-500/5">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Resolucao
              </h3>
            </div>
            <div className="p-4">
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                dispute.status === "resolved_buyer"
                  ? "bg-[#16C784]/10 text-[#16C784]"
                  : "bg-[#2DFF88]/10 text-[#2DFF88]"
              }`}>
                {dispute.status === "resolved_buyer"
                  ? "Favor do Comprador (Reembolso)"
                  : "Favor do Vendedor (Pagamento Liberado)"}
              </span>
              <p className="mt-4 p-4 bg-[#1A3A5C] rounded-xl text-gray-300">{dispute.resolution}</p>
              {dispute.resolvedAt && (
                <p className="text-sm text-gray-500 mt-2">
                  Resolvida em: {formatDate(dispute.resolvedAt)}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
