"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface FavoriteTicket {
  id: string;
  ticketId: string;
  ticket: {
    id: string;
    eventName: string;
    eventDate: string;
    eventLocation: string;
    ticketType: string;
    price: number;
    status: string;
    imageUrl: string | null;
  };
}

export default function FavoritosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      loadFavorites();
    }
  }, [session]);

  const loadFavorites = async () => {
    try {
      const response = await fetch("/api/modules/favorites");
      const data = await response.json();
      setFavorites(data.favorites || []);
    } catch (error) {
      console.error("Erro ao carregar favoritos:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (ticketId: string) => {
    try {
      await fetch("/api/modules/favorites/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId }),
      });
      setFavorites((prev) => prev.filter((f) => f.ticketId !== ticketId));
    } catch (error) {
      console.error("Erro ao remover favorito:", error);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#0B1F33] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#16C784] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1F33] py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-white mb-2">Meus Favoritos</h1>
        <p className="text-gray-400 mb-8">Ingressos que você salvou para comprar depois</p>

        {favorites.length === 0 ? (
          <div className="bg-[#0F2A44] rounded-xl p-12 text-center">
            <svg
              className="w-20 h-20 mx-auto text-gray-600 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <p className="text-gray-400 text-lg mb-2">Nenhum favorito ainda</p>
            <p className="text-gray-500 mb-6">
              Explore ingressos e clique no coração para salvar
            </p>
            <Link
              href="/ingressos"
              className="inline-block px-6 py-3 bg-[#16C784] hover:bg-[#14b576] text-white font-medium rounded-xl transition-colors"
            >
              Explorar Ingressos
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {favorites.map((fav) => (
              <div
                key={fav.id}
                className="bg-[#0F2A44] rounded-xl p-4 flex items-center gap-4"
              >
                {/* Imagem */}
                <div className="w-20 h-20 rounded-lg bg-[#1A3A5C] flex-shrink-0 overflow-hidden">
                  {fav.ticket.imageUrl ? (
                    <img
                      src={fav.ticket.imageUrl}
                      alt={fav.ticket.eventName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white truncate">{fav.ticket.eventName}</h3>
                  <p className="text-sm text-gray-400">{fav.ticket.ticketType}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(fav.ticket.eventDate)} • {fav.ticket.eventLocation}
                  </p>
                </div>

                {/* Preço e Ações */}
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-[#16C784]">
                    {formatPrice(fav.ticket.price)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {fav.ticket.status === "available" ? (
                      <Link
                        href={`/ingressos/${fav.ticket.id}`}
                        className="px-3 py-1.5 bg-[#16C784] hover:bg-[#14b576] text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Comprar
                      </Link>
                    ) : (
                      <span className="px-3 py-1.5 bg-gray-600 text-gray-300 text-sm rounded-lg">
                        Indisponível
                      </span>
                    )}
                    <button
                      onClick={() => removeFavorite(fav.ticketId)}
                      className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Remover dos favoritos"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
