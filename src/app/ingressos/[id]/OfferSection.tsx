"use client";

import { useEffect, useState } from "react";
import MakeOfferButton from "@/modules/offers/components/MakeOfferButton";

interface OfferSectionProps {
  ticketId: string;
  ticketPrice: number;
  sellerId: string;
}

// Verifica se o módulo está habilitado
function isOffersEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MODULE_OFFERS === "true";
}

export default function OfferSection({ ticketId, ticketPrice, sellerId }: OfferSectionProps) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(isOffersEnabled());
  }, []);

  if (!enabled) {
    return null;
  }

  return (
    <div className="mt-4">
      <MakeOfferButton
        ticketId={ticketId}
        ticketPrice={ticketPrice}
        sellerId={sellerId}
        minOfferPercentage={50}
      />
    </div>
  );
}
