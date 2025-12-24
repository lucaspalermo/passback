"use client";

import { motion, HTMLMotionProps, Variants } from "framer-motion";
import { ReactNode } from "react";

// ============================================
// Variantes de animacao reutilizaveis
// ============================================

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

// ============================================
// Componentes de animacao
// ============================================

interface MotionDivProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
}

// Fade In com direcao
export function FadeIn({
  children,
  direction = "up",
  delay = 0,
  className,
  ...props
}: MotionDivProps & { direction?: "up" | "down" | "left" | "right"; delay?: number }) {
  const variants = {
    up: fadeInUp,
    down: fadeInDown,
    left: fadeInLeft,
    right: fadeInRight
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={variants[direction]}
      transition={{ delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Scale In
export function ScaleIn({
  children,
  delay = 0,
  className,
  ...props
}: MotionDivProps & { delay?: number }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={scaleIn}
      transition={{ delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Container com stagger (para listas)
export function StaggerContainer({
  children,
  className,
  ...props
}: MotionDivProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={staggerContainer}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Item do stagger
export function StaggerItem({
  children,
  className,
  ...props
}: MotionDivProps) {
  return (
    <motion.div
      variants={staggerItem}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Hover Scale (para cards e botoes)
export function HoverScale({
  children,
  scale = 1.02,
  className,
  ...props
}: MotionDivProps & { scale?: number }) {
  return (
    <motion.div
      whileHover={{ scale, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Float animation (para elementos decorativos)
export function Float({
  children,
  duration = 6,
  y = 20,
  className,
  ...props
}: MotionDivProps & { duration?: number; y?: number }) {
  return (
    <motion.div
      animate={{
        y: [0, -y, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Pulse Glow (para badges e indicadores)
export function PulseGlow({
  children,
  className,
  ...props
}: MotionDivProps) {
  return (
    <motion.div
      animate={{
        boxShadow: [
          "0 0 0 0 rgba(22, 199, 132, 0.4)",
          "0 0 0 10px rgba(22, 199, 132, 0)",
        ]
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeOut"
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Shimmer loading effect
export function Shimmer({ className }: { className?: string }) {
  return (
    <motion.div
      className={`relative overflow-hidden bg-[#1A3A5C] ${className}`}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{ x: ["0%", "200%"] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </motion.div>
  );
}

// Counter animation (para numeros)
export function AnimatedCounter({
  value,
  duration = 1,
  className
}: {
  value: number;
  duration?: number;
  className?: string
}) {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      <motion.span
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        {value.toLocaleString("pt-BR")}
      </motion.span>
    </motion.span>
  );
}

// Page transition wrapper
export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Reveal on scroll
export function RevealOnScroll({
  children,
  className,
  width = "100%"
}: {
  children: ReactNode;
  className?: string;
  width?: string | number;
}) {
  return (
    <div style={{ position: "relative", width, overflow: "hidden" }}>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className={className}
      >
        {children}
      </motion.div>
      <motion.div
        initial={{ left: 0 }}
        whileInView={{ left: "100%" }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5, ease: "easeIn" }}
        style={{
          position: "absolute",
          top: 4,
          bottom: 4,
          left: 0,
          right: 0,
          background: "#16C784",
          zIndex: 20,
        }}
      />
    </div>
  );
}

// Gradient text animation
export function GradientText({
  children,
  className
}: {
  children: ReactNode;
  className?: string
}) {
  return (
    <motion.span
      className={`bg-gradient-to-r from-[#16C784] via-[#2DFF88] to-[#16C784] bg-clip-text text-transparent bg-[length:200%_auto] ${className}`}
      animate={{ backgroundPosition: ["0%", "200%"] }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "linear"
      }}
    >
      {children}
    </motion.span>
  );
}

// Button with ripple effect
export function RippleButton({
  children,
  onClick,
  className,
  disabled,
  type = "button"
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`relative overflow-hidden ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {children}
    </motion.button>
  );
}

// Animated badge
export function AnimatedBadge({
  children,
  variant = "default",
  className
}: {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "error";
  className?: string
}) {
  const colors = {
    default: "bg-[#1A3A5C]",
    success: "bg-[#16C784]/20 text-[#16C784]",
    warning: "bg-[#FF8A00]/20 text-[#FF8A00]",
    error: "bg-red-500/20 text-red-400"
  };

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[variant]} ${className}`}
    >
      {children}
    </motion.span>
  );
}

// Skeleton loader with shimmer
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={`rounded-xl bg-[#0F2A44] overflow-hidden ${className}`}>
      <Shimmer className="h-48 w-full" />
      <div className="p-4 space-y-3">
        <Shimmer className="h-4 w-3/4 rounded" />
        <Shimmer className="h-4 w-1/2 rounded" />
        <Shimmer className="h-8 w-full rounded mt-4" />
      </div>
    </div>
  );
}

// Animated list
export function AnimatedList({
  children,
  className
}: {
  children: ReactNode;
  className?: string
}) {
  return (
    <motion.ul
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.07
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.ul>
  );
}

export function AnimatedListItem({
  children,
  className
}: {
  children: ReactNode;
  className?: string
}) {
  return (
    <motion.li
      variants={{
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 }
      }}
      className={className}
    >
      {children}
    </motion.li>
  );
}
