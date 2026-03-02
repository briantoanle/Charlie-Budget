"use client";

import { motion, AnimatePresence, useSpring, useMotionValue, useReducedMotion } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";

/* ─── Spring config (tuned for snappy feel — 150-250ms settle) ──── */

const snappy = { type: "spring" as const, stiffness: 500, damping: 35 };
const gentle = { type: "spring" as const, stiffness: 350, damping: 32 };
const instant = { duration: 0 };

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
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduced ? instant : { ...gentle, delay }}
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
  stagger = 0.03,
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
  const reduced = useReducedMotion();
  return (
    <motion.div
      variants={{
        hidden: reduced ? { opacity: 1 } : { opacity: 0, y: 6 },
        visible: { opacity: 1, y: 0, transition: reduced ? instant : gentle },
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

  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, [axis]: sign * 10 }}
      animate={{ opacity: 1, [axis]: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, [axis]: sign * 10 }}
      transition={reduced ? instant : snappy}
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
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduced ? instant : { duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
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
  const reduced = useReducedMotion();
  return (
    <motion.div
      whileHover={reduced ? undefined : {
        y: -2,
        transition: { duration: 0.15 },
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
        transition={{ ...gentle, delay: 0.1 }}
        className={barClassName}
      />
    </div>
  );
}

/* Re-export for convenience */
export { motion, AnimatePresence };
