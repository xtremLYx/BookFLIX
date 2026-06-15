"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { useMagneticButton } from "../hooks/useMagneticButton";

interface MagneticButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
  range?: number;
  strength?: number;
  className?: string;
}

export default function MagneticButton({
  children,
  range = 60,
  strength = 0.3,
  className = "",
  ...props
}: MagneticButtonProps) {
  const { ref, position } = useMagneticButton(range, strength);

  return (
    <motion.button
      ref={ref as React.Ref<HTMLButtonElement>}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 180, damping: 12, mass: 0.2 }}
      className={`relative inline-flex items-center justify-center overflow-hidden transition-all duration-300 ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
