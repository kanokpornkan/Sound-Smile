import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import "./Login.css";

const API_URL = "http://localhost:5000";
const WAVE_HEIGHTS = [25, 39, 58, 42, 73, 88, 53, 38, 66, 91, 74, 49, 32, 61, 83, 98, 69, 43, 56, 84, 72, 47, 30, 58, 80, 96, 64, 44, 71, 54, 36, 22];

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

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const googleToken = searchParams.get("token");

  // คง Google OAuth callback เดิมไว้
  useEffect(() => {
    const token = googleToken;
    if (!token) return;
    let active = true;

    setGoogleLoading(true);
    localStorage.setItem("token", token);

    axios.get(`${API_URL}/auth/user`, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    }).then((res) => {
      if (!active) return;
      localStorage.setItem("user", JSON.stringify(res.data));
      window.dispatchEvent(new Event("userLoggedIn"));
      Swal.fire({ icon: "success", title: "เข้าสู่ระบบสำเร็จ", timer: 1400, showConfirmButton: false });
      navigate("/");
      window.location.href = "/"
    }).catch((err) => {
      if (!active) return;
      if (localStorage.getItem("token") === token) localStorage.removeItem("token");
      Swal.fire({ icon: "error", title: "เข้าสู่ระบบด้วย Google ไม่สำเร็จ", text: err.response?.data?.message || "กรุณาลองใหม่อีกครั้ง" });
    }).finally(() => {
      if (active) setGoogleLoading(false);
    });

    return () => { active = false; };
  }, [googleToken, navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/login`, form, {
        withCredentials: true,
      });
      const { token } = response.data;
      if (!token) throw new Error("ไม่พบ Token จากเซิร์ฟเวอร์");

      const userResponse = await axios.get(`${API_URL}/auth/user`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userResponse.data));
      window.dispatchEvent(new Event("userLoggedIn"));
      Swal.fire({ icon: "success", title: "เข้าสู่ระบบสำเร็จ", timer: 1400, showConfirmButton: false });
      navigate("/");
      window.location.href = "/"
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "เข้าสู่ระบบไม่สำเร็จ",
        text: error.response?.data?.message || error.message || "กรุณาลองใหม่อีกครั้ง",
      });
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  return (
    <main className="ss-auth-page ss-auth-login-page">
      <div className="ss-auth-shell">
        <section className="ss-auth-story" aria-label="เกี่ยวกับ Sound Share">
          <div className="ss-auth-brand">
            <div className="ss-auth-brand-icon" aria-hidden="true"><i/><i/><i/><i/><i/></div>
            <div><strong>SOUND <span>SHARE</span></strong><small>CREATOR PLATFORM</small></div>
          </div>

          <div className="ss-auth-story-main">
            <span className="ss-auth-overline"><span className="ss-auth-dot"/> YOUR CREATIVE SPACE</span>
            <h2>Welcome back.<br/><em>Make some noise.</em></h2>
            <p>กลับเข้าสู่โลกของเสียง ค้นพบแรงบันดาลใจใหม่ ๆ และต่อยอดผลงานของคุณใน SOUND SHARE</p>
            <div className="ss-auth-waveframe" aria-hidden="true">
              <div className="ss-auth-wave-top"><span>NOW PLAYING</span><span>01 / 04</span></div>
              <div className="ss-auth-wave">
                {WAVE_HEIGHTS.map((height, index) => <span key={index} style={{ height: `${height}%` }}/>) }
              </div>
              <div className="ss-auth-wave-bottom"><span>CREATE • DISCOVER • SHARE</span><span>♪</span></div>
            </div>
          </div>

          <div className="ss-auth-story-footer"><span>THE SOUND STARTS HERE</span><span>EST. SOUND SHARE</span></div>
        </section>

        <section className="ss-auth-form-panel">
          <div className="ss-auth-topline"><Link to="/" className="ss-auth-back"><span aria-hidden="true">←</span> กลับหน้าแรก</Link><span className="ss-auth-topnote">MEMBER ACCESS</span></div>

          <div className="ss-auth-form-content">
            <div className="ss-auth-form-overline">WELCOME BACK</div>
            <h1>เข้าสู่ระบบ<span className="ss-auth-title-dot">.</span></h1>
            <p className="ss-auth-intro">เข้าสู่บัญชีของคุณเพื่อฟัง จัดเก็บ และแบ่งปันเสียงที่ชื่นชอบ</p>

            <form className="ss-auth-form" onSubmit={handleSubmit}>
              <div className="ss-auth-field">
                <label htmlFor="ss-login-email">อีเมล <span>*</span></label>
                <input id="ss-login-email" type="email" name="email" value={form.email} onChange={handleChange} placeholder="yourname@example.com" autoComplete="email" required disabled={loading || googleLoading}/>
              </div>

              <div className="ss-auth-field">
                <label htmlFor="ss-login-password">รหัสผ่าน <span>*</span></label>
                <div className="ss-auth-password-wrap">
                  <input id="ss-login-password" type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange} placeholder="กรอกรหัสผ่านของคุณ" autoComplete="current-password" required disabled={loading || googleLoading}/>
                  <button type="button" className="ss-auth-eye" aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"} aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}>
                    {showPassword ? "ซ่อน" : "แสดง"}
                  </button>
                </div>
              </div>

              <button className="ss-auth-primary" type="submit" disabled={loading || googleLoading}>
                {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}<span aria-hidden="true">→</span>
              </button>
            </form>

            <div className="ss-auth-divider"><span>หรือเข้าสู่ระบบด้วย</span></div>
            <button className="ss-auth-google" type="button" onClick={googleLogin} disabled={loading || googleLoading}>
              <GoogleMark /> Google
            </button>
            <p className="ss-auth-switch">ยังไม่มีบัญชีใช่ไหม? <Link to="/register">สมัครสมาชิกฟรี <span aria-hidden="true">↗</span></Link></p>
          </div>

          <p className="ss-auth-footer-note">SOUND SHARE · LISTEN. CREATE. SHARE.</p>
        </section>
      </div>
    </main>
  );
}

export default Login;