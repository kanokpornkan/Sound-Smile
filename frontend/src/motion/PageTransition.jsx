import { useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { prefersReducedMotion, EASE_OUT } from "./utils";

/**
 * Page transition: เมื่อเปลี่ยนหน้า เนื้อหาจะ fade + slide up เล็กน้อย
 * ไม่ remount หน้า (ไม่ใช้ key) → state เดิม เช่น คำค้นหา ไม่หาย
 */
export default function PageTransition({ children }) {
  const { pathname } = useLocation();
  const navType = useNavigationType();
  const ref = useRef(null);
  const first = useRef(true);

  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    // ไปหน้าใหม่ (ไม่ใช่กด Back) → เริ่มที่ด้านบนของหน้า
    if (navType !== "POP") window.scrollTo(0, 0);

    const el = ref.current;
    if (!el?.animate || prefersReducedMotion()) return;
    const anim = el.animate(
      [
        { opacity: 0, translate: "0 14px" },
        { opacity: 1, translate: "0 0" },
      ],
      { duration: 340, easing: EASE_OUT }
    );
    return () => anim.cancel();
  }, [pathname, navType]);

  return (
    <div ref={ref} className="ss-page-transition">
      {children}
    </div>
  );
}
