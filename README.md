# صوت الذكاء — MiniMax Speech 2.8 HD TTS Studio

استوديو متكامل لتحويل النص إلى صوت عالي الجودة باستخدام نموذج **MiniMax Speech 2.8 HD** عبر **Rewind.ai**، مع استنساخ الصوت ولوحة إعدادات مفاتيح API.

> **بدون تسجيل دخول** — كل البيانات والمفاتيح تُحفظ محليًا في متصفح المستخدم فقط.

![minimax-tts-speech-2.8-hd](public/logo.svg)

## ✨ المميزات

- 🎙️ **تحويل النص إلى صوت** عبر عدة نماذج TTS من Rewind.ai:
  - **MiniMax Speech 2.8 HD** (أعلى جودة، افتراضي)
  - MiniMax Speech 2.8 Turbo (سريع)
  - Kokoro 82M (مجاني)
  - Qwen Audio TTS Flash
  - Microsoft MAI-Voice 2 Flash
- ⏸️ **الإيقاف المؤقت** — علامة `<#x.x#>` بمدد قابلة للتخصيص (لنموذج MiniMax)
- 🎵 **المؤثرات الصوتية المضمّنة** — 8 مؤثرات رسمية: `(laughs)` `(sighs)` `(coughs)` `(clears throat)` `(gasps)` `(sniffs)` `(groans)` `(yawns)` (لنموذج MiniMax)
- 🗣️ **استنساخ الصوت** — رفع أو تسجيل عينة صوتية
- 📜 **سجل التوليد** — آخر 40 توليدة قابلة للتشغيل/التنزيل
- 🎧 **صيغ إخراج** — MP3 و WAV
- 🌍 **أصوات عربية جاهزة** — امرأة هادئة، شاب ودود
- 🌙 **الوضع الليلي/النهاري** + دعم RTL عربي كامل + تصميم متجاوب

## 🛠️ التقنيات

- **Framework**: Next.js 16 (App Router) + TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui (New York)
- **API Provider**: Rewind.ai (`https://api.rewind.ai/v1/tts/`)
- **Auth**: لا يوجد — مفاتيح API تُحفظ في `localStorage`
- **Database**: غير مطلوبة للإنتاج (كل شيء في المتصفح)

## 🚀 التشغيل محليًا

```bash
# 1) تثبيت الاعتمادات
bun install

# 2) تشغيل خادم التطوير
bun run dev
# افتح http://localhost:3000

# 3) فحص الكود
bun run lint
```

## 🌐 النشر على Vercel

### الطريقة 1: عبر لوحة تحكم Vercel (الأسهل)

1. اذهب إلى [vercel.com/new](https://vercel.com/new)
2. اختر **Import Git Repository** واربط حساب GitHub الخاص بك
3. اختر مستودع `holrua/minimax-tts-speech-2.8-hd`
4. اترك الإعدادات الافتراضية:
   - **Framework Preset**: Next.js
   - **Build Command**: `next build` (يُكشف تلقائيًا)
   - **Output Directory**: `.next` (يُكشف تلقائيًا)
5. اضغط **Deploy** ✅

### الطريقة 2: عبر Vercel CLI

```bash
npm i -g vercel
vercel          # اربط المشروع
vercel --prod   # انشر للإنتاج
```

> 💡 لا توجد متغيرات بيئة مطلوبة للنشر — مفاتيح API يُدخلها كل مستخدم في واجهة الإعدادات وتُحفظ في متصفحه فقط.

## ⚙️ الإعدادات بعد النشر

عند أول زيارة للموقع المنشور:

1. اضغط زر **«الإعدادات»** أعلى يمين الصفحة
2. أدخل مفتاح Rewind.ai API (يبدأ بـ `sk-rewind-...`)
3. احفظ — جاهز للاستخدام!

احصل على مفتاحك من [rewind.ai/api](https://rewind.ai/api/)

## 📋 المتطلبات

- Node.js 18+ أو Bun
- مفتاح Rewind.ai API (للتوليد الفعلي)

## 📄 الترخيص

MIT — استخدمه بحرية.

## 🔗 الروابط

- **Rewind.ai API**: [rewind.ai/api](https://rewind.ai/api/)
- **MiniMax Speech 2.8**: أحدث طراز عالي الدقة من MiniMax
- **Kokoro 82M**: نموذج TTS مجاني وسريع
