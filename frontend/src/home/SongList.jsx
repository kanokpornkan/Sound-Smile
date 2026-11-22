
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./SongList.css";

const BASE_URL = "http://localhost:5000";

function SongList({ searchTerm }) {
  const [songs, setSongs] = useState([]);
  const [topLikes, setTopLikes] = useState([]);
  const [topDownloads, setTopDownloads] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [currentPlaying, setCurrentPlaying] = useState(null);
  const [filterTag, setFilterTag] = useState(null);
  const [durations, setDurations] = useState({});
  const [currentTimes, setCurrentTimes] = useState({});
  const [volumes, setVolumes] = useState({});

  const audioRefs = useRef({});
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // LOAD DATA
  useEffect(() => {
    loadAllData();
    loadFavorites();
  }, []);

  // STOP AUDIO WHEN LEAVING PAGE
  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach((audio) => {
        if (audio) audio.pause();
      });
    };
  }, []);

  // LOAD SONGS
  const loadAllData = async () => {
    try {
      const [allRes, likesRes, dlRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/songs`),
        axios.get(`${BASE_URL}/api/songs/top-likes`),
        axios.get(`${BASE_URL}/api/songs/top-downloads`),
      ]);

      setSongs(Array.isArray(allRes.data) ? allRes.data : []);
      setTopLikes(Array.isArray(likesRes.data) ? likesRes.data : []);
      setTopDownloads(Array.isArray(dlRes.data) ? dlRes.data : []);

      // โหลดคำแนะนำแยกต่างหาก เพื่อไม่ให้กระทบการโหลดเพลงส่วนอื่น
      try {
        const recommendRes = await axios.get(
          `${BASE_URL}/api/recommendations`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
        setRecommendations(
          Array.isArray(recommendRes.data) ? recommendRes.data : []
        );
      } catch (recommendError) {
        console.error("Error loading recommendations:", recommendError);
        setRecommendations([]);
      }
    } catch (err) {
      console.error("Error loading songs:", err);
    }
  };

  // LOAD FAVORITES
  const loadFavorites = async () => {
    if (!user._id || !token) return;

    try {
      const res = await axios.get(
        `${BASE_URL}/api/user/${user._id}/favorites`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setFavorites(
        Array.isArray(res.data)
          ? res.data.map((song) => song._id)
          : []
      );
    } catch (err) {
      console.error("Error loading favorites:", err);
    }
  };

  // LIKE
  const handleLike = async (id) => {
    if (!token) {
      Swal.fire({
        icon: "error",
        title: "กรุณาเข้าสู่ระบบ",
        toast: true,
        position: "top-end",
        timer: 2000,
      });
      return;
    }

    try {
      const isFav = favorites.includes(id);

      if (isFav) {
        await axios.delete(
          `${BASE_URL}/api/songs/${id}/favorite`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setFavorites((prev) => prev.filter((f) => f !== id));
      } else {
        await axios.post(
          `${BASE_URL}/api/songs/${id}/favorite`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setFavorites((prev) => [...prev, id]);
      }

      window.dispatchEvent(new Event("favoriteChanged"));
      loadAllData();
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  // DOWNLOAD
  const handleDownload = async (song) => {
    if (!token) {
      Swal.fire({
        icon: "error",
        title: "กรุณาเข้าสู่ระบบ",
        toast: true,
        position: "top-end",
        timer: 2000,
      });
      return;
    }

    try {
      const checkRes = await axios.get(
        `${BASE_URL}/api/songs/${song._id}/download-check`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!checkRes.data.allowed) {
        Swal.fire({
          icon: "error",
          title: "คุณไม่สามารถดาวน์โหลดได้",
          text: checkRes.data.message || "สิทธิ์ดาวน์โหลดหมดแล้ว",
          toast: true,
          position: "top-end",
          timer: 2500,
        });
        return;
      }

      const response = await axios.get(
        `${BASE_URL}/${song.filePath}`,
        {
          responseType: "blob",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const blob = new Blob([response.data], {
        type: "audio/mpeg",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `${song.title}.mp3`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);

      await axios.post(
        `${BASE_URL}/api/songs/${song._id}/download`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Swal.fire({
        icon: "success",
        title: "ดาวน์โหลดเพลงสำเร็จ",
        toast: true,
        position: "top-end",
        timer: 2000,
      });

      loadAllData();
    } catch (err) {
      console.error("Download error:", err);

      Swal.fire({
        icon: "error",
        title: "ไม่สามารถดาวน์โหลดเพลงได้",
        text: err.response?.data?.message || "",
        toast: true,
        position: "top-end",
        timer: 2500,
      });
    }
  };

  // PLAY / PAUSE
  const togglePlay = async (id) => {
    const audio = audioRefs.current[id];

    if (!audio) return;

    if (currentPlaying === id && !audio.paused) {
      audio.pause();
      setCurrentPlaying(null);
      return;
    }

    if (currentPlaying && currentPlaying !== id) {
      const previousAudio = audioRefs.current[currentPlaying];

      if (previousAudio) previousAudio.pause();
    }

    try {
      await audio.play();
      setCurrentPlaying(id);
    } catch (err) {
      console.error("Playback error:", err);

      Swal.fire({
        icon: "error",
        title: "ไม่สามารถเล่นเพลงได้",
        text: "กรุณาตรวจสอบไฟล์เพลงหรือการเชื่อมต่อ",
        toast: true,
        position: "top-end",
        timer: 2500,
      });
    }
  };

  // SEEK BAR
  const handleSeek = (id, value) => {
    const audio = audioRefs.current[id];

    if (!audio || !Number.isFinite(audio.duration)) return;

    const newTime = Number(value);

    if (!Number.isFinite(newTime)) return;

    audio.currentTime = Math.max(
      0,
      Math.min(newTime, audio.duration)
    );

    setCurrentTimes((prev) => ({
      ...prev,
      [id]: audio.currentTime,
    }));
  };

  // VOLUME
  const handleVolume = (id, value) => {
    const nextVolume = Number(value);

    setVolumes((prev) => ({
      ...prev,
      [id]: nextVolume,
    }));

    const audio = audioRefs.current[id];

    if (audio) {
      audio.volume = nextVolume;
    }
  };

  // FORMAT TIME
  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds < 0) {
      return "0:00";
    }

    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);

    return `${m}:${String(s).padStart(2, "0")}`;
  };

  // PROGRESS
  const getProgressPercentage = (songId) => {
    const duration = durations[songId] || 0;
    const currentTime = currentTimes[songId] || 0;

    if (!duration) return 0;

    return Math.min((currentTime / duration) * 100, 100);
  };

  // SEARCH AND FILTER
  const normalize = (text) =>
    text?.toString().trim().toLowerCase() || "";

  let filteredSongs = songs;

  if (searchTerm?.trim()) {
    const term = normalize(searchTerm);

    filteredSongs = songs.filter(
      (s) =>
        normalize(s.title).includes(term) ||
        normalize(s.artist).includes(term) ||
        normalize(s.type).includes(term) ||
        normalize(s.subtype).includes(term) ||
        normalize(s.bpm).includes(term)
    );
  }

  if (filterTag) {
    filteredSongs = filteredSongs.filter(
      (s) =>
        normalize(s.type) === normalize(filterTag) ||
        normalize(s.subtype) === normalize(filterTag)
    );
  }

  // CREATE SONG COVER URL
  const getCoverUrl = (coverPath) => {
    if (!coverPath) return "";

    // รองรับทั้ง URL เต็มและ path ที่ส่งมาจาก Backend
    if (/^https?:\/\//i.test(coverPath)) {
      return coverPath;
    }

    return `${BASE_URL}/${String(coverPath).replace(/^\/+/, "")}`;
  };

  // SONG CARD
  const renderSongBox = (song, index = 0) => {
    const isPlaying = currentPlaying === song._id;
    const duration = durations[song._id] || 0;
    const currentTime = currentTimes[song._id] || 0;
    const progress = getProgressPercentage(song._id);
    const volume = volumes[song._id] ?? 0.8;
    const isFavorite = favorites.includes(song._id);

    return (
      <article
        className={`ss-song-card ${isPlaying ? "is-playing" : ""}`}
        key={song._id}
        onClick={() => navigate(`/song/${song._id}`)}
      >
        {/* ARTWORK */}
        <div className={`ss-song-cover ${song.coverPath ? "has-cover" : ""}`}>
          {/* SONG COVER IMAGE */}
          {song.coverPath && (
            <img
              src={getCoverUrl(song.coverPath)}
              alt={`${song.title || "Song"} Cover`}
              className="ss-song-cover-image"
              loading="lazy"
              onError={(e) => {
                // ถ้าภาพโหลดไม่สำเร็จ ให้กลับไปแสดง Artwork เดิม
                e.currentTarget.style.display = "none";
                e.currentTarget.parentElement?.classList.remove("has-cover");
              }}
            />
          )}

          {/* DEFAULT ARTWORK: ใช้เมื่อเพลงไม่มีภาพปก */}
          <div className="ss-art-orbit ss-art-orbit-one" />
          <div className="ss-art-orbit ss-art-orbit-two" />

          <div className="ss-art-content">
            <span className="ss-art-label">SHARK SOUND</span>

            <div className={`ss-record ${isPlaying ? "spinning" : ""}`}>
              <div className="ss-record-center">SS</div>
            </div>

            <span className="ss-song-number">
              TRACK / {String(index + 1).padStart(2, "0")}
            </span>
          </div>

          <button
            type="button"
            className={`ss-favorite-btn ${isFavorite ? "liked" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              handleLike(song._id);
            }}
            aria-label="เพิ่มหรือลบรายการโปรด"
          >
            {isFavorite ? "♥" : "♡"}
          </button>

          <button
            type="button"
            className="ss-cover-play"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay(song._id);
            }}
            aria-label={isPlaying ? "หยุดเพลง" : "เล่นเพลง"}
          >
            {isPlaying ? "Ⅱ" : "▶"}
          </button>

          <span className="ss-art-status">
            {isPlaying ? "NOW PLAYING" : "MUSIC TRACK"}
          </span>
        </div>

        {/* SONG INFORMATION */}
        <div className="ss-song-body">
          <div className="ss-song-heading">
            <div className="ss-song-title-row">
              <div className="ss-song-title-group">
                <h3 title={song.title}>{song.title}</h3>
                <p>{song.artist || "Unknown Artist"}</p>
              </div>

              <div className={`ss-wave ${isPlaying ? "active" : ""}`}>
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>

          {/* TAGS */}
          <div className="ss-song-tags">
            {song.type && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFilterTag(song.type);
                }}
              >
                #{song.type}
              </button>
            )}

            {song.subtype && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFilterTag(song.subtype);
                }}
              >
                #{song.subtype}
              </button>
            )}
          </div>

          {/* TIME AND BPM */}
          <div className="ss-song-meta">
            <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
            <span>{song.bpm || 0} BPM</span>
          </div>

          {/* SEEK BAR */}
          <div
            className="ss-seek-area"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="range"
              className="ss-seek-slider"
              min="0"
              max={duration || 1}
              step="0.1"
              value={Math.min(currentTime, duration || 0)}
              style={{
                "--seek-progress": `${progress}%`,
              }}
              onChange={(e) =>
                handleSeek(song._id, e.target.value)
              }
              disabled={!duration}
              aria-label={`เลื่อนเวลาเพลง ${song.title}`}
            />
          </div>

          {/* VOLUME */}
          <div
            className="ss-volume-control"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="ss-volume-icon">
              {volume === 0 ? "◖" : "♫"}
            </span>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              style={{
                "--volume-progress": `${volume * 100}%`,
              }}
              onChange={(e) =>
                handleVolume(song._id, e.target.value)
              }
              aria-label={`ปรับเสียง ${song.title}`}
            />

            <small>{Math.round(volume * 100)}%</small>
          </div>

          {/* BUTTONS */}
          <div
            className="ss-song-actions"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="ss-play-btn"
              onClick={() => togglePlay(song._id)}
            >
              {isPlaying ? "Ⅱ  Pause" : "▶  Play"}
            </button>

            <button
              type="button"
              className="ss-download-btn"
              onClick={() => handleDownload(song)}
            >
              ↓ Download
            </button>
          </div>
        </div>

        {/* AUDIO */}
        <audio
          ref={(el) => {
            audioRefs.current[song._id] = el;
          }}
          id={`audio-${song._id}`}
          src={`${BASE_URL}/${song.filePath}`}
          preload="metadata"
          volume={volume}
          onLoadedMetadata={(e) => {
            const audio = e.currentTarget;

            if (!audio || !Number.isFinite(audio.duration)) return;

            setDurations((prev) => ({
              ...prev,
              [song._id]: audio.duration,
            }));
          }}
          onTimeUpdate={(e) => {
            const audio = e.currentTarget;

            if (!audio) return;

            setCurrentTimes((prev) => ({
              ...prev,
              [song._id]: audio.currentTime,
            }));
          }}
          onPlay={() => setCurrentPlaying(song._id)}
          onPause={() => {
            setCurrentPlaying((prev) =>
              prev === song._id ? null : prev
            );
          }}
          onEnded={() => {
            setCurrentPlaying((prev) =>
              prev === song._id ? null : prev
            );

            setCurrentTimes((prev) => ({
              ...prev,
              [song._id]: 0,
            }));
          }}
          onError={() => {
            console.error(
              "Audio loading error:",
              song.title,
              song.filePath
            );
          }}
        />
      </article>
    );
  };

  // SECTION
  const renderSection = (title, list) => {
    const isLiked = title.includes("Most Liked");
    const isDownloaded = title.includes("Most Downloaded");

    return (
      <section className="ss-music-section" key={title}>
        <div className="ss-section-heading">
          <div>
            <span className="ss-section-overline">
              SHARK SOUND COLLECTION
            </span>

            <h2>{title}</h2>

            <p>
              {title.includes("Recommended")
                ? "เพลงที่เลือกจากประเภทเพลงที่คุณชอบและความนิยม"
                : isLiked
                ? "เพลงที่ได้รับความนิยมจากผู้ฟัง"
                : isDownloaded
                ? "เพลงที่ถูกดาวน์โหลดมากที่สุด"
                : filterTag
                ? "เพลงตามหมวดหมู่ที่เลือก"
                : searchTerm
                ? "ผลลัพธ์จากการค้นหาเพลง"
                : "ค้นพบเพลงใหม่ ๆ จากคลังเพลงของเรา"}
            </p>
          </div>

          <span className="ss-section-count">
            {String(list.length).padStart(2, "0")} TRACKS
          </span>
        </div>

        {list.length > 0 ? (
          <div className="ss-song-grid">
            {list.map((song, index) =>
              renderSongBox(song, index)
            )}
          </div>
        ) : (
          <div className="ss-empty-state">
            <span className="ss-empty-icon">♫</span>
            <h3>ยังไม่มีเพลงในส่วนนี้</h3>
            <p>ลองกลับมาดูใหม่อีกครั้งนะ</p>
          </div>
        )}
      </section>
    );
  };

  // MAIN
  return (
    <div className="songlist-wrapper">

      {/* HERO */}
      {!searchTerm && !filterTag && (
        <section className="ss-hero">
          <div className="ss-hero-content">
            <span className="ss-hero-label">
              YOUR PERSONAL MUSIC SPACE
            </span>

            <h1>
              Discover Your
              <br />
              <span>Sound.</span>
            </h1>

            <p>
              Explore music, find your rhythm
              and enjoy every moment.
            </p>

            <div className="ss-hero-stats">
              <div>
                <strong>{songs.length}</strong>
                <span>AVAILABLE TRACKS</span>
              </div>

              <div className="ss-hero-divider" />

              <div>
                <strong>{favorites.length}</strong>
                <span>YOUR FAVORITES</span>
              </div>
            </div>
          </div>

          <div className="ss-hero-visual">
            <div className="ss-hero-ring ss-ring-one" />
            <div className="ss-hero-ring ss-ring-two" />

            <div className="ss-hero-record">
              <div className="ss-hero-record-center">SS</div>
            </div>

            <span className="ss-hero-caption">
              MUSIC IS YOUR ESCAPE
            </span>
          </div>
        </section>
      )}

      {/* FILTER */}
      {filterTag && (
        <div className="ss-filter-notice">
          <span>
            CATEGORY / <strong>{filterTag}</strong>
          </span>

          <button onClick={() => setFilterTag(null)}>
            ✕ Clear Filter
          </button>
        </div>
      )}

      {/* SEARCH */}
      {searchTerm && (
        <div className="ss-filter-notice">
          <span>SEARCH / <strong>{searchTerm}</strong></span>
        </div>
      )}

      {/* FEATURED */}
      {!searchTerm && !filterTag && (
        <>
          {renderSection("Recommended For You", recommendations)}
          {renderSection("Most Liked", topLikes)}
          {renderSection("Most Downloaded", topDownloads)}
        </>
      )}

      {/* ALL SONGS */}
      {renderSection(
        filterTag
          ? `Category: ${filterTag}`
          : searchTerm
          ? "Search Results"
          : "Explore All Music",
        filteredSongs
      )}

    </div>
  );
}

export default SongList;
