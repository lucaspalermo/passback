import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import WhatsAppButton from "@/components/WhatsAppButton";
import ConfirmButton from "./ConfirmButton";
import DisputeButton from "./DisputeButton";
import ContactOptions from "./ContactOptions";
import ReviewSection from "./ReviewSection";
import Navbar from "@/components/Navbar";
import PurchaseActions from "@/components/PurchaseActions";

interface CompraPageProps {
  params: Promise<{ transactionId: string }>;
  searchParams: Promise<{ status?: string }>;
}

const statusConfig: Record<string, { label: string; bgColor: string; textColor: string; icon: string }> = {
  awaiting_seller: { label: "Aguardando vendedor", bgColor: "bg-purple-500/10", textColor: "text-purple-400", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  pending: { label: "Aguardando pagamento", bgColor: "bg-[#FF8A00]/10", textColor: "text-[#FF8A00]", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  paid: { label: "Pago - Aguardando entrega", bgColor: "bg-blue-500/10", textColor: "text-blue-400", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  confirmed: { label: "Confirmado", bgColor: "bg-[#16C784]/10", textColor: "text-[#16C784]", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  released: { label: "Finalizado", bgColor: "bg-[#16C784]/10", textColor: "text-[#16C784]", icon: "M5 13l4 4L19 7" },
  disputed: { label: "Em disputa", bgColor: "bg-red-500/10", textColor: "text-red-400", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
  refunded: { label: "Reembolsado", bgColor: "bg-gray-500/10", textColor: "text-gray-400", icon: "M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" },
  cancelled: { label: "Cancelado", bgColor: "bg-gray-500/10", textColor: "text-gray-400", icon: "M6 18L18 6M6 6l12 12" },
  expired: { label: "Expirado", bgColor: "bg-gray-500/10", textColor: "text-gray-400", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  seller_rejected: { label: "Rejeitado pelo vendedor", bgColor: "bg-gray-500/10", textColor: "text-gray-400", icon: "M6 18L18 6M6 6l12 12" },
};

export default async function CompraPage({ params, searchParams }: CompraPageProps) {
  const session = await getServerSession(authOptions);
  const { transactionId } = await params;
  const queryParams = await searchParams;

  if (!session) {
    redirect("/login");
  }

  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      ticket: true,
      buyer: {
        select: { id: true, name: true, email: true, phone: true },
      },
      seller: {
        select: { id: true, name: true, email: true, phone: true },
      },
      dispute: {
        select: { id: true, status: true },
      },
    },
  });

  if (!transaction) {
    notFound();
  }

  const isBuyer = session.user.id === transaction.buyerId;
  const isSeller = session.user.id === transaction.sellerId;

  if (!isBuyer && !isSeller) {
    notFound();
  }

  const statusInfo = statusConfig[transaction.status] || {
    label: transaction.status,
    bgColor: "bg-gray-500/10",
    textColor: "text-gray-400",
    icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
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
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isPaid = ["paid", "confirmed", "released"].includes(transaction.status);
  const canConfirm = isBuyer && transaction.status === "paid";

  // Mostrar opções de contato quando pagamento confirmado
  const showContactOptions =
    isBuyer &&
    (queryParams.status === "success" || transaction.status === "paid") &&
    transaction.seller.phone;

  return (
    <div className="min-h-screen bg-[#0B1F33]">
      <Navbar />
      <div className="pt-20 pb-8">
        <div className="max-w-3xl mx-auto px-4">
          {/* Opcoes de Contato apos pagamento */}
          {showContactOptions && queryParams.status === "success" && (
            <div className="mb-6">
              <ContactOptions
                sellerName={transaction.seller.name}
                sellerPhone={transaction.seller.phone!}
                ticketId={transaction.ticketId}
                eventName={transaction.ticket.eventName}
                transactionId={transaction.id}
              />
            </div>
          )}

          {queryParams.status === "failure" && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              O pagamento nao foi concluido. Tente novamente.
            </div>
          )}

          {/* Back Button */}
          <Link
            href={isBuyer ? "/minhas-compras" : "/minhas-vendas"}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </Link>

          {/* Main Card */}
          <div className="bg-[#0F2A44] rounded-2xl border border-white/5 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold text-white">Detalhes da Compra</h1>
                <span className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={statusInfo.icon} />
                  </svg>
                  {statusInfo.label}
                </span>
              </div>

              {/* Event Info */}
              <div className="bg-[#1A3A5C]/50 rounded-xl p-4">
                <h2 className="text-lg font-semibold text-white mb-2">{transaction.ticket.eventName}</h2>
                <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                    {transaction.ticket.ticketType}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {transaction.ticket.eventLocation}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(transaction.ticket.eventDate)}
                  </span>
                </div>
              </div>
            </div>

            {/* Values */}
            <div className="p-6 border-b border-white/5">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Valor pago</p>
                  <p className="text-2xl font-bold text-white">{formatPrice(transaction.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">
                    {isSeller ? "Voce recebera" : "Taxa da plataforma"}
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {isSeller
                      ? formatPrice(transaction.sellerAmount)
                      : formatPrice(transaction.platformFee)}
                  </p>
                  {isSeller && (
                    <p className="text-xs text-gray-500">(apos confirmacao)</p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Section */}
            <div className="p-6 border-b border-white/5">
              {isBuyer && (
                <div>
                  <p className="text-sm text-gray-400 mb-3">Vendedor</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#16C784] to-[#2DFF88] flex items-center justify-center">
                        <span className="text-lg font-bold text-white">
                          {transaction.seller.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-white">{transaction.seller.name}</p>
                        {isPaid && transaction.seller.phone && (
                          <p className="text-sm text-gray-400">{transaction.seller.phone}</p>
                        )}
                      </div>
                    </div>
                    {isPaid && transaction.seller.phone && (
                      <WhatsAppButton
                        phone={transaction.seller.phone}
                        message={`Ola! Comprei o ingresso "${transaction.ticket.eventName}" pelo Passback. Podemos combinar a entrega?`}
                      />
                    )}
                  </div>
                </div>
              )}

              {isSeller && (
                <div>
                  <p className="text-sm text-gray-400 mb-3">Comprador</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2DFF88] to-[#16C784] flex items-center justify-center">
                        <span className="text-lg font-bold text-white">
                          {transaction.buyer.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-white">{transaction.buyer.name}</p>
                        {isPaid && transaction.buyer.phone && (
                          <p className="text-sm text-gray-400">{transaction.buyer.phone}</p>
                        )}
                      </div>
                    </div>
                    {isPaid && transaction.buyer.phone && (
                      <WhatsAppButton
                        phone={transaction.buyer.phone}
                        message={`Ola! Voce comprou meu ingresso "${transaction.ticket.eventName}" pelo Passback. Vamos combinar a entrega!`}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Status Messages */}
            <div className="p-6 space-y-4">
              {transaction.status === "awaiting_seller" && (
                <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl">
                  <h4 className="font-medium text-purple-400 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Aguardando confirmacao do vendedor
                  </h4>
                  <p className="text-sm text-purple-300/80">
                    {isBuyer
                      ? "O vendedor tem ate 15 minutos para confirmar que ainda possui o ingresso. Voce sera notificado assim que ele confirmar para poder efetuar o pagamento."
                      : "Voce precisa confirmar que ainda possui o ingresso para que o comprador possa efetuar o pagamento."}
                  </p>
                  {transaction.expiresAt && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-purple-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Expira em: {new Date(transaction.expiresAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  )}
                  {isSeller && (
                    <div className="mt-4 flex gap-3">
                      <a
                        href="/minhas-vendas"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#16C784] text-white font-medium hover:bg-[#16C784]/80 transition-all"
                      >
                        Confirmar disponibilidade
                      </a>
                    </div>
                  )}
                </div>
              )}

              {transaction.status === "seller_rejected" && (
                <div className="bg-gray-500/10 border border-gray-500/20 p-4 rounded-xl">
                  <h4 className="font-medium text-gray-400 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Ingresso indisponivel
                  </h4>
                  <p className="text-sm text-gray-400">
                    {isBuyer
                      ? "Infelizmente o vendedor informou que o ingresso nao esta mais disponivel. Voce pode buscar outros ingressos para o mesmo evento."
                      : "Voce rejeitou esta reserva. O ingresso voltou a ficar disponivel para venda."}
                  </p>
                  {isBuyer && (
                    <div className="mt-4">
                      <a
                        href="/"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#16C784]/10 text-[#16C784] font-medium hover:bg-[#16C784]/20 transition-all"
                      >
                        Buscar outros ingressos
                      </a>
                    </div>
                  )}
                </div>
              )}

              {transaction.status === "pending" && (
                <div className="bg-[#FF8A00]/10 border border-[#FF8A00]/20 p-4 rounded-xl">
                  <h4 className="font-medium text-[#FF8A00] mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Aguardando pagamento
                  </h4>
                  <p className="text-sm text-[#FF8A00]/80">
                    {isBuyer
                      ? "O vendedor confirmou! Complete o pagamento para receber os dados de contato do vendedor."
                      : "Voce confirmou a disponibilidade. O comprador esta efetuando o pagamento."}
                  </p>
                  {isBuyer && (
                    <PurchaseActions
                      transactionId={transaction.id}
                      status={transaction.status}
                      expiresAt={transaction.expiresAt}
                    />
                  )}
                </div>
              )}

              {transaction.status === "paid" && (
                <>
                  {isBuyer && transaction.seller.phone ? (
                    <ContactOptions
                      sellerName={transaction.seller.name}
                      sellerPhone={transaction.seller.phone}
                      ticketId={transaction.ticketId}
                      eventName={transaction.ticket.eventName}
                      transactionId={transaction.id}
                    />
                  ) : (
                    <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                      <h4 className="font-medium text-blue-400 mb-2 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Pagamento confirmado
                      </h4>
                      <p className="text-sm text-blue-300/80">
                        Entre em contato com o comprador para enviar o ingresso. O pagamento sera liberado apos confirmacao.
                      </p>
                    </div>
                  )}

                  {isBuyer && (
                    <div className="bg-[#FF8A00]/10 border border-[#FF8A00]/20 p-3 rounded-xl mt-4">
                      <p className="text-sm text-[#FF8A00] flex items-start gap-2">
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>
                          Apos entrar no evento, <strong>confirme aqui</strong> para liberar o pagamento ao vendedor.
                          Se nao confirmar em <strong>24 horas apos o evento</strong>, o pagamento sera liberado automaticamente.
                        </span>
                      </p>
                    </div>
                  )}
                </>
              )}

              {transaction.status === "disputed" && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                  <h4 className="font-medium text-red-400 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Transacao em disputa
                  </h4>
                  <p className="text-sm text-red-300/80">
                    Esta transacao esta sendo analisada pela nossa equipe. Entraremos em contato em breve.
                  </p>
                </div>
              )}

              {transaction.status === "released" && (
                <>
                  <div className="bg-[#16C784]/10 border border-[#16C784]/20 p-4 rounded-xl">
                    <h4 className="font-medium text-[#16C784] mb-2 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Transacao finalizada
                    </h4>
                    <p className="text-sm text-[#16C784]/80">
                      {isBuyer
                        ? "Voce confirmou a entrada no evento. O pagamento foi liberado ao vendedor."
                        : "O comprador confirmou. O pagamento foi liberado para voce!"}
                    </p>
                  </div>

                  {/* Secao de Avaliacao */}
                  <ReviewSection
                    transactionId={transaction.id}
                    userToReview={isBuyer ? transaction.seller : transaction.buyer}
                    eventName={transaction.ticket.eventName}
                  />
                </>
              )}

              {/* Action Buttons */}
              {canConfirm && (
                <ConfirmButton transactionId={transaction.id} />
              )}

              {(transaction.status === "paid" || transaction.status === "disputed") && (
                <DisputeButton
                  transactionId={transaction.id}
                  existingDisputeId={transaction.dispute?.id}
                />
              )}
            </div>

            {/* Transaction Details */}
            <div className="p-6 bg-[#1A3A5C]/30 border-t border-white/5">
              <p className="text-xs text-gray-500 space-y-1">
                <span className="block">ID da transacao: {transaction.id}</span>
                <span className="block">Criada em: {formatDate(transaction.createdAt)}</span>
                {transaction.paidAt && (
                  <span className="block">Paga em: {formatDate(transaction.paidAt)}</span>
                )}
                {transaction.confirmedAt && (
                  <span className="block">Confirmada em: {formatDate(transaction.confirmedAt)}</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
