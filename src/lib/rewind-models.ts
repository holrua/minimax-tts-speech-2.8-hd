// Rewind.ai TTS API — https://api.rewind.ai
//
// Synchronous pattern:
//   POST /v1/tts/  ->  { audio_url, format, voice }
//   fetch(audio_url)  ->  raw audio bytes (mp3/wav)
//
// Auth: Authorization: Bearer sk-rewind-...
// Body: { text, voice, speed, format, model? }
// We only surface MiniMax Speech 2.8 models — they're the highest-fidelity
// option and the only ones that support inline pause/sound tags.

export const REWIND_BASE_URL = "https://api.rewind.ai";

export interface TtsModel {
  id: string;
  label: string;
  description: string;
  badge?: string;
}

// Rewind.ai exposes several TTS models; we surface the MiniMax family only.
export const TTS_MODELS: TtsModel[] = [
  {
    id: "minimax/speech-2.8-hd",
    label: "MiniMax Speech 2.8 HD",
    description:
      "أعلى جودة من MiniMax — يدعم النص متعدد اللغات وعلامات الإيقاف والمؤثرات.",
    badge: "مميز",
  },
  {
    id: "minimax/speech-2.8-turbo",
    label: "MiniMax Speech 2.8 Turbo",
    description: "نسخة أسرع وأرخص من HD بنفس الجودة تقريبًا.",
    badge: "سريع",
  },
];

export const DEFAULT_TTS_MODEL = "minimax/speech-2.8-hd";

export function getModel(id: string): TtsModel | undefined {
  return TTS_MODELS.find((m) => m.id === id);
}

// Audio format — Rewind accepts mp3 and wav.
export type RewindFormat = "mp3" | "wav";

export const FORMAT_OPTIONS: { value: RewindFormat; label: string }[] = [
  { value: "mp3", label: "MP3" },
  { value: "wav", label: "WAV" },
];

