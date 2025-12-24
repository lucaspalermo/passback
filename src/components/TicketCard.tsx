"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import FavoriteButton from "./FavoriteButton";
import TicketCardButtons from "./TicketCardButtons";
import { useState } from "react";

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
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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
      <motion.div
        className="bg-[#0F2A44] rounded-2xl overflow-hidden border border-white/5 relative"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* Glow effect on hover */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{
            opacity: isHovered ? 1 : 0,
            boxShadow: isHovered
              ? "0 0 30px rgba(22, 199, 132, 0.3), 0 20px 40px rgba(0, 0, 0, 0.3)"
              : "none"
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Imagem/Header do Card */}
        <div className={`relative h-40 ${!imageUrl ? `bg-gradient-to-br ${getGradient(eventName)}` : ""} overflow-hidden`}>
          {imageUrl && (
            <>
              {/* Placeholder shimmer enquanto carrega */}
              {!imageLoaded && (
                <div className="absolute inset-0 bg-[#1A3A5C]">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                </div>
              )}
              <motion.img
                src={imageUrl}
                alt={eventName}
                className="absolute inset-0 w-full h-full object-cover"
                onLoad={() => setImageLoaded(true)}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{
                  opacity: imageLoaded ? 1 : 0,
                  scale: isHovered ? 1.1 : 1
                }}
                transition={{ duration: 0.5 }}
              />
            </>
          )}

          {imageUrl && <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />}

          {/* Favoritos e Badge de desconto */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
            <FavoriteButton ticketId={id} size="sm" />
            {discount > 0 && (
              <motion.span
                className="bg-gradient-to-r from-red-500 to-orange-500 px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-lg"
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                whileHover={{ scale: 1.1 }}
              >
                -{discount}%
              </motion.span>
            )}
          </div>

          {/* Badge de tipo */}
          <motion.div
            className="absolute bottom-3 left-3 z-10"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <span className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium text-white border border-white/10">
              {ticketType}
            </span>
          </motion.div>

          {!imageUrl && (
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20"
              animate={{
                rotate: isHovered ? 360 : 0,
                scale: isHovered ? 1.1 : 1
              }}
              transition={{ duration: 0.8 }}
            >
              <svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </motion.div>
          )}
        </div>

        {/* Conteudo do Card */}
        <div className="p-4 relative">
          {/* Data e Hora */}
          <div className="flex items-center gap-3 mb-3">
            <motion.div
              className="bg-[#1A3A5C] rounded-lg px-3 py-2 text-center min-w-[50px]"
              whileHover={{ scale: 1.05, backgroundColor: "#16C784" }}
              transition={{ duration: 0.2 }}
            >
              <span className="block text-[#16C784] group-hover:text-white font-bold text-lg leading-none transition-colors">
                {day}
              </span>
              <span className="block text-gray-400 group-hover:text-white/80 text-xs mt-0.5 transition-colors">
                {month}
              </span>
            </motion.div>
            <div className="flex-1">
              <h3 className="font-semibold text-white line-clamp-2 group-hover:text-[#16C784] transition-colors duration-300">
                {eventName}
              </h3>
            </div>
          </div>

          {/* Localizacao */}
          <motion.div
            className="flex items-center gap-2 text-gray-400 text-sm mb-3"
            initial={{ opacity: 0.8 }}
            whileHover={{ opacity: 1, x: 2 }}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="line-clamp-1">{eventLocation}</span>
          </motion.div>

          {/* Horario */}
          <motion.div
            className="flex items-center gap-2 text-gray-400 text-sm mb-4"
            initial={{ opacity: 0.8 }}
            whileHover={{ opacity: 1, x: 2 }}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{formatTime(eventDate)}</span>
          </motion.div>

          {/* Preco */}
          <div className="pt-3 border-t border-white/5">
            <div className="flex items-center justify-between mb-3">
              <div>
                {originalPrice && originalPrice > price && (
                  <motion.span
                    className="text-gray-500 line-through text-sm block"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {formatPrice(originalPrice)}
                  </motion.span>
                )}
                <motion.span
                  className="text-xl font-bold text-white"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  whileHover={{ scale: 1.05, color: "#16C784" }}
                  transition={{ duration: 0.2 }}
                >
                  {formatPrice(price)}
                </motion.span>
              </div>
            </div>
            <TicketCardButtons
              ticketId={id}
              price={price}
              eventName={eventName}
            />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
