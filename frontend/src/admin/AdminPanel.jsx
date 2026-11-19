import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import AdminHeader from "./AdminHeader";
import "./AdminTheme.css";

export default function Adminpanel() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const token = localStorage.getItem("token");
  const API_BASE = "http://localhost:5000";
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/users`, auth);
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      Swal.fire("Error", "Failed to fetch users", "error");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, role) => {
    try {
      await axios.put(`${API_BASE}/api/admin/users/${userId}/role`, { role }, auth);
      Swal.fire({ icon: "success", title: "Role Updated", text: `User role changed to ${role}`, timer: 1500, showConfirmButton: false });
      fetchUsers();
    } catch (err) {
      Swal.fire("Error", "Failed to update role", "error");
    }
  };

  const handleResetQuota = async (userId) => {
    try {
      await axios.put(`${API_BASE}/api/admin/users/${userId}/reset-quota`, {}, auth);
      Swal.fire({ icon: "success", title: "Quota Reset", text: "User quota has been reset", timer: 1500, showConfirmButton: false });
      fetchUsers();
    } catch (err) {
      Swal.fire("Error", "Failed to reset quota", "error");
    }
  };

  const handleDelete = async (userId) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This user will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#B3261E",
      cancelButtonColor: "#8290A2",
      confirmButtonText: "Delete",
    });
    if (!confirm.isConfirmed) return;

    try {
      await axios.delete(`${API_BASE}/api/admin/users/${userId}`, auth);
      Swal.fire({ icon: "success", title: "Deleted", text: "User has been deleted", timer: 1500, showConfirmButton: false });
      fetchUsers();
    } catch (err) {
      Swal.fire("Error", "Failed to delete user", "error");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="ss-admin">
      <AdminHeader
        label="ADMIN CONTROL"
        title="Users Management"
        desc="จัดการผู้ใช้ สิทธิ์ และโควตาการอัปโหลด / ดาวน์โหลด"
        stat={users.length}
        statLabel="TOTAL USERS"
      />

      <section className="ssa-section">
        <div className="ssa-section-head">
          <div>
            <span className="ssa-overline">SHARK SOUND ADMIN</span>
            <h2>All Users</h2>
          </div>
          <input
            type="text"
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ssa-search"
          />
        </div>

        <div className="ssa-card ssa-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Upload / Download</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u._id}>
                  <td><strong>{u.username}</strong></td>
                  <td>{u.email}</td>
                  <td>
                    <div className="ssa-cell">
                      <span className={`ssa-badge ${u.role === "admin" ? "admin" : ""}`}>{u.role}</span>
                      <button
                        onClick={() => handleRoleChange(u._id, u.role === "admin" ? "user" : "admin")}
                        className="ssa-btn outline"
                      >
                        Make {u.role === "admin" ? "User" : "Admin"}
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="ssa-cell">
                      <span>{u.uploadCount}/{u.maxUpload} — {u.downloadCount}/{u.maxDownload}</span>
                      <button onClick={() => handleResetQuota(u._id)} className="ssa-btn outline">
                        Reset Quota
                      </button>
                    </div>
                  </td>
                  <td>
                    <button onClick={() => handleDelete(u._id)} className="ssa-btn danger">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr><td colSpan="5" className="ssa-empty">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}