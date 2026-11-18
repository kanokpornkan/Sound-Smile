
import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  FaCloudUploadAlt,
  FaImage,
  FaMusic,
  FaTimes,
  FaCheckCircle,
  FaHeadphones,
} from "react-icons/fa";
import "./upload.css";

const API_URL = "http://localhost:5000";

const MAX_AUDIO = 50 * 1024 * 1024;
const MAX_IMAGE = 5 * 1024 * 1024;

const categories = {
  bass: ["analog synth bass", "bass line", "sub bass", "fingered bass", "slapped bass"],
  guitar: ["acoustic guitar", "electric guitar", "synth guitar"],
  drums: ["kicks", "snares", "claps", "hi-hats", "percussion", "breakbeat"],
  "pad & atmosphere": [],
  synthesizers: ["lead", "synth fx"],
  keys: ["piano", "organ", "rhodes piano", "synth keys"],
  vocals: ["singing", "spoken", "vocal fx", "acappella"],
  "bowed string": ["cello", "violin", "synth bowed string"],
  brass: ["trumpet", "trombone", "french horn"],
  "field recordings": [],
  "plucked string": ["harp", "ukulele", "sitar"],
  "sound effects": ["electronic", "nature", "machines", "water", "other fx"],
  woodwinds: ["flute", "clarinet", "saxophone", "oboe"],
};

const tagOptions = [
  "Bittersweet", "Calm", "Chilled", "Confident",
  "Relaxed", "Romantic", "Seductive", "Serious",
  "Cool", "R B", "Flowing", "Groovy",
  "Electric Guitar", "Electronic Drums",
  "Percussion", "Piano", "Synth", "Male",
];

const keys = [
  "C", "C#", "D", "D#", "E", "F",
  "F#", "G", "G#", "A", "A#", "B",
];

const emptyForm = () => ({
  title: "",
  artist: "",
  description: "",
  bpm: "",
  key: "C",
  mode: "None",
  type: "bass",
  subtype: "analog synth bass",
  soundType: "Loop",
  tags: [],
});

const formatSize = (bytes) =>
  `${(bytes / 1024 / 1024).toFixed(2)} MB`;

export default function UploadSong() {
  const [form, setForm] = useState(emptyForm);
  const [music, setMusic] = useState(null);
  const [cover, setCover] = useState(null);
  const [musicPreview, setMusicPreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState("");

  useEffect(() => {
    if (!cover) {
      setCoverPreview("");
      return;
    }

    const url = URL.createObjectURL(cover);
    setCoverPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [cover]);

  useEffect(() => {
    if (!music) {
      setMusicPreview("");
      return;
    }

    const url = URL.createObjectURL(music);
    setMusicPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [music]);

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "type"
        ? { subtype: categories[value]?.[0] || "" }
        : {}),
    }));
  };

  const toggleTag = (tag) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((item) => item !== tag)
        : [...prev.tags, tag],
    }));
  };

  const selectFile = (file, kind) => {
    if (!file || uploading) return;

    const isImage = kind === "cover";
    const extension = file.name.split(".").pop().toLowerCase();

    const allowed = isImage
      ? ["jpg", "jpeg", "png", "webp", "gif"]
      : ["mp3", "wav", "ogg", "m4a", "flac", "aac", "webm"];

    if (!allowed.includes(extension)) {
      Swal.fire({
        icon: "warning",
        title: "ชนิดไฟล์ไม่ถูกต้อง",
        text: isImage
          ? "รองรับ JPG, PNG, WEBP และ GIF"
          : "รองรับ MP3, WAV, OGG, M4A, FLAC, AAC และ WEBM",
      });
      return;
    }

    if (file.size > (isImage ? MAX_IMAGE : MAX_AUDIO)) {
      Swal.fire({
        icon: "warning",
        title: "ไฟล์ใหญ่เกินไป",
        text: isImage
          ? "ภาพปกต้องมีขนาดไม่เกิน 5 MB"
          : "ไฟล์เสียงต้องมีขนาดไม่เกิน 50 MB",
      });
      return;
    }

    if (isImage) setCover(file);
    else setMusic(file);
  };

  const handleDrop = (event, kind) => {
    event.preventDefault();
    setDragging("");

    selectFile(event.dataTransfer.files?.[0], kind);
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    if (uploading) return;

    const token = localStorage.getItem("token");

    if (!token) {
      Swal.fire("กรุณาเข้าสู่ระบบ", "เข้าสู่ระบบก่อนอัปโหลดเพลง", "warning");
      return;
    }

    if (!music) {
      Swal.fire("กรุณาเลือกไฟล์เพลง", "", "warning");
      return;
    }

    if (!form.title.trim() || !form.artist.trim()) {
      Swal.fire("กรุณากรอกชื่อเพลงและชื่อศิลปิน", "", "warning");
      return;
    }

    if (form.tags.length < 4) {
      Swal.fire("กรุณาเลือกอย่างน้อย 4 แท็ก", "", "warning");
      return;
    }

    const data = new FormData();

    data.append("music", music);

    if (cover) {
      data.append("cover", cover);
    }

    Object.entries(form).forEach(([key, value]) => {
      data.append(
        key,
        Array.isArray(value) ? JSON.stringify(value) : value
      );
    });

    setUploading(true);
    setProgress(0);

    try {
      const response = await axios.post(
        `${API_URL}/api/upload`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 180000,
          onUploadProgress: (event) => {
            if (event.total) {
              setProgress(
                Math.min(
                  100,
                  Math.round((event.loaded * 100) / event.total)
                )
              );
            }
          },
        }
      );

      await Swal.fire({
        icon: "success",
        title: "อัปโหลดสำเร็จ!",
        text: response.data.message || "บันทึกเพลงเรียบร้อยแล้ว",
      });

      setForm(emptyForm());
      setMusic(null);
      setCover(null);
      setProgress(0);

      // อัปเดตข้อมูลสมาชิกและหน้าอื่นที่รับฟัง event
      window.dispatchEvent(new Event("userLoggedIn"));
      window.dispatchEvent(new Event("newNotification"));

    } catch (error) {
      console.error("UPLOAD ERROR:", error);

      let message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "ไม่สามารถอัปโหลดไฟล์ได้";

      if (!error.response && error.code === "ERR_NETWORK") {
        message =
          "เชื่อมต่อ Backend ไม่ได้ ตรวจสอบว่าเซิร์ฟเวอร์ทำงานที่ localhost:5000";
      }

      if (error.response?.status === 401) {
        message = "กรุณาเข้าสู่ระบบใหม่";
      }

      if (
        error.response?.status === 403 &&
        /token/i.test(message)
      ) {
        message = "Token หมดอายุหรือไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่";
      }

      Swal.fire({
        icon: "error",
        title: "อัปโหลดไม่สำเร็จ",
        text: message,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="ss-upload-page">
      <div className="ss-upload-container">

        <header className="ss-upload-hero">
          <span className="ss-upload-eyebrow">
            SHARK SOUND / CREATOR STUDIO
          </span>
          <h1>
            Upload your <span>sound.</span>
          </h1>
          <p>
            แบ่งปันเสียงของคุณกับทุกคนในคอมมูนิตี้
            เพิ่มภาพปกและรายละเอียดให้เพลงของคุณโดดเด่น
          </p>
          <div className="ss-upload-hero-pills">
            <span><FaCheckCircle /> Audio upload</span>
            <span><FaCheckCircle /> Cover artwork</span>
            <span><FaCheckCircle /> Track details</span>
          </div>
        </header>

        <form onSubmit={handleUpload} className="ss-upload-layout">

          <div className="ss-upload-left">
            <section className="ss-upload-panel">
              <div className="ss-upload-panel-title">
                <span className="ss-upload-step">01</span>
                <div>
                  <h2>Artwork & Audio</h2>
                  <p>เพิ่มภาพหน้าปกและไฟล์เสียง</p>
                </div>
              </div>

              <div className="ss-upload-panel-body">

                <label className="ss-upload-label">
                  ภาพปกเพลง
                  <small>ไม่บังคับ • ไม่เกิน 5 MB</small>
                </label>

                <label
                  className={`ss-upload-cover ${
                    dragging === "cover" ? "dragging" : ""
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging("cover");
                  }}
                  onDragLeave={() => setDragging("")}
                  onDrop={(e) => handleDrop(e, "cover")}
                >
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.gif"
                    disabled={uploading}
                    onChange={(e) => {
                      selectFile(e.target.files?.[0], "cover");
                      e.target.value = "";
                    }}
                  />

                  {coverPreview ? (
                    <img src={coverPreview} alt="ภาพปกเพลง" />
                  ) : (
                    <div className="ss-upload-placeholder">
                      <FaImage />
                      <strong>Cover Artwork</strong>
                      <span>คลิกเพื่อเลือกรูปภาพ</span>
                      <small>JPG, PNG, WEBP, GIF</small>
                    </div>
                  )}
                </label>

                {cover && (
                  <div className="ss-upload-file-info">
                    <span>{cover.name} • {formatSize(cover.size)}</span>
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => setCover(null)}
                      aria-label="ลบภาพปก"
                    >
                      <FaTimes />
                    </button>
                  </div>
                )}

                <label className="ss-upload-label ss-upload-gap">
                  ไฟล์เสียง <b>*</b>
                  <small>ไม่เกิน 50 MB</small>
                </label>

                <label
                  className={`ss-upload-audio-drop ${
                    dragging === "music" ? "dragging" : ""
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging("music");
                  }}
                  onDragLeave={() => setDragging("")}
                  onDrop={(e) => handleDrop(e, "music")}
                >
                  <input
                    type="file"
                    accept=".mp3,.wav,.ogg,.m4a,.flac,.aac,.webm"
                    disabled={uploading}
                    onChange={(e) => {
                      selectFile(e.target.files?.[0], "music");
                      e.target.value = "";
                    }}
                  />

                  <FaCloudUploadAlt className="ss-upload-cloud" />

                  <strong>
                    {music ? music.name : "เลือกไฟล์เสียงของคุณ"}
                  </strong>

                  <small>
                    {music
                      ? formatSize(music.size)
                      : "หรือลากไฟล์มาวางที่นี่"}
                  </small>
                  <span className="ss-upload-choose">Browse Files</span>
                </label>

                {music && (
                  <div className="ss-upload-file-info">
                    <span>{music.name}</span>
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => setMusic(null)}
                      aria-label="ลบไฟล์เพลง"
                    >
                      <FaTimes />
                    </button>
                  </div>
                )}

                {musicPreview && (
                  <audio
                    className="ss-upload-player"
                    controls
                    src={musicPreview}
                  />
                )}

                <p className="ss-upload-note">
                  <FaHeadphones /> ทดลองฟังและตรวจสอบไฟล์ก่อนอัปโหลด
                </p>
              </div>
            </section>
          </div>

          <div className="ss-upload-right">
            <section className="ss-upload-panel">
              <div className="ss-upload-panel-title">
                <span className="ss-upload-step">02</span>
                <div>
                  <h2>Track Information</h2>
                  <p>กรอกรายละเอียดของเพลง</p>
                </div>
              </div>

              <div className="ss-upload-panel-body ss-upload-fields">
                <div className="ss-upload-grid">
                  <div>
                    <label>ชื่อเพลง *</label>
                    <input
                      name="title"
                      value={form.title}
                      onChange={updateField}
                      placeholder="ชื่อเพลง"
                      maxLength={120}
                      required
                      disabled={uploading}
                    />
                  </div>

                  <div>
                    <label>ชื่อศิลปิน *</label>
                    <input
                      name="artist"
                      value={form.artist}
                      onChange={updateField}
                      placeholder="ชื่อศิลปิน"
                      maxLength={120}
                      required
                      disabled={uploading}
                    />
                  </div>
                </div>

                <div>
                  <label>คำอธิบายเพลง</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={updateField}
                    placeholder="รายละเอียดเกี่ยวกับเพลง..."
                    maxLength={1200}
                    rows={3}
                    disabled={uploading}
                  />
                </div>

                <div>
                  <label>ประเภทไฟล์เสียง</label>
                  <div className="ss-upload-type-buttons">
                    {["Loop", "One Shot"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        disabled={uploading}
                        className={
                          form.soundType === type ? "active" : ""
                        }
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            soundType: type,
                          }))
                        }
                      >
                        <FaMusic /> {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ss-upload-grid three">
                  <div>
                    <label>BPM</label>
                    <input
                      type="number"
                      name="bpm"
                      min="0"
                      max="400"
                      value={form.bpm}
                      onChange={updateField}
                      placeholder="120"
                      disabled={uploading}
                    />
                  </div>

                  <div>
                    <label>Key</label>
                    <select
                      name="key"
                      value={form.key}
                      onChange={updateField}
                      disabled={uploading}
                    >
                      {keys.map((key) => (
                        <option key={key}>{key}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label>Mode</label>
                    <select
                      name="mode"
                      value={form.mode}
                      onChange={updateField}
                      disabled={uploading}
                    >
                      {["None", "Major", "Minor"].map((mode) => (
                        <option key={mode}>{mode}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="ss-upload-grid">
                  <div>
                    <label>หมวดหมู่เสียง</label>
                    <select
                      name="type"
                      value={form.type}
                      onChange={updateField}
                      disabled={uploading}
                    >
                      {Object.keys(categories).map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label>หมวดหมู่ย่อย</label>
                    <select
                      name="subtype"
                      value={form.subtype}
                      onChange={updateField}
                      disabled={uploading}
                    >
                      <option value="">None</option>
                      {(categories[form.type] || []).map((subtype) => (
                        <option key={subtype}>{subtype}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </section>

            <section className="ss-upload-panel">
              <div className="ss-upload-panel-title">
                <span className="ss-upload-step">03</span>
                <div>
                  <h2>Tags & Mood</h2>
                  <p>เลือกแท็กอย่างน้อย 4 รายการ</p>
                </div>
              </div>

              <div className="ss-upload-panel-body">
                <div className="ss-upload-tag-header">
                  <span>แท็กที่เลือก</span>
                  <strong>{form.tags.length} / 4 ขั้นต่ำ</strong>
                </div>

                <div className="ss-upload-tags">
                  {tagOptions.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      disabled={uploading}
                      className={
                        form.tags.includes(tag) ? "selected" : ""
                      }
                      onClick={() => toggleTag(tag)}
                    >
                      {form.tags.includes(tag) ? "✓" : "+"} {tag}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <div className="ss-upload-submit">
              <div>
                <strong>Ready to publish?</strong>
                <p>ตรวจสอบข้อมูลก่อนเผยแพร่เพลง</p>
              </div>

              <button type="submit" disabled={uploading}>
                <FaCloudUploadAlt />
                {uploading
                  ? progress === 100
                    ? "กำลังบันทึก..."
                    : `กำลังอัปโหลด ${progress}%`
                  : "Upload Sound"}
              </button>

              {uploading && (
                <div className="ss-upload-progress">
                  <div style={{ width: `${progress}%` }} />
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
