import Link from "next/link";
import FavoriteButton from "./FavoriteButton";

interface TicketCardProps {
  id: string;
  eventName: string;
  eventDate: Date | string;
  eventLocation: string;
  ticketType: string;
  price: number;
  originalPrice?: number | null;
  imageUrl?: string | null;
  seller?: {
    name: string;
  };
}

export default function TicketCard({
  id,
  eventName,
  eventDate,
  eventLocation,
  ticketType,
  price,
  originalPrice,
  imageUrl,
}: TicketCardProps) {
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const day = d.getDate();
    const month = d.toLocaleDateString("pt-BR", { month: "short" }).toUpperCase();
    return { day, month };
  };

  const formatTime = (date: Date | string) => {
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

  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const { day, month } = formatDate(eventDate);

  // Gera uma cor de gradiente baseada no nome do evento
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
    <Link href={`/ingressos/${id}`} className="block group">
      <div className="bg-[#0F2A44] rounded-2xl overflow-hidden card-hover border border-white/5">
        {/* Imagem/Header do Card */}
        <div className={`relative h-40 ${!imageUrl ? `bg-gradient-to-br ${getGradient(eventName)}` : ""} p-4`}>
          {/* Imagem de fundo se existir */}
          {imageUrl && (
            <img
              src={imageUrl}
              alt={eventName}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* Overlay escuro para legibilidade */}
          {imageUrl && <div className="absolute inset-0 bg-black/40" />}

          {/* Favoritos e Badge de desconto */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
            <FavoriteButton ticketId={id} size="sm" />
            {discount > 0 && (
              <span className="discount-badge px-2.5 py-1 rounded-full text-xs font-bold text-white">
                -{discount}%
              </span>
            )}
          </div>

          {/* Badge de tipo */}
          <div className="absolute bottom-3 left-3 z-10">
            <span className="bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-white">
              {ticketType}
            </span>
          </div>

          {/* Icone do evento (apenas se nao tiver imagem) */}
          {!imageUrl && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20">
              <svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
          )}
        </div>

        {/* Conteudo do Card */}
        <div className="p-4">
          {/* Data e Hora */}
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-[#1A3A5C] rounded-lg px-3 py-2 text-center min-w-[50px]">
              <span className="block text-[#16C784] font-bold text-lg leading-none">{day}</span>
              <span className="block text-gray-400 text-xs mt-0.5">{month}</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white line-clamp-2 group-hover:text-[#16C784] transition-colors">
                {eventName}
              </h3>
            </div>
          </div>

          {/* Localizacao */}
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="line-clamp-1">{eventLocation}</span>
          </div>

          {/* Horario */}
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{formatTime(eventDate)}</span>
          </div>

          {/* Preco */}
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div>
              {originalPrice && originalPrice > price && (
                <span className="text-gray-500 line-through text-sm block">
                  {formatPrice(originalPrice)}
                </span>
              )}
              <span className="text-xl font-bold text-white">
                {formatPrice(price)}
              </span>
            </div>
            <div className="bg-[#16C784]/10 text-[#16C784] px-4 py-2 rounded-lg font-semibold text-sm group-hover:bg-[#16C784] group-hover:text-white transition-all">
              Comprar
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
