// GMICloud (console.gmicloud.ai) TTS API — MiniMax Speech 2.8 HD
//
// Async request-queue pattern:
//   POST /api/v1/ie/requestqueue/apikey/requests  -> {request_id, status}
//   GET  /api/v1/ie/requestqueue/apikey/requests/{request_id} -> poll until success
//   On success: outcome.audio_url is a hosted .mp3/.flac URL (fetch it raw).
//
// Auth: Authorization: Bearer <JWT_API_KEY>

export const GMICLOUD_BASE_URL = "https://console.gmicloud.ai";

// The single TTS model on GMICloud.
export const DEFAULT_TTS_MODEL = "minimax-tts-speech-2.8-hd";

export interface TtsModel {
  id: string;
  label: string;
  description: string;
}

export const TTS_MODELS: TtsModel[] = [
  {
    id: DEFAULT_TTS_MODEL,
    label: "MiniMax Speech 2.8 HD",
    description:
      "أحدث طراز عالي الدقة من MiniMax — استجابة فورية وتحليل ذكي ودقة عاطفية واستنساخ صوتي عالي الجودة.",
  },
];

export function getModel(id: string): TtsModel | undefined {
  return TTS_MODELS.find((m) => m.id === id);
}

// Emotion enum (native GMICloud field — sent directly as `payload.emotion`).
export type GmiEmotion =
  | "auto"
  | "calm"
  | "happy"
  | "sad"
  | "angry"
  | "fearful"
  | "disgusted"
  | "surprised";

// Audio format — GMICloud supports mp3 and flac only.
export type GmiFormat = "mp3" | "flac";

// Sample rate (Hz).
export const SAMPLE_RATES = ["8000", "16000", "22050", "24000", "32000", "44100"] as const;
export const DEFAULT_SAMPLE_RATE = "32000";

// Bitrate (mp3 only).
export const BITRATES = ["32000", "64000", "128000", "256000"] as const;
export const DEFAULT_BITRATE = "128000";

// Channel count.
export const CHANNELS = [
  { value: "1", label: "أحادي (Mono)" },
  { value: "2", label: "ستيريو (Stereo)" },
] as const;
export const DEFAULT_CHANNEL = "2";

// language_boost — control recognition of minority languages/dialects.
export const LANGUAGE_BOOSTS = [
  { value: "auto", label: "تلقائي" },
  { value: "Chinese", label: "صيني" },
  { value: "Chinese,Yue", label: "صيني / كانتوني" },
  { value: "English", label: "إنجليزي" },
  { value: "Arabic", label: "عربي" },
  { value: "Russian", label: "روسي" },
  { value: "Spanish", label: "إسباني" },
  { value: "French", label: "فرنسي" },
  { value: "Portuguese", label: "برتغالي" },
  { value: "German", label: "ألماني" },
  { value: "Turkish", label: "تركي" },
  { value: "Dutch", label: "هولندي" },
  { value: "Ukrainian", label: "أوكراني" },
  { value: "Vietnamese", label: "فيتنامي" },
  { value: "Indonesian", label: "إندونيسي" },
  { value: "Japanese", label: "ياباني" },
  { value: "Italian", label: "إيطالي" },
  { value: "Korean", label: "كوري" },
  { value: "Thai", label: "تايلندي" },
] as const;
export const DEFAULT_LANGUAGE_BOOST = "auto";

// Sound effects (ambient) — a `payload.sound_effects` field, DISTINCT from
// the inline interjection tags like (laughs) that live inside the text.
// NOTE: we use "none" as the internal sentinel value because Radix Select
// forbids empty-string item values; the synthesize route maps "none" -> "".
export const SOUND_EFFECTS = [
  { value: "none", label: "بدون مؤثر" },
  { value: "spacious_echo", label: "صدى واسع" },
  { value: "auditorium_echo", label: "صدى قاعة" },
  { value: "lofi_telephone", label: "هاتف قديم" },
  { value: "robotic", label: "روبوت" },
] as const;
export const DEFAULT_SOUND_EFFECT = "none";

// Polling intervals & timeout for the async queue.
export const POLL_INTERVAL_MS = 2500;
export const POLL_TIMEOUT_MS = 180000; // ~3 min max
