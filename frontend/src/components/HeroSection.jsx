import React, {
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";

import axios from "axios";
import { useNavigate } from "react-router-dom";

import {
  FiSearch,
  FiPlay,
  FiPause,
  FiVolume2,
  FiVolumeX,
  FiArrowUpRight,
  FiHeadphones,
  FiDownload
} from "react-icons/fi";

import "./HeroSection.css";

const BASE_URL = "http://localhost:5000";
const BAR_COUNT = 48;

function HeroSection({ setSearchTerm }) {
  const [tags, setTags] = useState([]);
  const [input, setInput] = useState("");
  const [featuredSong, setFeaturedSong] = useState(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.72);

  const [bars, setBars] = useState(
    () => Array(BAR_COUNT).fill(5)
  );

  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const audioRef = useRef(null);
  const contextRef = useRef(null);
  const analyserRef = useRef(null);
  const frameRef = useRef(null);

  const navigate = useNavigate();

  // โหลดเพลงยอดดาวน์โหลดสูงสุดจากระบบ
  useEffect(() => {
    let alive = true;

    Promise.all([
      axios.get(`${BASE_URL}/api/songs`),
      axios.get(`${BASE_URL}/api/songs/top-downloads`)
    ])
      .then(([allRes, topRes]) => {
        if (!alive) return;

        const tagList = allRes.data
          .flatMap(song => [song.type, song.subtype])
          .filter(Boolean);

        setTags([
          ...new Set(tagList)
        ].sort((a, b) => a.localeCompare(b)));

        const topSong = [...(topRes.data || [])]
          .sort(
            (a, b) =>
              (b.downloads || 0) -
              (a.downloads || 0)
          )[0];

        setFeaturedSong(topSong || null);
      })
      .catch(err => {
        console.error(
          "Unable to load featured music:",
          err
        );
      });

    return () => {
      alive = false;
    };
  }, []);

  // ปรับระดับเสียง
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // ล้าง Animation เมื่อออกจากหน้า
  useEffect(() => {
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }

      if (
        contextRef.current &&
        contextRef.current.state !== "closed"
      ) {
        contextRef.current.close();
      }
    };
  }, []);

  // แปลงเวลาเพลง
  const formatTime = (value) => {
    if (!Number.isFinite(value)) return "0:00";

    const mins = Math.floor(value / 60);

    return `${mins}:${String(
      Math.floor(value % 60)
    ).padStart(2, "0")}`;
  };

  // วิเคราะห์คลื่นเสียงจริง
  const animateWaveform = useCallback(() => {
    const analyser = analyserRef.current;

    if (!analyser) return;

    const data = new Uint8Array(
      analyser.frequencyBinCount
    );

    const draw = () => {
      analyser.getByteFrequencyData(data);

      const nextBars = Array.from(
        { length: BAR_COUNT },
        (_, index) => {
          const bin = Math.floor(
            (index / BAR_COUNT) * data.length
          );

          return Math.max(
            5,
            Math.round((data[bin] / 255) * 100)
          );
        }
      );

      setBars(nextBars);

      frameRef.current =
        requestAnimationFrame(draw);
    };

    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }

    draw();
  }, []);

  // เล่นและหยุดเพลง
  const togglePlayback = async () => {
    const audio = audioRef.current;

    if (!audio || !featuredSong) return;

    if (audio.paused) {
      try {
        const AudioContextClass =
          window.AudioContext ||
          window.webkitAudioContext;

        if (
          AudioContextClass &&
          !contextRef.current
        ) {
          const context = new AudioContextClass();

          const analyser = context.createAnalyser();

          analyser.fftSize = 128;

          const source =
            context.createMediaElementSource(audio);

          source.connect(analyser);

          analyser.connect(context.destination);

          contextRef.current = context;
          analyserRef.current = analyser;
        }

        if (
          contextRef.current?.state === "suspended"
        ) {
          await contextRef.current.resume();
        }

        await audio.play();

        setIsPlaying(true);

        animateWaveform();

      } catch (error) {
        console.error(
          "Audio playback failed:",
          error
        );
      }

    } else {
      audio.pause();

      setIsPlaying(false);

      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }

      setBars(Array(BAR_COUNT).fill(5));
    }
  };

  // ค้นหาเพลง
  const handleSearch = () => {
    if (input.trim()) {
      setSearchTerm(input.trim());
    }
  };

  const featuredImage =
    featuredSong?.coverImage ||
    featuredSong?.thumbnail ||
    "";

  return (
    <section className="shark-home-hero">

      <div className="shark-hero-shell">

        {/* HEADER */}
        <div className="shark-hero-topline">

          <span className="shark-eyebrow">
            <span className="shark-live-dot" />
            SoundSmile / AUDIO DISCOVERY
          </span>

          <span className="shark-hero-index">
            01 — 04
          </span>

        </div>

        {/* MAIN TEXT */}
        <div className="shark-hero-copy">

          <p className="shark-kicker">
            SOUND THAT MOVES YOU
          </p>

          <h1>
            Find your next
            <br />
            <span>favorite sound.</span>
          </h1>

          <p className="shark-hero-description">
            Discover sounds, explore new music,
            and bring your ideas to life with
            SoundSmile.
          </p>

          {/* SEARCH */}
          <div className="shark-search-box">

            <FiSearch />

            <input
              type="search"
              placeholder="Search songs, artists, or sounds..."
              value={input}
              onChange={(e) =>
                setInput(e.target.value)
              }
              onKeyDown={(e) =>
                e.key === "Enter" && handleSearch()
              }
            />

            <button onClick={handleSearch}>
              Search <FiArrowUpRight />
            </button>

          </div>

          {/* TAGS */}
          <div className="shark-tag-row">

            <span>EXPLORE</span>

            {tags.slice(0, 5).map(tag => (
              <button
                key={tag}
                onClick={() => setSearchTerm(tag)}
              >
                #{tag}
              </button>
            ))}

          </div>

        </div>

        {/* FEATURED MUSIC */}
        <div className="shark-feature-card">

          <div className="shark-feature-art">

            {featuredImage ? (

              <img
                src={
                  featuredImage.startsWith("http")
                    ? featuredImage
                    : `${BASE_URL}/${featuredImage}`
                }
                alt=""
              />

            ) : (

              <div className="shark-art-glow">
                <FiHeadphones />
              </div>

            )}

            <div className="shark-art-overlay" />

            <span className="shark-feature-label">
              #1 MOST DOWNLOADED
            </span>

            <span className="shark-art-caption">
              THE COMMUNITY PICK
            </span>

          </div>

          <div className="shark-feature-details">

            <div className="shark-feature-heading">

              <div>

                <span className="shark-small-label">
                  TRENDING TRACK
                </span>

                <h2>
                  {featuredSong?.title ||
                    "Your next sound starts here"}
                </h2>

                <p>
                  {featuredSong?.artist ||
                    "Discover the SoundSmile library"}
                </p>

              </div>

              <span className="shark-feature-arrow">
                <FiArrowUpRight />
              </span>

            </div>

            {/* AUDIO WAVEFORM */}
            <div
              className={`shark-waveform ${
                isPlaying ? "is-playing" : ""
              }`}
              aria-label="Live audio waveform"
            >

              {bars.map((height, index) => (
                <span
                  key={index}
                  style={{
                    height: `${height}%`
                  }}
                />
              ))}

            </div>

            {/* MUSIC PLAYER */}
            <div className="shark-feature-controls">

              <button
                className="shark-play-button"
                onClick={togglePlayback}
                disabled={
                  !featuredSong ||
                  !featuredSong.filePath
                }
              >
                {isPlaying ? (
                  <FiPause />
                ) : (
                  <FiPlay />
                )}
              </button>

              <div className="shark-track-time">

                <span>
                  {formatTime(currentTime)}
                </span>

                <div className="shark-track-progress">
                  <i
                    style={{
                      width: `${
                        duration
                          ? (currentTime / duration) * 100
                          : 0
                      }%`
                    }}
                  />
                </div>

                <span>
                  {formatTime(duration)}
                </span>

              </div>

              {/* VOLUME */}
              <div className="shark-volume-control">

                <button
                  onClick={() =>
                    setVolume(volume === 0 ? 0.72 : 0)
                  }
                >
                  {volume === 0 ? (
                    <FiVolumeX />
                  ) : (
                    <FiVolume2 />
                  )}
                </button>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) =>
                    setVolume(Number(e.target.value))
                  }
                />

              </div>

            </div>

            {/* DOWNLOAD COUNT */}
            <div className="shark-feature-footer">

              <span>
                <FiDownload />
                {(featuredSong?.downloads || 0).toLocaleString()}
                {" "}downloads
              </span>

              <button
                onClick={() =>
                  featuredSong?._id &&
                  navigate(`/song/${featuredSong._id}`)
                }
              >
                Explore track <FiArrowUpRight />
              </button>

            </div>

          </div>

        </div>

        {/* AUDIO FILE */}
        {featuredSong?.filePath && (

          <audio
            ref={audioRef}
            crossOrigin="anonymous"
            src={`${BASE_URL}/${featuredSong.filePath}`}
            preload="metadata"

            onLoadedMetadata={(e) =>
              setDuration(e.currentTarget.duration)
            }

            onTimeUpdate={(e) =>
              setCurrentTime(e.currentTarget.currentTime)
            }

            onEnded={() => {
              setIsPlaying(false);
              setCurrentTime(0);

              if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
              }

              setBars(Array(BAR_COUNT).fill(5));
            }}
          />

        )}

        <div className="shark-hero-bottom">

          <span>CURATED BY THE COMMUNITY</span>

          <span>LISTEN · DISCOVER · CREATE</span>

        </div>

      </div>

    </section>
  );
}

export default HeroSection;