import React from "react";
import { FiDownload, FiHeart, FiMusic, FiPause, FiPlay, FiArrowUpRight } from "react-icons/fi";
import { PROFILE_API } from "./profileActions";
import "./ProfileTrackCard.css";

function displayTime(seconds) {
  if (!Number.isFinite(Number(seconds)) || Number(seconds) <= 0) return "0:00";
  const minutes = Math.floor(Number(seconds) / 60);
  const secs = Math.floor(Number(seconds) % 60);
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

export default function ProfileTrackCard({
  song, audioId = song?._id, favorite = false, onFavorite,
  onDownload, onOpen, isPlaying, duration = 0, currentTime = 0,
  registerAudio, onMetadata, onTimeUpdate, onEnded, onTogglePlay,
}) {
  if (!song) return <div className="ssp-track-removed">เพลงนี้ถูกลบไปแล้ว</div>;
  const coverUrl = song.coverPath
    ? (/^(https?:|data:|blob:)/i.test(song.coverPath)
      ? song.coverPath
      : `${PROFILE_API}/${String(song.coverPath).replace(/^\/+/, "")}`)
    : "";
  const progress = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  return (
    <article
      className="ssp-track-card"
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault(); onOpen?.();
        }
      }}
      role="link"
      tabIndex={0}
      aria-label={`ดูรายละเอียดเพลง ${song.title || "Untitled"}`}
    >
      <div className="ssp-track-art">
        <div className="ssp-track-art-fallback"><FiMusic /><span>SOUND SHARE</span></div>
        {coverUrl && (
          <img
            src={coverUrl}
            alt={`ปกเพลง ${song.title || ""}`}
            loading="lazy"
            onError={(event) => { event.currentTarget.style.display = "none"; }}
          />
        )}
        <span className="ssp-track-type">{song.soundType || "ORIGINAL SOUND"}</span>
        <button
          className={`ssp-track-heart ${favorite ? "is-liked" : ""}`}
          type="button"
          aria-label={favorite ? "นำออกจากรายการโปรด" : "เพิ่มในรายการโปรด"}
          title={favorite ? "นำออกจากรายการโปรด" : "เพิ่มในรายการโปรด"}
          onClick={(event) => { event.stopPropagation(); onFavorite?.(); }}
        ><FiHeart /></button>
      </div>
      <div className="ssp-track-body">
        <div className="ssp-track-heading"><div><h3>{song.title || "Untitled track"}</h3><p>{song.artist || "Unknown artist"}</p></div><FiArrowUpRight /></div>
        <div className="ssp-track-tags">
          {song.type && <span>#{song.type}</span>}
          {song.subtype && <span>#{song.subtype}</span>}
          {Number(song.bpm) > 0 && <span>{song.bpm} BPM</span>}
        </div>
        <div className="ssp-track-timeline"><span>{displayTime(currentTime)}</span><div className="ssp-track-timeline-base"><div style={{ width: `${progress}%` }} /></div><span>{displayTime(duration)}</span></div>
        <div className="ssp-track-controls">
          <button type="button" className="ssp-track-play" onClick={(event) => { event.stopPropagation(); onTogglePlay?.(); }} aria-label={isPlaying ? "หยุดเพลง" : "เล่นเพลง"}>
            {isPlaying ? <FiPause /> : <FiPlay />} <span>{isPlaying ? "หยุดเล่น" : "เล่นเพลง"}</span>
          </button>
          <button type="button" className="ssp-track-download" onClick={(event) => { event.stopPropagation(); onDownload?.(); }}><FiDownload /> ดาวน์โหลด</button>
        </div>
      </div>
      <audio
        ref={(element) => registerAudio?.(audioId, element)}
        src={song.filePath ? `${PROFILE_API}/${String(song.filePath).replace(/^\/+/, "")}` : undefined}
        preload="metadata"
        onLoadedMetadata={(event) => onMetadata?.(audioId, event.currentTarget)}
        onTimeUpdate={(event) => onTimeUpdate?.(audioId, event.currentTarget)}
        onEnded={() => onEnded?.(audioId)}
      />
    </article>
  );
}
