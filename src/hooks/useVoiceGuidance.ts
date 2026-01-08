import { useCallback, useRef, useEffect, useState } from "react";
import { Direction } from "@/lib/navigator";

type VoiceCue =
  | "intro"
  | "scan_waiting"
  | "dir_forward"
  | "dir_left"
  | "dir_right"
  | "dir_back"
  | "arrival"
  | "dest_changed"
  | "scan_error";

const AUDIO_FILES: Record<VoiceCue, string> = {
  intro: "/audio/intro_start.mp3",
  scan_waiting: "/audio/scan_waiting.mp3",
  dir_forward: "/audio/dir_forward.mp3",
  dir_left: "/audio/dir_left.mp3",
  dir_right: "/audio/dir_right.mp3",
  dir_back: "/audio/dir_back.mp3",
  arrival: "/audio/arrival.mp3",
  dest_changed: "/audio/dest_changed.mp3",
  scan_error: "/audio/scan_error.mp3",
};

export const useVoiceGuidance = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [needsUserGesture, setNeedsUserGesture] = useState(false);
  
  const isMutedRef = useRef(isMuted);
  const hasPlayedIntro = useRef(false);
  
  // Single pending cue (replace policy: only keep latest)
  const pendingCueRef = useRef<VoiceCue | null>(null);
  const currentCueRef = useRef<VoiceCue | null>(null);
  const isPlayingRef = useRef(false);
  const playTokenRef = useRef(0);

  // Keep muted ref in sync
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Initialize single audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;
    
    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  const playNext = useCallback(() => {
    if (isMutedRef.current || !audioRef.current) {
      isPlayingRef.current = false;
      setIsSpeaking(false);
      currentCueRef.current = null;
      pendingCueRef.current = null;
      return;
    }

    const cue = pendingCueRef.current;
    pendingCueRef.current = null;

    if (!cue) {
      isPlayingRef.current = false;
      setIsSpeaking(false);
      currentCueRef.current = null;
      return;
    }

    isPlayingRef.current = true;
    currentCueRef.current = cue;
    setIsSpeaking(true);

    const token = ++playTokenRef.current;
    const audio = audioRef.current;

    audio.src = AUDIO_FILES[cue];

    const handleEnded = () => {
      if (playTokenRef.current !== token) return;
      cleanup();
      playNext();
    };

    const handleError = () => {
      if (playTokenRef.current !== token) return;
      cleanup();
      playNext();
    };

    const cleanup = () => {
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    audio.play().catch((err) => {
      if (playTokenRef.current !== token) return;
      cleanup();
      
      // If blocked by autoplay policy, don't drain queue
      if (err.name === "NotAllowedError") {
        setNeedsUserGesture(true);
        isPlayingRef.current = false;
        setIsSpeaking(false);
        // Keep pendingCueRef as-is so we can resume later
        pendingCueRef.current = cue;
      } else {
        console.warn("Audio playback failed:", err);
        playNext();
      }
    });
  }, []);

  const play = useCallback((cue: VoiceCue) => {
    if (isMutedRef.current) return;

    // Ignore if same cue is currently playing
    if (currentCueRef.current === cue && isPlayingRef.current) {
      return;
    }

    // Replace policy: always replace pending with latest
    pendingCueRef.current = cue;

    // If not currently playing, start playback
    if (!isPlayingRef.current) {
      playNext();
    }
  }, [playNext]);

  const unlockAudio = useCallback(async () => {
    if (!audioRef.current) return;
    
    try {
      // Play a silent/short sound to unlock audio context
      const audio = audioRef.current;
      audio.volume = 0.01;
      audio.src = AUDIO_FILES.intro;
      await audio.play();
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 1;
      setNeedsUserGesture(false);
      
      // Resume pending cue if any
      if (pendingCueRef.current && !isPlayingRef.current) {
        playNext();
      }
    } catch (err) {
      console.warn("Failed to unlock audio:", err);
    }
  }, [playNext]);

  const playIntro = useCallback(() => {
    if (!hasPlayedIntro.current) {
      hasPlayedIntro.current = true;
      play("intro");
    }
  }, [play]);

  const playDirection = useCallback(
    (direction: Direction) => {
      switch (direction) {
        case "forward":
          play("dir_forward");
          break;
        case "left":
          play("dir_left");
          break;
        case "right":
          play("dir_right");
          break;
        case "back":
          play("dir_back");
          break;
        case "done":
          play("arrival");
          break;
        default:
          break;
      }
    },
    [play]
  );

  const playDestChanged = useCallback(() => {
    play("dest_changed");
  }, [play]);

  const playScanError = useCallback(() => {
    play("scan_error");
  }, [play]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
    // Stop current audio and clear pending when muting
    if (!isMuted && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      pendingCueRef.current = null;
      currentCueRef.current = null;
      isPlayingRef.current = false;
      setIsSpeaking(false);
    }
  }, [isMuted]);

  return {
    isMuted,
    isSpeaking,
    needsUserGesture,
    toggleMute,
    unlockAudio,
    playIntro,
    playDirection,
    playDestChanged,
    playScanError,
  };
};
