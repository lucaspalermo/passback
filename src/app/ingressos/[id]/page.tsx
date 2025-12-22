import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import BuyButton from "./BuyButton";
import FavoriteWrapper from "./FavoriteWrapper";

interface TicketPageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketPage({ params }: TicketPageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      seller: {
        select: {
          id: true,
          name: true,
          verified: true,
          createdAt: true,
        },
      },
    },
  });

  if (!ticket) {
    notFound();
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("pt-BR", {
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

  const discount = ticket.originalPrice
    ? Math.round(
        ((ticket.originalPrice - ticket.price) / ticket.originalPrice) * 100
      )
    : 0;

  const isOwner = session?.user?.id === ticket.sellerId;
  const isAvailable = ticket.status === "available";

  const getGradient = (name: string) => {
    const gradients = [
      "from-[#16C784] to-[#2DFF88]",
      "from-blue-600 to-cyan-500",
      "from-[#FF8A00] to-orange-400",
      "from-emerald-500 to-teal-500",
      "from-[#16C784] to-emerald-400",
      "from-indigo-600 to-blue-500",
    ];
    const index = name.length % gradients.length;
    return gradients[index];
  };

  return (
    <div className="min-h-screen bg-[#0B1F33]">
      {/* Hero do Evento */}
      <div className={`relative h-64 md:h-80 ${!ticket.imageUrl ? `bg-gradient-to-br ${getGradient(ticket.eventName)}` : ""}`}>
        {/* Imagem de fundo se existir */}
        {ticket.imageUrl && (
          <img
            src={ticket.imageUrl}
            alt={ticket.eventName}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        <div className={`absolute inset-0 ${ticket.imageUrl ? "bg-black/50" : "bg-black/20"}`} />

        {/* Voltar e Favorito */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 bg-black/30 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm hover:bg-black/40 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </Link>
          <FavoriteWrapper ticketId={ticket.id} />
        </div>

        {/* Badge de Status */}
        <div className="absolute top-4 right-4 z-10">
          {isAvailable ? (
            <span className="bg-[#16C784] text-white px-4 py-2 rounded-full text-sm font-medium">
              Disponivel
            </span>
          ) : (
            <span className="bg-gray-500 text-white px-4 py-2 rounded-full text-sm font-medium">
              {ticket.status === "sold" ? "Vendido" : ticket.status}
            </span>
          )}
        </div>

        {/* Badge de Desconto */}
        {discount > 0 && (
          <div className="absolute bottom-4 right-4 z-10">
            <span className="discount-badge px-4 py-2 rounded-full text-sm font-bold text-white">
              -{discount}% OFF
            </span>
          </div>
        )}

        {/* Icone (apenas se nao tiver imagem) */}
        {!ticket.imageUrl && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10">
            <svg className="w-48 h-48 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-20 relative z-10 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card de Info Principal */}
            <div className="bg-[#0F2A44] rounded-2xl p-6 border border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-[#1A3A5C] text-gray-300 px-3 py-1 rounded-full text-sm">
                  {ticket.ticketType}
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">
                {ticket.eventName}
              </h1>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Data */}
                <div className="flex items-start gap-4 bg-[#1A3A5C]/50 rounded-xl p-4">
                  <div className="w-12 h-12 rounded-xl bg-[#16C784]/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-[#16C784]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Data do Evento</p>
                    <p className="text-white font-medium capitalize">{formatDate(ticket.eventDate)}</p>
                    <p className="text-[#16C784] font-semibold">{formatTime(ticket.eventDate)}</p>
                  </div>
                </div>

                {/* Local */}
                <div className="flex items-start gap-4 bg-[#1A3A5C]/50 rounded-xl p-4">
                  <div className="w-12 h-12 rounded-xl bg-[#FF8A00]/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-[#FF8A00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Local</p>
                    <p className="text-white font-medium">{ticket.eventLocation}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Descricao */}
            {ticket.description && (
              <div className="bg-[#0F2A44] rounded-2xl p-6 border border-white/5">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#16C784]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  Descricao do Vendedor
                </h2>
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {ticket.description}
                </p>
              </div>
            )}

            {/* Vendedor */}
            <div className="bg-[#0F2A44] rounded-2xl p-6 border border-white/5">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#2DFF88]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Sobre o Vendedor
              </h2>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#16C784] to-[#2DFF88] flex items-center justify-center">
                  <span className="text-xl font-bold text-white">
                    {ticket.seller.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white">{ticket.seller.name}</p>
                    {ticket.seller.verified && (
                      <span className="bg-[#16C784]/20 text-[#16C784] px-2 py-0.5 rounded text-xs font-medium">
                        Verificado
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm">
                    Membro desde {new Date(ticket.seller.createdAt).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Card de Compra */}
          <div className="lg:col-span-1">
            <div className="bg-[#0F2A44] rounded-2xl p-6 border border-white/5 sticky top-20">
              {/* Preco */}
              <div className="mb-6">
                {ticket.originalPrice && ticket.originalPrice > ticket.price && (
                  <p className="text-gray-500 line-through text-lg">
                    {formatPrice(ticket.originalPrice)}
                  </p>
                )}
                <p className="text-4xl font-bold text-white">
                  {formatPrice(ticket.price)}
                </p>
                {discount > 0 && (
                  <p className="text-[#16C784] text-sm mt-1">
                    Voce economiza {formatPrice(ticket.originalPrice! - ticket.price)}
                  </p>
                )}
              </div>

              {/* Detalhes do valor */}
              <div className="border-t border-white/5 pt-4 mb-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Valor do ingresso</span>
                  <span className="text-white">{formatPrice(ticket.price)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Taxa de servico</span>
                  <span className="text-gray-500">Inclusa</span>
                </div>
                <div className="border-t border-white/5 pt-3 flex justify-between">
                  <span className="font-semibold text-white">Total</span>
                  <span className="font-bold text-white text-xl">{formatPrice(ticket.price)}</span>
                </div>
              </div>

              {/* Botao de Acao */}
              {isOwner ? (
                <div className="bg-[#1A3A5C] p-4 rounded-xl text-center">
                  <p className="text-gray-300 text-sm">
                    Este e seu ingresso
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    Aguardando compradores
                  </p>
                </div>
              ) : !session ? (
                <div className="space-y-3">
                  <Link
                    href="/login"
                    className="block w-full btn-gradient text-white text-center py-4 rounded-xl font-semibold hover:opacity-90 transition"
                  >
                    Entrar para comprar
                  </Link>
                  <p className="text-xs text-gray-500 text-center">
                    Voce precisa estar logado para comprar
                  </p>
                </div>
              ) : !isAvailable ? (
                <div className="bg-[#1A3A5C] p-4 rounded-xl text-center">
                  <p className="text-gray-300 text-sm">
                    Este ingresso nao esta mais disponivel
                  </p>
                </div>
              ) : (
                <BuyButton ticketId={ticket.id} price={ticket.price} />
              )}

              {/* Seguranca */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-[#16C784]/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#16C784]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <span className="text-gray-400">Pagamento protegido (escrow)</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-[#2DFF88]/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#2DFF88]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <span className="text-gray-400">Contato via WhatsApp</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-[#FF8A00]/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#FF8A00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <span className="text-gray-400">Suporte em disputas</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
