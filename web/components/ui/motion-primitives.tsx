"use client";

import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";

/* ─── Spring config ──────────────────────────────────────────────── */

const snappy = { type: "spring" as const, stiffness: 300, damping: 30 };
const gentle = { type: "spring" as const, stiffness: 200, damping: 25 };

/* ─── FadeIn ─────────────────────────────────────────────────────── */

export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...gentle, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── StaggerList ────────────────────────────────────────────────── */

export function StaggerList({
  children,
  className,
  stagger = 0.06,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 8 },
        visible: { opacity: 1, y: 0, transition: gentle },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── SlideIn ────────────────────────────────────────────────────── */

export function SlideIn({
  children,
  direction = "down",
  className,
}: {
  children: ReactNode;
  direction?: "left" | "right" | "up" | "down";
  className?: string;
}) {
  const axis = direction === "left" || direction === "right" ? "x" : "y";
  const sign = direction === "right" || direction === "down" ? 1 : -1;

  return (
    <motion.div
      initial={{ opacity: 0, [axis]: sign * 16 }}
      animate={{ opacity: 1, [axis]: 0 }}
      exit={{ opacity: 0, [axis]: sign * 16 }}
      transition={snappy}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── AnimatedNumber ─────────────────────────────────────────────── */

export function AnimatedNumber({
  value,
  format = "currency",
  className,
  decimals = 2,
}: {
  value: number;
  format?: "currency" | "number" | "percent";
  className?: string;
  decimals?: number;
}) {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    stiffness: 100,
    damping: 20,
    restDelta: 0.01,
  });

  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      if (ref.current) {
        let formatted: string;
        if (format === "currency") {
          formatted = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          }).format(latest);
        } else if (format === "percent") {
          formatted = `${latest.toFixed(1)}%`;
        } else {
          formatted = latest.toLocaleString("en-US", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          });
        }
        ref.current.textContent = formatted;
      }
    });
    return unsubscribe;
  }, [springValue, format, decimals]);

  return <span ref={ref} className={className} />;
}

/* ─── PageTransition ─────────────────────────────────────────────── */

export function PageTransition({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── CardHover ──────────────────────────────────────────────────── */

export function CardHover({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      whileHover={{
        y: -2,
        transition: { duration: 0.2 },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── ProgressBar (animated width) ───────────────────────────────── */

export function AnimatedProgressBar({
  percent,
  className,
  barClassName,
}: {
  percent: number;
  className?: string;
  barClassName?: string;
}) {
  return (
    <div className={className}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, percent)}%` }}
        transition={{ ...gentle, delay: 0.2 }}
        className={barClassName}
      />
    </div>
  );
}

/* Re-export for convenience */
export { motion, AnimatePresence };
