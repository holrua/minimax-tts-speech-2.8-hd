// LocalStorage-backed persistence. No login / no server accounts.
// Stores: Rewind.ai key, settings, custom cloned voices, and generation history.

export const STORAGE_KEYS = {
  apiKey: "vc_api_key",
  settings: "vc_settings",
  voices: "vc_custom_voices",
  history: "vc_history",
} as const;

export interface AppSettings {
  defaultVoice: string;
  speed: number;
  outputFormat: "mp3" | "wav";
  model: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  defaultVoice: "Arabic_CalmWoman",
  speed: 1,
  outputFormat: "mp3",
  model: "minimax/speech-2.8-hd",
};

export interface CustomVoice {
  id: string; // the voice ID to send to MiniMax (user-defined or generated)
  name: string; // friendly name
  description: string;
  sampleDataUrl?: string; // base64/recorded sample (for reference only)
  sampleName?: string;
  createdAt: number;
}

export interface HistoryItem {
  id: string;
  text: string;
  voice: string;
  voiceLabel: string;
  speed: number;
  format: "mp3" | "wav";
  model?: string;
  audioBase64: string;
  mimeType: string;
  createdAt: number;
  durationSec?: number;
}

function isBrowser() {
  return typeof window !== "undefined";
}

function safeRead<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite(key: string, value: unknown) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

/* ---------- API key ---------- */
export function getApiKey(): string {
  if (!isBrowser()) return "";
  return window.localStorage.getItem(STORAGE_KEYS.apiKey) || "";
}
export function setApiKey(key: string) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEYS.apiKey, key.trim());
}
export function clearApiKey() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORAGE_KEYS.apiKey);
}

/* ---------- Settings ---------- */
export function getSettings(): AppSettings {
  return { ...DEFAULT_SETTINGS, ...safeRead(STORAGE_KEYS.settings, DEFAULT_SETTINGS) };
}
export function setSettings(s: AppSettings) {
  safeWrite(STORAGE_KEYS.settings, s);
}

/* ---------- Custom voices ---------- */
export function getCustomVoices(): CustomVoice[] {
  return safeRead<CustomVoice[]>(STORAGE_KEYS.voices, []);
}
export function saveCustomVoice(v: CustomVoice) {
  const all = getCustomVoices();
  const idx = all.findIndex((x) => x.id === v.id);
  if (idx >= 0) all[idx] = v;
  else all.unshift(v);
  safeWrite(STORAGE_KEYS.voices, all);
}
export function deleteCustomVoice(id: string) {
  const all = getCustomVoices().filter((x) => x.id !== id);
  safeWrite(STORAGE_KEYS.voices, all);
}

/* ---------- History ---------- */
const MAX_HISTORY = 40;
export function getHistory(): HistoryItem[] {
  return safeRead<HistoryItem[]>(STORAGE_KEYS.history, []);
}
export function addHistory(item: HistoryItem) {
  const all = getHistory();
  all.unshift(item);
  const trimmed = all.slice(0, MAX_HISTORY);
  safeWrite(STORAGE_KEYS.history, trimmed);
}
export function deleteHistory(id: string) {
  safeWrite(
    STORAGE_KEYS.history,
    getHistory().filter((x) => x.id !== id),
  );
}
export function clearHistory() {
  safeWrite(STORAGE_KEYS.history, []);
}

/* ---------- Helpers ---------- */
export function uid(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// Rough estimate of UTF-8 byte length for pricing display.
export function utf8ByteLength(text: string): number {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(text).length;
  }
  return Buffer ? Buffer.byteLength(text, "utf-8") : text.length;
}

export function estimateCost(byteLength: number): number {
  // $0.211 per 1000 chars (bytes). $0.01 minimum per job.
  const charge = (byteLength / 1000) * 0.211;
  return Math.max(0.01, charge);
}
