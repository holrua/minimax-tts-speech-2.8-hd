// MiniMax Speech 2.8 HD advanced controls:
// - Emotion: passed as options.emotion
// - Pause tag: <#> inserted inline in the prompt
// - Sound tags: (sound_name) inserted inline in the prompt

export interface EmotionPreset {
  value: string;
  label: string;
  description: string;
  emoji: string;
}

// Emotions supported by MiniMax Speech 2.8 HD.
export const EMOTION_PRESETS: EmotionPreset[] = [
  {
    value: "auto",
    label: "تلقائي",
    description: "يترك النموذج يختار المشاعر المناسبة للنص تلقائيًا",
    emoji: "✨",
  },
  {
    value: "calm",
    label: "هادئ",
    description: "نبرة هادئة ومطمئنة وثابتة",
    emoji: "🧘",
  },
  {
    value: "happy",
    label: "سعيد",
    description: "نبرة مبهجة ومتفائلة",
    emoji: "😄",
  },
  {
    value: "sad",
    label: "حزين",
    description: "نبرة حزينة وبطيئة",
    emoji: "😢",
  },
  {
    value: "angry",
    label: "غاضب",
    description: "نبرة قوية ومتهورة",
    emoji: "😠",
  },
  {
    value: "fearful",
    label: "خائف",
    description: "نبرة متوترة ومرتعبة",
    emoji: "😨",
  },
  {
    value: "disgusted",
    label: "مشمئز",
    description: "نبرة ازدراء ونفور",
    emoji: "🤢",
  },
  {
    value: "surprised",
    label: "متفاجئ",
    description: "نبرة دهشة وانبهار",
    emoji: "😲",
  },
];

export interface SoundTagPreset {
  tag: string; // the inline tag e.g. "(laughs)"
  label: string;
  category: "human" | "crowd" | "nature" | "object" | "animal" | "music";
  official?: boolean; // true for the 8 officially documented MiniMax interjections
}

// MiniMax Speech 2.8 officially supports these 8 interjection tags (verb form).
// Non-official tags may still work but with weaker/weird results.
// See: https://fal.ai/models/fal-ai/minimax/speech-2.8-hd/api
export const SOUND_TAG_PRESETS: SoundTagPreset[] = [
  // Official MiniMax interjections (verb form — these produce the strongest effect)
  { tag: "(laughs)", label: "ضحك", category: "human", official: true },
  { tag: "(sighs)", label: "تنهيدة", category: "human", official: true },
  { tag: "(coughs)", label: "سعال", category: "human", official: true },
  { tag: "(clears throat)", label: "تخليص الحلق", category: "human", official: true },
  { tag: "(gasps)", label: "لهاث", category: "human", official: true },
  { tag: "(sniffs)", label: "شم", category: "human", official: true },
  { tag: "(groans)", label: "أنين", category: "human", official: true },
  { tag: "(yawns)", label: "تثاؤب", category: "human", official: true },

  // Additional commonly-supported tags (weaker effect)
  { tag: "(chuckles)", label: "ضحكة خافتة", category: "human" },
  { tag: "(cries)", label: "بكاء", category: "human" },
  { tag: "(screams)", label: "صراخ", category: "human" },
  { tag: "(whispers)", label: "همس", category: "human" },

  // Crowd / social
  { tag: "(applause)", label: "تصفيق", category: "crowd" },
  { tag: "(cheers)", label: "هتاف", category: "crowd" },
  { tag: "(crowd)", label: "ضجيج جمهور", category: "crowd" },
  { tag: "(booing)", label: "استهجان", category: "crowd" },

  // Nature
  { tag: "(rain)", label: "مطر", category: "nature" },
  { tag: "(wind)", label: "رياح", category: "nature" },
  { tag: "(thunder)", label: "رعد", category: "nature" },
  { tag: "(ocean)", label: "أمواج", category: "nature" },
  { tag: "(fire)", label: "نار", category: "nature" },
  { tag: "(storm)", label: "عاصفة", category: "nature" },

  // Objects
  { tag: "(footsteps)", label: "خطوات", category: "object" },
  { tag: "(door)", label: "باب", category: "object" },
  { tag: "(phone)", label: "هاتف", category: "object" },
  { tag: "(bell)", label: "جرس", category: "object" },
  { tag: "(clock)", label: "ساعة", category: "object" },
  { tag: "(car)", label: "سيارة", category: "object" },
  { tag: "(train)", label: "قطار", category: "object" },
  { tag: "(plane)", label: "طائرة", category: "object" },

  // Animals
  { tag: "(bird)", label: "عصفور", category: "animal" },
  { tag: "(dog)", label: "كلب", category: "animal" },
  { tag: "(cat)", label: "قطة", category: "animal" },
  { tag: "(horse)", label: "حصان", category: "animal" },
  { tag: "(rooster)", label: "ديك", category: "animal" },

  // Music
  { tag: "(music)", label: "موسيقى", category: "music" },
  { tag: "(drum)", label: "طبلة", category: "music" },
  { tag: "(guitar)", label: "غيتار", category: "music" },
  { tag: "(piano)", label: "بيانو", category: "music" },
];

export const SOUND_TAG_CATEGORIES: {
  value: SoundTagPreset["category"];
  label: string;
}[] = [
  { value: "human", label: "أصوات بشرية" },
  { value: "crowd", label: "جمهور واجتماعي" },
  { value: "nature", label: "طبيعة" },
  { value: "object", label: "أشياء" },
  { value: "animal", label: "حيوانات" },
  { value: "music", label: "موسيقى" },
];

// Pause tag for MiniMax — MUST include a duration (in seconds, 0.01 to 99.99).
// The bare "<#>" form is stripped by ChinaAPI; only "<#x.xx#>" is honoured.
// e.g. "<#0.5#>" = half a second pause, "<#1.5#>" = one and a half seconds.
export const PAUSE_TAG = "<#0.5#>";
export const PAUSE_MIN = 0.01;
export const PAUSE_MAX = 99.99;

// Build a pause tag with a given duration (seconds).
export function makePauseTag(seconds: number): string {
  const clamped = Math.max(PAUSE_MIN, Math.min(PAUSE_MAX, seconds));
  // Trim trailing zeros but keep at least one decimal place for clarity.
  const formatted = Number(clamped.toFixed(2)).toString();
  return `<#${formatted}#>`;
}

// Extract all pause durations present in a text (e.g. "<#1.5#>" -> 1.5).
export const PAUSE_TAG_REGEX = /<#(\d+(?:\.\d+)?)#>/g;
export function extractPauseDurations(text: string): number[] {
  const out: number[] = [];
  for (const m of text.matchAll(PAUSE_TAG_REGEX)) {
    out.push(Number(m[1]));
  }
  return out;
}

// Emotion value sent to GMICloud as `payload.emotion` (native field).
// GMICloud accepts these directly: auto, calm, happy, sad, angry, fearful,
// disgusted, surprised. We keep a simple identity map for forward-compat.
export const EMOTION_DIRECTIONS: Record<string, string> = {
  auto: "auto",
  calm: "calm",
  happy: "happy",
  sad: "sad",
  angry: "angry",
  fearful: "fearful",
  disgusted: "disgusted",
  surprised: "surprised",
};

// Examples demonstrating advanced syntax
export const ADVANCED_EXAMPLES: { title: string; text: string }[] = [
  {
    title: "إيقاف مؤقت (نصف ثانية)",
    text: "مرحبًا بك <#0.5#> يسعدني أن أراك اليوم!",
  },
  {
    title: "إيقاف مؤقت طويل (ثانية ونصف)",
    text: "فكّرت قليلًا <#1.5#> ثم قرّرت المواصلة.",
  },
  {
    title: "مؤثر صوتي (ضحك)",
    text: "هذا الموقف مضحك حقًا (laughs) لا أستطيع التوقف!",
  },
  {
    title: "مزيج كامل",
    text: "في البداية كنت مترددًا (sighs) <#0.8#> لكنني الآن متحمس جدًا (cheers)!",
  },
];
