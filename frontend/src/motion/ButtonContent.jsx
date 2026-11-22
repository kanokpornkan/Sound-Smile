/**
 * เนื้อหาปุ่มที่เปลี่ยนตามสถานะ: idle → loading (spinner) → success (เครื่องหมายถูก)
 * ใช้ใน <button> เดิม จึงไม่เปลี่ยน className / event เดิมของปุ่ม
 */
export function CheckIcon() {
  return (
    <svg className="ss-check" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12.5l4.2 4.2L19 7" />
    </svg>
  );
}

export default function ButtonContent({ status = "idle", loadingText, successText, children }) {
  if (status === "loading") {
    return (
      <span className="ss-btn-content" key="loading">
        <span className="ss-spinner" aria-hidden="true" />
        <span className="ss-btn-label">{loadingText}</span>
      </span>
    );
  }
  if (status === "success") {
    return (
      <span className="ss-btn-content" key="success">
        <CheckIcon />
        <span className="ss-btn-label">{successText}</span>
      </span>
    );
  }
  return (
    <span className="ss-btn-content" key="idle">
      {children}
    </span>
  );
}
