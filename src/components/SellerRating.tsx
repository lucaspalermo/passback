"use client";

import { useState, useEffect } from "react";
import { RatingStars, RatingBadge } from "./Rating";

interface SellerRatingProps {
  sellerId: string;
  showDetails?: boolean;
}

interface RatingStats {
  averageRating: number;
  totalReviews: number;
  positivePercentage: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  recentReviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    reviewer: { name: string; image?: string | null };
    eventName: string;
  }>;
}

export function SellerRatingBadge({ sellerId }: SellerRatingProps) {
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/modules/reviews/stats/${sellerId}`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch {
        console.error("Erro ao buscar avaliacoes");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [sellerId]);

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-600/20 rounded-full h-6 w-20" />
    );
  }

  if (!stats || stats.totalReviews === 0) {
    return (
      <span className="text-gray-500 text-xs">Novo vendedor</span>
    );
  }

  return (
    <RatingBadge
      rating={stats.averageRating}
      reviewCount={stats.totalReviews}
      size="sm"
    />
  );
}

export function SellerRatingFull({ sellerId }: SellerRatingProps) {
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/modules/reviews/stats/${sellerId}`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch {
        console.error("Erro ao buscar avaliacoes");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [sellerId]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-6 bg-gray-600/20 rounded w-1/2" />
        <div className="h-4 bg-gray-600/20 rounded w-3/4" />
      </div>
    );
  }

  if (!stats || stats.totalReviews === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-400 text-sm">Este vendedor ainda nao tem avaliacoes</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="flex items-center gap-4">
        <div className="text-center">
          <p className="text-3xl font-bold text-white">{stats.averageRating}</p>
          <RatingStars rating={stats.averageRating} size="sm" />
          <p className="text-xs text-gray-400 mt-1">{stats.totalReviews} avaliacoes</p>
        </div>

        {/* Barra de distribuicao */}
        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = stats.distribution[star as keyof typeof stats.distribution];
            const percentage = (count / stats.totalReviews) * 100;
            return (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="text-gray-400 w-3">{star}</span>
                <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-gray-500 w-8">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Porcentagem positiva */}
      <div className="flex items-center gap-2 text-sm">
        <svg className="w-4 h-4 text-[#16C784]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-gray-300">
          <strong className="text-[#16C784]">{stats.positivePercentage}%</strong> avaliacoes positivas
        </span>
      </div>

      {/* Ultimas avaliacoes */}
      {stats.recentReviews.length > 0 && (
        <div className="space-y-3 pt-3 border-t border-white/5">
          <p className="text-sm font-medium text-gray-400">Ultimas avaliacoes</p>
          {stats.recentReviews.map((review) => (
            <div key={review.id} className="bg-[#1A3A5C]/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-white">{review.reviewer.name}</span>
                <RatingStars rating={review.rating} size="sm" />
              </div>
              <p className="text-xs text-gray-500 mb-1">{review.eventName}</p>
              {review.comment && (
                <p className="text-sm text-gray-300">"{review.comment}"</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
