import React from "react";
import "./AdminTheme.css";

// หัวหน้าที่ใช้ซ้ำทุกหน้า admin (สไตล์เดียวกับ hero หน้า Home)
export default function AdminHeader({ label, title, desc, stat, statLabel }) {
  return (
    <section className="ssa-hero">
      <div>
        <span className="ssa-hero-label">{label}</span>
        <h1>{title}</h1>
        {desc && <p>{desc}</p>}
      </div>
      <div className="ssa-hero-side">
        {stat !== undefined && (
          <div className="ssa-hero-stat">
            <strong>{stat}</strong>
            <span>{statLabel}</span>
          </div>
        )}
        <div className="ssa-hero-record"><i>SS</i></div>
      </div>
    </section>
  );
}