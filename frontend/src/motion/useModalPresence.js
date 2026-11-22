import { useEffect, useState } from "react";
import { prefersReducedMotion } from "./utils";

/**
 * ทำให้ Modal เล่น animation ตอนปิด (reverse) ก่อนถูกถอดออกจากหน้า
 * คืนค่า [mounted, closing]
 */
export default function useModalPresence(open, exitMs = 220) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
      return undefined;
    }
    if (!mounted) return undefined;
    setClosing(true);
    const timer = setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, prefersReducedMotion() ? 0 : exitMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return [mounted, closing];
}
