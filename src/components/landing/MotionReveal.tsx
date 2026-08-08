import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type MotionRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  scale?: number;
} & Omit<HTMLMotionProps<"div">, "children" | "className">;

function MotionReveal({
  children,
  className,
  delay = 0,
  y = 18,
  scale = 1,
  ...props
}: MotionRevealProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={cn(className)}>{children}</div>;
  }

  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, y, scale: scale === 1 ? 1 : scale }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: 0.42,
        delay,
        ease: [0.2, 0, 0, 1],
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export { MotionReveal };
