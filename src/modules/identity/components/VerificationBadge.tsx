"use client";

import { useIdentity } from "../hooks/useIdentity";

interface VerificationBadgeProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

/**
 * Badge de verificação para exibir no perfil do usuário
 */
export function VerificationBadge({
  size = "md",
  showText = true,
}: VerificationBadgeProps) {
  const { status, loading } = useIdentity();

  if (loading || !status?.isVerified) {
    return null;
  }

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className="flex items-center gap-1.5">
      <svg
        className={`${sizeClasses[size]} text-[#16C784]`}
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 2L3.5 6.5v5.09c0 5.05 3.41 9.76 8.5 10.91 5.09-1.15 8.5-5.86 8.5-10.91V6.5L12 2zm-1 14.59L7 12.6l1.41-1.41L11 13.76l4.59-4.59L17 10.6l-6 6z" />
      </svg>
      {showText && (
        <span className={`${textSizes[size]} text-[#16C784] font-medium`}>
          Verificado
        </span>
      )}
    </div>
  );
}
