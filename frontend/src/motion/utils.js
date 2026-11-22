// ตัวช่วยเล็ก ๆ ที่ใช้ร่วมกันในระบบ Motion
export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";
