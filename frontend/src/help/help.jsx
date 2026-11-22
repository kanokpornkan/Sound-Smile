import React from "react";
import { Link } from "react-router-dom";
import { FiUserPlus, FiLogIn, FiUploadCloud, FiDownload, FiHeadphones, FiShield, FiArrowRight } from "react-icons/fi";
import HelpLayout from "./HelpLayout";

const STEPS = [
  {
    icon: <FiUserPlus />,
    title: "First-time registration",
    text: "Click “Sign Up” and fill in all required information.",
    to: "/register",
    action: "Create an account",
  },
  {
    icon: <FiLogIn />,
    title: "Login",
    text: "Click “Login” to access your account.",
    to: "/login",
    action: "Go to login",
  },
  {
    icon: <FiUploadCloud />,
    title: "Upload sounds",
    text: "Go to the “Upload” page and choose your audio file along with the details.",
    to: "/upload",
    action: "Upload a sound",
  },
  {
    icon: <FiDownload />,
    title: "Download sounds",
    text: "Go to the “Browse Sounds” page and click “Download” under a file.",
    to: "/",
    action: "Browse sounds",
  },
  {
    icon: <FiHeadphones />,
    title: "Contact support",
    text: "Reach out to the support team for further assistance.",
    to: "/contact",
    action: "Contact us",
  },
  {
    icon: <FiShield />,
    title: "Usage rights",
    text: "Make sure to review the usage rights before any commercial use.",
    to: "/qa",
    action: "Read the Q&A",
  },
];

export default function HelpSupport() {
  return (
    <HelpLayout
      id="help-heading"
      section="Help"
      index="01"
      eyebrow="Help & Support"
      title="How can we"
      highlight="help you?"
      description="If you need help, please check the guide below first 🎵 Every step links straight to the page you need."
    >
      <div className="ssh-section-head">
        <div>
          <span>Getting started</span>
          <h2>Quick guide</h2>
        </div>
        <p>6 steps to get the most out of SoundSmile</p>
      </div>

      <div className="ssh-grid">
        {STEPS.map((step, i) => (
          <Link key={step.title} to={step.to} className="ssh-step">
            <div className="ssh-step-top">
              <span className="ssh-icon" aria-hidden="true">{step.icon}</span>
              <span className="ssh-step-num">{String(i + 1).padStart(2, "0")}</span>
            </div>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
            <span className="ssh-step-link">
              {step.action} <FiArrowRight aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>

      <div className="ssh-cta">
        <div>
          <h3>We hope this guide helps you use the app more easily!</h3>
          <p>Still stuck? Check the frequently asked questions or get in touch with our team.</p>
        </div>
        <Link to="/qa" className="ssh-btn">
          Open Q&amp;A <FiArrowRight aria-hidden="true" />
        </Link>
      </div>
    </HelpLayout>
  );
}
