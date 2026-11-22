import React, { useRef, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./Rigister.css";
import logoLight from "../assets/soundsmile-logo-light.png";
import { FiEye, FiEyeOff, FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import { CheckIcon } from "../motion/ButtonContent";

const API_URL = "http://localhost:5000";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const STRENGTH_LABELS = ["", "อ่อน", "พอใช้", "ดี", "แข็งแรงมาก"];

// ประเมินความแข็งแรงของรหัสผ่าน (แสดงผลเท่านั้น ไม่บังคับ — Backend ยังรับเหมือนเดิม)
function passwordStrength(value) {
  if (!value) return 0;
  let score = 0;
  if (value.length >= 6) score++;
  if (value.length >= 10) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
  if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score++;
  return Math.max(1, score);
}
const WAVE_HEIGHTS = [22, 42, 61, 85, 55, 32, 73, 97, 66, 45, 78, 52, 31, 60, 89, 74, 48, 97, 68, 38, 56, 81, 45, 67, 92, 73, 51, 29, 60, 45, 34, 21];

function GoogleMark() {
  return (
    <svg className="ss-auth-google-mark" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.27 5.48-4.81 7.18l7.73 6C44.38 38 46.98 31.61 46.98 24.55z"/>
      <path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 0 1 9.75 24c0-1.59.28-3.13.76-4.59l-7.98-6.19A23.86 23.86 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6C30.04 37.64 27.3 38.5 24 38.5c-6.26 0-11.57-4.22-13.47-9.91l-7.97 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

function Rigister() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState({ email: false });
  const submitRef = useRef(null);
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  // ปุ่มสั่นเบา ๆ เมื่อเกิดข้อผิดพลาด
  const shakeButton = () => {
    const el = submitRef.current;
    if (!el) return;
    el.classList.remove("ss-shake");
    void el.offsetWidth;
    el.classList.add("ss-shake");
  };

  const emailInvalid = touched.email && form.email !== "" && !EMAIL_PATTERN.test(form.email);
  const emailValid = form.email !== "" && EMAIL_PATTERN.test(form.email);
  const strength = passwordStrength(form.password);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      await axios.post(`${API_URL}/api/register`, form);
      setSuccess(true);
      await Swal.fire({
        icon: "success",
        title: "สมัครสมาชิกสำเร็จ!",
        text: "ตอนนี้คุณสามารถเข้าสู่ระบบด้วยบัญชีใหม่ได้แล้ว",
        confirmButtonText: "ไปหน้าเข้าสู่ระบบ",
      });
      navigate("/login");
    } catch (error) {
      shakeButton();
      Swal.fire({
        icon: "error",
        title: "สมัครสมาชิกไม่สำเร็จ",
        text: error.response?.data?.message || "กรุณาลองใหม่อีกครั้ง",
      });
    } finally {
      setLoading(false);
    }
  };

  const googleSignup = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  return (
    <main className="ss-auth-page ss-auth-register-page">
      <div className="ss-auth-shell">
        <section className="ss-auth-story" aria-label="เกี่ยวกับ SoundSmile">
          <div className="ss-auth-brand">
            <img className="ss-auth-logo" src={logoLight} alt="SoundSmile" />
          </div>

          <div className="ss-auth-story-main">
            <span className="ss-auth-overline"><span className="ss-auth-dot"/> FOR THE NEXT GENERATION</span>
            <h2>Your sound.<br/><em>Your story.</em></h2>
            <p>สร้างพื้นที่ให้เสียงของคุณมีตัวตน ค้นพบเพลงใหม่ ๆ เก็บผลงานที่ชอบ และแบ่งปันจังหวะของคุณกับทุกคน</p>
            <div className="ss-auth-waveframe" aria-hidden="true">
              <div className="ss-auth-wave-top"><span>YOUR CREATIVE JOURNEY</span><span>01 / ∞</span></div>
              <div className="ss-auth-wave">
                {WAVE_HEIGHTS.map((height, index) => <span key={index} style={{ height: `${height}%` }}/>) }
              </div>
              <div className="ss-auth-wave-bottom"><span>YOUR SOUND STARTS HERE</span><span>♪</span></div>
            </div>
          </div>

          <div className="ss-auth-story-footer"><span>EXPLORE THE SOUND</span><span>MADE FOR CREATORS</span></div>
        </section>

        <section className="ss-auth-form-panel">
          <div className="ss-auth-topline"><Link to="/" className="ss-auth-back"><span aria-hidden="true">←</span> กลับหน้าแรก</Link><span className="ss-auth-topnote">JOIN THE COMMUNITY</span></div>

          <div className="ss-auth-form-content">
            <div className="ss-auth-form-overline">GET STARTED • IT'S FREE</div>
            <h1>สร้างบัญชีใหม่<span className="ss-auth-title-dot">.</span></h1>
            <p className="ss-auth-intro">สมัครสมาชิกเพื่อเริ่มต้นค้นหา ฟัง และแบ่งปันเสียงในแบบของคุณ</p>

            <form className="ss-auth-form" onSubmit={handleSubmit}>
              <div className="ss-auth-field">
                <label htmlFor="ss-register-username">ชื่อผู้ใช้ <span>*</span></label>
                <input id="ss-register-username" type="text" name="username" value={form.username} onChange={handleChange} placeholder="ตั้งชื่อที่คุณต้องการ" autoComplete="username" required disabled={loading}/>
              </div>
              <div className={`ss-auth-field${emailInvalid ? " is-invalid" : emailValid && touched.email ? " is-valid" : ""}`}>
                <label htmlFor="ss-register-email">อีเมล <span>*</span></label>
                <input id="ss-register-email" type="email" name="email" value={form.email} onChange={handleChange} placeholder="yourname@example.com" autoComplete="email" required disabled={loading} onBlur={() => setTouched((t) => ({ ...t, email: true }))} aria-invalid={emailInvalid} aria-describedby={emailInvalid ? "ss-register-email-msg" : undefined}/>
                {emailInvalid && <small id="ss-register-email-msg" className="ss-field-msg is-error"><FiAlertCircle aria-hidden="true" /> รูปแบบอีเมลไม่ถูกต้อง เช่น name@example.com</small>}
                {emailValid && touched.email && <small className="ss-field-msg is-ok"><FiCheckCircle aria-hidden="true" /> อีเมลพร้อมใช้งาน</small>}
              </div>
              <div className="ss-auth-field">
                <label htmlFor="ss-register-password">รหัสผ่าน <span>*</span></label>
                <div className="ss-auth-password-wrap">
                  <input id="ss-register-password" type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange} placeholder="ตั้งรหัสผ่านสำหรับบัญชีของคุณ" autoComplete="new-password" required disabled={loading}/>
                  <button type="button" className="ss-auth-eye" aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"} aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}>
                    <span className="ss-eye-icon" aria-hidden="true">
                      <FiEye className={showPassword ? "is-hidden" : ""} />
                      <FiEyeOff className={showPassword ? "" : "is-hidden"} />
                    </span>
                  </button>
                </div>
                {form.password && (
                  <>
                    <div className="ss-strength" data-level={strength} aria-hidden="true"><i /><i /><i /><i /></div>
                    <small className="ss-field-msg" aria-live="polite">ความแข็งแรงของรหัสผ่าน: {STRENGTH_LABELS[strength]}</small>
                  </>
                )}
                <small className="ss-auth-input-hint">เลือกรหัสผ่านที่เดายากและไม่ใช้ซ้ำกับบัญชีอื่น</small>
              </div>
              <button ref={submitRef} className={`ss-auth-primary${success ? " is-success" : ""}`} type="submit" disabled={loading || success}>
                {loading && !success && <i className="ss-spinner" aria-hidden="true" />}
                {success && <CheckIcon />}
                {success ? "สมัครสมาชิกสำเร็จ" : loading ? "กำลังสร้างบัญชี..." : "สมัครสมาชิกฟรี"}
                {!loading && !success && <span className="ss-auth-arrow" aria-hidden="true">→</span>}
              </button>
            </form>

            <div className="ss-auth-divider"><span>หรือสมัครด้วย</span></div>
            <button className="ss-auth-google" type="button" onClick={googleSignup} disabled={loading}>
              <GoogleMark /> Google
            </button>
            <p className="ss-auth-switch">มีบัญชีอยู่แล้ว? <Link to="/login">เข้าสู่ระบบ <span aria-hidden="true">↗</span></Link></p>
          </div>

          <p className="ss-auth-footer-note">SoundSmile · LISTEN. CREATE. SHARE.</p>
        </section>
      </div>
    </main>
  );
}

export default Rigister;