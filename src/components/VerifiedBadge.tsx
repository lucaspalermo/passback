"use client";

interface VerifiedBadgeProps {
  level: "none" | "basic" | "verified" | "trusted";
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function VerifiedBadge({ level, showLabel = false, size = "md" }: VerifiedBadgeProps) {
  if (level === "none") return null;

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const labelClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const config = {
    basic: {
      bg: "bg-yellow-500",
      text: "text-yellow-500",
      label: "Basico",
      icon: (
        <svg className={sizeClasses[size]} viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    verified: {
      bg: "bg-blue-500",
      text: "text-blue-500",
      label: "Verificado",
      icon: (
        <svg className={sizeClasses[size]} viewBox="0 0 24 24" fill="currentColor">
          <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
        </svg>
      ),
    },
    trusted: {
      bg: "bg-[#16C784]",
      text: "text-[#16C784]",
      label: "Confiavel",
      icon: (
        <svg className={sizeClasses[size]} viewBox="0 0 24 24" fill="currentColor">
          <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 00-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08zm3.094 8.016a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
        </svg>
      ),
    },
  };

  const currentConfig = config[level];

  return (
    <div className={`flex items-center gap-1 ${currentConfig.text}`} title={currentConfig.label}>
      {currentConfig.icon}
      {showLabel && (
        <span className={`font-medium ${labelClasses[size]}`}>
          {currentConfig.label}
        </span>
      )}
    </div>
  );
}

// Componente para buscar e exibir o badge de um usuario
interface UserVerifiedBadgeProps {
  userId: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function UserVerifiedBadge({ userId, showLabel = false, size = "md" }: UserVerifiedBadgeProps) {
  // Este componente seria usado com SWR ou React Query para buscar o status
  // Por simplicidade, retorna null - o badge deve ser passado diretamente
  return null;
}

// Helper para determinar o nivel de verificacao
export function getVerificationLevel(verifications: {
  email?: boolean;
  cpf?: boolean;
  phone?: boolean;
  identity?: boolean;
}): "none" | "basic" | "verified" | "trusted" {
  let count = 0;
  if (verifications.email) count++;
  if (verifications.cpf) count++;
  if (verifications.phone) count++;
  if (verifications.identity) count++;

  if (count >= 3) return "trusted";
  if (count >= 2) return "verified";
  if (count >= 1) return "basic";
  return "none";
}
