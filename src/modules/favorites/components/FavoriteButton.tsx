"use client";

import { useState, useEffect } from "react";

interface FavoriteButtonProps {
  ticketId: string;
  initialFavorite?: boolean;
  size?: "sm" | "md" | "lg";
  onToggle?: (isFavorite: boolean) => void;
}

export function FavoriteButton({
  ticketId,
  initialFavorite = false,
  size = "md",
  onToggle,
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsFavorite(initialFavorite);
  }, [initialFavorite]);

  const handleToggle = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/modules/favorites/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsFavorite(data.isFavorite);
        onToggle?.(data.isFavorite);
      }
    } catch {
      // Silencia erro
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center transition-all ${
        isFavorite
          ? "bg-red-500/20 text-red-500"
          : "bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white"
      } ${loading ? "opacity-50" : ""}`}
      title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
    >
      <svg
        className={iconSizes[size]}
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
