// ChinaAPI.ai Text-to-Speech model catalog.
// All models are reachable via POST https://api.chinaapi.ai/v1/audio/speech
// Authentication: Authorization: Bearer $CHINAAPI_KEY (OpenAI-compatible)

export interface TtsModel {
  id: string;
  label: string;
  description: string;
  category: "high-fidelity" | "voice-clone" | "multilingual" | "low-cost";
  supportsCloning: boolean;
  supportsEmotion: boolean;
  badge?: string;
}

export const TTS_MODELS: TtsModel[] = [
  {
    id: "speech-2.8-hd",
    label: "Speech 2.8 HD",
    description:
      "أعلى جودة صوت متاحة على المنصة — النموذج المميز من MiniMax. يدعم المشاعر والعلامات الصوتية.",
    category: "high-fidelity",
    supportsCloning: false,
    supportsEmotion: true,
    badge: "مميز",
  },
  {
    id: "speech-2.8-turbo",
    label: "Speech 2.8 Turbo",
    description:
      "نسخة أسرع وأرخص من HD تقريبًا بنفس الجودة بزمن استجابة أقل.",
    category: "high-fidelity",
    supportsCloning: false,
    supportsEmotion: true,
    badge: "سريع",
  },
  {
    id: "step-tts-2",
    label: "Step TTS 2",
    description:
      "يدعم استنساخ الصوت من ~10 ثوانٍ من العينة المرجعية، مع التحكم بالمشاعر عبر تعليمات طبيعية.",
    category: "voice-clone",
    supportsCloning: true,
    supportsEmotion: true,
    badge: "استنساخ",
  },
  {
    id: "step-tts-mini",
    label: "Step TTS Mini",
    description:
      "نسخة منخفضة الكلفة وزمن الاستجابة من عائلة Step، تدعم الاستنساخ.",
    category: "low-cost",
    supportsCloning: true,
    supportsEmotion: true,
    badge: "اقتصادي",
  },
  {
    id: "stepaudio-2.5-tts",
    label: "StepAudio 2.5 TTS",
    description:
      "نموذج StepAudio الكامل — يدعم استنساخ الصوت والتحكم بالمشاعر والتعبير.",
    category: "voice-clone",
    supportsCloning: true,
    supportsEmotion: true,
  },
  {
    id: "qwen3-tts-flash",
    label: "Qwen3 TTS Flash",
    description:
      "نموذج متعدد اللغات سريع ومنخفض الكلفة — خيار افتراضي جيد عند عدم الحاجة لصوت مستنسخ.",
    category: "multilingual",
    supportsCloning: false,
    supportsEmotion: false,
    badge: "متعدد اللغات",
  },
  {
    id: "glm-tts",
    label: "GLM TTS",
    description:
      "نموذج GLM متعدد اللغات منخفض الكلفة.",
    category: "multilingual",
    supportsCloning: false,
    supportsEmotion: false,
  },
];

export const TTS_MODEL_CATEGORIES: {
  value: TtsModel["category"];
  label: string;
}[] = [
  { value: "high-fidelity", label: "جودة عالية" },
  { value: "voice-clone", label: "استنساخ الصوت" },
  { value: "multilingual", label: "متعدد اللغات" },
  { value: "low-cost", label: "اقتصادي" },
];

export function getModel(id: string): TtsModel | undefined {
  return TTS_MODELS.find((m) => m.id === id);
}

export const DEFAULT_TTS_MODEL = "speech-2.8-hd";

// ChinaAPI base URL (OpenAI-compatible)
export const CHINAAPI_BASE_URL = "https://api.chinaapi.ai/v1";
