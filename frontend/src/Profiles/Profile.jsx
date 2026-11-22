import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaFacebook, FaInstagram } from "react-icons/fa";
import { SiTiktok } from "react-icons/si";
import {
  FiArrowRight, FiCamera, FiDownload, FiEdit2,
  FiHeart, FiHeadphones, FiMusic, FiX,
} from "react-icons/fi";
import ProfileUpload from "./ProfileUpload/Profileuploads";
import ProfileDownload from "./ProfileDownload/Profiledownload";
import ProfileFavorites from "./ProfileFovorites/Profilefovorites";
import EditProfile from "./editprofile/editprofile";
import defaultAvatar from "../assets/soundsmile-mark.png";
import "./Profile.css";
import CountUp from "../motion/CountUp";
import useModalPresence from "../motion/useModalPresence";

const API = "http://localhost:5000";

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function imageUrl(path) {
  if (!path) return defaultAvatar;
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  return `${API}/${String(path).replace(/^\/+/, "")}`;
}

function Profile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("uploads");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editModalMounted, editModalClosing] = useModalPresence(showEditModal);
  const [user, setUser] = useState(readStoredUser);
  const [counts, setCounts] = useState({ uploads: 0, downloads: 0, favorites: 0 });

  const fetchUserData = useCallback(async () => {
    const cachedUser = readStoredUser();
    const token = localStorage.getItem("token");
    if (cachedUser) setUser(cachedUser);
    if (!cachedUser?._id || !token) return;

    const auth = { Authorization: `Bearer ${token}` };
    try {
      const [fresh, uploaded, downloaded, liked] = await Promise.allSettled([
        fetch(`${API}/auth/user`, { headers: auth }),
        fetch(`${API}/api/user/${cachedUser._id}/uploads`),
        fetch(`${API}/api/user/${cachedUser._id}/downloads`, { headers: auth }),
        fetch(`${API}/api/user/${cachedUser._id}/favorites`, { headers: auth }),
      ]);

      if (fresh.status === "fulfilled" && fresh.value.ok) {
        const data = await fresh.value.json();
        if (data?._id) {
          setUser(data);
          localStorage.setItem("user", JSON.stringify(data));
        }
      }
      const results = [uploaded, downloaded, liked];
      const values = await Promise.all(results.map(async (r) => {
        if (r.status !== "fulfilled" || !r.value.ok) return null;
        const data = await r.value.json();
        return Array.isArray(data) ? data.length : null;
      }));
      setCounts((old) => ({
        uploads: values[0] ?? old.uploads,
        downloads: values[1] ?? old.downloads,
        favorites: values[2] ?? old.favorites,
      }));
    } catch (error) {
      console.error("Profile loading error:", error);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
    const handleUpdated = (event) => {
      if (event.detail?._id) {
        setUser(event.detail);
        localStorage.setItem("user", JSON.stringify(event.detail));
      } else {
        fetchUserData();
      }
    };
    const refresh = () => fetchUserData();
    window.addEventListener("profileUpdated", handleUpdated);
    ["uploadSuccess", "downloadSuccess", "favoriteChanged", "userLoggedIn"].forEach((name) => {
      window.addEventListener(name, refresh);
    });
    return () => {
      window.removeEventListener("profileUpdated", handleUpdated);
      ["uploadSuccess", "downloadSuccess", "favoriteChanged", "userLoggedIn"].forEach((name) => {
        window.removeEventListener(name, refresh);
      });
    };
  }, [fetchUserData]);

  useEffect(() => {
    if (!showEditModal) return;
    const handleEscape = (event) => {
      if (event.key === "Escape") setShowEditModal(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showEditModal]);

  const handleUpdateProfile = (updatedUser) => {
    if (updatedUser?._id) {
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
    setShowEditModal(false);
  };

  const tabs = [
    { id: "uploads", label: "เพลงที่อัปโหลด", count: counts.uploads, icon: <FiMusic /> },
    { id: "downloads", label: "ประวัติดาวน์โหลด", count: counts.downloads, icon: <FiDownload /> },
    { id: "favorites", label: "รายการโปรด", count: counts.favorites, icon: <FiHeart /> },
  ];

  const renderTabContent = () => {
    if (activeTab === "uploads") return <ProfileUpload />;
    if (activeTab === "downloads") return <ProfileDownload />;
    return <ProfileFavorites />;
  };

  if (!user?._id) {
    return (
      <main className="ssp-profile-page">
        <div className="ssp-shell">
          <div className="ssp-guest-panel">
            <FiHeadphones />
            <h1>พื้นที่เพลงของคุณ</h1>
            <p>เข้าสู่ระบบเพื่อดูโปรไฟล์ เพลงที่อัปโหลด และรายการโปรด</p>
            <button type="button" onClick={() => navigate("/login")}>เข้าสู่ระบบ <FiArrowRight /></button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="ssp-profile-page">
      <div className="ssp-shell">
        <section className="ssp-profile-hero" aria-label="ข้อมูลโปรไฟล์">
          <div className="ssp-hero-topline">
            <span><i /> SoundSmile / MY PROFILE</span>
            <span>CREATOR SPACE — 01 / 03</span>
          </div>

          <div className="ssp-hero-content">
            <div className="ssp-hero-copy">
              <span className="ssp-hero-eyebrow">WELCOME TO YOUR SPACE</span>
              <h1>Every sound <span>starts here.</span></h1>
              <p>โปรไฟล์ของคุณคือพื้นที่เก็บผลงาน เสียงที่ชื่นชอบ และเรื่องราวของคุณบน SoundSmile</p>
              <div className="ssp-hero-discover"><FiHeadphones /> LISTEN · CREATE · SHARE</div>
            </div>

            <div className="ssp-identity-card">
              <div className="ssp-identity-top"><span>YOUR CREATOR PROFILE</span><span className="ssp-live-dot" /></div>
              <div className="ssp-identity-main">
                <div className="ssp-avatar-wrap">
                  <img
                    className="ssp-avatar"
                    src={imageUrl(user.avatar || user.picture)}
                    onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = defaultAvatar; }}
                    alt={`รูปโปรไฟล์ของ ${user.username || "สมาชิก"}`}
                  />
                  <button
                    type="button"
                    className="ssp-avatar-pencil"
                    aria-label="แก้ไขโปรไฟล์"
                    title="คลิกเพื่อแก้ไขโปรไฟล์"
                    onClick={() => setShowEditModal(true)}
                  ><FiEdit2 /></button>
                </div>
                <div className="ssp-identity-text">
                  <span className="ssp-member-chip">{user.plan || "FREE"} MEMBER</span>
                  <h2>{user.username || "Music Lover"}</h2>
                  <p>{user.email || ""}</p>
                </div>
              </div>
              <p className="ssp-identity-bio">{user.bio || "เล่าเรื่องราวของคุณได้ โดยกดรูปดินสอที่รูปโปรไฟล์"}</p>
              <div className="ssp-identity-bottom">
                <div className="ssp-profile-socials">
                  {user.facebook && <a href={user.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" title="Facebook"><FaFacebook /></a>}
                  {user.instagram && <a href={user.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" title="Instagram"><FaInstagram /></a>}
                  {user.tiktok && <a href={user.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok" title="TikTok"><SiTiktok /></a>}
                  {!user.facebook && !user.instagram && !user.tiktok && <span className="ssp-social-muted">เพิ่มลิงก์ Social Media ได้ในโปรไฟล์</span>}
                </div>
                <span className="ssp-edit-hint"><FiCamera /> กดดินสอที่รูปเพื่อแก้ไข</span>
              </div>
            </div>
          </div>
          <div className="ssp-hero-bottomline"><span>YOUR PERSONAL MUSIC SPACE</span><span>SoundSmile / COMMUNITY</span></div>
        </section>

        <section className="ssp-overview" aria-label="สรุปผลงาน">
          <div className="ssp-section-heading">
            <div>
              <span className="ssp-section-kicker">ACCOUNT OVERVIEW</span>
              <h2>ภาพรวมโปรไฟล์ของคุณ</h2>
              <p>ทุกเสียงที่คุณสร้างและบันทึกไว้ รวมอยู่ที่นี่</p>
            </div>
          </div>
          <div className="ssp-stat-grid">
            <div className="ssp-stat-card"><span className="ssp-stat-icon"><FiMusic /></span><div><span>เพลงที่อัปโหลด</span><strong><CountUp value={counts.uploads} /></strong><small>UPLOADS</small></div></div>
            <div className="ssp-stat-card"><span className="ssp-stat-icon"><FiDownload /></span><div><span>ประวัติดาวน์โหลด</span><strong><CountUp value={counts.downloads} /></strong><small>DOWNLOADS</small></div></div>
            <div className="ssp-stat-card"><span className="ssp-stat-icon"><FiHeart /></span><div><span>เพลงที่ชื่นชอบ</span><strong><CountUp value={counts.favorites} /></strong><small>FAVORITES</small></div></div>
          </div>
        </section>

        <section className="ssp-library" aria-label="คลังเพลงของฉัน">
          <div className="ssp-section-heading ssp-library-heading">
            <div>
              <span className="ssp-section-kicker">YOUR COLLECTION</span>
              <h2>My Music Library</h2>
              <p>จัดการเพลงที่อัปโหลด ดาวน์โหลด และบันทึกเป็นรายการโปรดได้ในที่เดียว</p>
            </div>
            <span className="ssp-library-mark"><FiMusic /></span>
          </div>
          <div className="ssp-library-panel">
            <div className="ssp-tab-list" role="tablist" aria-label="เลือกหมวดคลังเพลง">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  id={`ssp-tab-${tab.id}`}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls="ssp-library-content"
                  className={`ssp-tab ${activeTab === tab.id ? "is-active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.icon}<span>{tab.label}</span><b>{tab.count}</b>
                </button>
              ))}
            </div>
            <div id="ssp-library-content" role="tabpanel" aria-labelledby={`ssp-tab-${activeTab}`} className="ssp-tab-content">
              {renderTabContent()}
            </div>
          </div>
        </section>
      </div>

      {editModalMounted && (
        <div className={`ssp-modal-overlay${editModalClosing ? " is-closing" : ""}`} role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setShowEditModal(false);
        }}>
          <div className="ssp-modal-panel" role="dialog" aria-modal="true" aria-label="แก้ไขโปรไฟล์">
            <button type="button" className="ssp-modal-close" aria-label="ปิด" onClick={() => setShowEditModal(false)}><FiX /></button>
            <EditProfile onClose={() => setShowEditModal(false)} onUpdate={handleUpdateProfile} />
          </div>
        </div>
      )}
    </main>
  );
}

export default Profile;
