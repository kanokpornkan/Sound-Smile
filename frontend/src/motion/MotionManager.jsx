import { useEffect } from "react";
import { prefersReducedMotion } from "./utils";

/* =====================================================================
   MotionManager — เพิ่มลูกเล่นให้ทั้งเว็บจากจุดเดียว โดยไม่ต้องแก้ทุก component
   1) Ripple เมื่อคลิกปุ่มที่มีพื้นหลัง
   2) Scroll reveal + stagger ให้การ์ด / หัวข้อ เมื่อเลื่อนเข้ามาในจอ
   3) Sliding indicator ให้เมนู / แท็บ / ฟิลเตอร์
   4) Tooltip สำหรับ element ที่มี data-tooltip
   5) Accordion (<details class="ss-smooth">) เปิด-ปิดแบบความสูงลื่น ๆ
   ทุกอย่างเป็น progressive enhancement: ถ้า JS ส่วนนี้ไม่ทำงาน หน้าเว็บยังใช้ได้ปกติ
   ===================================================================== */

/* ---------- Scroll reveal config ---------- */
const REVEAL_GROUPS = [
  { selector: ".ss-section-heading, .ssp-section-heading, .ssh-section-head, .ssm-section-intro", dir: "left" },
  { selector: ".ssp-stat-card, .ssm-stat-card", dir: "scale" },
  {
    selector:
      ".ss-song-card, .ssp-track-card, .ssh-step, .ssh-faq-item, .ssm-plan-grid > article, .ss-rank-item, .ssd-row, .ss-skel-card",
    dir: "up",
  },
  { selector: ".ss-card, .ssd-card, .ssh-card, .ssh-cta, .ssp-library-panel, .ss-upload-panel", dir: "up" },
];
const REVEAL_SELECTOR = REVEAL_GROUPS.map((g) => g.selector).join(", ");
const STAGGER_MS = 55;
const MAX_STAGGER_STEPS = 8;

/* ---------- Sliding indicator config ---------- */
const INDICATORS = [
  { container: ".ssn-nav", active: ".ssn-link-active" },
  { container: ".ssh-tabs", active: ".ssh-tab-active" },
  { container: ".ssf-links", active: ".ssf-link-active" },
  { container: ".ssp-tab-list", active: ".ssp-tab.is-active" },
  { container: ".ss-filter-row", active: ".ss-filter-btn.is-active" },
  { container: ".ssd-pills", active: ".ssd-pill.active" },
];

/* ---------- Ripple ---------- */
const RIPPLE_TARGET = 'button, [role="button"], a.ssh-btn, a.ssn-primary-cta, a[class*="btn"]';

function parseRgba(color) {
  const m = color && color.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const [r, g, b, a = "1"] = m[1].split(/[\s,/]+/).filter(Boolean);
  return { r: +r, g: +g, b: +b, a: +a };
}

function spawnRipple(event) {
  if (event.button !== 0 || prefersReducedMotion()) return;
  const el = event.target.closest?.(RIPPLE_TARGET);
  if (!el || el.disabled || el.getAttribute("aria-disabled") === "true" || el.dataset.noRipple !== undefined) return;

  const rect = el.getBoundingClientRect();
  if (rect.width < 30 || rect.height < 24) return;

  const cs = getComputedStyle(el);
  const bg = parseRgba(cs.backgroundColor);
  const hasGradient = cs.backgroundImage && cs.backgroundImage !== "none";
  if (!hasGradient && (!bg || bg.a < 0.35)) return; // ปุ่มโปร่งใส ไม่ต้องมี ripple

  // ถ้าปุ่มเป็น static ให้เป็น relative ได้ก็ต่อเมื่อไม่มีลูกที่ absolute อยู่ (กัน layout เพี้ยน)
  if (cs.position === "static") {
    const hasAbsChild = [...el.children].some((c) => {
      const p = getComputedStyle(c).position;
      return p === "absolute" || p === "fixed";
    });
    if (hasAbsChild) return;
    el.style.position = "relative";
  }

  const lum = hasGradient ? 0 : (0.299 * bg.r + 0.587 * bg.g + 0.114 * bg.b) / 255;
  const color = lum > 0.6 ? "rgba(25, 66, 125, 0.28)" : "rgba(255, 255, 255, 0.45)";

  let host = el.querySelector(":scope > .ss-ripple-host");
  if (!host) {
    host = document.createElement("span");
    host.className = "ss-ripple-host";
    host.setAttribute("aria-hidden", "true");
    el.appendChild(host);
  }

  const size = Math.hypot(rect.width, rect.height) * 2;
  const ripple = document.createElement("span");
  ripple.className = "ss-ripple";
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${event.clientX - rect.left}px`;
  ripple.style.top = `${event.clientY - rect.top}px`;
  ripple.style.background = color;
  host.appendChild(ripple);

  const cleanup = () => {
    ripple.remove();
    if (host.isConnected && !host.childElementCount) host.remove();
  };
  ripple.addEventListener("animationend", cleanup, { once: true });
  setTimeout(cleanup, 900);
}

/* ---------- Tooltip ---------- */
function createTooltip() {
  const tip = document.createElement("div");
  tip.className = "ss-tooltip";
  tip.setAttribute("role", "tooltip");
  tip.id = "ss-tooltip";
  document.body.appendChild(tip);
  let current = null;
  let timer = null;

  const show = (el) => {
    const text = el.getAttribute("data-tooltip");
    if (!text) return;
    current = el;
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (current !== el || !el.isConnected) return;
      tip.textContent = text;
      el.setAttribute("aria-describedby", tip.id);
      const r = el.getBoundingClientRect();
      const tr = tip.getBoundingClientRect();
      let top = r.top - tr.height - 10;
      if (top < 8) top = r.bottom + 10;
      let left = r.left + r.width / 2 - tr.width / 2;
      left = Math.max(8, Math.min(left, window.innerWidth - tr.width - 8));
      tip.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
      tip.classList.add("is-visible");
    }, 280);
  };

  const hide = (el) => {
    if (el && el !== current) return;
    clearTimeout(timer);
    current?.removeAttribute("aria-describedby");
    current = null;
    tip.classList.remove("is-visible");
  };

  const over = (e) => {
    const el = e.target.closest?.("[data-tooltip]");
    if (el) show(el);
  };
  const out = (e) => {
    const el = e.target.closest?.("[data-tooltip]");
    if (el && !el.contains(e.relatedTarget)) hide(el);
  };

  document.addEventListener("pointerover", over);
  document.addEventListener("pointerout", out);
  document.addEventListener("focusin", over);
  document.addEventListener("focusout", out);
  const hideAll = () => hide();
  document.addEventListener("pointerdown", hideAll);
  window.addEventListener("scroll", hideAll, { passive: true });

  return () => {
    document.removeEventListener("pointerover", over);
    document.removeEventListener("pointerout", out);
    document.removeEventListener("focusin", over);
    document.removeEventListener("focusout", out);
    document.removeEventListener("pointerdown", hideAll);
    window.removeEventListener("scroll", hideAll);
    clearTimeout(timer);
    tip.remove();
  };
}

/* ---------- Smooth <details> ---------- */
function onDetailsClick(event) {
  const summary = event.target.closest?.("details.ss-smooth > summary");
  if (!summary) return;
  const details = summary.parentElement;
  if (prefersReducedMotion() || !details.animate) return; // ใช้พฤติกรรมเดิมของ browser

  event.preventDefault();
  if (details.dataset.animating) return;
  details.dataset.animating = "1";

  const start = details.offsetHeight;
  const summaryH = summary.offsetHeight;
  const done = () => {
    details.style.height = "";
    delete details.dataset.animating;
  };

  if (details.open) {
    const anim = details.animate([{ height: `${start}px` }, { height: `${summaryH}px` }], {
      duration: 260,
      easing: "cubic-bezier(0.65, 0, 0.35, 1)",
    });
    details.style.height = `${summaryH}px`;
    anim.onfinish = () => {
      details.open = false;
      done();
    };
  } else {
    details.style.height = `${start}px`;
    details.open = true;
    const end = details.scrollHeight;
    const anim = details.animate([{ height: `${start}px` }, { height: `${end}px` }], {
      duration: 320,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    });
    anim.onfinish = done;
  }
}

export default function MotionManager() {
  useEffect(() => {
    const reduce = prefersReducedMotion();
    const processed = new WeakSet();
    let frame = 0;

    /* ----- Reveal ----- */
    const finishReveal = (el) => {
      el.classList.remove("ss-reveal-in");
      el.style.removeProperty("--ss-reveal-delay");
    };

    const playReveal = (el, index) => {
      el.classList.remove("ss-reveal-pending");
      el.style.setProperty("--ss-reveal-delay", `${Math.min(index, MAX_STAGGER_STEPS) * STAGGER_MS}ms`);
      el.classList.add("ss-reveal-in");
      // เอา class ออกหลังเล่นจบ เพื่อให้ hover (translate) ของการ์ดทำงานได้ตามปกติ
      el.addEventListener("animationend", () => finishReveal(el), { once: true });
      setTimeout(() => finishReveal(el), 1400);
    };

    const io =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            (entries) => {
              let i = 0;
              entries
                .filter((e) => e.isIntersecting)
                .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left)
                .forEach((entry) => {
                  io.unobserve(entry.target);
                  playReveal(entry.target, i++);
                });
            },
            { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
          )
        : null;

    const scanReveal = () => {
      if (reduce) return;
      const viewH = window.innerHeight;
      let inViewIndex = 0;
      document.querySelectorAll(REVEAL_SELECTOR).forEach((el) => {
        if (processed.has(el)) return;
        processed.add(el);
        const group = REVEAL_GROUPS.find((g) => el.matches(g.selector));
        if (group && group.dir !== "up") el.setAttribute("data-reveal", group.dir);
        const rect = el.getBoundingClientRect();
        if (rect.top < viewH * 0.95 || !io) {
          // อยู่ในจออยู่แล้ว → เล่นทันทีแบบ stagger (เช่น ตอนโหลดหน้า / ผลค้นหาเปลี่ยน)
          playReveal(el, inViewIndex++);
        } else {
          el.classList.add("ss-reveal-pending");
          io.observe(el);
        }
      });
    };

    /* ----- Sliding indicators ----- */
    const updateIndicators = () => {
      INDICATORS.forEach(({ container, active }) => {
        document.querySelectorAll(container).forEach((host) => {
          if (!host.classList.contains("ss-ind-host")) host.classList.add("ss-ind-host");
          if (getComputedStyle(host).position === "static") host.style.position = "relative";

          let ind = host.querySelector(":scope > .ss-indicator");
          if (!ind) {
            ind = document.createElement("span");
            ind.className = "ss-indicator no-anim";
            ind.setAttribute("aria-hidden", "true");
            host.prepend(ind);
          }

          const target = host.querySelector(`:scope > ${active}`);
          if (!target || !target.offsetWidth) {
            if (ind.classList.contains("is-ready")) ind.classList.remove("is-ready");
            if (!ind.classList.contains("no-anim")) ind.classList.add("no-anim");
            return;
          }

          const next = `translate(${target.offsetLeft}px, ${target.offsetTop}px)`;
          const w = `${target.offsetWidth}px`;
          const h = `${target.offsetHeight}px`;
          if (ind.style.transform !== next) ind.style.transform = next;
          if (ind.style.width !== w) ind.style.width = w;
          if (ind.style.height !== h) ind.style.height = h;

          if (!ind.classList.contains("is-ready")) {
            ind.classList.add("is-ready");
            // แสดงครั้งแรกที่ตำแหน่งจริงก่อน แล้วค่อยเปิดการเลื่อน
            requestAnimationFrame(() => requestAnimationFrame(() => ind.classList.remove("no-anim")));
          }
        });
      });
    };

    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        updateIndicators();
        scanReveal();
      });
    };

    const mo = new MutationObserver(schedule);
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "aria-selected"] });
    window.addEventListener("resize", schedule);
    document.fonts?.ready?.then(schedule);
    schedule();

    document.addEventListener("pointerdown", spawnRipple, true);
    document.addEventListener("click", onDetailsClick);
    const removeTooltip = createTooltip();

    return () => {
      mo.disconnect();
      io?.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("pointerdown", spawnRipple, true);
      document.removeEventListener("click", onDetailsClick);
      removeTooltip();
    };
  }, []);

  return null;
}
