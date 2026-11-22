import React, { useState } from "react";
import Swal from "sweetalert2";
import AdminHeader from "./AdminHeader";
import "./AdminTheme.css";

function AdminGenCode() {
  const [plan, setPlan] = useState("SOCOZY");
  const [code, setCode] = useState("");

  const copyCode = (text) =>
    navigator.clipboard
      .writeText(text)
      .then(() =>
        Swal.fire({ title: "Copied!", text: "The code has been copied to clipboard.", icon: "success", timer: 1500, showConfirmButton: false })
      )
      .catch(() => Swal.fire("Error", "Failed to copy code", "error"));

  const generate = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/gencode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json().catch(() => ({}));
      // แสดงข้อความจริงจาก backend (เช่น No token / Admin only) เพื่อให้รู้สาเหตุ
      if (!res.ok || !data.code) {
        throw new Error(data.message || `Server error (${res.status})`);
      }
      setCode(data.code);

      Swal.fire({
        title: "Success!",
        html: `
          <p>Plan "<strong>${plan}</strong>" has been successfully generated!</p>
          <p>Your Code: <strong id="genCode">${data.code}</strong></p>
        `,
        icon: "success",
        showCancelButton: true,
        confirmButtonColor: "#19427D",
        cancelButtonColor: "#8290A2",
        confirmButtonText: "Copy Code",
        cancelButtonText: "Close",
      }).then((result) => {
        if (result.isConfirmed) copyCode(data.code);
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        title: "Error",
        text: error.message || "Cannot generate code. Please try again.",
        icon: "error",
        confirmButtonColor: "#19427D",
        confirmButtonText: "OK",
      });
    }
  };

  return (
    <div className="ss-admin">
      <AdminHeader
        label="ADMIN CONTROL"
        title="Generate Premium Code"
        desc="สร้างโค้ดสำหรับแพ็กเกจพรีเมียม"
      />

      <section className="ssa-section">
        <div className="ssa-card ssa-gen">
          <span className="ssa-overline">NEW CODE</span>
          <h2>เลือกแพ็กเกจ</h2>
          <p>เลือกแพ็กเกจแล้วกด Generate เพื่อสร้างโค้ดใหม่</p>

          <select className="ssa-input" value={plan} onChange={(e) => setPlan(e.target.value)}>
            <option value="SOCOZY">So Cozy</option>
            <option value="SUPERCOZY">Super Cozy</option>
            <option value="COZIEST">Coziest</option>
          </select>

          <button className="ssa-btn" onClick={generate}>Generate</button>

          {code && (
            <div className="ssa-result">
              <small>YOUR CODE</small>
              <span className="ssa-code">{code}</span>
              <button className="ssa-btn outline" onClick={() => copyCode(code)}>Copy</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default AdminGenCode;