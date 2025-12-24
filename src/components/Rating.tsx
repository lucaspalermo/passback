"use client";

import { useState } from "react";

interface RatingStarsProps {
  rating: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
}

export function RatingStars({ rating, size = "md", showValue = false }: RatingStarsProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const textClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating ? "text-yellow-400" : "text-gray-600"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      {showValue && (
        <span className={`${textClasses[size]} text-gray-400 ml-1`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

interface RatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  size?: "md" | "lg";
}

export function RatingInput({ value, onChange, size = "lg" }: RatingInputProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  const labels = ["", "Pessimo", "Ruim", "Regular", "Bom", "Excelente"];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="transition-transform hover:scale-110"
          >
            <svg
              className={`${sizeClasses[size]} ${
                star <= (hoverRating || value)
                  ? "text-yellow-400"
                  : "text-gray-600"
              } transition-colors`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
      {(hoverRating || value) > 0 && (
        <span className="text-sm text-gray-400">
          {labels[hoverRating || value]}
        </span>
      )}
    </div>
  );
}

interface RatingBadgeProps {
  rating: number;
  reviewCount: number;
  size?: "sm" | "md";
}

export function RatingBadge({ rating, reviewCount, size = "md" }: RatingBadgeProps) {
  if (reviewCount === 0) {
    return (
      <span className="text-gray-500 text-sm">Sem avaliacoes</span>
    );
  }

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
  };

  const starSize = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
  };

  return (
    <div className={`flex items-center gap-1.5 bg-yellow-500/20 rounded-full ${sizeClasses[size]}`}>
      <svg
        className={`${starSize[size]} text-yellow-400`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      <span className="text-yellow-400 font-medium">{rating.toFixed(1)}</span>
      <span className="text-gray-400">({reviewCount})</span>
    </div>
  );
}
