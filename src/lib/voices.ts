// Voice catalog for MiniMax Speech 2.8 HD (accepts arbitrary MiniMax voice IDs)

export type VoiceCategory = "english" | "chinese" | "arabic" | "custom";

export interface VoicePreset {
  id: string;
  label: string;
  description: string;
  category: VoiceCategory;
  gender: "male" | "female" | "narrator";
}

// Common MiniMax voice IDs (per YepAPI docs) + a few well-known ones.
export const VOICE_PRESETS: VoicePreset[] = [
  {
    id: "English_expressive_narrator",
    label: "الراوي الإنجليزي (تعبيري)",
    description: "صوت راوي إنجليزي غني بالتعبير — مثالي للقصص والكتب الصوتية",
    category: "english",
    gender: "narrator",
  },
  {
    id: "male-qn-qingse",
    label: "شاب صافي (ذكر)",
    description: "صوت ذكوري شاب ونقي — مناسب للمحتوى العام",
    category: "chinese",
    gender: "male",
  },
  {
    id: "female-shaonv",
    label: "فتاة (أنثى)",
    description: "صوت أنثوي ناعم — مناسب للحوارات والتعليقات",
    category: "chinese",
    gender: "female",
  },
  {
    id: "male-qn-jingying",
    label: "نخبة ذكورية",
    description: "صوت ذكوري احترافي هادئ",
    category: "chinese",
    gender: "male",
  },
  {
    id: "female-qn-qingse",
    label: "نخبة نسائية شابة",
    description: "صوت أنثوي شاب وواضح",
    category: "chinese",
    gender: "female",
  },
  {
    id: "female-qn-yuxie",
    label: "أنثى ناضجة",
    description: "صوت أنثوي ناضج ودافئ",
    category: "chinese",
    gender: "female",
  },
  {
    id: "English_trustworth_voice",
    label: "إنجليزي موثوق",
    description: "صوت إنجليزي موثوق ومهني — مناسب للعروض والتقارير",
    category: "english",
    gender: "narrator",
  },
  {
    id: "English_Magnetic_Male",
    label: "إنجليزي جذاب (ذكر)",
    description: "صوت ذكوري إنجليزي بجاذبية إذاعية",
    category: "english",
    gender: "male",
  },
  {
    id: "English_Actress_Female",
    label: "إنجليزي ممثلة (أنثى)",
    description: "صوت أنثوي إنجليزي تعبيري درامي",
    category: "english",
    gender: "female",
  },
  {
    id: "French_Skittlish_Male",
    label: "فرنسي ذكوري",
    description: "صوت فرنسي حيوي",
    category: "english",
    gender: "male",
  },
  {
    id: "German_Magnetic_Male",
    label: "ألماني ذكوري",
    description: "صوت ألماني جاذب",
    category: "english",
    gender: "male",
  },
  {
    id: "audiobook_female_1",
    label: "كتاب صوتي (أنثى)",
    description: "صوت أنثوي هادئ مناسب للكتب الصوتية الطويلة",
    category: "english",
    gender: "female",
  },

  // ---- Arabic voices ----
  {
    id: "Arabic_CalmWoman",
    label: "امرأة هادئة (عربي)",
    description: "صوت أنثوي عربي دافئ وناعم ومخملي — مناسب للروايات والمحتوى الهادئ",
    category: "arabic",
    gender: "female",
  },
  {
    id: "Arabic_FriendlyGuy",
    label: "شاب ودود (عربي)",
    description: "صوت ذكوري عربي ناعم وعميق ومصقول — مناسب للمحتوى العام والعروض",
    category: "arabic",
    gender: "male",
  },
];

export const VOICE_CATEGORIES: { value: VoiceCategory; label: string }[] = [
  { value: "english", label: "إنجليزي / متعدد اللغات" },
  { value: "chinese", label: "صيني" },
  { value: "arabic", label: "عربي" },
  { value: "custom", label: "أصواتي المستنسخة" },
];

export function getVoiceById(id: string): VoicePreset | undefined {
  return VOICE_PRESETS.find((v) => v.id === id);
}
