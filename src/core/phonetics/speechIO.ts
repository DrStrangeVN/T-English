/**
 * Cross-Platform Speech Synthesis, VieNeu Local TTS Bridge,
 * Speech Recognition & Haptic Feedback Bridge.
 * Works seamlessly across macOS WKWebView, iOS WKWebView / Safari, and Web Browsers.
 */
import type { TtsConfig } from '../storage/db';

export interface VieneuVoice {
  id: string;
  name: string;
  lang?: string;
  description?: string;
}

const DEFAULT_TTS_CONFIG: TtsConfig = {
  engine: 'system',
  vieneuUrl: 'http://127.0.0.1:8765',
  vieneuToken: '',
  voiceId: '',
  voiceName: 'Mặc định VieNeu',
  speed: 1.0,
  useVieneuForVietnamese: true,
};

let activeTtsConfig: TtsConfig = { ...DEFAULT_TTS_CONFIG };
let activeAudio: HTMLAudioElement | null = null;
let activeAudioUrl: string | null = null;
let speechRequestSeq = 0;

// 30-entry LRU audio cache for zero-latency repetition in Shadowing & Flashcards
const audioBlobCache = new Map<string, Blob>();
const MAX_AUDIO_CACHE = 30;

export function configureSpeechEngine(config: TtsConfig): void {
  activeTtsConfig = { ...DEFAULT_TTS_CONFIG, ...config };
}

export function getSpeechEngineConfig(): TtsConfig {
  return activeTtsConfig;
}

export function clearSpeechCache(): void {
  audioBlobCache.clear();
}

export function pcm16ToWavBytes(pcmBuffer: ArrayBuffer, sampleRate = 24_000): Uint8Array {
  const pcm = new Uint8Array(pcmBuffer);
  const dataBytes = pcm.byteLength;
  const out = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(out);
  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i += 1) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataBytes, true);
  new Uint8Array(out, 44).set(pcm);
  return new Uint8Array(out);
}

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes.buffer;
}

function hasNativeMacBridge(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as unknown as {
    webkit?: { messageHandlers?: { tenglish?: { postMessage: (msg: unknown) => void } } };
  };
  return Boolean(win.webkit?.messageHandlers?.tenglish);
}

interface VieneuTransportResult {
  ok: boolean;
  status: number;
  contentType: string;
  sampleRate: number;
  buffer: ArrayBuffer;
  text: string;
  error?: string;
}

async function vieneuTransportRequest(params: {
  url: string;
  method?: 'GET' | 'POST';
  token?: string;
  body?: string;
  timeoutMs?: number;
}): Promise<VieneuTransportResult> {
  const { url, method = 'GET', token = '', body, timeoutMs = 12_000 } = params;

  if (hasNativeMacBridge() && typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    const requestId = `vr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    return new Promise<VieneuTransportResult>((resolve) => {
      let settled = false;
      const timer = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        window.removeEventListener('tenglish-vieneu-response', onResp);
        resolve({
          ok: false,
          status: 0,
          contentType: 'text/plain',
          sampleRate: 24_000,
          buffer: new ArrayBuffer(0),
          text: '',
          error: 'Hết thời gian chờ kết nối tới VieNeu Local Engine',
        });
      }, timeoutMs);

      const onResp = (ev: Event) => {
        const detail = (ev as CustomEvent<{
          requestId: string;
          ok: boolean;
          status: number;
          contentType?: string;
          sampleRate?: number;
          bodyBase64?: string;
          error?: string;
        }>).detail;
        if (!detail || detail.requestId !== requestId || settled) return;
        settled = true;
        window.clearTimeout(timer);
        window.removeEventListener('tenglish-vieneu-response', onResp);

        const buffer = detail.bodyBase64 ? base64ToArrayBuffer(detail.bodyBase64) : new ArrayBuffer(0);
        let text = '';
        if (!detail.ok || detail.contentType?.includes('json') || detail.contentType?.includes('text')) {
          try {
            text = new TextDecoder().decode(buffer);
          } catch {
            text = '';
          }
        }
        resolve({
          ok: Boolean(detail.ok),
          status: detail.status ?? 0,
          contentType: detail.contentType ?? 'application/octet-stream',
          sampleRate: detail.sampleRate ?? 24_000,
          buffer,
          text,
          error: detail.error,
        });
      };

      window.addEventListener('tenglish-vieneu-response', onResp);
      const win = window as unknown as {
        webkit: { messageHandlers: { tenglish: { postMessage: (msg: unknown) => void } } };
      };
      win.webkit.messageHandlers.tenglish.postMessage({
        action: 'vieneuRequest',
        requestId,
        url,
        method,
        token: token.trim(),
        body,
      });
    });
  }

  const controller = new AbortController();
  const timer = typeof globalThis.setTimeout === 'function'
    ? globalThis.setTimeout(() => controller.abort(), timeoutMs)
    : 0;

  try {
    const headers: Record<string, string> = {};
    if (token.trim()) {
      headers['X-VieNeu-Studio-Token'] = token.trim();
      headers['Authorization'] = `Bearer ${token.trim()}`;
    }
    if (body && method === 'POST') {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(url, {
      method,
      headers,
      body,
      signal: controller.signal,
    });
    const headersObj = res.headers;
    const getHeader = (k: string): string | null => {
      if (!headersObj) return null;
      if (typeof (headersObj as Headers).get === 'function') {
        return (headersObj as Headers).get(k);
      }
      return (headersObj as unknown as Record<string, string>)[k] || null;
    };
    const contentType = getHeader('content-type') || 'application/octet-stream';
    const srHeader = getHeader('X-Sample-Rate') || getHeader('x-sample-rate');
    const sampleRate = srHeader ? Number(srHeader) || 24_000 : 24_000;

    let text = '';
    let buffer: ArrayBuffer = new ArrayBuffer(0);

    if (typeof res.arrayBuffer === 'function') {
      buffer = await res.arrayBuffer();
      try {
        text = new TextDecoder().decode(buffer);
      } catch {
        text = '';
      }
    } else if (typeof res.text === 'function') {
      text = await res.text();
      buffer = new TextEncoder().encode(text).buffer;
    } else if (typeof res.json === 'function') {
      const j = await res.json();
      text = typeof j === 'string' ? j : JSON.stringify(j);
      buffer = new TextEncoder().encode(text).buffer;
    }

    return {
      ok: res.ok,
      status: res.status,
      contentType,
      sampleRate,
      buffer,
      text,
      error: res.ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (err) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    return {
      ok: false,
      status: 0,
      contentType: 'text/plain',
      sampleRate: 24_000,
      buffer: new ArrayBuffer(0),
      text: '',
      error: isAbort
        ? 'Hết thời gian kết nối tới VieNeu TTS'
        : 'Không thể kết nối hoặc bị chặn CORS từ trình duyệt (hãy chạy trên app macOS hoặc cho phép origin)',
    };
  } finally {
    if (timer) globalThis.clearTimeout(timer);
  }
}

function normalizeBaseUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, '');
}

export async function checkVieneuHealth(
  vieneuUrl: string,
  token = ''
): Promise<{ ok: boolean; status: number; message: string }> {
  const base = normalizeBaseUrl(vieneuUrl);
  if (!base) {
    return { ok: false, status: 0, message: 'Chưa nhập địa chỉ VieNeu server.' };
  }
  const resp = await vieneuTransportRequest({
    url: `${base}/health`,
    method: 'GET',
    token,
    timeoutMs: 8_000,
  });
  if (resp.ok) {
    return { ok: true, status: resp.status, message: 'VieNeu Local Engine đang sẵn sàng.' };
  }
  if (resp.status === 401 || resp.status === 403) {
    return {
      ok: false,
      status: resp.status,
      message: 'Mã truy cập VieNeu Studio chưa đúng hoặc bị thiếu (HTTP 401).',
    };
  }
  return {
    ok: false,
    status: resp.status,
    message: resp.error || `Không thể kết nối tới ${base}`,
  };
}

export async function fetchVieneuVoices(
  vieneuUrl: string,
  token = ''
): Promise<{ ok: boolean; status: number; voices: VieneuVoice[]; error?: string }> {
  const base = normalizeBaseUrl(vieneuUrl);
  if (!base) {
    return { ok: false, status: 0, voices: [], error: 'Chưa nhập địa chỉ VieNeu server.' };
  }
  const resp = await vieneuTransportRequest({
    url: `${base}/v1/voices`,
    method: 'GET',
    token,
    timeoutMs: 10_000,
  });
  if (!resp.ok) {
    return {
      ok: false,
      status: resp.status,
      voices: [],
      error:
        resp.status === 401 || resp.status === 403
          ? 'Mã truy cập VieNeu Studio chưa đúng hoặc bị thiếu (HTTP 401).'
          : resp.error || `HTTP ${resp.status}`,
    };
  }

  try {
    const parsed = JSON.parse(resp.text) as
      | { data?: unknown[]; voices?: unknown[] }
      | unknown[];
    const rawList = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.data)
        ? parsed.data
        : Array.isArray(parsed.voices)
          ? parsed.voices
          : [];
    const voices: VieneuVoice[] = rawList
      .map((item) => {
        if (typeof item === 'string') return { id: item, name: item };
        if (item && typeof item === 'object') {
          const obj = item as { id?: string; voice_id?: string; name?: string; description?: string; lang?: string };
          const id = obj.id || obj.voice_id || obj.name || '';
          if (!id) return null;
          return {
            id,
            name: obj.name || id,
            lang: obj.lang,
            description: obj.description,
          };
        }
        return null;
      })
      .filter((v): v is VieneuVoice => v !== null);

    return { ok: true, status: resp.status, voices };
  } catch {
    return { ok: false, status: resp.status, voices: [], error: 'Dữ liệu /v1/voices không hợp lệ' };
  }
}

function isRiffWav(buf: ArrayBuffer): boolean {
  if (buf.byteLength < 12) return false;
  const v = new Uint8Array(buf, 0, 4);
  return v[0] === 0x52 && v[1] === 0x49 && v[2] === 0x46 && v[3] === 0x46;
}

export async function synthesizeVieneuAudio(
  text: string,
  config: TtsConfig = activeTtsConfig,
  speedOverride?: number
): Promise<Blob | null> {
  const cleanText = text.trim();
  const base = normalizeBaseUrl(config.vieneuUrl);
  if (!cleanText || !base) return null;

  const effectiveSpeed = Math.min(1.5, Math.max(0.65, speedOverride ?? config.speed ?? 1.0));
  const cacheKey = `${base}|${config.voiceId}|${effectiveSpeed.toFixed(2)}|${cleanText}`;
  const cached = audioBlobCache.get(cacheKey);
  if (cached) {
    // Refresh LRU order
    audioBlobCache.delete(cacheKey);
    audioBlobCache.set(cacheKey, cached);
    return cached;
  }

  const payload: Record<string, unknown> = {
    model: 'vieneu-v3-turbo',
    input: cleanText,
    response_format: 'wav',
    speed: effectiveSpeed,
  };
  if (config.voiceId.trim()) {
    payload.voice = config.voiceId.trim();
  }

  const resp = await vieneuTransportRequest({
    url: `${base}/v1/audio/speech`,
    method: 'POST',
    token: config.vieneuToken,
    body: JSON.stringify(payload),
    timeoutMs: 15_000,
  });

  if (!resp.ok || resp.buffer.byteLength === 0) {
    return null;
  }

  let blob: Blob;
  if (isRiffWav(resp.buffer)) {
    blob = new Blob([resp.buffer], { type: 'audio/wav' });
  } else if (
    resp.contentType.includes('mpeg') ||
    resp.contentType.includes('mp3') ||
    resp.contentType.includes('ogg') ||
    resp.contentType.includes('flac')
  ) {
    blob = new Blob([resp.buffer], { type: resp.contentType });
  } else {
    const wavBytes = pcm16ToWavBytes(resp.buffer, resp.sampleRate || 24_000);
    const wavCopy = new Uint8Array(wavBytes.byteLength);
    wavCopy.set(wavBytes);
    blob = new Blob([wavCopy.buffer], { type: 'audio/wav' });
  }

  if (audioBlobCache.size >= MAX_AUDIO_CACHE) {
    const oldestKey = audioBlobCache.keys().next().value;
    if (oldestKey) audioBlobCache.delete(oldestKey);
  }
  audioBlobCache.set(cacheKey, blob);
  return blob;
}

function stopActiveVieneuAudio(): void {
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.onended = null;
      activeAudio.onerror = null;
    } catch {
      // ignore
    }
    activeAudio = null;
  }
  if (activeAudioUrl && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
    URL.revokeObjectURL(activeAudioUrl);
    activeAudioUrl = null;
  }
}

function speakWithSystemSpeech(
  text: string,
  targetLang: 'en-US' | 'en-GB' | 'vi-VN',
  rate?: number,
  onEnd?: () => void
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.();
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = targetLang;
    utter.rate = rate ?? (targetLang === 'vi-VN' ? 1.0 : 0.96);

    const voices = window.speechSynthesis.getVoices();
    const langPrefix = targetLang.split('-')[0];
    const preferred =
      voices.find((v) => v.lang.startsWith(targetLang) && /linh|samantha|daniel|alex|google|aaron/i.test(v.name)) ||
      voices.find((v) => v.lang.startsWith(targetLang)) ||
      voices.find((v) => v.lang.startsWith(langPrefix));
    if (preferred) utter.voice = preferred;

    if (onEnd) utter.onend = () => onEnd();
    window.speechSynthesis.speak(utter);
  } catch {
    onEnd?.();
  }
}

function speakInternal(
  text: string,
  targetLang: 'en-US' | 'en-GB' | 'vi-VN',
  options: { rate?: number; onEnd?: () => void } = {}
): void {
  const seq = ++speechRequestSeq;
  stopActiveVieneuAudio();
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }

  const shouldUseVieneu =
    activeTtsConfig.engine === 'vieneu' &&
    Boolean(activeTtsConfig.vieneuUrl.trim()) &&
    (targetLang !== 'vi-VN' || activeTtsConfig.useVieneuForVietnamese);

  if (!shouldUseVieneu) {
    speakWithSystemSpeech(text, targetLang, options.rate, options.onEnd);
    return;
  }

  void synthesizeVieneuAudio(text, activeTtsConfig, options.rate)
    .then((blob) => {
      if (seq !== speechRequestSeq) return;
      if (!blob || typeof Audio === 'undefined' || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
        speakWithSystemSpeech(text, targetLang, options.rate, options.onEnd);
        return;
      }

      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      activeAudio = audio;
      activeAudioUrl = url;

      const cleanupAndDone = (callEnd: boolean) => {
        if (activeAudio === audio) {
          stopActiveVieneuAudio();
        } else if (typeof URL.revokeObjectURL === 'function') {
          URL.revokeObjectURL(url);
        }
        if (callEnd && seq === speechRequestSeq) {
          options.onEnd?.();
        }
      };

      audio.onended = () => cleanupAndDone(true);
      audio.onerror = () => {
        cleanupAndDone(false);
        if (seq === speechRequestSeq) {
          speakWithSystemSpeech(text, targetLang, options.rate, options.onEnd);
        }
      };

      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          cleanupAndDone(false);
          if (seq === speechRequestSeq) {
            speakWithSystemSpeech(text, targetLang, options.rate, options.onEnd);
          }
        });
      }
    })
    .catch(() => {
      if (seq === speechRequestSeq) {
        speakWithSystemSpeech(text, targetLang, options.rate, options.onEnd);
      }
    });
}

export function speakEnglish(
  text: string,
  options: { accent?: 'US General' | 'UK RP'; rate?: number; onEnd?: () => void } = {}
): void {
  const targetLang = options.accent === 'UK RP' ? 'en-GB' : 'en-US';
  speakInternal(text, targetLang, options);
}

export function speakVietnamese(
  text: string,
  options: { rate?: number; onEnd?: () => void } = {}
): void {
  speakInternal(text, 'vi-VN', options);
}

export function stopSpeaking(): void {
  speechRequestSeq += 1;
  stopActiveVieneuAudio();
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export async function triggerHaptic(type: 'light' | 'success' | 'warning' = 'light'): Promise<void> {
  try {
    const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
    if (cap?.isNativePlatform?.()) {
      const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics');
      if (type === 'success') {
        await Haptics.notification({ type: NotificationType.Success });
      } else if (type === 'warning') {
        await Haptics.notification({ type: NotificationType.Warning });
      } else {
        await Haptics.impact({ style: ImpactStyle.Light });
      }
      return;
    }
  } catch {
    // Fallback below
  }

  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(type === 'success' ? [12, 30, 18] : 10);
  }
}

export interface SpeechRecognitionSession {
  stop: () => void;
}

export function startSpeechCapture(callbacks: {
  onInterim?: (text: string) => void;
  onFinal: (text: string) => void;
  onError?: (reason: string) => void;
}): SpeechRecognitionSession | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    SpeechRecognition?: new () => {
      lang: string;
      interimResults: boolean;
      continuous: boolean;
      onresult: (ev: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void;
      onerror: (ev: { error: string }) => void;
      onend: () => void;
      start: () => void;
      stop: () => void;
    };
    webkitSpeechRecognition?: new () => {
      lang: string;
      interimResults: boolean;
      continuous: boolean;
      onresult: (ev: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void;
      onerror: (ev: { error: string }) => void;
      onend: () => void;
      start: () => void;
      stop: () => void;
    };
  };

  const Ctor = win.SpeechRecognition || win.webkitSpeechRecognition;
  if (!Ctor) {
    callbacks.onError?.('Trình duyệt/WebView chưa bật Web Speech API — dùng chế độ nhập/giả lập giọng nói.');
    return null;
  }

  try {
    const rec = new Ctor();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.continuous = false;
    let latest = '';
    let delivered = false;

    const deliverOnce = (txt: string) => {
      if (delivered || !txt) return;
      delivered = true;
      callbacks.onFinal(txt);
    };

    rec.onresult = (event) => {
      let full = '';
      for (let i = 0; i < event.results.length; i++) {
        full += event.results[i][0].transcript + ' ';
      }
      latest = full.trim();
      callbacks.onInterim?.(latest);
      const last = event.results[event.results.length - 1];
      if (last?.isFinal && latest) {
        deliverOnce(latest);
      }
    };
    rec.onerror = (ev) => callbacks.onError?.(ev.error || 'microphone_unavailable');
    rec.onend = () => {
      if (latest) deliverOnce(latest);
    };
    rec.start();
    return {
      stop: () => {
        try {
          rec.stop();
        } catch {
          // ignore
        }
      },
    };
  } catch {
    callbacks.onError?.('Không thể khởi tạo micro.');
    return null;
  }
}

export function notifyMacNativeHost(payload: {
  theme: 'dark' | 'light';
  glass: 'clear' | 'balanced' | 'solid';
  reduceTransparency: boolean;
  statusSummary: string;
}): void {
  try {
    const win = window as unknown as {
      webkit?: { messageHandlers?: { tenglish?: { postMessage: (msg: unknown) => void } } };
    };
    win.webkit?.messageHandlers?.tenglish?.postMessage({
      action: 'syncAppearance',
      ...payload,
    });
  } catch {
    // Web mode no-op
  }
}

export function notifyMacStateSync(): void {
  try {
    const win = window as unknown as {
      webkit?: { messageHandlers?: { tenglish?: { postMessage: (msg: unknown) => void } } };
    };
    win.webkit?.messageHandlers?.tenglish?.postMessage({ action: 'stateUpdated' });
  } catch {
    // Web mode no-op
  }
}

export function exportTextFile(filename: string, content: string, mimeType = 'text/csv;charset=utf-8;'): void {
  try {
    const win = window as unknown as {
      webkit?: { messageHandlers?: { tenglish?: { postMessage: (msg: unknown) => void } } };
    };
    if (win.webkit?.messageHandlers?.tenglish) {
      win.webkit.messageHandlers.tenglish.postMessage({
        action: 'saveFile',
        filename,
        content,
      });
      return;
    }
  } catch {
    // Fall back to browser download
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
