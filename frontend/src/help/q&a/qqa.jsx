import React from "react";
import { Link } from "react-router-dom";
import { FiChevronDown, FiArrowRight } from "react-icons/fi";
import HelpLayout from "../HelpLayout";

const FAQS = [
  {
    q: "What is this app?",
    a: "This app is a platform for musicians, producers, and creators to upload, share, and download music sounds such as drum kits, synths, and sound effects for free, to use in music production.",
  },
  {
    q: "Do I need to sign up before using the app?",
    a: "Yes. You need to register an account so the system can manage your profile, track uploads/downloads, and prevent copyright violations.",
  },
  {
    q: "What types of audio files can be uploaded?",
    a: "The app supports .mp3, .wav, .ogg. Each file can include name, type, BPM, and key.",
  },
  {
    q: "Can I use downloaded sounds commercially?",
    a: "Only sounds labeled “Free for commercial use” can be used for commercial purposes.",
  },
  {
    q: "How is this app different from other websites?",
    a: "Completely free, includes search, preview, and a community section for sharing and commenting.",
  },
  {
    q: "Can I delete sounds I uploaded?",
    a: "Yes. Users can delete their own uploaded sounds anytime from their profile.",
  },
  {
    q: "Are uploaded sounds reviewed before publishing?",
    a: "Yes. Admin reviews all uploaded sounds to prevent copyright or inappropriate content.",
  },
  {
    q: "Does the app have a rating/comment system?",
    a: "Yes. Users can like, rate, and comment to help the community grow.",
  },
];

function Qqa() {
  return (
    <HelpLayout
      id="qqa-heading"
      section="Q&A"
      index="02"
      eyebrow="Frequently Asked Questions"
      title="Questions &"
      highlight="answers."
      description="Everything you need to know about uploading, downloading and using sounds on SoundSmile. Tap a question to see the answer."
    >
      <div className="ssh-section-head">
        <div>
          <span>FAQ</span>
          <h2>Q&amp;A (Frequently Asked Questions)</h2>
        </div>
        <p>{FAQS.length} questions</p>
      </div>

      <div className="ssh-faq">
        {FAQS.map((item, i) => (
          <details key={item.q} className="ssh-faq-item ss-smooth" open={i === 0}>
            <summary>
              <span className="ssh-faq-q">Q{i + 1}</span>
              <span className="ssh-faq-title">{item.q}</span>
              <FiChevronDown className="ssh-faq-chevron" aria-hidden="true" />
            </summary>
            <p className="ssh-faq-answer">{item.a}</p>
          </details>
        ))}
      </div>

      <div className="ssh-cta">
        <div>
          <h3>Didn’t find your answer?</h3>
          <p>Our team is happy to help with questions, feedback or technical issues.</p>
        </div>
        <Link to="/contact" className="ssh-btn">
          Contact us <FiArrowRight aria-hidden="true" />
        </Link>
      </div>
    </HelpLayout>
  );
}

export default Qqa;
