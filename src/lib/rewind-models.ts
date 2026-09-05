// Rewind.ai TTS API — https://api.rewind.ai
//
// Synchronous pattern:
//   POST /v1/tts/  ->  { audio_url, format, voice }
//   fetch(audio_url)  ->  raw audio bytes (mp3/wav)
//
// Auth: Authorization: Bearer sk-rewind-...
// Body: { text, voice, speed, format, model? }
// The server default model is Kokoro; we send model explicitly so MiniMax
// Speech 2.8 HD (the highest-fidelity option) is used by default.

export const REWIND_BASE_URL = "https://api.rewind.ai";

export interface TtsModel {
  id: string;
  label: string;
  description: string;
  badge?: string;
}

// Rewind.ai exposes several TTS models; we surface the most useful ones.
// The "model" field is passed in the request body.
export const TTS_MODELS: TtsModel[] = [
  {
    id: "minimax/speech-2.8-hd",
    label: "MiniMax Speech 2.8 HD",
    description:
      "أعلى جودة من MiniMax — يدعم النص متعدد اللغات والمشاعر وعلامات الإيقاف والمؤثرات.",
    badge: "مميز",
  },
  {
    id: "minimax/speech-2.8-turbo",
    label: "MiniMax Speech 2.8 Turbo",
    description: "نسخة أسرع وأرخص من HD بنفس الجودة تقريبًا.",
    badge: "سريع",
  },
  {
    id: "hexgrad/kokoro-82m",
    label: "Kokoro 82M",
    description: "نموذج TTS مجاني وسريع من Kokoro — أصوات إنجليزية ولهجات متعددة.",
    badge: "مجاني",
  },
  {
    id: "qwen/qwen-audio-3.0-tts-flash",
    label: "Qwen Audio TTS Flash",
    description: "نموذج Qwen متعدد اللغات وسريع.",
  },
  {
    id: "microsoft/mai-voice-2-flash",
    label: "Microsoft MAI-Voice 2 Flash",
    description: "صوت طبيعي من Microsoft بنبرة احترافية.",
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
