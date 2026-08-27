"use client";

import * as React from "react";
import {
  Trash2,
  Download,
  Play,
  Pause,
  History,
  Clock,
  Volume2,
  Mic2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  getHistory,
  deleteHistory,
  clearHistory,
  type HistoryItem,
} from "@/lib/storage";

interface HistoryPanelProps {
  refreshSignal?: number;
}

function relTime(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `قبل ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `قبل ${h} ساعة`;
  const d = Math.floor(h / 24);
  return `قبل ${d} يوم`;
}

export function HistoryPanel({ refreshSignal }: HistoryPanelProps) {
  const { toast } = useToast();
  const [items, setItems] = React.useState<HistoryItem[]>([]);
  const [playingId, setPlayingId] = React.useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    setItems(getHistory());
  }, [refreshSignal]);

  React.useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const play = (item: HistoryItem) => {
    if (playingId === item.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    if (!audioRef.current) audioRef.current = new Audio();
    audioRef.current.pause();
    audioRef.current.src = `data:${item.mimeType};base64,${item.audioBase64}`;
    audioRef.current.onended = () => setPlayingId(null);
    audioRef.current.play().catch(() => {
      toast({ title: "تعذّر التشغيل", variant: "destructive" });
    });
    setPlayingId(item.id);
  };

  const download = (item: HistoryItem) => {
    const ext = item.mimeType.includes("pcm") ? "pcm" : "mp3";
    const a = document.createElement("a");
    a.href = `data:${item.mimeType};base64,${item.audioBase64}`;
    a.download = `voicecraft-${item.id}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const remove = (id: string) => {
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
    }
    deleteHistory(id);
    setItems(getHistory());
    toast({ title: "تم الحذف" });
  };

  const clearAll = () => {
    clearHistory();
    setItems([]);
    audioRef.current?.pause();
    setPlayingId(null);
    toast({ title: "تم مسح السجل" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          سجل التوليد
          <Badge variant="secondary">{items.length}</Badge>
        </h3>
        {items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="text-destructive hover:text-destructive gap-2"
          >
            <Trash2 className="h-4 w-4" />
            مسح الكل
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 p-12 text-center text-muted-foreground">
          <History className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="font-medium">لا يوجد سجل بعد</p>
          <p className="text-sm mt-1">
            ستظهر هنا كل التوليدات السابقة لتشغيلها أو تنزيلها مجددًا.
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[560px] rounded-xl border border-border/40 p-1 scroll-area-custom">
          <div className="space-y-3 p-2">
            {items.map((item) => (
              <Card
                key={item.id}
                className="border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden"
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => play(item)}
                      className="h-11 w-11 rounded-full shrink-0"
                    >
                      {playingId === item.id ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5 translate-x-px" />
                      )}
                    </Button>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <p
                        className="text-sm leading-relaxed line-clamp-2"
                        dir="auto"
                      >
                        {item.text}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Mic2 className="h-3 w-3" />
                          {item.voiceLabel}
                        </Badge>
                        <Badge variant="outline" className="text-xs font-mono">
                          {item.speed.toFixed(2)}×
                        </Badge>
                        <Badge variant="outline" className="text-xs uppercase">
                          {item.format}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {relTime(item.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => download(item)}
                        aria-label="تنزيل"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => remove(item.id)}
                        aria-label="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {playingId === item.id && (
                    <div className="flex items-end gap-[2px] h-6 px-1" dir="ltr">
                      {Array.from({ length: 32 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-primary wave-bar rounded-full"
                          style={{
                            height: "100%",
                            animationDelay: `${i * 60}ms`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}

      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Volume2 className="h-3.5 w-3.5" />
        يُحفظ السجل محليًا في متصفحك فقط (آخر 40 توليدة).
      </p>
    </div>
  );
}
