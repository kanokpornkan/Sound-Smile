import { useEffect, useRef, useState } from "react";

// One audio player at a time across the visible tab.
export default function useProfileAudio() {
  const players = useRef(new Map());
  const [currentPlaying, setCurrentPlaying] = useState(null);
  const [durations, setDurations] = useState({});
  const [currentTimes, setCurrentTimes] = useState({});

  useEffect(() => () => {
    players.current.forEach((audio) => audio.pause());
    players.current.clear();
  }, []);

  const registerAudio = (id, element) => {
    if (element) players.current.set(id, element);
    else players.current.delete(id);
  };

  const togglePlay = async (id) => {
    const audio = players.current.get(id);
    if (!audio) return;
    players.current.forEach((other, otherId) => {
      if (otherId !== id) {
        other.pause();
        other.currentTime = 0;
        setCurrentTimes((previous) => ({ ...previous, [otherId]: 0 }));
      }
    });
    if (!audio.paused) {
      audio.pause();
      audio.currentTime = 0;
      setCurrentPlaying(null);
      setCurrentTimes((previous) => ({ ...previous, [id]: 0 }));
      return;
    }
    try {
      await audio.play();
      setCurrentPlaying(id);
    } catch (error) {
      console.error("Cannot play track:", error);
      setCurrentPlaying(null);
    }
  };

  const onMetadata = (id, audio) => {
    setDurations((previous) => ({ ...previous, [id]: Number.isFinite(audio.duration) ? audio.duration : 0 }));
  };
  const onTimeUpdate = (id, audio) => {
    setCurrentTimes((previous) => ({ ...previous, [id]: audio.currentTime || 0 }));
  };
  const onEnded = (id) => {
    setCurrentPlaying((old) => old === id ? null : old);
    setCurrentTimes((previous) => ({ ...previous, [id]: 0 }));
  };

  return { currentPlaying, durations, currentTimes, registerAudio, togglePlay, onMetadata, onTimeUpdate, onEnded };
}
