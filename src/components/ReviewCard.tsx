"use client";

import { RatingStars } from "./Rating";

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    reviewer: {
      name: string;
      image?: string | null;
    };
    eventName: string;
  };
}

export function ReviewCard({ review }: ReviewCardProps) {
  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

    if (seconds < 60) return "agora";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d`;
    if (seconds < 31536000) return `${Math.floor(seconds / 2592000)}m`;
    return `${Math.floor(seconds / 31536000)}a`;
  };

  return (
    <div className="bg-[#0F2A44] rounded-xl p-4">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-[#1A3A5C] flex items-center justify-center flex-shrink-0">
          {review.reviewer.image ? (
            <img
              src={review.reviewer.image}
              alt={review.reviewer.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-lg font-medium text-gray-400">
              {review.reviewer.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-white truncate">
              {review.reviewer.name}
            </span>
            <span className="text-xs text-gray-500 flex-shrink-0">
              {timeAgo(review.createdAt)}
            </span>
          </div>

          {/* Rating */}
          <div className="mt-1">
            <RatingStars rating={review.rating} size="sm" />
          </div>

          {/* Event */}
          <p className="text-xs text-gray-500 mt-1">
            {review.eventName}
          </p>

          {/* Comment */}
          {review.comment && (
            <p className="text-sm text-gray-300 mt-2">
              {review.comment}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface ReviewsListProps {
  userId: string;
}

export function ReviewsList({ userId }: ReviewsListProps) {
  // Este componente buscaria as avaliacoes via API
  // Por ora, retorna placeholder
  return (
    <div className="space-y-3">
      <p className="text-gray-400 text-center py-4">
        Carregando avaliacoes...
      </p>
    </div>
  );
}
