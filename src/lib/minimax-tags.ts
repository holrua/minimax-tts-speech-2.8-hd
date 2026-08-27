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

// Pause tag for MiniMax
export const PAUSE_TAG = "<#>";

// Examples demonstrating advanced syntax
export const ADVANCED_EXAMPLES: { title: string; text: string }[] = [
  {
    title: "مشاعر + إيقاف مؤقت",
    text: "مرحبًا بك <#> يسعدني أن أراك اليوم!",
  },
  {
    title: "مؤثر صوتي (ضحك)",
    text: "هذا الموقف مضحك حقًا (laughter) لا أستطيع التوقف!",
  },
  {
    title: "مزيج كامل",
    text: "في البداية كنت مترددًا (sigh) <#> لكنني الآن متحمس جدًا (cheers)!",
  },
];
