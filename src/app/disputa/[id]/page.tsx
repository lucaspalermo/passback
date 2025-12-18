import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import EvidenceUpload from "@/components/EvidenceUpload";
import { getWhatsAppLink } from "@/lib/config";
import Navbar from "@/components/Navbar";

interface DisputaPageProps {
  params: Promise<{ id: string }>;
}

const statusConfig: Record<string, { label: string; bgColor: string; textColor: string; icon: string }> = {
  open: {
    label: "Aberta",
    bgColor: "bg-[#FF8A00]/10",
    textColor: "text-[#FF8A00]",
    icon: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  under_review: {
    label: "Em Analise",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-400",
    icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
  },
  resolved_buyer: {
    label: "Resolvida - Favor Comprador",
    bgColor: "bg-[#16C784]/10",
    textColor: "text-[#16C784]",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  resolved_seller: {
    label: "Resolvida - Favor Vendedor",
    bgColor: "bg-[#2DFF88]/10",
    textColor: "text-[#2DFF88]",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  closed: {
    label: "Encerrada",
    bgColor: "bg-gray-500/10",
    textColor: "text-gray-400",
    icon: "M6 18L18 6M6 6l12 12",
  },
};

const reasonLabels: Record<string, string> = {
  ingresso_invalido: "Ingresso Invalido",
  nao_recebeu: "Nao Recebeu o Ingresso",
  ingresso_diferente: "Ingresso Diferente do Anunciado",
  vendedor_nao_responde: "Vendedor Nao Responde",
  outro: "Outro Motivo",
};

export default async function DisputaUserPage({ params }: DisputaPageProps) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session) {
    redirect("/login");
  }

  const dispute = await prisma.dispute.findUnique({
    where: { id },
    include: {
      transaction: {
        include: {
          ticket: true,
          buyer: {
            select: { id: true, name: true, email: true, phone: true },
          },
          seller: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
      },
      user: {
        select: { id: true, name: true },
      },
      evidences: {
        orderBy: { createdAt: "desc" },
      },
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!dispute) {
    notFound();
  }

  const isBuyer = dispute.transaction.buyerId === session.user.id;
  const isSeller = dispute.transaction.sellerId === session.user.id;

  if (!isBuyer && !isSeller) {
    redirect("/");
  }

  const canAddEvidence = ["open", "under_review"].includes(dispute.status);
  const statusInfo = statusConfig[dispute.status] || statusConfig.open;
  const userRole = isBuyer ? "buyer" : "seller";
  const otherParty = isBuyer ? dispute.transaction.seller : dispute.transaction.buyer;

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

  return (
    <div className="min-h-screen bg-[#0B1F33]">
      <Navbar />
      <div className="pt-20 pb-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <Link
              href={isBuyer ? "/minhas-compras" : "/minhas-vendas"}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar
            </Link>

            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={statusInfo.icon} />
                </svg>
                {statusInfo.label}
              </span>
              <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-[#1A3A5C] text-gray-300">
                {reasonLabels[dispute.reason] || dispute.reason}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-white">Disputa #{dispute.id.slice(-6).toUpperCase()}</h1>
            <p className="text-gray-400 mt-1">Aberta em {formatDate(dispute.createdAt)}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Info da transacao */}
              <div className="bg-[#0F2A44] rounded-2xl border border-white/5 overflow-hidden">
                <div className="p-4 border-b border-white/5">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#16C784]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                    Informacoes do Ingresso
                  </h3>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Evento</p>
                    <p className="font-semibold text-white text-lg">{dispute.transaction.ticket.eventName}</p>
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
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Valor Pago</p>
                      <p className="text-xl font-bold text-[#16C784]">{formatPrice(dispute.transaction.amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">{isBuyer ? "Vendedor" : "Comprador"}</p>
                      <p className="text-gray-300">{otherParty.name}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Descricao da disputa */}
              <div className="bg-[#0F2A44] rounded-2xl border border-white/5 overflow-hidden">
                <div className="p-4 border-b border-white/5">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#FF8A00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Descricao do Problema
                  </h3>
                </div>
                <div className="p-4">
                  <p className="text-gray-300 bg-[#1A3A5C] p-4 rounded-xl">{dispute.description}</p>
                  <p className="text-sm text-gray-500 mt-3">
                    Aberta por: {dispute.user.name} ({dispute.userId === dispute.transaction.buyerId ? "Comprador" : "Vendedor"})
                  </p>
                </div>
              </div>

              {/* Evidencias enviadas */}
              <div className="bg-[#0F2A44] rounded-2xl border border-white/5 overflow-hidden">
                <div className="p-4 border-b border-white/5">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#2DFF88]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Evidencias Enviadas ({dispute.evidences.length})
                  </h3>
                </div>
                <div className="p-4">
                  {dispute.evidences.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 rounded-full bg-[#1A3A5C] flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-500">Nenhuma evidencia enviada ainda</p>
                      {canAddEvidence && (
                        <p className="text-sm text-gray-600 mt-1">Use o formulario ao lado para enviar evidencias</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {dispute.evidences.map((evidence) => {
                        const isMyEvidence = evidence.uploadedBy === userRole;
                        return (
                          <div
                            key={evidence.id}
                            className={`p-4 rounded-xl border-l-4 ${
                              evidence.uploadedBy === "buyer"
                                ? "bg-blue-500/5 border-blue-500"
                                : "bg-[#2DFF88]/5 border-[#2DFF88]"
                            }`}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  evidence.uploadedBy === "buyer" ? "bg-blue-500/10 text-blue-400" : "bg-[#2DFF88]/10 text-[#2DFF88]"
                                }`}>
                                  {evidence.uploadedBy === "buyer" ? "Comprador" : "Vendedor"}
                                  {isMyEvidence && " (Voce)"}
                                </span>
                                <span className="px-2 py-1 rounded text-xs font-medium bg-[#1A3A5C] text-gray-400">
                                  {evidence.type}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">{formatDate(evidence.createdAt)}</span>
                            </div>

                            {evidence.description && (
                              <p className="text-sm text-gray-300 mb-3">{evidence.description}</p>
                            )}

                            {/* Preview do arquivo */}
                            {evidence.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) || evidence.url.startsWith("data:image") ? (
                              <a href={evidence.url} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={evidence.url}
                                  alt="Evidencia"
                                  className="max-w-full max-h-64 object-contain rounded-lg border border-white/10 hover:border-[#16C784]/50 transition-colors"
                                />
                              </a>
                            ) : evidence.url.match(/\.(mp4|webm)$/i) ? (
                              <video
                                src={evidence.url}
                                controls
                                className="max-w-full max-h-64 rounded-lg border border-white/10"
                              />
                            ) : (
                              <a
                                href={evidence.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#1A3A5C] rounded-lg text-[#16C784] hover:bg-[#234B6E] transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Ver arquivo
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Resolucao (se houver) */}
              {dispute.resolution && (
                <div className={`rounded-2xl border-2 overflow-hidden ${
                  dispute.status === "resolved_buyer"
                    ? "border-[#16C784]/50 bg-[#16C784]/5"
                    : dispute.status === "resolved_seller"
                    ? "border-[#2DFF88]/50 bg-[#2DFF88]/5"
                    : "border-gray-500/50 bg-[#0F2A44]"
                }`}>
                  <div className="p-4 border-b border-white/5">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#16C784]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Resolucao da Disputa
                    </h3>
                  </div>
                  <div className="p-4">
                    <p className="text-gray-300 bg-[#1A3A5C] p-4 rounded-xl">{dispute.resolution}</p>
                    {dispute.resolvedAt && (
                      <p className="text-sm text-gray-500 mt-3">
                        Resolvida em: {formatDate(dispute.resolvedAt)}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Upload de evidencias */}
              {canAddEvidence && <EvidenceUpload disputeId={dispute.id} />}

              {/* Status da disputa */}
              <div className="bg-[#0F2A44] rounded-2xl border border-white/5 overflow-hidden">
                <div className="p-4 border-b border-white/5">
                  <h3 className="font-semibold text-white">Status</h3>
                </div>
                <div className="p-4 space-y-4">
                  <div className={`p-4 rounded-xl ${statusInfo.bgColor}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <svg className={`w-5 h-5 ${statusInfo.textColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={statusInfo.icon} />
                      </svg>
                      <span className={`font-semibold ${statusInfo.textColor}`}>{statusInfo.label}</span>
                    </div>
                    <p className="text-sm text-gray-400">
                      {dispute.status === "open" && "Aguardando analise da equipe Passback."}
                      {dispute.status === "under_review" && "Nossa equipe esta analisando as evidencias."}
                      {dispute.status === "resolved_buyer" && "Disputa resolvida a favor do comprador. Reembolso processado."}
                      {dispute.status === "resolved_seller" && "Disputa resolvida a favor do vendedor. Pagamento liberado."}
                      {dispute.status === "closed" && "Esta disputa foi encerrada."}
                    </p>
                  </div>

                  {canAddEvidence && (
                    <div className="p-3 bg-[#FF8A00]/10 rounded-xl">
                      <p className="text-xs text-[#FF8A00]">
                        <strong>Dica:</strong> Envie todas as evidencias possiveis para fortalecer seu caso. Prints de conversa, fotos do ingresso e comprovantes ajudam muito!
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contato suporte */}
              <div className="bg-[#0F2A44] rounded-2xl border border-white/5 p-4">
                <h3 className="font-semibold text-white mb-3">Precisa de ajuda?</h3>
                <a
                  href={getWhatsAppLink("5511999999999", `Olá! Preciso de ajuda com a disputa #${dispute.id.slice(-6).toUpperCase()}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-[#16C784] hover:bg-[#14B576] text-white font-semibold rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Falar com Suporte
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
