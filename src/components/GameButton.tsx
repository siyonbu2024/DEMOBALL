"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  /** Extra Tailwind classes for width/margin overrides */
  className?: string;
  size?: "md" | "lg";
}

/**
 * Game-style button that uses Button.svg as the background.
 * Gold face with orange 3D depth. Presses down on tap.
 */
export const GameButton = ({
  children,
  onClick,
  disabled = false,
  className = "",
  size = "md",
}: Props) => {
  const height = size === "lg" ? 60 : 50;

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { y: 4, scaleY: 0.94 }}
      transition={{ type: "spring", stiffness: 500, damping: 25 }}
      className={`relative select-none touch-none ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:brightness-95"
      } ${className}`}
      style={{
        height,
        backgroundImage: "url('/Button.svg')",
        backgroundSize: "100% 100%",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Text sits slightly above center to account for the orange depth at bottom */}
      <span
        className={`absolute inset-0 flex items-center justify-center font-black tracking-wide select-none pointer-events-none ${
          size === "lg" ? "text-xl" : "text-base"
        }`}
        style={{
          color: "#5C2000",
          textShadow: "0 1px 0 rgba(255,220,80,0.6)",
          paddingBottom: "10px",
        }}
      >
        {children}
      </span>
    </motion.button>
  );
};
