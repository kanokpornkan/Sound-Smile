import axios from "axios";
import Swal from "sweetalert2";

export const PROFILE_API = "http://localhost:5000";

export function getStoredProfile() {
  try { return JSON.parse(localStorage.getItem("user") || "{}"); }
  catch { return {}; }
}

export function getToken() {
  return localStorage.getItem("token");
}

export function showLoginRequired() {
  Swal.fire({
    icon: "warning", title: "กรุณาเข้าสู่ระบบ",
    text: "คุณต้องเข้าสู่ระบบก่อนใช้ฟังก์ชันนี้",
    toast: true, position: "top-end", timer: 2100, showConfirmButton: false,
  });
}

// Keep original behavior: download actual file and record it in the backend.
export async function downloadProfileSong(song, token) {
  if (!token) { showLoginRequired(); return false; }
  try {
    const response = await axios.get(`${PROFILE_API}/${String(song.filePath || "").replace(/^\/+/, "")}`, {
      responseType: "blob",
      headers: { Authorization: `Bearer ${token}` },
    });
    const url = URL.createObjectURL(new Blob([response.data]));
    const extension = String(song.filePath || "").split(".").pop()?.toLowerCase();
    const safeExtension = ["mp3", "wav", "ogg", "m4a", "flac", "aac", "webm"].includes(extension) ? extension : "mp3";
    const a = document.createElement("a");
    a.href = url;
    a.download = `${song.title || "sound"}.${safeExtension}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);

    await axios.post(`${PROFILE_API}/api/songs/${song._id}/download`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    window.dispatchEvent(new Event("downloadSuccess"));
    await Swal.fire({
      icon: "success", title: "ดาวน์โหลดเพลงสำเร็จ",
      text: `ดาวน์โหลด ${song.title || "เพลง"} เรียบร้อยแล้ว`,
      toast: true, position: "top-end", timer: 2000, showConfirmButton: false,
    });
    return true;
  } catch (error) {
    console.error("Download error:", error);
    Swal.fire({
      icon: "error", title: "ไม่สามารถดาวน์โหลดเพลงได้",
      text: error.response?.data?.message || error.message,
      toast: true, position: "top-end", timer: 2500, showConfirmButton: false,
    });
    return false;
  }
}
