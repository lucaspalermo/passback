"use client";

import { useIdentity } from "../hooks/useIdentity";

interface VerificationStatusProps {
  onStartVerification?: () => void;
}

export function VerificationStatus({ onStartVerification }: VerificationStatusProps) {
  const { status, loading } = useIdentity();

  if (loading) {
    return (
      <div className="bg-[#0F2A44] rounded-xl p-4 animate-pulse">
        <div className="h-4 bg-[#1A3A5C] rounded w-1/3 mb-2" />
        <div className="h-3 bg-[#1A3A5C] rounded w-2/3" />
      </div>
    );
  }

  if (!status || status.isVerified) {
    return (
      <div className="bg-[#16C784]/10 border border-[#16C784]/20 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#16C784]/20 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-[#16C784]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div>
            <h4 className="font-medium text-[#16C784]">Identidade Verificada</h4>
            <p className="text-sm text-gray-400">Sua conta está verificada</p>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = {
    pending: {
      color: "yellow",
      icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
      title: "Aguardando Análise",
      description: "Seus documentos estão na fila de verificação.",
    },
    under_review: {
      color: "blue",
      icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
      title: "Em Análise",
      description: "Nossa equipe está analisando seus documentos.",
    },
    approved: {
      color: "green",
      icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
      title: "Verificação Aprovada",
      description: "Sua identidade foi verificada com sucesso.",
    },
    rejected: {
      color: "red",
      icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
      title: "Documentos Rejeitados",
      description: status.verification?.rejectionReason || "Envie novos documentos.",
    },
    expired: {
      color: "orange",
      icon: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      title: "Verificação Expirada",
      description: "Sua verificação expirou. Envie novos documentos.",
    },
  };

  const config = statusConfig[status.status || "pending"];
  const colorClasses = {
    yellow: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400",
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    green: "bg-[#16C784]/10 border-[#16C784]/20 text-[#16C784]",
    red: "bg-red-500/10 border-red-500/20 text-red-400",
    orange: "bg-orange-500/10 border-orange-500/20 text-orange-400",
  };

  return (
    <div className={`rounded-xl p-4 border ${colorClasses[config.color as keyof typeof colorClasses]}`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full bg-current/20 flex items-center justify-center flex-shrink-0`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="font-medium">{config.title}</h4>
          <p className="text-sm opacity-80 mt-1">{config.description}</p>

          {(status.status === "rejected" || status.status === "expired" || !status.status) && onStartVerification && (
            <button
              onClick={onStartVerification}
              className="mt-3 px-4 py-2 bg-[#16C784] hover:bg-[#14b576] text-white text-sm font-medium rounded-lg transition-colors"
            >
              {status.status ? "Enviar novos documentos" : "Iniciar verificação"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
