import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "./utils";

/**
 * นับตัวเลขขึ้นจากค่าเดิมไปยังค่าจริงจาก Backend เมื่อเลื่อนมาเห็น
 * - ไม่สร้างตัวเลขปลอม: ค่าสุดท้ายคือ value ที่ส่งเข้ามาเสมอ
 * - ถ้า value ไม่ใช่ตัวเลข จะแสดงตามเดิม
 */
export default function CountUp({ value, duration = 900, className }) {
  const target = Number(value);
  const isNumber = value !== null && value !== undefined && value !== "" && Number.isFinite(target);
  const ref = useRef(null);
  const shownRef = useRef(0);
  const [shown, setShown] = useState(0);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    if (!("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        io.disconnect();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [inView]);

  useEffect(() => {
    if (!isNumber || !inView) return;
    const from = shownRef.current;
    if (from === target) return;
    if (prefersReducedMotion() || Math.abs(target - from) < 1) {
      shownRef.current = target;
      setShown(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = t === 1 ? target : from + (target - from) * eased;
      shownRef.current = next;
      setShown(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, isNumber, inView, duration]);

  if (!isNumber) return <span className={className}>{value}</span>;

  const display = Number.isInteger(target) ? Math.round(shown) : shown.toFixed(1);
  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
