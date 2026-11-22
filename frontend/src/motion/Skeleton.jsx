/** Skeleton loading ระหว่างรอข้อมูลจาก API */

export function SkeletonSongGrid({ count = 6 }) {
  return (
    <div className="ss-skel-grid" role="status" aria-live="polite">
      <span className="ss-sr-only">กำลังโหลดข้อมูล…</span>
      {Array.from({ length: count }, (_, i) => (
        <div className="ss-skel-card" key={i} aria-hidden="true">
          <div className="ss-skel ss-skel-cover" />
          <div className="ss-skel ss-skel-line is-lg w-80" />
          <div className="ss-skel ss-skel-line w-60" />
          <div className="ss-skel ss-skel-line w-40" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonRows({ count = 5, dark = false }) {
  const tone = dark ? " ss-skel-dark" : "";
  return (
    <div role="status" aria-live="polite">
      <span className="ss-sr-only">กำลังโหลดข้อมูล…</span>
      {Array.from({ length: count }, (_, i) => (
        <div className="ss-skel-row" key={i} aria-hidden="true">
          <div className={`ss-skel ss-skel-avatar${tone}`} />
          <div className="ss-skel-lines">
            <div className={`ss-skel ss-skel-line w-80${tone}`} />
            <div className={`ss-skel ss-skel-line w-40${tone}`} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonBlock({ height = 220, dark = false }) {
  return (
    <div role="status" aria-live="polite" style={{ height: "100%" }}>
      <span className="ss-sr-only">กำลังโหลดข้อมูล…</span>
      <div className={`ss-skel${dark ? " ss-skel-dark" : ""}`} style={{ height, borderRadius: 14 }} aria-hidden="true" />
    </div>
  );
}
