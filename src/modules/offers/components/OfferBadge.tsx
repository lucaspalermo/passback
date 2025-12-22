"use client";

import { useState, useEffect } from "react";

interface OfferBadgeProps {
  ticketId: string;
  sellerId: string;
  currentUserId?: string;
}

export default function OfferBadge({ ticketId, sellerId, currentUserId }: OfferBadgeProps) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOfferCount() {
      try {
        const response = await fetch(`/api/modules/offers/ticket?ticketId=${ticketId}`);
        if (response.ok) {
          const data = await response.json();
          setCount(data.offers?.length || 0);
        }
      } catch (error) {
        console.error("Erro ao carregar ofertas:", error);
      } finally {
        setLoading(false);
      }
    }

    loadOfferCount();
  }, [ticketId]);

  // Só mostra para o vendedor
  if (currentUserId !== sellerId || loading || count === 0) {
    return null;
  }

  return (
    <div className="absolute top-2 left-2 px-2 py-1 bg-yellow-500 text-black text-xs font-bold rounded-full flex items-center gap-1">
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
        />
      </svg>
      {count} {count === 1 ? "oferta" : "ofertas"}
    </div>
  );
}
