"use client";

import { useState } from "react";
import { RatingInput } from "./Rating";

interface ReviewFormProps {
  transactionId: string;
  userToReview: { id: string; name: string };
  eventName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({
  transactionId,
  userToReview,
  eventName,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Selecione uma avaliacao");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/modules/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId,
          rating,
          comment: comment.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao enviar avaliacao");
        return;
      }

      onSuccess?.();
    } catch {
      setError("Erro ao enviar avaliacao");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#0F2A44] rounded-xl p-6">
      <h3 className="text-lg font-medium text-white mb-2">
        Avaliar {userToReview.name}
      </h3>
      <p className="text-sm text-gray-400 mb-6">
        Como foi sua experiencia com a transacao de <strong>{eventName}</strong>?
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center">
          <RatingInput value={rating} onChange={setRating} />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Comentario (opcional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Conte como foi sua experiencia..."
            className="w-full bg-[#1A3A5C] border border-white/10 rounded-xl px-4 py-3 text-white resize-none"
            rows={3}
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1 text-right">
            {comment.length}/500
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 bg-[#1A3A5C] hover:bg-[#1A3A5C]/80 text-white font-medium rounded-xl transition-colors"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={submitting || rating === 0}
            className="flex-1 py-3 bg-[#16C784] hover:bg-[#14b576] disabled:opacity-50 text-white font-medium rounded-xl transition-colors"
          >
            {submitting ? "Enviando..." : "Enviar Avaliacao"}
          </button>
        </div>
      </form>
    </div>
  );
}
