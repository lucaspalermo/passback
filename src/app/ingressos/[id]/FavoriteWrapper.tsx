"use client";

import FavoriteButton from "@/components/FavoriteButton";

interface FavoriteWrapperProps {
  ticketId: string;
}

export default function FavoriteWrapper({ ticketId }: FavoriteWrapperProps) {
  return <FavoriteButton ticketId={ticketId} size="md" />;
}
