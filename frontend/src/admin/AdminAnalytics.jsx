import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import "./AdminTheme.css";

const TABS = [
  { id: "all", label: "All" },
  { id: "uploads", label: "Uploads" },
  { id: "downloads", label: "Downloads" },
  { id: "users", label: "Users" },
];
const C = { uploads: "#38BDF8", downloads: "#7FA6F5", users: "#F472B6" };
const AXIS = { fontSize: 12, fill: "#DDE6F3" };
const GRID = "rgba(255,255,255,0.08)";
const TIP = {
  contentStyle: { background: "#041228", border: "1px solid rgba(255,255,255,.15)", borderRadius: 10, fontSize: 12 },
  labelStyle: { color: "#fff" },
  itemStyle: { color: "#DDE6F3" },
};

const shorten = (s, n = 8) => {
  const t = String(s ?? "");
  return t.length > n ? `${t.slice(0, n)}…` : t;
};
const shortDate = (d) => {
  const p = String(d ?? "").split("-"); // YYYY-MM-DD -> DD/MM
  return p.length === 3 ? `${p[2]}/${p[1]}` : d;
};

function AdminAnalytics() {
  const token = localStorage.getItem("token");
  const [tab, setTab] = useState("all");
  const [usersGrowth, setUsersGrowth] = useState([]);
  const [uploadsDownloads, setUploadsDownloads] = useState([]);
  const [topSongs, setTopSongs] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const auth = { headers: { Authorization: `Bearer ${token}` } };
        const usersRes = await axios.get("http://localhost:5000/api/admin/analytics/users-growth", auth);
        setUsersGrowth(usersRes.data);
        const udRes = await axios.get("http://localhost:5000/api/admin/analytics/uploads-downloads", auth);
        setUploadsDownloads(udRes.data);
        const topSongsRes = await axios.get("http://localhost:5000/api/admin/analytics/top-songs", auth);
        setTopSongs(topSongsRes.data);
      } catch (err) {
        console.error(err);
        alert("โหลดข้อมูล Analytics ไม่สำเร็จ");
      }
    };
    fetchData();
  }, [token]);

  // 1 จุดต่อ 1 วัน
  const growth = useMemo(() => {
    const byDate = {};
    usersGrowth.forEach((d) => { byDate[d.date] = d.totalUsers; });
    return Object.entries(byDate).map(([date, totalUsers]) => ({ date, totalUsers }));
  }, [usersGrowth]);

  // ผู้ใช้ที่ active สูงสุด 8 คน
  const activity = useMemo(
    () =>
      [...uploadsDownloads]
        .sort((a, b) => b.uploads + b.downloads - (a.uploads + a.downloads))
        .slice(0, 8),
    [uploadsDownloads]
  );

  const totalUsers = growth.length ? growth[growth.length - 1].totalUsers : 0;
  const totalUploads = uploadsDownloads.reduce((n, u) => n + (u.uploads || 0), 0);
  const totalDownloads = uploadsDownloads.reduce((n, u) => n + (u.downloads || 0), 0);

  const isUsers = tab === "users";
  const data = isUsers ? growth : activity;

  return (
    <div className="ss-admin ssa-dark">
      {/* HEADER */}
      <section className="ssd-hero">
        <div>
          <span className="ssd-badge">SOUNDSMILE</span>
          <h1>admin performance</h1>
          <p>ภาพรวมทั้งระบบ: ผู้ใช้ {totalUsers} คน · อัปโหลด {totalUploads} เพลง · ดาวน์โหลด {totalDownloads} ครั้ง</p>
        </div>
        <div className="ssd-stats">
          <div><span>Users</span><strong>{totalUsers}</strong></div>
          <div className="ssd-divider" />
          <div><span>Uploads</span><strong>{totalUploads}</strong></div>
          <div className="ssd-divider" />
          <div><span>Downloads</span><strong>{totalDownloads}</strong></div>
        </div>
      </section>

      <div className="ssd-grid">
        {/* CHART */}
        <section className="ssd-card">
          <h2>Overall Performance</h2>
          <p className="ssd-sub">
            {isUsers ? "จำนวนผู้ใช้สะสมรายวัน" : "สถิติอัปโหลด / ดาวน์โหลด ของผู้ใช้ที่ active สูงสุด 8 คน"}
          </p>

          <div className="ssd-pills" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className={`ssd-pill${tab === t.id ? " active" : ""}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="ssd-panel">
            {data.length === 0 ? (
              <div className="ssa-chart-empty"><b>♫</b>ยังไม่มีข้อมูล</div>
            ) : (
              <ResponsiveContainer>
                <LineChart data={data} margin={{ top: 8, right: 18, left: -12, bottom: 0 }}>
                  <CartesianGrid stroke={GRID} />
                  <XAxis
                    dataKey={isUsers ? "date" : "username"}
                    tick={AXIS}
                    interval={isUsers ? "preserveStartEnd" : 0}
                    tickFormatter={isUsers ? shortDate : (v) => shorten(v, 7)}
                  />
                  <YAxis tick={AXIS} allowDecimals={false} />
                  <Tooltip {...TIP} labelFormatter={isUsers ? shortDate : undefined} />
                  {tab === "all" && <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: "#DDE6F3" }} />}
                  {isUsers && (
                    <Line type="monotone" dataKey="totalUsers" name="ผู้ใช้ทั้งหมด" stroke={C.users}
                      strokeWidth={2.5} dot={{ r: 3.5 }} activeDot={{ r: 5 }} />
                  )}
                  {(tab === "all" || tab === "uploads") && (
                    <Line type="monotone" dataKey="uploads" name="Uploads" stroke={C.uploads}
                      strokeWidth={2.5} dot={{ r: 3.5 }} activeDot={{ r: 5 }} />
                  )}
                  {(tab === "all" || tab === "downloads") && (
                    <Line type="monotone" dataKey="downloads" name="Downloads" stroke={C.downloads}
                      strokeWidth={2.5} dot={{ r: 3.5 }} activeDot={{ r: 5 }} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* TOP SONGS */}
        <section className="ssd-card">
          <div className="ssd-head">
            <div>
              <h2>Top Songs</h2>
              <p className="ssd-sub">จัดอันดับเพลงที่ถูกดาวน์โหลดมากที่สุดใน SoundSmile</p>
            </div>
            <span className="ssd-top">Top {topSongs.length}</span>
          </div>

          {topSongs.length === 0 ? (
            <div className="ssd-panel" style={{ height: 200 }}>
              <div className="ssa-chart-empty"><b>♫</b>ยังไม่มีข้อมูล</div>
            </div>
          ) : (
            <div className="ssd-list">
              {topSongs.map((s, i) => (
                <div className="ssd-row" key={`${s.title}-${i}`}>
                  <span className="ssd-rank">#{i + 1}</span>
                  <div className="ssd-info">
                    <strong title={s.title}>{s.title}</strong>
                    <small>{[s.artist, `${s.downloads ?? 0} downloads`].filter(Boolean).join(" · ")}</small>
                  </div>
                  <span className="ssd-heart">♥ {s.likes ?? 0}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default AdminAnalytics;