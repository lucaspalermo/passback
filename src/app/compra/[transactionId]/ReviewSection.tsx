"use client";

import { useState, useEffect } from "react";
import { RatingInput, RatingStars } from "@/components/Rating";

interface ReviewSectionProps {
  transactionId: string;
  userToReview: { id: string; name: string };
  eventName: string;
}

interface ReviewCheckResult {
  canReview: boolean;
  reason?: string;
  existingReview?: {
    rating: number;
    comment: string | null;
    createdAt: string;
  };
}

export default function ReviewSection({
  transactionId,
  userToReview,
  eventName,
}: ReviewSectionProps) {
  const [checkResult, setCheckResult] = useState<ReviewCheckResult | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    checkReviewStatus();
  }, [transactionId]);

  const checkReviewStatus = async () => {
    try {
      const response = await fetch(
        `/api/modules/reviews/check?transactionId=${transactionId}`
      );
      const data = await response.json();
      setCheckResult(data);
    } catch {
      console.error("Erro ao verificar status de avaliacao");
    }
  };

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

      setSuccess(true);
      setShowForm(false);
      checkReviewStatus();
    } catch {
      setError("Erro ao enviar avaliacao");
    } finally {
      setSubmitting(false);
    }
  };

  // Ainda carregando
  if (checkResult === null) {
    return null;
  }

  // Ja avaliou
  if (checkResult.existingReview) {
    return (
      <div className="bg-[#0F2A44] rounded-xl p-6 border border-white/5">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#16C784]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Sua avaliacao
        </h3>
        <div className="flex items-center gap-3 mb-2">
          <RatingStars rating={checkResult.existingReview.rating} />
          <span className="text-gray-400 text-sm">
            {new Date(checkResult.existingReview.createdAt).toLocaleDateString("pt-BR")}
          </span>
        </div>
        {checkResult.existingReview.comment && (
          <p className="text-gray-300 text-sm mt-2">
            "{checkResult.existingReview.comment}"
          </p>
        )}
      </div>
    );
  }

  // Nao pode avaliar
  if (!checkResult.canReview) {
    return null;
  }

  // Sucesso
  if (success) {
    return (
      <div className="bg-[#16C784]/10 border border-[#16C784]/20 p-4 rounded-xl">
        <div className="flex items-center gap-2 text-[#16C784]">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">Avaliacao enviada com sucesso!</span>
        </div>
      </div>
    );
  }

  // Formulario
  if (showForm) {
    return (
      <div className="bg-[#0F2A44] rounded-xl p-6 border border-white/5">
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
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 py-3 bg-[#1A3A5C] hover:bg-[#1A3A5C]/80 text-white font-medium rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || rating === 0}
              className="flex-1 py-3 bg-[#16C784] hover:bg-[#14b576] disabled:opacity-50 text-white font-medium rounded-xl transition-colors"
            >
              {submitting ? "Enviando..." : "Enviar"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Botao para avaliar
  return (
    <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 p-4 rounded-xl">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-white mb-1 flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Avalie {userToReview.name}
          </h4>
          <p className="text-sm text-gray-400">
            Sua opiniao ajuda outros usuarios
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-lg transition-colors"
        >
          Avaliar
        </button>
      </div>
    </div>
  );
}
