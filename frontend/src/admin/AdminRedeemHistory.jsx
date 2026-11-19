import React, { useEffect, useState } from "react";
import AdminHeader from "./AdminHeader";
import "./AdminTheme.css";

const AdminRedeemHistory = () => {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCodes = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/admin/redeem-codes", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setCodes(data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchCodes();
  }, []);

  if (loading)
    return (
      <div className="ss-admin">
        <p className="ssa-loading">Loading...</p>
      </div>
    );

  return (
    <div className="ss-admin">
      <AdminHeader
        label="ADMIN CONTROL"
        title="ประวัติโค้ด Redeem"
        desc="ตรวจสอบสถานะโค้ดที่ถูกใช้และยังไม่ถูกใช้"
        stat={codes.length}
        statLabel="TOTAL CODES"
      />

      <section className="ssa-section">
        <div className="ssa-card ssa-table-wrap">
          <table>
            <thead>
              <tr><th>Code</th><th>Plan</th><th>Status</th><th>Created At</th></tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c._id}>
                  <td className="ssa-code">{c.code}</td>
                  <td><span className="ssa-badge">{c.plan}</span></td>
                  <td><span className={`ssa-badge ${c.used ? "admin" : "no"}`}>{c.used ? "Used" : "Unused"}</span></td>
                  <td>
                    {new Date(c.createdAt).toLocaleDateString()}{" "}
                    {new Date(c.createdAt).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
              {codes.length === 0 && (
                <tr><td colSpan="4" className="ssa-empty">ยังไม่มีโค้ด</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminRedeemHistory;