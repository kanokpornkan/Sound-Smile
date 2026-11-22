import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { FiHeart } from "react-icons/fi";
import ProfileTrackCard from "../ProfileTrackCard";
import useProfileAudio from "../useProfileAudio";
import { PROFILE_API, downloadProfileSong, getStoredProfile, getToken, showLoginRequired } from "../profileActions";
import "./Profilefovorites.css";
import { SkeletonRows } from "../../motion/Skeleton";

function Profilefavorites() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const audio = useProfileAudio();

  const fetchFavorites = useCallback(async () => {
    const user = getStoredProfile();
    const token = getToken();
    if (!user?._id || !token) { setLoading(false); return; }
    try {
      const response = await axios.get(`${PROFILE_API}/api/user/${user._id}/favorites`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFavorites((Array.isArray(response.data) ? response.data : []).filter(Boolean));
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
    window.addEventListener("favoriteChanged", fetchFavorites);
    return () => window.removeEventListener("favoriteChanged", fetchFavorites);
  }, [fetchFavorites]);

  const handleUnfavorite = async (songId) => {
    const token = getToken();
    if (!token) { showLoginRequired(); return; }
    try {
      await axios.delete(`${PROFILE_API}/api/songs/${songId}/favorite`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFavorites((old) => old.filter((song) => song._id !== songId));
      window.dispatchEvent(new Event("favoriteChanged"));
      Swal.fire({ icon: "success", title: "นำออกจากรายการโปรดแล้ว", toast: true, position: "top-end", timer: 1600, showConfirmButton: false });
    } catch (error) {
      console.error("Unfavorite error:", error);
      Swal.fire({ icon: "error", title: "ลบออกจากรายการโปรดไม่สำเร็จ", text: error.response?.data?.message || error.message });
    }
  };

  const handleDownload = async (song) => {
    await downloadProfileSong(song, getToken());
  };

  if (loading) return <div className="ssp-panel-skeleton"><SkeletonRows count={4} /></div>;

  return (
    <div className="ssp-favorites-list">
      <div className="ssp-collection-bar"><div><h3>Favorite tracks</h3><p>เพลงโปรดที่คุณบันทึกเก็บไว้</p></div></div>
      {favorites.length === 0 ? (
        <div className="ssp-panel-state"><FiHeart /><h3>ยังไม่มีเพลงในรายการโปรด</h3><p>ลองฟังเพลงและกดหัวใจเพื่อบันทึกเพลงที่คุณชอบ</p><button type="button" onClick={() => navigate("/")}>สำรวจเสียงใหม่</button></div>
      ) : (
        <div className="ssp-track-grid">
          {favorites.map((song) => (
            <ProfileTrackCard
              key={song._id}
              song={song}
              favorite
              onFavorite={() => handleUnfavorite(song._id)}
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

export default Profilefavorites;
