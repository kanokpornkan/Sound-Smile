import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaCheck,
  FaCloudUploadAlt,
  FaCompactDisc,
  FaCrown,
  FaDownload,
  FaHeadphones,
  FaMicrophoneAlt,
  FaTicketAlt,
  FaTimes,
} from "react-icons/fa";
import "./member.css";
import useModalPresence from "../motion/useModalPresence";

const API_URL = "http://localhost:5000";
// รหัสแผนต้องตรงกับค่า plan ที่ Backend เก็บใน MongoDB
const PLANS = [
  {
    id: "FREE",
    name: "Newbie",
    caption: "สำหรับการเริ่มต้น",
    price: "Free",
    interval: "ตลอดไป",
    downloads: "5 เครดิตดาวน์โหลด / สัปดาห์",
    uploads: "3 เครดิตอัปโหลดเริ่มต้น",
    icon: FaCompactDisc,
    badge: "STARTER",
    description: "เริ่มสำรวจเสียงและสร้างผลงานของคุณ",
  },
  {
    id: "SOCOZY",
    name: "So Cozy",
    caption: "สำหรับครีเอเตอร์ทั่วไป",
    price: "฿150",
    interval: "/ เดือน",
    downloads: "300 เครดิตดาวน์โหลด",
    uploads: "100 เครดิตอัปโหลด",
    icon: FaMicrophoneAlt,
    badge: "CREATOR",
    description: "พื้นที่มากขึ้นสำหรับไอเดียใหม่ ๆ",
  },
  {
    id: "SUPERCOZY",
    name: "Super Cozy",
    caption: "สำหรับคนที่สร้างสรรค์ต่อเนื่อง",
    price: "฿300",
    interval: "/ เดือน",
    downloads: "600 เครดิตดาวน์โหลด",
    uploads: "200 เครดิตอัปโหลด",
    icon: FaHeadphones,
    badge: "RECOMMENDED",
    description: "ตัวเลือกสำหรับผลงานที่เติบโตขึ้น",
    featured: true,
  },
  {
    id: "COZIEST",
    name: "Coziest!",
    caption: "สำหรับผู้ใช้งานหนัก",
    price: "฿1,000",
    interval: "/ เดือน",
    downloads: "สูงสุด 999,999 เครดิตดาวน์โหลด",
    uploads: "สูงสุด 999,999 เครดิตอัปโหลด",
    icon: FaCrown,
    badge: "ULTIMATE",
    description: "โควตาขนาดใหญ่สำหรับทุกโปรเจกต์",
  },
];

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function remaining(used, limit) {
  if (!Number.isFinite(Number(used)) || !Number.isFinite(Number(limit))) {
    return null;
  }
  return Math.max(0, Number(limit) - Number(used));
}

function displayNumber(value) {
  return value == null ? "—" : Number(value).toLocaleString("th-TH");
}

function Member() {
  const [user, setUser] = useState(readStoredUser);
  const [limits, setLimits] = useState(null);
  const [showCodeBox, setShowCodeBox] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [codeBoxMounted, codeBoxClosing] = useModalPresence(showCodeBox);
  const [redeemError, setRedeemError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // โหลดข้อมูลจริงจาก Backend หลังล็อกอินและเมื่อข้อมูลโปรไฟล์เปลี่ยน
  const refreshUserData = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setLimits(null);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Unable to load account");

      const freshUser = await response.json();
      if (!freshUser?._id) throw new Error("Invalid account");

      setUser(freshUser);
      localStorage.setItem("user", JSON.stringify(freshUser));

      const limitResponse = await fetch(
        `${API_URL}/api/user/${freshUser._id}/limits`
      );
      if (!limitResponse.ok) throw new Error("Unable to load credits");
      setLimits(await limitResponse.json());
    } catch (err) {
      // แสดงข้อมูลที่เคยโหลดไว้ได้ หากเซิร์ฟเวอร์ไม่พร้อมชั่วคราว
      console.error("Member data load error:", err);
    }
  }, []);

  useEffect(() => {
    refreshUserData();

    const onProfileUpdated = (event) => {
      if (event.detail?._id) setUser(event.detail);
      refreshUserData();
    };
    const onLoggedIn = () => refreshUserData();
    const onLoggedOut = () => {
      setUser(null);
      setLimits(null);
    };

    window.addEventListener("profileUpdated", onProfileUpdated);
    window.addEventListener("userLoggedIn", onLoggedIn);
    window.addEventListener("userLoggedOut", onLoggedOut);

    return () => {
      window.removeEventListener("profileUpdated", onProfileUpdated);
      window.removeEventListener("userLoggedIn", onLoggedIn);
      window.removeEventListener("userLoggedOut", onLoggedOut);
    };
  }, [refreshUserData]);

  useEffect(() => {
    if (!showCodeBox) return;
    const onEscape = (event) => {
      if (event.key === "Escape" && !redeeming) setShowCodeBox(false);
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [showCodeBox, redeeming]);

  const currentPlanId = (user?.plan || "FREE").toUpperCase();
  const currentPlan = PLANS.find((plan) => plan.id === currentPlanId) || PLANS[0];

  const downloadRemaining = remaining(limits?.downloadCount, limits?.maxDownload);
  const uploadRemaining = remaining(limits?.uploadCount, limits?.maxUpload);

  let expiryText = "";
  if (user?.planExpire && currentPlanId !== "FREE") {
    const expiry = new Date(user.planExpire);
    if (!Number.isNaN(expiry.getTime())) {
      const daysLeft = Math.ceil((expiry.getTime() - Date.now()) / 86400000);
      expiryText = daysLeft < 0
        ? "แพ็กเกจหมดอายุแล้ว"
        : daysLeft === 0
          ? "แพ็กเกจหมดอายุวันนี้"
          : `เหลือเวลา ${daysLeft} วัน`;
    }
  }

  const openRedeem = (planName = "") => {
    setSelectedPlan(planName);
    setCode("");
    setRedeemError("");
    setShowCodeBox(true);
  };

  const closeRedeem = () => {
    if (redeeming) return;
    setShowCodeBox(false);
    setCode("");
    setRedeemError("");
  };

  const submitCode = async (event) => {
    event.preventDefault();
    if (redeeming) return;

    const token = localStorage.getItem("token");
    if (!token || !user?._id) {
      setRedeemError("กรุณาเข้าสู่ระบบก่อนใช้รหัสแพ็กเกจ");
      return;
    }
    if (!code.trim()) {
      setRedeemError("กรุณากรอกรหัสแพ็กเกจ");
      return;
    }

    setRedeeming(true);
    setRedeemError("");

    try {
      // Backend ใช้ verifyToken จึงต้องส่ง Authorization ด้วยเสมอ
      const response = await fetch(`${API_URL}/api/redeem`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.message || "ไม่สามารถใช้รหัสได้ กรุณาลองใหม่");
      }

      setShowCodeBox(false);
      setCode("");
      setSuccessMessage("ใช้รหัสสำเร็จ! สิทธิ์สมาชิกของคุณได้รับการอัปเดตแล้ว");
      // /api/redeem ส่งเพียง success/message จึงดึง user ใหม่จาก Backend
      await refreshUserData();
      window.dispatchEvent(new Event("userLoggedIn"));
    } catch (err) {
      console.error("Redeem error:", err);
      setRedeemError(err.message || "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <main className="ssm-page">
      <div className="ssm-container">
        <section className="ssm-usage" aria-label="สรุปสิทธิ์ของบัญชี">
          <div className="ssm-usage-heading">
            <span className="ssm-small-eyebrow">Your Credits</span>
            <h2>เครดิตคงเหลือ</h2>
         
          </div>
          <div className="ssm-stats-grid">
            <div className="ssm-stat-card">
              <div className="ssm-stat-icon"><FaDownload aria-hidden="true" /></div>
              <div>
                <span>เครดิตดาวน์โหลดคงเหลือ</span>
                <strong>{displayNumber(downloadRemaining)}</strong>
                <small>จากทั้งหมด {displayNumber(limits?.maxDownload)} เครดิต</small>
              </div>
            </div>
            <div className="ssm-stat-card">
              <div className="ssm-stat-icon"><FaCloudUploadAlt aria-hidden="true" /></div>
              <div>
                <span>เครดิตอัปโหลดคงเหลือ</span>
                <strong>{displayNumber(uploadRemaining)}</strong>
                <small>จากทั้งหมด {displayNumber(limits?.maxUpload)} เครดิต</small>
              </div>
            </div>
            <div className="ssm-stat-card ssm-stat-plan">
              <div className="ssm-stat-icon"><FaCrown aria-hidden="true" /></div>
              <div>
                <span>แพ็กเกจของคุณ</span>
                <strong className="ssm-stat-plan-name">{user ? currentPlan.name : "—"}</strong>
                <small>{expiryText || (user ? "ดูรายละเอียดแพ็กเกจด้านล่าง" : "เข้าสู่ระบบเพื่อดูสิทธิ์")}</small>
              </div>
            </div>
          </div>
        </section>

        <section className="ssm-packages" id="ssm-plans" aria-labelledby="ssm-plans-title">
          <div className="ssm-section-intro">
            <div>
              <span className="ssm-small-eyebrow">YOU PLAN</span>
              <h2 id="ssm-plans-title">เลือกแพ็กเกจที่เหมาะกับคุณ พร้อมเติบโตไปกับทุกเสียงที่สร้าง</h2>
          
            </div>
            <span className="ssm-plan-summary">4 MEMBERSHIP OPTIONS</span>
          </div>

          <div className="ssm-plan-grid">
            {PLANS.map((plan, index) => {
              const PlanIcon = plan.icon;
              const isCurrent = Boolean(user) && currentPlanId === plan.id;
              return (
                <article
                  key={plan.id}
                  className={[
                    "ssm-plan-card",
                    plan.featured ? "ssm-plan-featured" : "",
                    isCurrent ? "ssm-plan-active" : "",
                  ].filter(Boolean).join(" ")}
                >
                  <div className="ssm-card-topline">
                    <span>0{index + 1} / {plan.badge}</span>
                    {isCurrent && <span className="ssm-active-label">CURRENT</span>}
                    {!isCurrent && plan.featured && (
                      <span className="ssm-featured-label">แนะนำ</span>
                    )}
                  </div>

                  <div className="ssm-plan-symbol"><PlanIcon aria-hidden="true" /></div>
                  <div className="ssm-plan-heading">
                    <h3>{plan.name}</h3>
                    <p>{plan.caption}</p>
                  </div>
                  <div className="ssm-price-row">
                    <strong>{plan.price}</strong>
                    <span>{plan.interval}</span>
                  </div>
                  <p className="ssm-plan-description">{plan.description}</p>
                  <div className="ssm-card-rule" />
                  <ul className="ssm-plan-features">
                    <li><FaCheck aria-hidden="true" />{plan.downloads}</li>
                    <li><FaCheck aria-hidden="true" />{plan.uploads}</li>
                    <li><FaCheck aria-hidden="true" />เข้าถึงคลังเสียงของ SoundSmile</li>
                  </ul>

                  {isCurrent ? (
                    <span className="ssm-plan-button ssm-plan-disabled">
                      <FaCheck aria-hidden="true" /> แพ็กเกจปัจจุบัน
                    </span>
                  ) : plan.id === "FREE" ? (
                    <span className="ssm-plan-button ssm-plan-free">
                      FREE PLAN
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="ssm-plan-button ssm-plan-action"
                      onClick={() => openRedeem(plan.name)}
                    >
                      ใช้รหัสแพ็กเกจ <FaArrowRight aria-hidden="true" />
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <section className="ssm-redeem-banner">
          <div className="ssm-redeem-icon"><FaTicketAlt aria-hidden="true" /></div>
          <div className="ssm-redeem-copy">
            <span>HAVE A REDEEM CODE?</span>
            <h2>มีรหัสแพ็กเกจอยู่แล้วใช่ไหม?</h2>
            <p>กรอกรหัสเพื่อเปิดใช้งานสิทธิ์สมาชิกของคุณได้ที่นี่</p>
          </div>
          <button type="button" className="ssm-redeem-open" onClick={() => openRedeem()}>
            Redeem Code <FaArrowRight aria-hidden="true" />
          </button>
        </section>

        {successMessage && (
          <div className="ssm-success" role="status">
            <FaCheck aria-hidden="true" />
            <span>{successMessage}</span>
            <button type="button" onClick={() => setSuccessMessage("")} aria-label="ปิดข้อความ">
              <FaTimes />
            </button>
          </div>
        )}
      </div>

      {codeBoxMounted && (
        <div
          className={`ssm-modal-backdrop${codeBoxClosing ? " is-closing" : ""}`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeRedeem();
          }}
        >
          <div
            className="ssm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ssm-modal-title"
          >
            <button type="button" className="ssm-modal-close" onClick={closeRedeem} disabled={redeeming} aria-label="ปิดหน้าต่าง">
              <FaTimes aria-hidden="true" />
            </button>
            <div className="ssm-modal-icon"><FaTicketAlt aria-hidden="true" /></div>
            <span className="ssm-small-eyebrow">ACTIVATE MEMBERSHIP</span>
            <h2 id="ssm-modal-title">Redeem your code</h2>
            <p>
              {selectedPlan
                ? `คุณเลือก ${selectedPlan} — ใส่รหัสที่ได้รับเพื่อเปิดใช้งานแพ็กเกจ`
                : "ใส่รหัสที่ได้รับเพื่อเปิดใช้งานแพ็กเกจของคุณ"}
            </p>
            <form onSubmit={submitCode}>
              <label htmlFor="ssm-redeem-code">รหัสแพ็กเกจ</label>
              <input
                id="ssm-redeem-code"
                autoFocus
                type="text"
                autoComplete="off"
                placeholder="เช่น SOCOZY-XXXXXX"
                value={code}
                disabled={redeeming}
                onChange={(event) => {
                  setCode(event.target.value);
                  setRedeemError("");
                }}
              />
              {redeemError && <p className="ssm-form-error" role="alert">{redeemError}</p>}
              {!user && (
                <Link className="ssm-modal-login" to="/login" onClick={closeRedeem}>
                  ไปหน้าเข้าสู่ระบบ
                </Link>
              )}
              <button type="submit" className="ssm-modal-submit" disabled={redeeming}>
                {redeeming && <span className="ss-spinner" aria-hidden="true" />}
                {redeeming ? "กำลังตรวจสอบรหัส..." : "ยืนยันการใช้รหัส"}
                {!redeeming && <FaArrowRight aria-hidden="true" />}
              </button>
              <button type="button" className="ssm-modal-cancel" onClick={closeRedeem} disabled={redeeming}>
                ยกเลิก
              </button>
            </form>
            <small className="ssm-modal-tip">ระบบจะใช้แพ็กเกจตามประเภทของรหัสที่กรอก</small>
          </div>
        </div>
      )}
    </main>
  );
}

export default Member;
