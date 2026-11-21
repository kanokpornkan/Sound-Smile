import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "./UserAnalytics.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const API_BASE = "http://localhost:5000";

function UserAnalytics() {
  const [analyticsData, setAnalyticsData] = useState({
    uploads: 0,
    downloads: 0,
    uploadLimit: 0,
    downloadLimit: 0,
    topSongs: [],
  });
  const [topFavorites, setTopFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError("");

        // ดึงข้อมูล analytics เดิม (uploads / downloads / limits / top songs)
        const resAnalytics = await fetch(`${API_BASE}/api/analytics/user`, {
          headers,
        });
        if (resAnalytics.ok) {
          const data = await resAnalytics.json();
          setAnalyticsData((prev) => ({
            ...prev,
            uploads: data.uploads ?? data.uploadCount ?? 0,
            downloads: data.downloads ?? data.downloadCount ?? 0,
            uploadLimit: data.uploadLimit ?? 0,
            downloadLimit: data.downloadLimit ?? 0,
            topSongs: Array.isArray(data.topSongs) ? data.topSongs : [],
          }));
        }

        // ดึงข้อมูลเพลงที่กดถูกใจมากสุด (Top Favorite Songs)
        const resFav = await fetch(`${API_BASE}/api/songs/top-likes`, {
          headers,
        });
        if (resFav.ok) {
          const favData = await resFav.json();
          const list = Array.isArray(favData)
            ? favData
            : Array.isArray(favData.songs)
            ? favData.songs
            : [];
          setTopFavorites(list);
        }
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setError("ไม่สามารถเชื่อมต่อข้อมูลจากเซิร์ฟเวอร์ได้");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const chartData = {
    labels: ["Uploads", "Downloads"],
    datasets: [
      {
        label: "count",
        data: [analyticsData.uploads, analyticsData.downloads],
        borderColor: "#4da3ff",
        backgroundColor: "rgba(77, 163, 255, 0.25)",
        pointBackgroundColor: "#63b3ed",
        pointBorderColor: "#041228",
        pointRadius: 5,
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#DDDDDD",
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#DDDDDD" },
        grid: { color: "rgba(221, 221, 221, 0.12)" },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: "#DDDDDD",
          stepSize: 1,
        },
        grid: { color: "rgba(221, 221, 221, 0.12)" },
      },
    },
  };

  return (
    <div className="analytics-page">
      <div className="analytics-container">
        <div className="analytics-header">
          <h1 className="analytics-title">Your Analytics</h1>
          <p className="analytics-subtitle">
            ภาพรวมการอัปโหลด ดาวน์โหลด และเพลงยอดนิยมที่ถูกใจมากสุด
          </p>
        </div>

        {error && <div className="analytics-alert">{error}</div>}

        {/* ส่วนบน: กราฟ Your Uploads / Downloads + ลิมิต */}
        <section className="analytics-card">
          <h2 className="section-heading">Your Uploads / Downloads</h2>

          <div className="chart-wrapper">
            <Line data={chartData} options={chartOptions} />
          </div>

          <div className="limit-summary">
            <span>
              Upload limit: <strong>{analyticsData.uploads} / {analyticsData.uploadLimit}</strong>
            </span>
            <span className="limit-divider">|</span>
            <span>
              Download limit: <strong>{analyticsData.downloads} / {analyticsData.downloadLimit}</strong>
            </span>
          </div>
        </section>

        {/* ส่วนล่าง: แบ่ง 2 คอลัมน์ ปรับโครงสร้างให้ดูบาลานซ์ขึ้น */}
        <div className="analytics-grid">
          {/* เนื้อหาเดิม: Top Songs in Platform */}
          <section className="analytics-card">
            <h2 className="section-heading">Top Songs in Platform</h2>
            {loading ? (
              <p className="empty-text">กำลังโหลดข้อมูล...</p>
            ) : analyticsData.topSongs.length === 0 ? (
              <p className="empty-text">ยังไม่มีข้อมูลเพลงในระบบ</p>
            ) : (
              <ul className="song-rank-list">
                {analyticsData.topSongs.map((song, index) => (
                  <li key={song._id || song.id || index} className="song-rank-item">
                    <span className="rank-badge">#{index + 1}</span>
                    <div className="song-info">
                      <span className="song-title">{song.title || song.name || "Untitled"}</span>
                      <span className="song-meta">
                        {song.artist || song.uploader || "Unknown Artist"}
                      </span>
                    </div>
                    <span className="song-stat">
                      {song.downloads ?? song.plays ?? 0} downloads
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ฟีเจอร์ใหม่ตามรีเควส: Top Favorite Songs */}
          <section className="analytics-card">
            <h2 className="section-heading">Top Favorite Songs</h2>
            {loading ? (
              <p className="empty-text">กำลังโหลดเพลงที่ถูกใจมากสุด...</p>
            ) : topFavorites.length === 0 ? (
              <p className="empty-text">ยังไม่มีข้อมูลเพลงที่ถูกใจ</p>
            ) : (
              <ul className="song-rank-list">
                {topFavorites.map((song, index) => (
                  <li key={song._id || song.id || index} className="song-rank-item">
                    <span className="rank-badge rank-fav">#{index + 1}</span>
                    <div className="song-info">
                      <span className="song-title">{song.title || song.name || "Untitled"}</span>
                      <span className="song-meta">
                        {song.artist || song.uploader || "Unknown Artist"}
                      </span>
                    </div>
                    <span className="song-stat fav-stat">
                      ♥ {song.likes ?? song.likeCount ?? song.favorites ?? 0}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default UserAnalytics;