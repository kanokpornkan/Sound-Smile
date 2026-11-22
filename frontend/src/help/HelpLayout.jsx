import React from "react";
import { NavLink } from "react-router-dom";
import { FiHelpCircle, FiMessageCircle, FiInfo, FiMail } from "react-icons/fi";
import "./HelpTheme.css";

// แท็บที่ใช้ร่วมกันในหน้า Help | Q&A | About | Contact
const TABS = [
  { to: "/help", label: "Help", icon: <FiHelpCircle /> },
  { to: "/qa", label: "Q&A", icon: <FiMessageCircle /> },
  { to: "/about", label: "About", icon: <FiInfo /> },
  { to: "/contact", label: "Contact", icon: <FiMail /> },
];

/**
 * โครงหน้าแบบเดียวกับ Profile / Home:
 * พื้น #DDDDDD + Hero การ์ด navy→blue + แท็บสลับหน้า + เนื้อหาการ์ดสีขาว
 */
export default function HelpLayout({ id, section, index, eyebrow, title, highlight, description, aside, children }) {
  return (
    <main className="ssh-page" aria-labelledby={id}>
      <div className="ssh-shell">
        <section className="ssh-hero">
          <div className="ssh-hero-topline">
            <span><i /> SoundSmile / {section}</span>
            <span>SUPPORT CENTER — {index} / 04</span>
          </div>

          <div className={`ssh-hero-content${aside ? " ssh-hero-has-aside" : ""}`}>
            <div className="ssh-hero-copy">
              <span className="ssh-eyebrow">{eyebrow}</span>
              <h1 id={id}>
                {title} {highlight && <span>{highlight}</span>}
              </h1>
              {description && <p>{description}</p>}
            </div>
            {aside && <div className="ssh-hero-aside">{aside}</div>}
          </div>

          <nav className="ssh-tabs" aria-label="Support pages">
            {TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) => `ssh-tab${isActive ? " ssh-tab-active" : ""}`}
              >
                {tab.icon}
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </section>

        <div className="ssh-body">{children}</div>
      </div>
    </main>
  );
}
