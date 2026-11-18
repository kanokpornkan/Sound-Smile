import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { FiArrowLeft, FiCamera, FiCheck, FiImage, FiSave, FiUser } from "react-icons/fi";
import { FaFacebook, FaInstagram } from "react-icons/fa";
import { SiTiktok } from "react-icons/si";
import fallbackAvatar from "../../assets/logo.png";
import "./editprofile.css";

const API = "http://localhost:5000";

function storedUser() {
  try { return JSON.parse(localStorage.getItem("user") || "{}"); }
  catch { return {}; }
}

function getImageUrl(value) {
  if (!value) return fallbackAvatar;
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  return `${API}/${String(value).replace(/^\/+/, "")}`;
}

export default function EditProfile({ onClose, onUpdate }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(storedUser);
  const [displayName, setDisplayName] = useState(() => storedUser().username || "");
  const [email, setEmail] = useState(() => storedUser().email || "");
  const [bio, setBio] = useState(() => storedUser().bio || "");
  const [tiktok, setTiktok] = useState(() => storedUser().tiktok || "");
  const [instagram, setInstagram] = useState(() => storedUser().instagram || "");
  const [facebook, setFacebook] = useState(() => storedUser().facebook || "");
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(() => getImageUrl(storedUser().avatar || storedUser().picture));
  const [loading, setLoading] = useState(false);
  const objectUrl = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    let canceled = false;
    axios.get(`${API}/auth/user`, { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => {
        if (canceled || !data?._id) return;
        setUser(data);
        setDisplayName(data.username || "");
        setEmail(data.email || "");
        setBio(data.bio || "");
        setTiktok(data.tiktok || "");
        setInstagram(data.instagram || "");
        setFacebook(data.facebook || "");
        if (!objectUrl.current) setAvatarPreview(getImageUrl(data.avatar || data.picture));
      })
      .catch((err) => console.error("Fetch edit profile error:", err));
    return () => { canceled = true; };
  }, []);

  useEffect(() => () => {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
  }, []);

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      Swal.fire({ icon: "warning", title: "ชนิดไฟล์ไม่รองรับ", text: "รองรับ JPG, PNG, WEBP และ GIF" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({ icon: "warning", title: "ไฟล์ใหญ่เกินไป", text: "ภาพโปรไฟล์ต้องมีขนาดไม่เกิน 5 MB" });
      return;
    }
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = URL.createObjectURL(file);
    setAvatar(file);
    setAvatarPreview(objectUrl.current);
  };

  const closeEditor = () => {
    if (onClose) onClose();
    else navigate("/profile");
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem("token");
    if (!displayName.trim()) {
      Swal.fire({ icon: "warning", title: "กรุณากรอกชื่อที่แสดง" });
      return;
    }
    if (!email.trim()) {
      Swal.fire({ icon: "warning", title: "กรุณากรอกอีเมล" });
      return;
    }
    if (!token || !user?._id) {
      Swal.fire({ icon: "error", title: "กรุณาเข้าสู่ระบบใหม่" });
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append("username", displayName.trim());
      data.append("email", email.trim());
      data.append("bio", bio);
      data.append("tiktok", tiktok.trim());
      data.append("instagram", instagram.trim());
      data.append("facebook", facebook.trim());
      if (avatar) data.append("avatar", avatar);

      const response = await axios.put(`${API}/api/user/${user._id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedUser = { ...user, ...response.data.user };
      const updatedAvatar = response.data.user?.avatar || response.data.user?.picture;
      if (updatedAvatar) {
        updatedUser.avatar = updatedAvatar;
        updatedUser.picture = updatedAvatar;
      }
      localStorage.setItem("user", JSON.stringify(updatedUser));
      window.dispatchEvent(new CustomEvent("profileUpdated", { detail: updatedUser }));
      window.dispatchEvent(new Event("userLoggedIn"));
      if (onUpdate) onUpdate(updatedUser);
      else navigate("/profile");
      await Swal.fire({ icon: "success", title: "บันทึกโปรไฟล์สำเร็จ", timer: 1600, showConfirmButton: false });
    } catch (error) {
      console.error("Profile update error:", error);
      Swal.fire({
        icon: "error",
        title: "บันทึกไม่สำเร็จ",
        text: error.response?.data?.message || error.message || "ไม่สามารถแก้ไขโปรไฟล์ได้",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`sse-editor ${onClose ? "sse-editor-modal" : "sse-editor-page"}`}>
      <div className="sse-editor-shell">
        <header className="sse-header">
          <span className="sse-overline">SOUND SHARE / ACCOUNT SETTINGS</span>
          <h1>Edit your <span>profile.</span></h1>
          <p>ปรับรูปโปรไฟล์ ข้อมูลส่วนตัว และลิงก์ Social Media ของคุณ</p>
        </header>

        <form className="sse-body" onSubmit={handleSave}>
          <aside className="sse-avatar-pane">
            <div className="sse-section-intro"><FiImage /><span>PROFILE PHOTO</span></div>
            <div className="sse-avatar-preview">
              <img
                src={avatarPreview || fallbackAvatar}
                alt="ตัวอย่างรูปโปรไฟล์"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = fallbackAvatar; }}
              />
              <label className="sse-avatar-camera" title="เปลี่ยนรูปโปรไฟล์">
                <FiCamera />
                <input type="file" accept=".jpg,.jpeg,.png,.webp,.gif" onChange={handleAvatarChange} disabled={loading} />
              </label>
            </div>
            <h2>Profile picture</h2>
            <p>ภาพที่แสดงบนโปรไฟล์และหน้าอื่น ๆ ของคุณ</p>
            <label className="sse-image-picker"><FiCamera /> เลือกรูปโปรไฟล์
              <input type="file" accept=".jpg,.jpeg,.png,.webp,.gif" onChange={handleAvatarChange} disabled={loading} />
            </label>
            <small>JPG, PNG, WEBP, GIF · สูงสุด 5 MB</small>
          </aside>

          <div className="sse-fields-pane">
            <div className="sse-field-section">
              <div className="sse-section-heading"><span className="sse-section-icon"><FiUser /></span><div><h2>Personal information</h2><p>ข้อมูลทั่วไปที่ผู้ใช้คนอื่นจะมองเห็น</p></div></div>
              <div className="sse-form-grid">
                <label className="sse-field"><span>ชื่อที่แสดง <b>*</b></span><input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="ชื่อที่ต้องการแสดง" required maxLength={90} disabled={loading} /></label>
                <label className="sse-field"><span>อีเมล <b>*</b></span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required disabled={loading} /></label>
                <label className="sse-field sse-field-full"><span>เกี่ยวกับฉัน (Bio)</span><textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="แนะนำตัวเองหรือเล่าเกี่ยวกับเพลงที่คุณทำ..." rows={4} maxLength={600} disabled={loading} /></label>
              </div>
            </div>
            <div className="sse-field-section">
              <div className="sse-section-heading"><span className="sse-section-icon"><FaInstagram /></span><div><h2>Social links</h2><p>เพิ่มช่องทางให้คนฟังติดตามผลงานของคุณ</p></div></div>
              <div className="sse-social-fields">
                <label className="sse-field"><span><SiTiktok /> TikTok</span><input type="url" value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="https://www.tiktok.com/@username" disabled={loading} /></label>
                <label className="sse-field"><span><FaInstagram /> Instagram</span><input type="url" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://www.instagram.com/username" disabled={loading} /></label>
                <label className="sse-field"><span><FaFacebook /> Facebook</span><input type="url" value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="https://www.facebook.com/username" disabled={loading} /></label>
              </div>
            </div>
            <div className="sse-footer-actions">
              <button type="button" className="sse-cancel" onClick={closeEditor} disabled={loading}><FiArrowLeft /> ยกเลิก</button>
              <button type="submit" className="sse-save" disabled={loading}>{loading ? <><FiSave /> กำลังบันทึก...</> : <><FiCheck /> บันทึกการเปลี่ยนแปลง</>}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
