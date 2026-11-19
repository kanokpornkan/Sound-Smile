import { useEffect, useState } from "react";
import axios from "axios";
import AdminHeader from "./AdminHeader";
import "./AdminTheme.css";

export default function AdminCodeHistory() {
  const [codes, setCodes] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/admin/codes", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => setCodes(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="ss-admin">
      <AdminHeader
        label="ADMIN CONTROL"
        title="Code History"
        desc="ประวัติโค้ดทั้งหมดที่สร้างขึ้น"
        stat={codes.length}
        statLabel="TOTAL CODES"
      />

      <section className="ssa-section">
        <div className="ssa-card ssa-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Code</th><th>Plan</th><th>Created At</th>
                <th>Used</th><th>Used By</th><th>Expire At</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c._id}>
                  <td className="ssa-code">{c.code}</td>
                  <td><span className="ssa-badge">{c.plan}</span></td>
                  <td>{new Date(c.createdAt).toLocaleString()}</td>
                  <td><span className={`ssa-badge ${c.used ? "admin" : "no"}`}>{c.used ? "Yes" : "No"}</span></td>
                  <td>{c.usedBy ? c.usedBy.username || c.usedBy.email || "-" : "-"}</td>
                  <td>{c.expireAt ? new Date(c.expireAt).toLocaleDateString() : "-"}</td>
                </tr>
              ))}
              {codes.length === 0 && (
                <tr><td colSpan="6" className="ssa-empty">ยังไม่มีโค้ด</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}