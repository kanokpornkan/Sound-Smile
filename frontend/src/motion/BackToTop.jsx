import { useEffect, useState } from "react";
import { FiArrowUp } from "react-icons/fi";
import { prefersReducedMotion } from "./utils";

/** ปุ่มกลับขึ้นด้านบน — ปรากฏเมื่อเลื่อนลงมาเกิน 600px */
export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setVisible(window.scrollY > 600);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <button
      type="button"
      className={`ss-back-to-top${visible ? " is-visible" : ""}`}
      onClick={() => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" })}
      aria-label="กลับขึ้นด้านบน"
      data-tooltip="กลับขึ้นด้านบน"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
    >
      <FiArrowUp aria-hidden="true" />
    </button>
  );
}
