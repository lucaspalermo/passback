"use client";

import { useState, useEffect } from "react";

interface EntryQrCodeProps {
  transactionId: string;
  eventName: string;
  ticketType: string;
  eventDate: Date | string;
}

export function EntryQrCodeDisplay({
  transactionId,
  eventName,
  ticketType,
  eventDate,
}: EntryQrCodeProps) {
  const [code, setCode] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadQrCode() {
      try {
        const response = await fetch(`/api/modules/entry-qr?transactionId=${transactionId}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Erro ao carregar QR Code");
          return;
        }

        if (data.qrCode) {
          setCode(data.qrCode.code);
        }
      } catch {
        setError("Erro ao carregar QR Code");
      } finally {
        setLoading(false);
      }
    }

    loadQrCode();
  }, [transactionId]);

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Gera URL do QR code usando API externa
  const qrCodeUrl = code
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(code)}`
    : "";

  if (loading) {
    return (
      <div className="bg-[#0F2A44] rounded-xl p-6 animate-pulse">
        <div className="w-48 h-48 bg-[#1A3A5C] rounded-xl mx-auto" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0F2A44] rounded-xl p-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-medium text-white">{eventName}</h3>
        <p className="text-sm text-gray-400">{ticketType}</p>
        <p className="text-xs text-gray-500 mt-1">{formatDate(eventDate)}</p>
      </div>

      {/* QR Code */}
      <div className="bg-white rounded-xl p-4 mb-4">
        <img
          src={qrCodeUrl}
          alt="QR Code de Entrada"
          className="mx-auto w-48 h-48"
        />
      </div>

      {/* Código manual */}
      <div className="text-center">
        <p className="text-xs text-gray-500 mb-1">Código de entrada</p>
        <p className="font-mono text-lg text-[#16C784] tracking-wider">{code}</p>
      </div>

      <div className="mt-4 p-3 bg-[#16C784]/10 border border-[#16C784]/20 rounded-lg">
        <p className="text-xs text-[#16C784] text-center">
          Apresente este QR Code na entrada do evento
        </p>
      </div>
    </div>
  );
}
