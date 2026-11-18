import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { FiDownload } from "react-icons/fi";
import ProfileTrackCard from "../ProfileTrackCard";
import useProfileAudio from "../useProfileAudio";
import { PROFILE_API, downloadProfileSong, getStoredProfile, getToken, showLoginRequired } from "../profileActions";
import "./Profiledownload.css";

function Profiledownload() {
  const navigate = useNavigate();
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const audio = useProfileAudio();

  const fetchDownloads = useCallback(async () => {
    const user = getStoredProfile();
    const token = getToken();
    if (!user?._id || !token) { setLoading(false); return; }
    try {
      const result = await axios.get(`${PROFILE_API}/api/user/${user._id}/downloads`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDownloads(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error("Error fetching downloads:", error);
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
    fetchDownloads();
    loadFavorites();
    window.addEventListener("downloadSuccess", fetchDownloads);
    window.addEventListener("favoriteChanged", loadFavorites);
    return () => {
      window.removeEventListener("downloadSuccess", fetchDownloads);
      window.removeEventListener("favoriteChanged", loadFavorites);
    };
  }, [fetchDownloads, loadFavorites]);

  const handleLike = async (songId) => {
    const token = getToken();
    if (!token) { showLoginRequired(); return; }
    try {
      const headers = { Authorization: `Bearer ${token}` };
      if (favorites.includes(songId)) {
        await axios.delete(`${PROFILE_API}/api/songs/${songId}/favorite`, { headers });
        setFavorites((old) => old.filter((id) => id !== songId));
      } else {
        await axios.post(`${PROFILE_API}/api/songs/${songId}/favorite`, {}, { headers });
        setFavorites((old) => [...old, songId]);
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

  if (loading) return <div className="ssp-panel-state"><FiDownload /><h3>กำลังโหลดประวัติดาวน์โหลด...</h3></div>;

  return (
    <div className="ssp-download-list">
      <div className="ssp-collection-bar"><div><h3>Download history</h3><p>เสียงที่คุณเคยดาวน์โหลดไว้</p></div></div>
      {downloads.length === 0 ? (
        <div className="ssp-panel-state"><FiDownload /><h3>ยังไม่มีประวัติการดาวน์โหลด</h3><p>ลองฟังเพลงจากหน้าแรกและดาวน์โหลดเพลงที่ถูกใจ</p><button type="button" onClick={() => navigate("/")}>ค้นหาเพลง</button></div>
      ) : (
        <div className="ssp-track-grid">
          {downloads.map((item, index) => {
            const song = item.song;
            if (!song) return <div className="ssp-track-removed" key={item._id || `deleted-${index}`}>เพลงนี้ถูกลบไปแล้ว</div>;
            // One history entry per download. Songs may appear more than once.
            const id = item._id || `${song._id}-${index}`;
            return (
              <ProfileTrackCard
                key={id}
                song={song}
                audioId={id}
                favorite={favorites.includes(song._id)}
                onFavorite={() => handleLike(song._id)}
                onDownload={() => handleDownload(song)}
                onOpen={() => navigate(`/song/${song._id}`)}
                isPlaying={audio.currentPlaying === id}
                duration={audio.durations[id] || 0}
                currentTime={audio.currentTimes[id] || 0}
                registerAudio={audio.registerAudio}
                onMetadata={audio.onMetadata}
                onTimeUpdate={audio.onTimeUpdate}
                onEnded={audio.onEnded}
                onTogglePlay={() => audio.togglePlay(id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Profiledownload;
