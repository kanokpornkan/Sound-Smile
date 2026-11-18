import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { FiMusic, FiPlus } from "react-icons/fi";
import ProfileTrackCard from "../ProfileTrackCard";
import useProfileAudio from "../useProfileAudio";
import { PROFILE_API, downloadProfileSong, getStoredProfile, getToken, showLoginRequired } from "../profileActions";
import "./Profileuploads.css";

function Profileuploads() {
  const navigate = useNavigate();
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const audio = useProfileAudio();

  const fetchUploads = useCallback(async () => {
    const user = getStoredProfile();
    if (!user?._id) { setLoading(false); return; }
    try {
      const res = await axios.get(`${PROFILE_API}/api/user/${user._id}/uploads`);
      setUploads(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching uploads:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFavorites = useCallback(async () => {
    const user = getStoredProfile();
    const token = getToken();
    if (!user?._id || !token) return;
    try {
      const res = await axios.get(`${PROFILE_API}/api/user/${user._id}/favorites`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFavorites((Array.isArray(res.data) ? res.data : []).filter(Boolean).map((song) => song._id));
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  }, []);

  useEffect(() => {
    fetchUploads();
    loadFavorites();
    window.addEventListener("uploadSuccess", fetchUploads);
    window.addEventListener("favoriteChanged", loadFavorites);
    return () => {
      window.removeEventListener("uploadSuccess", fetchUploads);
      window.removeEventListener("favoriteChanged", loadFavorites);
    };
  }, [fetchUploads, loadFavorites]);

  const handleLike = async (id) => {
    const token = getToken();
    if (!token) { showLoginRequired(); return; }
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      if (favorites.includes(id)) {
        await axios.delete(`${PROFILE_API}/api/songs/${id}/favorite`, config);
        setFavorites((previous) => previous.filter((entry) => entry !== id));
      } else {
        await axios.post(`${PROFILE_API}/api/songs/${id}/favorite`, {}, config);
        setFavorites((previous) => [...previous, id]);
      }
      window.dispatchEvent(new Event("favoriteChanged"));
    } catch (error) {
      console.error("Like error:", error);
      Swal.fire({ icon: "error", title: "ไม่สามารถเปลี่ยนรายการโปรดได้", text: error.response?.data?.message || error.message });
    }
  };

  const handleDownload = async (song) => {
    await downloadProfileSong(song, getToken());
  };

  if (loading) {
    return <div className="ssp-panel-state"><FiMusic /><h3>กำลังโหลดเพลงของคุณ...</h3></div>;
  }

  return (
    <div className="ssp-uploads-list">
      <div className="ssp-collection-bar">
        <div><h3>My uploads</h3><p>เพลงที่คุณแบ่งปันกับคอมมูนิตี้</p></div>
        <button type="button" className="ssp-collection-add" onClick={() => navigate("/upload")}><FiPlus /> เพิ่มเพลง</button>
      </div>
      {uploads.length === 0 ? (
        <div className="ssp-panel-state"><FiMusic /><h3>ยังไม่มีเพลงที่อัปโหลด</h3><p>เริ่มเพิ่มผลงานของคุณ เพื่อให้คนอื่นได้ค้นพบเสียงใหม่ ๆ</p><button type="button" onClick={() => navigate("/upload")}>อัปโหลดเพลงแรก</button></div>
      ) : (
        <div className="ssp-track-grid">
          {uploads.map((song) => (
            <ProfileTrackCard
              key={song._id}
              song={song}
              favorite={favorites.includes(song._id)}
              onFavorite={() => handleLike(song._id)}
              onDownload={() => handleDownload(song)}
              onOpen={() => navigate(`/song/${song._id}`)}
              isPlaying={audio.currentPlaying === song._id}
              duration={audio.durations[song._id] || 0}
              currentTime={audio.currentTimes[song._id] || 0}
              registerAudio={audio.registerAudio}
              onMetadata={audio.onMetadata}
              onTimeUpdate={audio.onTimeUpdate}
              onEnded={audio.onEnded}
              onTogglePlay={() => audio.togglePlay(song._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Profileuploads;
