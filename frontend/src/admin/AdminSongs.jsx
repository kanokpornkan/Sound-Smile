import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import AdminHeader from "./AdminHeader";
import "./AdminTheme.css";

const AVAILABLE_TAGS = [
  "Bittersweet", "Calm", "Chilled", "Confident", "Relaxed", "Romantic",
  "Seductive", "Serious", "Cool", "R B", "Flowing", "Groovy",
  "Electric Guitar", "Electronic Drums", "Percussion", "Piano", "Synth", "Male",
];
const KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const TYPES = ["keys", "bass", "drums", "melody", "fx"];

function AdminSongs() {
  const [songs, setSongs] = useState([]);
  const [currentPlaying, setCurrentPlaying] = useState(null);
  const [durations, setDurations] = useState({});
  const [currentTimes, setCurrentTimes] = useState({});

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const fetchSongs = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/songs");
      setSongs(res.data);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "โหลดเพลงไม่สำเร็จ", "error");
    }
  };

  useEffect(() => {
    fetchSongs();
  }, []);

  const handleDelete = async (id) => {
    const confirmed = await Swal.fire({
      title: "คุณแน่ใจไหม?",
      text: "คุณจะไม่สามารถกู้เพลงนี้กลับมาได้!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#B3261E",
      cancelButtonColor: "#8290A2",
      confirmButtonText: "ใช่ ลบเลย!",
      cancelButtonText: "ยกเลิก",
    });

    if (confirmed.isConfirmed) {
      try {
        await axios.delete(`http://localhost:5000/api/admin/songs/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Swal.fire("Deleted!", "เพลงถูกลบเรียบร้อย", "success");
        fetchSongs();
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "ลบเพลงไม่สำเร็จ", "error");
      }
    }
  };

  // popup แก้ไข (ใช้ class จาก AdminTheme.css แทน inline style สีเข้ม)
  const openEditModal = async (song) => {
    const { value: formValues } = await Swal.fire({
      title: "แก้ไขเพลง",
      html: `
        <div class="ssa-form">
          <label class="ssa-l">ชื่อเพลง</label>
          <input id="swal-title" class="ssa-input" placeholder="ชื่อเพลง" value="${song.title || ""}">

          <label class="ssa-l">ศิลปิน</label>
          <input id="swal-artist" class="ssa-input" placeholder="ศิลปิน" value="${song.artist || ""}">

          <label class="ssa-l">รายละเอียด</label>
          <textarea id="swal-description" placeholder="รายละเอียด">${song.description || ""}</textarea>

          <label class="ssa-l">ประเภทการวาง</label>
          <div class="ssa-radios">
            <label><input type="radio" name="loopType" value="Loop" ${song.loopType === "Loop" ? "checked" : ""}> Loop</label>
            <label><input type="radio" name="loopType" value="One Shot" ${song.loopType === "One Shot" ? "checked" : ""}> One Shot</label>
          </div>

          <label class="ssa-l">แท็ก (เลือกได้หลายอัน)</label>
          <div class="ssa-tagbox">
            ${AVAILABLE_TAGS.map(
              (tag) => `
              <label class="ssa-tag">
                <input type="checkbox" name="tags" value="${tag}" ${song.tags && song.tags.includes(tag) ? "checked" : ""}>
                <span>${tag}</span>
              </label>`
            ).join("")}
          </div>

          <div class="ssa-row">
            <div>
              <label class="ssa-l">BPM</label>
              <input id="swal-bpm" class="ssa-input" type="number" placeholder="BPM" value="${song.bpm || 0}">
            </div>
            <div>
              <label class="ssa-l">KEY</label>
              <select id="swal-key">
                <option value="">เลือก Key</option>
                ${KEYS.map((k) => `<option value="${k}" ${song.key === k ? "selected" : ""}>${k}</option>`).join("")}
              </select>
            </div>
          </div>

          <label class="ssa-l">MODE</label>
          <select id="swal-mode">
            <option value="">None</option>
            <option value="Major" ${song.mode === "Major" ? "selected" : ""}>Major</option>
            <option value="Minor" ${song.mode === "Minor" ? "selected" : ""}>Minor</option>
          </select>

          <div class="ssa-row">
            <div>
              <label class="ssa-l">ประเภท (TYPE)</label>
              <select id="swal-type">
                <option value="">เลือกประเภท</option>
                ${TYPES.map((t) => `<option value="${t}" ${song.type === t ? "selected" : ""}>${t}</option>`).join("")}
              </select>
            </div>
            <div>
              <label class="ssa-l">ประเภทย่อย (SUBTYPE)</label>
              <input id="swal-subtype" class="ssa-input" placeholder="ประเภทย่อย" value="${song.subtype || ""}">
            </div>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#19427D",
      cancelButtonColor: "#8290A2",
      customClass: { popup: "ssa-swal" },
      width: "700px",
      preConfirm: () => {
        const title = document.getElementById("swal-title").value;
        const artist = document.getElementById("swal-artist").value;
        const description = document.getElementById("swal-description").value;
        const loopType = document.querySelector('input[name="loopType"]:checked')?.value;
        const type = document.getElementById("swal-type").value;
        const subtype = document.getElementById("swal-subtype").value;
        const bpm = document.getElementById("swal-bpm").value;
        const key = document.getElementById("swal-key").value;
        const mode = document.getElementById("swal-mode").value;
        const tags = Array.from(document.querySelectorAll('input[name="tags"]:checked')).map((c) => c.value);

        if (!title || !artist) {
          Swal.showValidationMessage("กรุณากรอกชื่อเพลงและศิลปิน");
          return false;
        }

        return { title, artist, description, loopType, type, subtype, bpm: Number(bpm), key, mode, tags };
      },
    });

    if (formValues) await handleEditSave(song._id, formValues);
  };

  const handleEditSave = async (songId, updatedData) => {
    try {
      await axios.put(`http://localhost:5000/api/admin/songs/${songId}`, updatedData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      Swal.fire({ icon: "success", title: "Success", text: "อัปเดตเพลงเรียบร้อย", timer: 2000, showConfirmButton: false });
      fetchSongs();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "อัปเดตเพลงไม่สำเร็จ", "error");
    }
  };

  const togglePlay = (id) => {
    const audio = document.getElementById(`audio-${id}`);
    if (!audio) return;

    if (currentPlaying && currentPlaying !== id) {
      const prevAudio = document.getElementById(`audio-${currentPlaying}`);
      if (prevAudio) {
        prevAudio.pause();
        prevAudio.currentTime = 0;
      }
    }

    if (audio.paused) {
      audio.play();
      setCurrentPlaying(id);

      const interval = setInterval(() => {
        setCurrentTimes((prev) => ({ ...prev, [id]: audio.currentTime }));
      }, 200);

      audio.onended = () => {
        clearInterval(interval);
        setCurrentPlaying(null);
        setCurrentTimes((prev) => ({ ...prev, [id]: 0 }));
      };
    } else {
      audio.pause();
      audio.currentTime = 0;
      setCurrentPlaying(null);
      setCurrentTimes((prev) => ({ ...prev, [id]: 0 }));
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getProgressPercentage = (songId) => {
    const duration = durations[songId] || 0;
    const currentTime = currentTimes[songId] || 0;
    if (duration === 0) return 0;
    return Math.min((currentTime / duration) * 100, 100);
  };

  return (
    <div className="ss-admin">
      <AdminHeader
        label="ADMIN CONTROL"
        title="Songs Management"
        desc="แก้ไข ลบ และฟังตัวอย่างเพลงทั้งหมดในระบบ"
        stat={songs.length}
        statLabel="TOTAL TRACKS"
      />

      <section className="ssa-section">
        <div className="ssa-section-head">
          <div>
            <span className="ssa-overline">SoundSmile COLLECTION</span>
            <h2>All Songs</h2>
          </div>
          <span className="ssa-count">{String(songs.length).padStart(2, "0")} TRACKS</span>
        </div>

        <div className="ssa-song-grid">
          {songs.map((song) => {
            const isPlaying = currentPlaying === song._id;
            return (
              <article
                className={`ssa-card ssa-song ${isPlaying ? "is-playing" : ""}`}
                key={song._id}
                onClick={() => navigate(`/song/${song._id}`)}
              >
                <div className="ssa-song-cover">
                  <div className={`ssa-record ${isPlaying ? "spinning" : ""}`}><i>SS</i></div>
                  <span className="ssa-status">{isPlaying ? "NOW PLAYING" : "MUSIC TRACK"}</span>
                </div>

                <div className="ssa-song-body">
                  <div className="ssa-song-title">
                    <div>
                      <h3 title={song.title}>{song.title}</h3>
                      <p>{song.artist || "Unknown Artist"}</p>
                    </div>
                    <div className={`ssa-wave ${isPlaying ? "active" : ""}`}>
                      <span /><span /><span /><span /><span />
                    </div>
                  </div>

                  <div className="ssa-tags">
                    {song.type && <span>#{song.type}</span>}
                    {song.subtype && <span>#{song.subtype}</span>}
                  </div>

                  <div className="ssa-meta">
                    <span>{formatTime(currentTimes[song._id] || 0)} / {formatTime(durations[song._id] || 0)}</span>
                    {song.bpm && <span>{song.bpm} BPM</span>}
                  </div>

                  <div className="ssa-progress">
                    <div style={{ width: `${getProgressPercentage(song._id)}%` }} />
                  </div>

                  <div className="ssa-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="ssa-btn" onClick={() => togglePlay(song._id)}>
                      {isPlaying ? "⏹ หยุด" : "▶ เล่น"}
                    </button>
                    <button className="ssa-btn outline" onClick={() => openEditModal(song)}>แก้ไข</button>
                    <button className="ssa-btn danger" onClick={() => handleDelete(song._id)}>ลบ</button>
                  </div>
                </div>

                <audio
                  id={`audio-${song._id}`}
                  src={`http://localhost:5000/${song.filePath}`}
                  style={{ display: "none" }}
                  onLoadedMetadata={(e) =>
                    setDurations((prev) => ({ ...prev, [song._id]: e.target.duration }))
                  }
                />
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default AdminSongs;