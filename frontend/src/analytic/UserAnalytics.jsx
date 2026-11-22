import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Legend,
  Tooltip,
} from "chart.js";
import "./UserAnalytics.css";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Legend,
  Tooltip
);

const API_BASE = "http://localhost:5000";

function UserAnalytics() {
  const [filter, setFilter] = useState("all");
  const [topFavoriteSongs, setTopFavoriteSongs] = useState([]);
  const [limits, setLimits] = useState({
    uploadCount: 0,
    downloadCount: 0,
    maxUpload: 3,
    maxDownload: 5,
  });
  const [loadingTop, setLoadingTop] = useState(true);

  useEffect(() => {
    const fetchTopFavorites = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/songs/top-likes`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setTopFavoriteSongs(data);
          }
        }
      } catch (err) {
        console.error("Error fetching top liked songs:", err);
      } finally {
        setLoadingTop(false);
      }
    };

    const fetchUserAnalytics = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const analyticsRes = await fetch(`${API_BASE}/api/analytics/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (analyticsRes.ok) {
          const analyticsData = await analyticsRes.json();
          setLimits({
            uploadCount: analyticsData.uploadCount ?? analyticsData.uploads ?? 0,
            downloadCount:
              analyticsData.downloadCount ?? analyticsData.downloads ?? 0,
            maxUpload: analyticsData.maxUpload ?? analyticsData.uploadLimit ?? 3,
            maxDownload:
              analyticsData.maxDownload ?? analyticsData.downloadLimit ?? 5,
          });
          if (
            Array.isArray(analyticsData.topSongs) &&
            analyticsData.topSongs.length > 0
          ) {
            setTopFavoriteSongs((prev) =>
              prev.length > 0 ? prev : analyticsData.topSongs
            );
          }
          return;
        }

        const userRes = await fetch(`${API_BASE}/auth/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!userRes.ok) return;
        const userData = await userRes.json();
        const userId = userData?._id || userData?.id;
        if (!userId) return;

        const limRes = await fetch(`${API_BASE}/api/user/${userId}/limits`);
        if (limRes.ok) {
          const limData = await limRes.json();
          setLimits({
            uploadCount: limData.uploadCount ?? 0,
            downloadCount: limData.downloadCount ?? 0,
            maxUpload: limData.maxUpload ?? 3,
            maxDownload: limData.maxDownload ?? 5,
          });
        }
      } catch (err) {
        console.error("Error fetching user analytics:", err);
      }
    };

    fetchTopFavorites();
    fetchUserAnalytics();
  }, []);

  const data = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Download",
        data: [12, 19, 10, 25, 20, 30, 15],
        borderColor: "#38bdf8",
        backgroundColor: "rgba(56, 189, 248, 0.2)",
        tension: 0.35,
        hidden: filter !== "all" && filter !== "download",
      },
      {
        label: "Play",
        data: [8, 14, 20, 18, 25, 35, 30],
        borderColor: "#60a5fa",
        backgroundColor: "rgba(96, 165, 250, 0.2)",
        tension: 0.35,
        hidden: filter !== "all" && filter !== "play",
      },
      {
        label: "Favorite",
        data: [5, 8, 12, 15, 10, 20, 18],
        borderColor: "#f472b6",
        backgroundColor: "rgba(244, 114, 182, 0.2)",
        tension: 0.35,
        hidden: filter !== "all" && filter !== "favorite",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        ticks: { color: "#DDDDDD" },
        grid: { color: "rgba(221, 221, 221, 0.1)" },
      },
      y: {
        beginAtZero: true,
        ticks: { color: "#DDDDDD" },
        grid: { color: "rgba(221, 221, 221, 0.1)" },
      },
    },
  };

  const sortedFavorites = [...topFavoriteSongs].sort(
    (a, b) => (Number(b.likes) || 0) - (Number(a.likes) || 0)
  );

  return (
    <div className="ss-dash-page">
      <div className="ss-dash-shell">
        <header className="ss-dash-topbar">
          <div>
            <span className="ss-dash-brand">SoundSmile</span>
            <h1 className="ss-dash-title">User Analytics</h1>
            <p className="ss-dash-subtitle">
              ภาพรวมการอัปโหลด ดาวน์โหลด และเพลงยอดนิยมที่ถูกใจมากสุด
            </p>
          </div>

          <div className="ss-quota-box">
            <div className="ss-quota-item">
              <span>Uploads</span>
              <strong>
                {limits.uploadCount} / {limits.maxUpload}
              </strong>
            </div>
            <div className="ss-quota-divider" />
            <div className="ss-quota-item">
              <span>Downloads</span>
              <strong>
                {limits.downloadCount} / {limits.maxDownload}
              </strong>
            </div>
          </div>
        </header>

        <div className="ss-dash-grid">
          <section className="ss-card">
            <div className="ss-card-head">
              <div>
                <h2 className="ss-card-title">Overall Performance</h2>
                <p className="ss-card-desc">สถิติรายสัปดาห์แยกตามหมวดหมู่</p>
              </div>
            </div>

            <div className="ss-filter-row">
              <button
                type="button"
                className={`ss-filter-btn ${filter === "all" ? "is-active" : ""}`}
                onClick={() => setFilter("all")}
              >
                All
              </button>
              <button
                type="button"
                className={`ss-filter-btn ${
                  filter === "download" ? "is-active" : ""
                }`}
                onClick={() => setFilter("download")}
              >
                Download
              </button>
              <button
                type="button"
                className={`ss-filter-btn ${filter === "play" ? "is-active" : ""}`}
                onClick={() => setFilter("play")}
              >
                Play
              </button>
              <button
                type="button"
                className={`ss-filter-btn ${
                  filter === "favorite" ? "is-active" : ""
                }`}
                onClick={() => setFilter("favorite")}
              >
                Favorite
              </button>
            </div>

            <div className="ss-chart-wrap">
              <Line data={data} options={options} />
            </div>
          </section>

          <section className="ss-card">
            <div className="ss-card-head">
              <div>
                <h2 className="ss-card-title">Top Favorite Songs</h2>
                <p className="ss-card-desc">
                  จัดอันดับเพลงที่ถูกกด Favorite มากที่สุดใน SoundSmile
                </p>
              </div>
              <span className="ss-badge">Top {sortedFavorites.length || 5}</span>
            </div>

            {loadingTop ? (
              <p className="ss-empty-text">กำลังโหลดอันดับเพลง...</p>
            ) : sortedFavorites.length === 0 ? (
              <p className="ss-empty-text">ยังไม่มีข้อมูลเพลงที่ถูกกด Favorite</p>
            ) : (
              <ol className="ss-rank-list">
                {sortedFavorites.map((song, index) => {
                  const rank = index + 1;
                  const rankClass =
                    rank === 1
                      ? "rank-1"
                      : rank === 2
                      ? "rank-2"
                      : rank === 3
                      ? "rank-3"
                      : "";

                  return (
                    <li key={song._id || index} className="ss-rank-item">
                      <span className={`ss-rank-num ${rankClass}`}>
                        #{rank}
                      </span>

                      <div className="ss-rank-info">
                        <div className="ss-rank-song" title={song.title}>
                          {song.title || "Untitled"}
                        </div>
                        <div className="ss-rank-artist">
                          {song.artist || "Unknown Artist"}
                        </div>
                      </div>

                      <div className="ss-rank-stats">
                        <span className="ss-like-pill">
                          ♥ {Number(song.likes) || 0}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default UserAnalytics;