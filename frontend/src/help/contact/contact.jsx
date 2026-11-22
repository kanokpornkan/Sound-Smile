import React from "react";
import { FiMail, FiPhone, FiMapPin } from "react-icons/fi";
import { FaFacebookF, FaInstagram, FaTiktok } from "react-icons/fa";
import HelpLayout from "../HelpLayout";

const CONTACTS = [
  {
    icon: <FiMail />,
    label: "Email",
    value: "soracha.cha@spumail.net",
    href: "mailto:soracha.cha@spumail.net",
  },
  {
    icon: <FiPhone />,
    label: "Phone",
    value: "+66 096 137 9867",
    href: "tel:+66961379867",
  },
  {
    icon: <FiMapPin />,
    label: "Address",
    value: "Bangkok, Thailand",
  },
];

const SOCIALS = [
  { href: "https://www.facebook.com/sound.share.2025", label: "Facebook", icon: <FaFacebookF /> },
  { href: "#", label: "Instagram", icon: <FaInstagram /> },
  { href: "#", label: "TikTok", icon: <FaTiktok /> },
];

function Contact() {
  return (
    <HelpLayout
      id="contact-heading"
      section="Contact"
      index="04"
      eyebrow="Get in touch"
      title="We'd love to"
      highlight="hear from you!"
      description="If you have any questions, feedback, or technical issues while using our platform, please contact us directly via email, phone or social media."
    >
      <div className="ssh-section-head">
        <div>
          <span>Contact information</span>
          <h2>Reach our team</h2>
        </div>
      </div>

      <div className="ssh-grid">
        {CONTACTS.map((c) => (
          <div key={c.label} className="ssh-step">
            <span className="ssh-icon" aria-hidden="true">{c.icon}</span>
            <h3>{c.label}</h3>
            {c.href ? (
              <a className="ssh-contact-value" href={c.href}>{c.value}</a>
            ) : (
              <span className="ssh-contact-value">{c.value}</span>
            )}
          </div>
        ))}
      </div>

      <div className="ssh-cta">
        <div>
          <h3>Follow SoundSmile</h3>
          <p>Get the latest sounds and community news on social media.</p>
        </div>
        <div className="ssh-socials">
          {SOCIALS.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer">
              {s.icon} {s.label}
            </a>
          ))}
        </div>
      </div>
    </HelpLayout>
  );
}

export default Contact;
