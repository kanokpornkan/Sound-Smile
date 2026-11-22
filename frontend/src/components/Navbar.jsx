import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { io } from "socket.io-client";
import {
  FaArrowRight,
  FaBars,
  FaBell,
  FaChartLine,
  FaChevronDown,
  FaCloudUploadAlt,
  FaCrown,
  FaHome,
  FaSignOutAlt,
  FaTimes,
  FaUserCircle,
} from "react-icons/fa";
import logo from "../assets/soundsmile-logo.png";
import "./Navbar.css";

const API_URL = "http://localhost:5000";
const defaultAvatar =
  "https://cdn-icons-png.flaticon.com/512/847/847969.png";

// โควตาคงเหลือ = สิทธิ์ทั้งหมด - จำนวนที่ใช้ไป (ตาม Backend)
// ไม่แสดง 0 ในระหว่างกำลังโหลด เพื่อไม่ให้ผู้ใช้เข้าใจว่าเครดิตหมด
const getRemaining = (used, max, isAdmin = false) => {
  if (isAdmin) return "∞"; // Backend อนุญาตให้ admin ไม่จำกัด
  const usedNumber = Number(used);
  const maxNumber = Number(max);
  if (!Number.isFinite(usedNumber) || !Number.isFinite(maxNumber)) return null;
  return Math.max(0, maxNumber - usedNumber);
};

const formatCredit = (value) =>
  value == null ? "—" : value === "∞" ? "∞" : value.toLocaleString("th-TH");

function Navbar() {
  const [user, setUser] = useState(null);
  const [limits, setLimits] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const socketRef = useRef(null);
  const adminRef = useRef(null);
  const notificationRef = useRef(null);
  const accountRef = useRef(null);
  const headerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Navbar เปลี่ยนสถานะอย่างนุ่มนวลเมื่อเลื่อนหน้าจอ (เงาเข้มขึ้น + โลโก้ย่อเล็กน้อย)
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setIsScrolled(window.scrollY > 12);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const fetchLimits = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/user/${id}/limits`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // ป้องกัน request ที่กลับมาหลัง Logout / เปลี่ยนบัญชี
      try {
        const current = JSON.parse(localStorage.getItem("user") || "null");
        if (current?._id === id) setLimits(data);
      } catch {
        setLimits(null);
      }
    } catch (err) {
      console.error("Error fetching limits:", err);
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await fetch(`${API_URL}/api/notifications`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const notifWithUnread = (Array.isArray(data) ? data : []).map((n) => ({
        ...n,
        unread: true,
      }));
      setNotifications(notifWithUnread);
      setUnreadCount(notifWithUnread.filter((n) => n.unread).length);
    } catch (err) {
      console.error("Error loading notifications:", err);
    }
  };

  useEffect(() => {
    const updateUserFromLocalStorage = () => {
      const savedUser = localStorage.getItem("user");
      let parsed = null;

      if (savedUser) {
        try {
          parsed = JSON.parse(savedUser);
        } catch (err) {
          console.error("Invalid saved user:", err);
        }
      }

      if (parsed?._id) {
        setUser(parsed);
        fetchLimits(parsed._id);
        loadNotifications();

        if (!socketRef.current) {
          socketRef.current = io(API_URL);
          socketRef.current.on("notification", (notif) => {
            setNotifications((prev) => [{ ...notif, unread: true }, ...prev]);
            setUnreadCount((prev) => prev + 1);
            // Backend ส่ง notification หลังมีการอัปโหลด/ดาวน์โหลดสำเร็จ
            fetchLimits(parsed._id);
          });
        }
      } else {
        setUser(null);
        setLimits(null);
        setNotifications([]);
        setUnreadCount(0);
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      }
    };

    updateUserFromLocalStorage();

    // เก็บระบบ Google Login Callback เดิมไว้
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("token", token);
      fetch(`${API_URL}/auth/user`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Cannot load Google login user");
          return res.json();
        })
        .then((data) => {
          if (!data?._id) throw new Error("Invalid Google login user");
          localStorage.setItem("user", JSON.stringify(data));
          window.dispatchEvent(new Event("userLoggedIn"));
          updateUserFromLocalStorage();
          navigate("/");
        })
        .catch((err) => console.error("Google login failed:", err));
    }

    const handleLoginEvent = () => updateUserFromLocalStorage();
    const handleProfileUpdated = (event) => {
      if (event.detail) {
        setUser(event.detail);
        if (event.detail._id) fetchLimits(event.detail._id);
      }
    };

    window.addEventListener("userLoggedIn", handleLoginEvent);
    window.addEventListener("userLoggedOut", handleLoginEvent);
    window.addEventListener("profileUpdated", handleProfileUpdated);

    return () => {
      window.removeEventListener("userLoggedIn", handleLoginEvent);
      window.removeEventListener("userLoggedOut", handleLoginEvent);
      window.removeEventListener("profileUpdated", handleProfileUpdated);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [navigate]);

  // อัปเดตยอดเครดิตเมื่อกลับมาที่แท็บ / เปลี่ยนหน้า / อัปโหลด / ดาวน์โหลด / Redeem Code
  // ไม่ต้องรีโหลดทั้งเว็บไซต์หรือปรับ Backend
  useEffect(() => {
    const refreshCredits = () => {
      try {
        const saved = JSON.parse(localStorage.getItem("user") || "null");
        if (saved?._id) fetchLimits(saved._id);
        else setLimits(null);
      } catch {
        setLimits(null);
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") refreshCredits();
    };
    refreshCredits();
    window.addEventListener("focus", refreshCredits);
    window.addEventListener("storage", refreshCredits);
    window.addEventListener("newNotification", refreshCredits);
    window.addEventListener("quotaUpdated", refreshCredits);
    window.addEventListener("uploadSuccess", refreshCredits);
    window.addEventListener("downloadSuccess", refreshCredits);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", refreshCredits);
      window.removeEventListener("storage", refreshCredits);
      window.removeEventListener("newNotification", refreshCredits);
      window.removeEventListener("quotaUpdated", refreshCredits);
      window.removeEventListener("uploadSuccess", refreshCredits);
      window.removeEventListener("downloadSuccess", refreshCredits);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [location.pathname]);

  // เปลี่ยนหน้าแล้วปิดเมนูทั้งหมด
  useEffect(() => {
    setShowAdminMenu(false);
    setShowNotifications(false);
    setShowAccountMenu(false);
    setShowMobileMenu(false);
  }, [location.pathname]);

  // คลิกข้างนอกหรือกด Esc จะปิด dropdown
  useEffect(() => {
    const handlePointerDown = (event) => {
      if (adminRef.current && !adminRef.current.contains(event.target)) {
        setShowAdminMenu(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setShowAccountMenu(false);
      }
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setShowMobileMenu(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setShowAdminMenu(false);
        setShowNotifications(false);
        setShowAccountMenu(false);
        setShowMobileMenu(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setShowAccountMenu(false);
    setShowMobileMenu(false);
    window.dispatchEvent(new Event("userLoggedOut"));

    Swal.fire({
      icon: "success",
      title: "ออกจากระบบเรียบร้อย",
      text: "🚪 คุณได้ออกจากระบบแล้ว",
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: "top-end",
    });
    navigate("/");
  };

  const isAdminUser = user?.role === "admin";
  const remainingUploads = limits
    ? getRemaining(limits.uploadCount, limits.maxUpload, isAdminUser)
    : null;
  const remainingDownloads = limits
    ? getRemaining(limits.downloadCount, limits.maxDownload, isAdminUser)
    : null;

  const avatarUrl = user?.avatar || user?.picture || defaultAvatar;
  const displayName = user?.username || user?.email || "My account";
  const navLinkClass = ({ isActive }) =>
    `ssn-link${isActive ? " ssn-link-active" : ""}`;

  return (
    <header className={`ssn-shell${isScrolled ? " is-scrolled" : ""}`} ref={headerRef}>
      <div className="ssn-pill">
        {/* Brand: โลโก้ SoundSmile */}
        <Link to="/" className="ssn-brand" aria-label="SoundSmile — Home">
          <img className="ssn-brand-logo" src={logo} alt="SoundSmile" />
        </Link>

        {/* Desktop + Mobile navigation */}
        <nav className={`ssn-nav${showMobileMenu ? " ssn-nav-open" : ""}`} aria-label="Main menu">
          <NavLink to="/" end className={navLinkClass}>
            <FaHome className="ssn-mobile-icon" /> Home
          </NavLink>

          <NavLink to="/premium" className={navLinkClass}>
            <FaCrown className="ssn-mobile-icon" /> Premium
          </NavLink>

          <NavLink to="/analytics" className={navLinkClass}>
            <FaChartLine className="ssn-mobile-icon" /> Your Analytics
          </NavLink>

          {user && (
            <NavLink to="/upload" className="ssn-link ssn-mobile-only">
              <FaCloudUploadAlt className="ssn-mobile-icon" /> Upload Sound
            </NavLink>
          )}

          {/* Admin functionality เดิมครบ */}
          {user?.role === "admin" && (
            <div className="ssn-dropdown-root" ref={adminRef}>
              <button
                type="button"
                className={`ssn-link ssn-dropdown-toggle${showAdminMenu ? " ssn-link-active" : ""}`}
                onClick={() => {
                  setShowAdminMenu((v) => !v);
                  setShowNotifications(false);
                  setShowAccountMenu(false);
                }}
                aria-expanded={showAdminMenu}
                aria-haspopup="menu"
              >
                Admin <FaChevronDown size={10} />
              </button>
              {showAdminMenu && (
                <div className="ssn-dropdown ssn-admin-dropdown" role="menu">
                  <Link to="/admin" role="menuitem">Admin Panel</Link>
                  <Link to="/admin/songs" role="menuitem">Songs Management</Link>
                  <Link to="/admin/analytics" role="menuitem">Analytics</Link>
                  <Link to="/admin/generate-codes" role="menuitem">Generate Code</Link>
                  <Link to="/admin/code-history" role="menuitem">Redeem Code History</Link>
                </div>
              )}
            </div>
          )}

          {!user && (
            <>
              <NavLink to="/register" className="ssn-link ssn-mobile-only">
                Register
              </NavLink>
              <NavLink to="/login" className="ssn-link ssn-mobile-only">
                Login
              </NavLink>
            </>
          )}
          {user && (
            <Link to="/profile" className="ssn-link ssn-mobile-only">
              <FaUserCircle className="ssn-mobile-icon" /> My Profile
            </Link>
          )}
          {user && (
            <button type="button" className="ssn-link ssn-mobile-only ssn-mobile-logout" onClick={handleLogout}>
              <FaSignOutAlt className="ssn-mobile-icon" /> Logout
            </button>
          )}

          {user && limits && (
            <div className="ssn-mobile-quota">
              <span>เครดิตอัปโหลดคงเหลือ <b>{formatCredit(remainingUploads)}</b></span>
              <span>เครดิตดาวน์โหลดคงเหลือ <b>{formatCredit(remainingDownloads)}</b></span>
              <small>Member: {user.plan || "FREE"}</small>
            </div>
          )}
        </nav>

        {/* Right-side actions */}
        <div className="ssn-actions">
          {user && (
            <div className="ssn-dropdown-root" ref={notificationRef}>
              <button
                className="ssn-icon-btn"
                type="button"
                onClick={() => {
                  setShowNotifications((v) => !v);
                  setShowAccountMenu(false);
                  setShowAdminMenu(false);
                }}
                aria-label={`Notifications${unreadCount ? ` (${unreadCount})` : ""}`}
                aria-expanded={showNotifications}
                aria-haspopup="true"
                data-tooltip="การแจ้งเตือน"
              >
                <FaBell size={17} />
                {unreadCount > 0 && <span className="ssn-notification-dot" />}
              </button>
              {showNotifications && (
                <div className="ssn-dropdown ssn-notification-dropdown">
                  <div className="ssn-popup-heading">Notifications</div>
                  {notifications.length === 0 ? (
                    <p className="ssn-notification-empty">No notifications</p>
                  ) : (
                    <div className="ssn-notification-list">
                      {notifications.map((n, idx) => (
                        <div key={n._id || idx} className={`ssn-notification-item${n.unread ? " is-unread" : ""}`}>
                          {n.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {user ? (
            <div className="ssn-dropdown-root ssn-account-root" ref={accountRef}>
              <button
                type="button"
                className="ssn-account-btn"
                onClick={() => {
                  setShowAccountMenu((v) => !v);
                  setShowNotifications(false);
                  setShowAdminMenu(false);
                }}
                aria-label="Open account menu"
                aria-haspopup="menu"
                aria-expanded={showAccountMenu}
                data-tooltip="บัญชีของฉัน"
              >
                <img src={avatarUrl} alt="Profile" className="ssn-avatar" />
                <FaChevronDown size={10} className="ssn-account-chevron" />
              </button>
              {showAccountMenu && (
                <div className="ssn-dropdown ssn-account-dropdown" role="menu">
                  <div className="ssn-account-summary">
                    <strong>{displayName}</strong>
                    <span className="ssn-plan-label">{user.plan || "FREE"} Member</span>
                    {user.planExpire && (
                      <small>Expire: {new Date(user.planExpire).toLocaleDateString()}</small>
                    )}
                  </div>
                  {limits && (
                    <div className="ssn-account-usage">
                      <span>อัปโหลดคงเหลือ <b>{formatCredit(remainingUploads)}</b></span>
                      <span>ดาวน์โหลดคงเหลือ <b>{formatCredit(remainingDownloads)}</b></span>
                      <small>ใช้ไป: อัปโหลด {limits.uploadCount ?? 0}/{limits.maxUpload ?? "-"} · ดาวน์โหลด {limits.downloadCount ?? 0}/{limits.maxDownload ?? "-"}</small>
                    </div>
                  )}
                  <Link to="/profile" role="menuitem"><FaUserCircle /> My Profile</Link>
                  <button type="button" role="menuitem" onClick={handleLogout} className="ssn-signout">
                    <FaSignOutAlt /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/register" className="ssn-register-link">Register</Link>
          )}

          {user ? (
            <Link to="/upload" className="ssn-primary-cta">
              <FaCloudUploadAlt /> <span>Upload Sound</span> <FaArrowRight size={12} />
            </Link>
          ) : (
            <Link to="/login" className="ssn-primary-cta">
              <span>Login</span> <FaArrowRight size={12} />
            </Link>
          )}

          <button
            className="ssn-mobile-toggle"
            type="button"
            aria-label={showMobileMenu ? "Close menu" : "Open menu"}
            aria-expanded={showMobileMenu}
            onClick={() => setShowMobileMenu((v) => !v)}
          >
            {showMobileMenu ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
