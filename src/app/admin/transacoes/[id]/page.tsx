import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

interface PageProps {
  params: Promise<{ id: string }>;
}

const statusConfig: Record<string, { label: string; bgColor: string; textColor: string }> = {
  pending: { label: "Pendente", bgColor: "bg-gray-500/10", textColor: "text-gray-400" },
  paid: { label: "Pago", bgColor: "bg-blue-500/10", textColor: "text-blue-400" },
  confirmed: { label: "Confirmado", bgColor: "bg-[#16C784]/10", textColor: "text-[#16C784]" },
  released: { label: "Liberado", bgColor: "bg-[#16C784]/10", textColor: "text-[#16C784]" },
  disputed: { label: "Em Disputa", bgColor: "bg-red-500/10", textColor: "text-red-400" },
  refunded: { label: "Reembolsado", bgColor: "bg-[#FF8A00]/10", textColor: "text-[#FF8A00]" },
  cancelled: { label: "Cancelado", bgColor: "bg-gray-500/10", textColor: "text-gray-400" },
  expired: { label: "Expirado", bgColor: "bg-gray-500/10", textColor: "text-gray-400" },
};

export default async function AdminTransactionDetailPage({ params }: PageProps) {
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

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      ticket: true,
      buyer: {
        select: { id: true, name: true, email: true, phone: true, cpf: true },
      },
      seller: {
        select: { id: true, name: true, email: true, phone: true, cpf: true, pixKey: true },
      },
      dispute: {
        include: {
          evidences: true,
          messages: true,
        },
      },
    },
  });

  if (!transaction) {
    notFound();
  }

  const statusInfo = statusConfig[transaction.status] || statusConfig.pending;

  const formatPrice = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-[#0B1F33] py-8">
      <div className="max-w-4xl mx-auto px-4">
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
          <h1 className="text-2xl font-bold text-white">Detalhes da Transacao</h1>
        </div>

        {/* Main Card */}
        <div className="bg-[#0F2A44] rounded-2xl border border-white/5 overflow-hidden">
          {/* Status Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}>
              {statusInfo.label}
            </span>
            <p className="text-2xl font-bold text-white">{formatPrice(transaction.amount)}</p>
          </div>

          {/* Event Info */}
          <div className="p-6 border-b border-white/5">
            <h3 className="text-xs text-gray-500 mb-3">EVENTO</h3>
            <div className="bg-[#1A3A5C]/50 rounded-xl p-4">
              <h2 className="text-lg font-semibold text-white mb-2">{transaction.ticket.eventName}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Tipo</p>
                  <p className="text-white">{transaction.ticket.ticketType}</p>
                </div>
                <div>
                  <p className="text-gray-500">Local</p>
                  <p className="text-white">{transaction.ticket.eventLocation}</p>
                </div>
                <div>
                  <p className="text-gray-500">Data do Evento</p>
                  <p className="text-white">{formatDate(transaction.ticket.eventDate)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status Ingresso</p>
                  <p className="text-white">{transaction.ticket.status}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Buyer Info */}
          <div className="p-6 border-b border-white/5">
            <h3 className="text-xs text-gray-500 mb-3">COMPRADOR</h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <span className="text-lg font-bold text-blue-400">
                  {transaction.buyer.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">{transaction.buyer.name}</p>
                <p className="text-sm text-gray-400">{transaction.buyer.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 text-sm">
              <div>
                <p className="text-gray-500">WhatsApp</p>
                <p className="text-white">{transaction.buyer.phone || "Nao informado"}</p>
              </div>
              <div>
                <p className="text-gray-500">CPF</p>
                <p className="text-white">{transaction.buyer.cpf || "Nao informado"}</p>
              </div>
              <div>
                <p className="text-gray-500">ID</p>
                <p className="text-gray-400 text-xs">{transaction.buyer.id}</p>
              </div>
            </div>
          </div>

          {/* Seller Info */}
          <div className="p-6 border-b border-white/5">
            <h3 className="text-xs text-gray-500 mb-3">VENDEDOR</h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#16C784]/20 flex items-center justify-center">
                <span className="text-lg font-bold text-[#16C784]">
                  {transaction.seller.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">{transaction.seller.name}</p>
                <p className="text-sm text-gray-400">{transaction.seller.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 text-sm">
              <div>
                <p className="text-gray-500">WhatsApp</p>
                <p className="text-white">{transaction.seller.phone || "Nao informado"}</p>
              </div>
              <div>
                <p className="text-gray-500">CPF</p>
                <p className="text-white">{transaction.seller.cpf || "Nao informado"}</p>
              </div>
              <div>
                <p className="text-gray-500">Chave PIX</p>
                <p className="text-[#16C784]">{transaction.seller.pixKey || "Nao informado"}</p>
              </div>
            </div>
          </div>

          {/* Values */}
          <div className="p-6 border-b border-white/5">
            <h3 className="text-xs text-gray-500 mb-3">VALORES</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#1A3A5C]/50 rounded-xl p-4">
                <p className="text-gray-500 text-xs">Valor Total</p>
                <p className="text-xl font-bold text-white">{formatPrice(transaction.amount)}</p>
              </div>
              <div className="bg-[#1A3A5C]/50 rounded-xl p-4">
                <p className="text-gray-500 text-xs">Taxa Plataforma (10%)</p>
                <p className="text-xl font-bold text-[#FF8A00]">{formatPrice(transaction.platformFee)}</p>
              </div>
              <div className="bg-[#1A3A5C]/50 rounded-xl p-4">
                <p className="text-gray-500 text-xs">Vendedor Recebe</p>
                <p className="text-xl font-bold text-[#16C784]">{formatPrice(transaction.sellerAmount)}</p>
              </div>
              <div className="bg-[#1A3A5C]/50 rounded-xl p-4">
                <p className="text-gray-500 text-xs">Metodo</p>
                <p className="text-xl font-bold text-white">{transaction.paymentMethod?.toUpperCase() || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="p-6 border-b border-white/5">
            <h3 className="text-xs text-gray-500 mb-3">DATAS</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Criada em</p>
                <p className="text-white">{formatDate(transaction.createdAt)}</p>
              </div>
              {transaction.expiresAt && (
                <div>
                  <p className="text-gray-500">Expira em</p>
                  <p className="text-white">{formatDate(transaction.expiresAt)}</p>
                </div>
              )}
              {transaction.paidAt && (
                <div>
                  <p className="text-gray-500">Paga em</p>
                  <p className="text-[#16C784]">{formatDate(transaction.paidAt)}</p>
                </div>
              )}
              {transaction.confirmedAt && (
                <div>
                  <p className="text-gray-500">Confirmada em</p>
                  <p className="text-[#16C784]">{formatDate(transaction.confirmedAt)}</p>
                </div>
              )}
              {transaction.releasedAt && (
                <div>
                  <p className="text-gray-500">Liberada em</p>
                  <p className="text-[#16C784]">{formatDate(transaction.releasedAt)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Dispute Info */}
          {transaction.dispute && (
            <div className="p-6 border-b border-white/5 bg-red-500/5">
              <h3 className="text-xs text-red-400 mb-3">DISPUTA</h3>
              <div className="bg-[#1A3A5C]/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-red-400 font-medium">Status: {transaction.dispute.status}</span>
                  <Link
                    href={`/admin/disputas/${transaction.dispute.id}`}
                    className="btn-gradient px-4 py-2 rounded-lg text-sm font-semibold text-white"
                  >
                    Ver Disputa
                  </Link>
                </div>
                <p className="text-gray-400 text-sm mb-2">
                  <strong>Motivo:</strong> {transaction.dispute.reason}
                </p>
                {transaction.dispute.description && (
                  <p className="text-gray-400 text-sm">
                    <strong>Descricao:</strong> {transaction.dispute.description}
                  </p>
                )}
                <p className="text-gray-500 text-xs mt-2">
                  {transaction.dispute.evidences.length} evidencia(s) | {transaction.dispute.messages.length} mensagem(ns)
                </p>
              </div>
            </div>
          )}

          {/* IDs */}
          <div className="p-6 bg-[#1A3A5C]/30">
            <h3 className="text-xs text-gray-500 mb-3">IDENTIFICADORES</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-gray-500">ID Transacao</p>
                <p className="text-gray-400 font-mono">{transaction.id}</p>
              </div>
              <div>
                <p className="text-gray-500">ID Ingresso</p>
                <p className="text-gray-400 font-mono">{transaction.ticketId}</p>
              </div>
              {transaction.asaasPaymentId && (
                <div>
                  <p className="text-gray-500">ID Pagamento Asaas</p>
                  <p className="text-gray-400 font-mono">{transaction.asaasPaymentId}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/ingressos/${transaction.ticketId}`}
            className="px-4 py-2 rounded-xl bg-[#1A3A5C] text-gray-300 hover:bg-[#234B6E] text-sm transition-colors"
          >
            Ver Ingresso
          </Link>
          {transaction.buyer.phone && (
            <a
              href={`https://wa.me/55${transaction.buyer.phone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 text-sm transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
              </svg>
              WhatsApp Comprador
            </a>
          )}
          {transaction.seller.phone && (
            <a
              href={`https://wa.me/55${transaction.seller.phone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 text-sm transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
              </svg>
              WhatsApp Vendedor
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
