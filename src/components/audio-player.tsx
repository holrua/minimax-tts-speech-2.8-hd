"use client";

import * as React from "react";
import {
  Play,
  Pause,
  Download,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  src: string; // object URL or data URL
  mimeType?: string;
  fileName?: string;
  autoPlay?: boolean;
  className?: string;
}

function fmtTime(s: number): string {
  if (!isFinite(s) || s < 0) return "00:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function AudioPlayer({
  src,
  mimeType,
  fileName = "voicecraft-audio",
  autoPlay = false,
  className,
}: AudioPlayerProps) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = React.useState(false);
  const [current, setCurrent] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [volume, setVolume] = React.useState(1);
  const [muted, setMuted] = React.useState(false);

  React.useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setCurrent(a.currentTime);
    const onMeta = () => setDuration(a.duration || 0);
    const onEnd = () => setPlaying(false);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnd);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("ended", onEnd);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
    };
  }, []);

  React.useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = muted ? 0 : volume;
  }, [volume, muted]);

  React.useEffect(() => {
    if (autoPlay) {
      audioRef.current?.play().catch(() => {});
    }
  }, [autoPlay, src]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  };

  const seek = (val: number[]) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = val[0];
    setCurrent(val[0]);
  };

  const restart = () => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = 0;
    a.play().catch(() => {});
  };

  const download = () => {
    let ext = "mp3";
    if (mimeType?.includes("wav")) ext = "wav";
    else if (mimeType?.includes("opus")) ext = "opus";
    else if (mimeType?.includes("flac")) ext = "flac";
    else if (mimeType?.includes("pcm")) ext = "pcm";
    const a = document.createElement("a");
    a.href = src;
    a.download = `${fileName}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // progress percentage for waveform bars coloring
  const pct = duration > 0 ? (current / duration) * 100 : 0;
  const bars = 40;

  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur-sm",
        className,
      )}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Waveform */}
      <div className="flex items-end gap-[3px] h-14 mb-3" dir="ltr">
        {Array.from({ length: bars }).map((_, i) => {
          const active = (i / bars) * 100 <= pct;
          const height = 20 + Math.abs(Math.sin(i * 1.7)) * 80;
          return (
            <div
              key={i}
              className={cn(
                "flex-1 rounded-full transition-colors duration-150",
                active
                  ? "bg-primary"
                  : "bg-muted-foreground/25 dark:bg-muted-foreground/20",
              )}
              style={{ height: `${height}%` }}
            />
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Button
          size="icon"
          onClick={toggle}
          className="h-11 w-11 rounded-full"
          aria-label={playing ? "إيقاف" : "تشغيل"}
        >
          {playing ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 translate-x-px" />
          )}
        </Button>

        <Button
          size="icon"
          variant="outline"
          onClick={restart}
          className="h-9 w-9 rounded-full"
          aria-label="إعادة"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        <div className="text-xs font-mono text-muted-foreground tabular-nums w-24 text-center">
          {fmtTime(current)} / {fmtTime(duration)}
        </div>

        <div className="flex-1 px-1">
          <Slider
            value={[current]}
            max={duration || 1}
            step={0.05}
            onValueChange={seek}
            aria-label="شريط التقدم"
          />
        </div>

        <Button
          size="icon"
          variant="ghost"
          onClick={() => setMuted((m) => !m)}
          className="h-9 w-9 rounded-full"
          aria-label={muted ? "تشغيل الصوت" : "كتم الصوت"}
        >
          {muted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>

        <Button
          size="icon"
          variant="outline"
          onClick={download}
          className="h-9 w-9 rounded-full"
          aria-label="تنزيل"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
