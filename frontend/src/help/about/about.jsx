import React from "react";
import { Link } from "react-router-dom";
import { FiTag, FiSliders, FiZap, FiUsers, FiArrowRight } from "react-icons/fi";
import HelpLayout from "../HelpLayout";
import logoLight from "../../assets/soundsmile-logo-light.png";

const FEATURES = [
  {
    icon: <FiTag />,
    title: "Smart tagging",
    text: "Sounds are catalogued by category, timbre, character, mood, and instrument.",
  },
  {
    icon: <FiSliders />,
    title: "Tempo & key filters",
    text: "Filter samples by tempo range and musical key to find what fits your track.",
  },
  {
    icon: <FiZap />,
    title: "Similar sounds",
    text: "Click any sample to see recommendations on similar sounds.",
  },
  {
    icon: <FiUsers />,
    title: "Community driven",
    text: "Uploaded and curated by the community, with new sounds added daily.",
  },
];

function About() {
  return (
    <HelpLayout
      id="about-heading"
      section="About"
      index="03"
      eyebrow="About SoundSmile"
      title="Super-charge your"
      highlight="creative potential."
      description="SoundSmile is the web's premiere community uploaded and curated sample library."
      aside={<img src={logoLight} alt="SoundSmile" className="ssh-hero-logo" />}
    >
      <div className="ssh-card ssh-about-intro">
        <p className="ssh-lead">
          Thousands of audio samples have already been uploaded to <span>SoundSmile</span> and new
          sounds are added daily!
        </p>
        <div>
          <p className="ssh-text">
            Looking for one particular sound? We recognize how difficult it can be to stay in your
            creative flow when you are spending most of your time searching for the audio tools you
            need. Get what you need and continue creating, no need to spend precious time sorting
            through dense sound libraries.
          </p>
          <p className="ssh-text">
            Everything on SoundSmile has already been meticulously tagged and catalogued for you.
          </p>
        </div>
      </div>

      <div className="ssh-section-head">
        <div>
          <span>What we offer</span>
          <h2>Built for creators</h2>
        </div>
      </div>

      <div className="ssh-grid ssh-grid-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="ssh-step">
            <span className="ssh-icon" aria-hidden="true">{f.icon}</span>
            <h3>{f.title}</h3>
            <p>{f.text}</p>
          </div>
        ))}
      </div>

      <div className="ssh-cta">
        <div>
          <h3>Our hope is that SoundSmile helps you produce awesome audio creations.</h3>
          <p>Start exploring the library or share your own sounds with the community.</p>
        </div>
        <Link to="/" className="ssh-btn">
          Explore sounds <FiArrowRight aria-hidden="true" />
        </Link>
      </div>
    </HelpLayout>
  );
}

export default About;
