"use client";

import { useState, useEffect, useCallback } from "react";
import type { UserVerificationStatus, DocumentType } from "../types";

interface UseIdentityReturn {
  status: UserVerificationStatus | null;
  loading: boolean;
  submitting: boolean;
  error: string | null;
  loadStatus: () => Promise<void>;
  submitVerification: (data: SubmitData) => Promise<boolean>;
}

interface SubmitData {
  documentType: DocumentType;
  documentNumber?: string;
  documentFrontUrl: string;
  documentBackUrl?: string;
  selfieUrl: string;
}

export function useIdentity(): UseIdentityReturn {
  const [status, setStatus] = useState<UserVerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/modules/identity");
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao carregar status");
        return;
      }

      setStatus(data);
    } catch (err) {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }, []);

  const submitVerification = useCallback(
    async (data: SubmitData): Promise<boolean> => {
      setSubmitting(true);
      setError(null);

      try {
        const response = await fetch("/api/modules/identity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          setError(result.error || "Erro ao enviar documentos");
          return false;
        }

        // Recarrega status
        await loadStatus();
        return true;
      } catch (err) {
        setError("Erro de conexão");
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [loadStatus]
  );

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  return {
    status,
    loading,
    submitting,
    error,
    loadStatus,
    submitVerification,
  };
}
