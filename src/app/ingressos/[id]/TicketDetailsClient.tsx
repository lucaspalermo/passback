"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface TicketDetailsClientProps {
  children: ReactNode;
}

export function HeroSection({
  children,
  hasImage,
  gradient
}: {
  children: ReactNode;
  hasImage: boolean;
  gradient: string;
}) {
  return (
    <motion.div
      className={`relative h-64 md:h-80 ${!hasImage ? `bg-gradient-to-br ${gradient}` : ""}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
}

export function ContentCard({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={`bg-[#0F2A44] rounded-2xl p-6 border border-white/5 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  );
}

export function SidebarCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={`bg-[#0F2A44] rounded-2xl p-6 border border-white/5 sticky top-20 ${className}`}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedBadge({
  children,
  variant = "success",
}: {
  children: ReactNode;
  variant?: "success" | "gray" | "discount";
}) {
  const colors = {
    success: "bg-[#16C784]",
    gray: "bg-gray-500",
    discount: "discount-badge",
  };

  return (
    <motion.span
      className={`${colors[variant]} text-white px-4 py-2 rounded-full text-sm font-medium`}
      initial={{ scale: 0, rotate: -10 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
    >
      {children}
    </motion.span>
  );
}

export function BackButton({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ x: -3 }}
    >
      {children}
    </motion.div>
  );
}

export function InfoCard({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      className="flex items-start gap-4 bg-[#1A3A5C]/50 rounded-xl p-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.02, backgroundColor: "rgba(26, 58, 92, 0.7)" }}
    >
      {children}
    </motion.div>
  );
}

export function SecurityItem({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      className="flex items-center gap-3 text-sm"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ x: 3 }}
    >
      {children}
    </motion.div>
  );
}

export function PriceDisplay({
  price,
  originalPrice,
  discount,
}: {
  price: number;
  originalPrice?: number | null;
  discount: number;
}) {
  const formatPrice = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  return (
    <motion.div
      className="mb-6"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      {originalPrice && originalPrice > price && (
        <motion.p
          className="text-gray-500 line-through text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {formatPrice(originalPrice)}
        </motion.p>
      )}
      <motion.p
        className="text-4xl font-bold text-white"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, delay: 0.4 }}
      >
        {formatPrice(price)}
      </motion.p>
      {discount > 0 && (
        <motion.p
          className="text-[#16C784] text-sm mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Voce economiza {formatPrice(originalPrice! - price)}
        </motion.p>
      )}
    </motion.div>
  );
}

export function TicketIcon() {
  return (
    <motion.div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10"
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
    >
      <svg className="w-48 h-48 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
      </svg>
    </motion.div>
  );
}

export function PageWrapper({ children }: TicketDetailsClientProps) {
  return (
    <motion.div
      className="min-h-screen bg-[#0B1F33]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
