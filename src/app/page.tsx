"use client";

import * as React from "react";
import {
  AudioLines,
  Mic2,
  History,
  KeyRound,
  Sparkles,
  Github,
  ShieldCheck,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { SettingsDialog } from "@/components/settings-dialog";
import { TtsPanel } from "@/components/tts-panel";
import { VoiceClonePanel } from "@/components/voice-clone-panel";
import { HistoryPanel } from "@/components/history-panel";
import { getApiKey } from "@/lib/storage";

export default function Home() {
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [hasKey, setHasKey] = React.useState(false);
  const [historyTick, setHistoryTick] = React.useState(0);
  const [voicesTick, setVoicesTick] = React.useState(0);
  const [activeTab, setActiveTab] = React.useState("tts");

  React.useEffect(() => {
    setHasKey(!!getApiKey());
  }, [settingsOpen]);

  return (
    <div className="min-h-screen flex flex-col bg-aurora">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <AudioLines className="h-5 w-5 text-primary-foreground" />
              <span className="absolute -top-1 -end-1 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-background" />
            </div>
            <div className="leading-tight">
              <h1 className="font-bold text-lg sm:text-xl tracking-tight">
                صوت الذكاء
              </h1>
              <p className="text-[11px] sm:text-xs text-muted-foreground -mt-0.5">
                استوديو تحويل النص إلى صوت واستنساخ الصوت
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={hasKey ? "secondary" : "outline"}
              className={
                hasKey
                  ? "hidden sm:flex bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1"
                  : "hidden sm:flex text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1"
              }
            >
              {hasKey ? (
                <>
                  <ShieldCheck className="h-3.5 w-3.5" /> مفتاح مُفعّل
                </>
              ) : (
                <>
                  <KeyRound className="h-3.5 w-3.5" /> أضف مفتاح API
                </>
              )}
            </Badge>
            <Button
              variant={hasKey ? "outline" : "default"}
              size="sm"
              onClick={() => setSettingsOpen(true)}
              className="gap-2"
            >
              <KeyRound className="h-4 w-4" />
              <span className="hidden sm:inline">الإعدادات</span>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-6 sm:py-10">
        {/* Hero */}
        <section className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur-sm mb-4">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            مدعوم بـ GMICloud — MiniMax Speech 2.8 HD
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text">
            حوّل أي نص إلى صوت عالي الجودة
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            استوديو متكامل لتحويل النص إلى صوت بأعلى جودة، مع استنساخ الصوت
            ولوحة إعدادات لمفاتيح API. كل شيء يُحفظ في متصفحك —{" "}
            <span className="font-semibold text-foreground">بدون تسجيل دخول</span>.
          </p>
        </section>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 mb-6 h-auto py-1.5">
            <TabsTrigger value="tts" className="gap-2 py-2">
              <AudioLines className="h-4 w-4" />
              <span className="hidden sm:inline">تحويل النص</span>
              <span className="sm:hidden">نص→صوت</span>
            </TabsTrigger>
            <TabsTrigger value="clone" className="gap-2 py-2">
              <Mic2 className="h-4 w-4" />
              <span className="hidden sm:inline">استنساخ الصوت</span>
              <span className="sm:hidden">استنساخ</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2 py-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">السجل</span>
              <span className="sm:hidden">سجل</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tts" className="mt-0">
            <TtsPanel
              onOpenSettings={() => setSettingsOpen(true)}
              onHistoryChange={() => setHistoryTick((t) => t + 1)}
              refreshSignal={voicesTick}
            />
          </TabsContent>

          <TabsContent value="clone" className="mt-0">
            <VoiceClonePanel onChanged={() => setVoicesTick((t) => t + 1)} />
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <HistoryPanel refreshSignal={historyTick} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Sticky footer */}
      <footer className="mt-auto border-t border-border/40 bg-background/60 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>
              بياناتك ومفاتيحك محفوظة محليًا في متصفحك فقط — لا حسابات ولا تسجيل دخول.
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono">console.gmicloud.ai</span>
            <span>·</span>
            <span>طابور طلبات غير متزامن — استطلاع حتى الاكتمال</span>
          </div>
        </div>
      </footer>

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onSaved={() => setHasKey(!!getApiKey())}
      />
    </div>
  );
}
