"use client";
// Adapted from React Bits FadeContent by David Haz (2026).
// Native animation API replaces GSAP. See docs/third-party-react-bits.md.
import { useEffect, useRef, type ReactNode } from "react";
export function FadeContent({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let animation: Animation | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        animation = element.animate(
          [
            { opacity: 0.65, filter: "blur(3px)", transform: "translateY(18px)" },
            { opacity: 1, filter: "blur(0px)", transform: "translateY(0px)" },
          ],
          { duration: 650, easing: "cubic-bezier(.16,1,.3,1)" },
        );
        observer.disconnect();
      },
      { threshold: 0.12 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      animation?.cancel();
    };
  }, []);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
