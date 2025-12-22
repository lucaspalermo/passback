"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface FavoriteButtonProps {
  ticketId: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function FavoriteButton({ ticketId, size = "md", className = "" }: FavoriteButtonProps) {
  const { data: session } = useSession();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  const sizeClasses = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-11 h-11",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  useEffect(() => {
    if (session?.user) {
      checkFavoriteStatus();
    }
  }, [session, ticketId]);

  const checkFavoriteStatus = async () => {
    try {
      const response = await fetch(`/api/modules/favorites/check?ticketId=${ticketId}`);
      const data = await response.json();
      setIsFavorite(data.isFavorite);
    } catch (error) {
      console.error("Erro ao verificar favorito:", error);
    }
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/modules/favorites/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId }),
      });
      const data = await response.json();
      setIsFavorite(data.isFavorite);
    } catch (error) {
      console.error("Erro ao atualizar favorito:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!session?.user) {
    return null;
  }

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center transition-all ${
        isFavorite
          ? "bg-red-500 text-white hover:bg-red-600"
          : "bg-black/40 backdrop-blur-sm text-white hover:bg-black/60"
      } ${loading ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
    >
      <svg
        className={`${iconSizes[size]} ${loading ? "animate-pulse" : ""}`}
        fill={isFavorite ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>
  );
}
