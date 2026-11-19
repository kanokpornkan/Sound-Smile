import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";
import AdminHeader from "./AdminHeader";
import "./AdminTheme.css";

const COLORS = ["#19427D", "#315D91", "#7299CA", "#263C5A", "#A7BBD7"];
const GRID = "rgba(4,18,40,0.1)";
const AXIS = { fontSize: 11, fill: "#687A91" };

function AdminAnalytics() {
  const token = localStorage.getItem("token");
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

  const latestUsers = usersGrowth.length ? usersGrowth[usersGrowth.length - 1].totalUsers : 0;

  return (
    <div className="ss-admin">
      <AdminHeader
        label="ADMIN CONTROL"
        title="Analytics Dashboard"
        desc="ภาพรวมผู้ใช้ การอัปโหลด และเพลงยอดนิยม"
        stat={latestUsers}
        statLabel="TOTAL USERS"
      />

      <div className="ssa-chart-grid">
        <section className="ssa-card ssa-chart-card wide">
          <span className="ssa-overline">GROWTH</span>
          <h3>Users Growth</h3>
          <div className="ssa-chart-box">
            <ResponsiveContainer>
              <LineChart data={usersGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis dataKey="date" tick={AXIS} />
                <YAxis tick={AXIS} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="totalUsers" stroke="#19427D" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="ssa-card ssa-chart-card">
          <span className="ssa-overline">ACTIVITY</span>
          <h3>Uploads / Downloads</h3>
          <div className="ssa-chart-box">
            <ResponsiveContainer>
              <BarChart data={uploadsDownloads}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis dataKey="username" tick={AXIS} />
                <YAxis tick={AXIS} />
                <Tooltip />
                <Legend />
                <Bar dataKey="uploads" fill="#7299CA" radius={[6, 6, 0, 0]} />
                <Bar dataKey="downloads" fill="#19427D" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="ssa-card ssa-chart-card">
          <span className="ssa-overline">POPULAR</span>
          <h3>Top Songs</h3>
          <div className="ssa-chart-box">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={topSongs} dataKey="downloads" nameKey="title" cx="50%" cy="50%" outerRadius={100} label>
                  {topSongs.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminAnalytics;