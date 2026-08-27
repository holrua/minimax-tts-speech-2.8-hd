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
    description: "يترك النموذج يختار المشاعر المناسبة للنص",
    emoji: "✨",
  },
  {
    value: "neutral",
    label: "محايد",
    description: "نبرة هادئة وموضوعية",
    emoji: "😐",
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
  {
    value: "calm",
    label: "هادئ",
    description: "نبرة مهدئة وثابتة",
    emoji: "🧘",
  },
];

export interface SoundTagPreset {
  tag: string; // the inline tag e.g. "(laughter)"
  label: string;
  category: "human" | "crowd" | "nature" | "object" | "animal" | "music";
}

// Curated MiniMax-compatible sound effect tags.
export const SOUND_TAG_PRESETS: SoundTagPreset[] = [
  // Human sounds
  { tag: "(laughter)", label: "ضحك", category: "human" },
  { tag: "(giggle)", label: "قهقهة", category: "human" },
  { tag: "(chuckle)", label: "ضحكة خافتة", category: "human" },
  { tag: "(sigh)", label: "تنهيدة", category: "human" },
  { tag: "(cough)", label: "سعال", category: "human" },
  { tag: "(sneeze)", label: "عطس", category: "human" },
  { tag: "(yawn)", label: "تثاؤب", category: "human" },
  { tag: "(cry)", label: "بكاء", category: "human" },
  { tag: "(sob)", label: "نحيب", category: "human" },
  { tag: "(gasp)", label: "لهاث", category: "human" },
  { tag: "(groan)", label: "أنين", category: "human" },
  { tag: "(moan)", label: "تأوه", category: "human" },
  { tag: "(scream)", label: "صراخ", category: "human" },
  { tag: "(whisper)", label: "همس", category: "human" },
  { tag: "(sniff)", label: "شم", category: "human" },

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

// Emotion → rich natural-language delivery direction.
// ChinaAPI's speech-2.8-hd honours emotion through the `instructions` field
// when it is written as a natural-language delivery brief (not a bare label).
export const EMOTION_DIRECTIONS: Record<string, string> = {
  auto: "",
  neutral: "Speak in a calm, neutral, matter-of-fact tone.",
  happy: "Speak in a happy, cheerful, upbeat, joyful tone.",
  sad: "Speak in a sad, melancholic, subdued, sorrowful tone.",
  angry: "Speak in an angry, irritated, sharp, aggressive tone.",
  fearful: "Speak in a fearful, anxious, trembling, worried tone.",
  disgusted: "Speak in a disgusted, contemptuous, repulsed tone.",
  surprised: "Speak in a surprised, astonished, amazed tone.",
  calm: "Speak in a calm, soothing, relaxed, steady tone.",
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
    text: "هذا الموقف مضحك حقًا (laughter) لا أستطيع التوقف!",
  },
  {
    title: "مزيج كامل",
    text: "في البداية كنت مترددًا (sigh) <#0.8#> لكنني الآن متحمس جدًا (cheers)!",
  },
];
