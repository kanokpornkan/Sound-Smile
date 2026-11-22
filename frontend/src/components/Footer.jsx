import React from "react";
import "./Footer.css";
import logo from "../assets/soundsmile-logo-light.png"; // โลโก้ SoundSmile (เวอร์ชันสีอ่อนสำหรับพื้นเข้ม)
import { FaFacebookF, FaInstagram, FaTiktok } from "react-icons/fa";
import { Link, NavLink } from "react-router-dom";

const FOOTER_LINKS = [
  { to: "/help", label: "Help" },
  { to: "/qa", label: "Q&A" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

const SOCIALS = [
  { href: "https://www.facebook.com/sound.share.2025", label: "Facebook", icon: <FaFacebookF /> },
  { href: "#", label: "Instagram", icon: <FaInstagram /> },
  { href: "#", label: "TikTok", icon: <FaTiktok /> },
];

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="ssf-footer">
      <div className="ssf-panel">
        <div className="ssf-main">
          <Link to="/" className="ssf-brand" aria-label="SoundSmile — Home">
            <img src={logo} alt="SoundSmile" className="ssf-logo" />
          </Link>

          <nav className="ssf-links" aria-label="Footer menu">
            {FOOTER_LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `ssf-link${isActive ? " ssf-link-active" : ""}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ssf-socials">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                title={s.label}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        <div className="ssf-bottom">
          <span>© {year} SoundSmile. All rights reserved.</span>
          <span>LISTEN · CREATE · SHARE</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
