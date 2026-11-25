/**
 * Cross-Platform Dual-Voice Speech Synthesis, VieNeu Local TTS Bridge (Direct 48kHz & Async HA Coordinator),
 * Native macOS HTTP Proxy, Desktop Vocab HUD Bridge, Speech Recognition & Haptic Feedback.
 */
import { DEFAULT_TTS_CONFIG, type EnglishAccent, type TtsConfig } from '../storage/db';

export interface VieneuVoice {
  id: string;
  name: string;
  lang?: string;
  gender?: string;
  description?: string;
  availableOn?: string[];
}

export interface SpeechRuntimeState {
  status: 'idle' | 'loading' | 'playing';
  text: string;
  lang: 'en-US' | 'en-GB' | 'en-AU' | 'vi-VN';
  engineUsed: 'system' | 'vieneu';
}

let activeTtsConfig: TtsConfig = { ...DEFAULT_TTS_CONFIG };
let activeAudio: HTMLAudioElement | null = null;
let activeAudioUrl: string | null = null;
let speechRequestSeq = 0;
let runtimeState: SpeechRuntimeState = {
  status: 'idle',
  text: '',
  lang: 'en-US',
  engineUsed: 'system',
};
const speechListeners = new Set<(state: SpeechRuntimeState) => void>();

// 40-entry LRU audio cache for instant replay in Shadowing, Flashcards & Vocab Notifications
const audioBlobCache = new Map<string, Blob>();
const MAX_AUDIO_CACHE = 40;

function emitSpeechState(next: Partial<SpeechRuntimeState>): void {
  runtimeState = { ...runtimeState, ...next };
  speechListeners.forEach((fn) => {
    try {
      fn(runtimeState);
    } catch {
      // ignore listener errors
    }
  });
}

export function subscribeSpeechState(listener: (state: SpeechRuntimeState) => void): () => void {
  speechListeners.add(listener);
  listener(runtimeState);
  return () => {
    speechListeners.delete(listener);
  };
}

export function getSpeechRuntimeState(): SpeechRuntimeState {
  return runtimeState;
}

export function configureSpeechEngine(config: TtsConfig): void {
  activeTtsConfig = { ...DEFAULT_TTS_CONFIG, ...config };
}

export function getSpeechEngineConfig(): TtsConfig {
  return activeTtsConfig;
}

export function clearSpeechCache(): void {
  audioBlobCache.clear();
}

export function pcm16ToWavBytes(pcmBuffer: ArrayBuffer, sampleRate = 48_000): Uint8Array {
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

/**
 * Repairs streaming RIFF WAV headers whose size fields are set to 0xFFFFFFFF
 * (produced by VieNeu apps.openai_speech streaming responses) so WebKit/Safari plays them cleanly.
 */
export function repairStreamingWavHeader(buf: ArrayBuffer): ArrayBuffer {
  if (buf.byteLength < 44) return buf;
  const bytes = new Uint8Array(buf);
  const isRiff =
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
  if (!isRiff) return buf;
  const view = new DataView(buf);
  const riffSize = view.getUint32(4, true);
  const dataSize = view.getUint32(40, true);
  if (riffSize !== 0xffffffff && dataSize !== 0xffffffff && riffSize > 0 && dataSize > 0) {
    return buf;
  }
  const copy = new Uint8Array(buf.byteLength);
  copy.set(bytes);
  const copyView = new DataView(copy.buffer);
  copyView.setUint32(4, Math.max(0, buf.byteLength - 8), true);
  copyView.setUint32(40, Math.max(0, buf.byteLength - 44), true);
  return copy.buffer;
}

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes.buffer;
}

export function hasNativeMacBridge(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as unknown as {
    webkit?: { messageHandlers?: { tenglish?: { postMessage: (msg: unknown) => void } } };
  };
  return Boolean(win.webkit?.messageHandlers?.tenglish);
}

export interface NativeHttpResult {
  ok: boolean;
  status: number;
  contentType: string;
  sampleRate: number;
  buffer: ArrayBuffer;
  text: string;
  error?: string;
}

export async function nativeHttpRequest(params: {
  url: string;
  method?: 'GET' | 'POST';
  token?: string;
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
  eventChannel?: 'vieneu' | 'http';
}): Promise<NativeHttpResult> {
  const {
    url,
    method = 'GET',
    token = '',
    headers: extraHeaders = {},
    body,
    timeoutMs = 20_000,
    eventChannel = 'vieneu',
  } = params;

  const actionName = eventChannel === 'vieneu' ? 'vieneuRequest' : 'nativeHttpRequest';
  const eventName = eventChannel === 'vieneu' ? 'tenglish-vieneu-response' : 'tenglish-http-response';

  if (hasNativeMacBridge() && typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    const requestId = `nh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    return new Promise<NativeHttpResult>((resolve) => {
      let settled = false;
      const timer = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        window.removeEventListener(eventName, onResp);
        resolve({
          ok: false,
          status: 0,
          contentType: 'text/plain',
          sampleRate: 48_000,
          buffer: new ArrayBuffer(0),
          text: '',
          error: 'Hết thời gian chờ kết nối mạng nội bộ',
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
        window.removeEventListener(eventName, onResp);

        const buffer = detail.bodyBase64 ? base64ToArrayBuffer(detail.bodyBase64) : new ArrayBuffer(0);
        let text = '';
        if (
          !detail.ok ||
          detail.status === 202 ||
          detail.contentType?.includes('json') ||
          detail.contentType?.includes('text')
        ) {
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
          sampleRate: detail.sampleRate ?? 48_000,
          buffer,
          text,
          error: detail.error,
        });
      };

      window.addEventListener(eventName, onResp);
      const win = window as unknown as {
        webkit: { messageHandlers: { tenglish: { postMessage: (msg: unknown) => void } } };
      };
      win.webkit.messageHandlers.tenglish.postMessage({
        action: actionName,
        requestId,
        url,
        method,
        token: token.trim(),
        headers: extraHeaders,
        body,
        timeoutMs,
      });
    });
  }

  const controller = new AbortController();
  const timer =
    typeof globalThis.setTimeout === 'function'
      ? globalThis.setTimeout(() => controller.abort(), timeoutMs)
      : 0;

  try {
    const headers: Record<string, string> = { ...extraHeaders };
    if (token.trim()) {
      headers['X-VieNeu-Studio-Token'] = token.trim();
      if (!headers['Authorization']) {
        headers['Authorization'] = `Bearer ${token.trim()}`;
      }
    }
    if (body && method === 'POST' && !headers['Content-Type']) {
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
      const record = headersObj as unknown as Record<string, string>;
      return record[k] ?? record[k.toLowerCase()] ?? null;
    };

    const contentType = getHeader('content-type') || 'application/octet-stream';
    const srHeader = getHeader('X-Sample-Rate') || getHeader('x-sample-rate');
    const sampleRate = srHeader ? Number(srHeader) || 48_000 : 48_000;

    let text = '';
    let buffer: ArrayBuffer = new ArrayBuffer(0);

    if (typeof res.arrayBuffer === 'function') {
      buffer = await res.arrayBuffer();
      if (!res.ok || res.status === 202 || contentType.includes('json') || contentType.includes('text')) {
        try {
          text = new TextDecoder().decode(buffer);
        } catch {
          text = '';
        }
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
      sampleRate: 48_000,
      buffer: new ArrayBuffer(0),
      text: '',
      error: isAbort
        ? 'Hết thời gian kết nối tới VieNeu TTS'
        : 'Không thể kết nối hoặc bị chặn CORS từ trình duyệt (hãy chạy trên app macOS)',
    };
  } finally {
    if (timer) globalThis.clearTimeout(timer);
  }
}

export async function startLocalVieneuDaemon(port = 8766): Promise<{
  ok: boolean;
  running: boolean;
  message: string;
}> {
  if (!hasNativeMacBridge() || typeof window === 'undefined') {
    return {
      ok: false,
      running: false,
      message: 'Chỉ hỗ trợ bật tự động tiến trình VieNeu Direct trên ứng dụng macOS T-English.app.',
    };
  }
  const requestId = `vd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  return new Promise((resolve) => {
    let settled = false;
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      window.removeEventListener('tenglish-vieneu-daemon', onResp);
      resolve({ ok: false, running: false, message: 'Không nhận phản hồi từ tiến trình macOS host.' });
    }, 6000);

    const onResp = (ev: Event) => {
      const detail = (ev as CustomEvent<{
        requestId: string;
        ok: boolean;
        running: boolean;
        message?: string;
      }>).detail;
      if (!detail || detail.requestId !== requestId || settled) return;
      settled = true;
      window.clearTimeout(timer);
      window.removeEventListener('tenglish-vieneu-daemon', onResp);
      resolve({
        ok: Boolean(detail.ok),
        running: Boolean(detail.running),
        message: detail.message || (detail.ok ? 'Đã bật VieNeu Direct Engine' : 'Không thể bật'),
      });
    };

    window.addEventListener('tenglish-vieneu-daemon', onResp);
    const win = window as unknown as {
      webkit: { messageHandlers: { tenglish: { postMessage: (msg: unknown) => void } } };
    };
    win.webkit.messageHandlers.tenglish.postMessage({
      action: 'startLocalVieneu',
      requestId,
      port,
    });
  });
}

export async function stopLocalVieneuDaemon(): Promise<{ ok: boolean; message: string }> {
  if (!hasNativeMacBridge() || typeof window === 'undefined') {
    return { ok: false, message: 'Chỉ hỗ trợ trên ứng dụng macOS.' };
  }
  const requestId = `vds-${Date.now()}`;
  return new Promise((resolve) => {
    const onResp = (ev: Event) => {
      const detail = (ev as CustomEvent<{ requestId: string; ok: boolean; message?: string }>).detail;
      if (!detail || detail.requestId !== requestId) return;
      window.removeEventListener('tenglish-vieneu-daemon', onResp);
      resolve({ ok: Boolean(detail.ok), message: detail.message || 'Đã tắt VieNeu Direct Engine.' });
    };
    window.addEventListener('tenglish-vieneu-daemon', onResp);
    const win = window as unknown as {
      webkit: { messageHandlers: { tenglish: { postMessage: (msg: unknown) => void } } };
    };
    win.webkit.messageHandlers.tenglish.postMessage({ action: 'stopLocalVieneu', requestId });
  });
}

function normalizeBaseUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, '');
}

export async function checkVieneuHealth(
  vieneuUrl: string,
  token = ''
): Promise<{
  ok: boolean;
  status: number;
  message: string;
  mode?: 'direct' | 'coordinator';
  sampleRate?: number;
}> {
  const base = normalizeBaseUrl(vieneuUrl);
  if (!base) {
    return { ok: false, status: 0, message: 'Chưa nhập địa chỉ VieNeu server.' };
  }
  const resp = await nativeHttpRequest({
    url: `${base}/health`,
    method: 'GET',
    token,
    timeoutMs: 8_000,
    eventChannel: 'vieneu',
  });
  if (resp.ok) {
    let mode: 'direct' | 'coordinator' = 'direct';
    let sampleRate = 48_000;
    let readyWorkers = 0;
    try {
      const info = JSON.parse(resp.text) as {
        status?: string;
        sample_rate?: number;
        workers?: Record<string, { ready?: boolean }>;
        coordinator?: string;
      };
      if (typeof info.sample_rate === 'number') sampleRate = info.sample_rate;
      if (info.workers || info.coordinator) {
        mode = 'coordinator';
        readyWorkers = Object.values(info.workers ?? {}).filter((w) => w?.ready).length;
        if (readyWorkers === 0) {
          return {
            ok: false,
            status: resp.status,
            mode,
            sampleRate,
            message:
              'Coordinator (8765) đang mở nhưng chưa có Worker online (Tailscale tắt?). Hãy bấm "Bật VieNeu Direct 8766" để chạy thẳng trên máy!',
          };
        }
      }
    } catch {
      // plain text / minimal health json is fine
    }
    return {
      ok: true,
      status: resp.status,
      mode,
      sampleRate,
      message:
        mode === 'coordinator'
          ? `VieNeu HA Coordinator sẵn sàng (${readyWorkers} worker online · ${sampleRate / 1000}kHz).`
          : `VieNeu Direct Engine sẵn sàng (${sampleRate / 1000}kHz).`,
    };
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
  const resp = await nativeHttpRequest({
    url: `${base}/v1/voices`,
    method: 'GET',
    token,
    timeoutMs: 10_000,
    eventChannel: 'vieneu',
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
          const obj = item as {
            id?: string;
            voice_id?: string;
            name?: string;
            description?: string;
            lang?: string;
            gender?: string;
            available_on?: string[];
          };
          const id = obj.id || obj.voice_id || obj.name || '';
          if (!id) return null;
          return {
            id,
            name: obj.name || id,
            lang: obj.lang,
            gender: obj.gender,
            description: obj.description,
            availableOn: obj.available_on,
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

function looksLikeJsonBuffer(buf: ArrayBuffer, contentType: string): boolean {
  if (contentType.includes('json') || contentType.includes('text')) return true;
  if (buf.byteLength === 0) return false;
  const first = new Uint8Array(buf, 0, 1)[0];
  return first === 0x7b || first === 0x5b; // '{' or '['
}

function makeTaskId(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `teng-${Date.now().toString(36)}-${rand}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms));
}

function decodeAudioResultToBlob(resp: NativeHttpResult): Blob | null {
  if (!resp.ok || resp.buffer.byteLength === 0) return null;
  if (looksLikeJsonBuffer(resp.buffer, resp.contentType)) return null;

  if (isRiffWav(resp.buffer)) {
    const fixed = repairStreamingWavHeader(resp.buffer);
    return new Blob([fixed], { type: 'audio/wav' });
  }
  if (
    resp.contentType.includes('mpeg') ||
    resp.contentType.includes('mp3') ||
    resp.contentType.includes('ogg') ||
    resp.contentType.includes('flac')
  ) {
    return new Blob([resp.buffer], { type: resp.contentType });
  }
  const wavBytes = pcm16ToWavBytes(resp.buffer, resp.sampleRate || 48_000);
  const wavCopy = new Uint8Array(wavBytes.byteLength);
  wavCopy.set(wavBytes);
  return new Blob([wavCopy.buffer], { type: 'audio/wav' });
}

/**
 * Synthesizes audio via VieNeu-TTS v3 Turbo.
 * Supports BOTH:
 * 1) Direct Streaming API (`apps.openai_speech` on 8766/8000 -> HTTP 200 WAV/PCM, 48kHz)
 * 2) Async HA Coordinator API (`service.coordinator` on 8765 -> HTTP 202 + X-Task-Id -> poll /jobs/{id} -> GET /jobs/{id}/audio)
 */
export async function synthesizeVieneuAudio(
  text: string,
  config: TtsConfig = activeTtsConfig,
  speedOverride?: number
): Promise<Blob | null> {
  const cleanText = text.trim();
  const base = normalizeBaseUrl(config.vieneuUrl);
  if (!cleanText || !base) return null;

  // VieNeu HA audio_speed.py accepts 0.75..1.5; finer speed changes happen client-side via playbackRate
  const requestedSpeed = speedOverride ?? config.speed ?? 1.0;
  const serverSpeed = Math.min(1.5, Math.max(0.75, requestedSpeed));
  const cacheKey = `${base}|${config.voiceId}|${serverSpeed.toFixed(2)}|${cleanText}`;
  const cached = audioBlobCache.get(cacheKey);
  if (cached) {
    audioBlobCache.delete(cacheKey);
    audioBlobCache.set(cacheKey, cached);
    return cached;
  }

  const payload: Record<string, unknown> = {
    model: 'vieneu-v3-turbo',
    input: cleanText,
    response_format: 'wav',
    sample_rate: 48_000,
    speed: serverSpeed,
  };
  if (config.voiceId.trim()) {
    payload.voice = config.voiceId.trim();
  }

  const taskId = makeTaskId();
  const resp = await nativeHttpRequest({
    url: `${base}/v1/audio/speech`,
    method: 'POST',
    token: config.vieneuToken,
    headers: {
      'X-Task-Id': taskId,
      'X-VieNeu-Worker': 'auto',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    timeoutMs: 22_000,
    eventChannel: 'vieneu',
  });

  if (!resp.ok || resp.buffer.byteLength === 0) {
    return null;
  }

  let blob: Blob | null = null;

  // Async HA Coordinator protocol: HTTP 202 Accepted or JSON job descriptor
  if (resp.status === 202 || looksLikeJsonBuffer(resp.buffer, resp.contentType)) {
    let jobId = taskId;
    try {
      const parsed = JSON.parse(resp.text || new TextDecoder().decode(resp.buffer)) as {
        id?: string;
        state?: string;
      };
      if (parsed.id) jobId = parsed.id;
      if (parsed.state === 'failed' || parsed.state === 'interrupted' || parsed.state === 'rejected') {
        return null;
      }
    } catch {
      return null;
    }

    // Poll GET /jobs/{id} until completed (up to 18s)
    for (let attempt = 0; attempt < 45; attempt += 1) {
      if (attempt > 0) await sleep(400);
      const statusResp = await nativeHttpRequest({
        url: `${base}/jobs/${encodeURIComponent(jobId)}`,
        method: 'GET',
        token: config.vieneuToken,
        timeoutMs: 8_000,
        eventChannel: 'vieneu',
      });
      if (!statusResp.ok) return null;
      try {
        const job = JSON.parse(statusResp.text || new TextDecoder().decode(statusResp.buffer)) as {
          state?: string;
        };
        if (job.state === 'completed') {
          const audioResp = await nativeHttpRequest({
            url: `${base}/jobs/${encodeURIComponent(jobId)}/audio`,
            method: 'GET',
            token: config.vieneuToken,
            timeoutMs: 20_000,
            eventChannel: 'vieneu',
          });
          blob = decodeAudioResultToBlob(audioResp);
          break;
        }
        if (job.state === 'failed' || job.state === 'interrupted' || job.state === 'expired') {
          return null;
        }
      } catch {
        return null;
      }
    }
  } else {
    // Direct OpenAI-compatible WAV/PCM stream
    blob = decodeAudioResultToBlob(resp);
  }

  if (!blob) return null;

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

export function getAvailableEnglishVoices(): Array<{ name: string; lang: string }> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  try {
    return window.speechSynthesis
      .getVoices()
      .filter((v) => v.lang.toLowerCase().startsWith('en'))
      .map((v) => ({ name: v.name, lang: v.lang }));
  } catch {
    return [];
  }
}

function pickBestSystemVoice(
  voices: SpeechSynthesisVoice[],
  targetLang: 'en-US' | 'en-GB' | 'en-AU' | 'vi-VN'
): SpeechSynthesisVoice | undefined {
  if (targetLang.startsWith('en') && activeTtsConfig.englishVoiceName) {
    const exact = voices.find((v) => v.name === activeTtsConfig.englishVoiceName);
    if (exact) return exact;
  }

  const langPrefix = targetLang.split('-')[0];
  const preferredPattern =
    targetLang === 'en-GB'
      ? /daniel|oliver|serena|kate|arthur|stephanie|google uk/i
      : targetLang === 'en-AU'
        ? /karen|lee|matilda|catherine/i
        : targetLang === 'vi-VN'
          ? /linh|an|mai/i
          : /ava|zoe|samantha|allison|alex|aaron|nicky|google us/i;

  return (
    voices.find((v) => v.lang.startsWith(targetLang) && /premium|enhanced/i.test(v.name) && preferredPattern.test(v.name)) ||
    voices.find((v) => v.lang.startsWith(targetLang) && preferredPattern.test(v.name)) ||
    voices.find((v) => v.lang.startsWith(targetLang)) ||
    voices.find((v) => v.lang.startsWith(langPrefix))
  );
}

function speakWithSystemSpeech(
  text: string,
  targetLang: 'en-US' | 'en-GB' | 'en-AU' | 'vi-VN',
  rate?: number,
  onEnd?: () => void
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    emitSpeechState({ status: 'idle' });
    onEnd?.();
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = targetLang;
    utter.rate = rate ?? (targetLang === 'vi-VN' ? activeTtsConfig.speed || 1.0 : 0.96);

    const voices = window.speechSynthesis.getVoices();
    const preferred = pickBestSystemVoice(voices, targetLang);
    if (preferred) utter.voice = preferred;

    emitSpeechState({ status: 'playing', text, lang: targetLang, engineUsed: 'system' });
    utter.onend = () => {
      emitSpeechState({ status: 'idle' });
      onEnd?.();
    };
    utter.onerror = () => {
      emitSpeechState({ status: 'idle' });
      onEnd?.();
    };
    window.speechSynthesis.speak(utter);
  } catch {
    emitSpeechState({ status: 'idle' });
    onEnd?.();
  }
}

export function shouldRouteToVieneu(targetLang: 'en-US' | 'en-GB' | 'en-AU' | 'vi-VN'): boolean {
  if (!activeTtsConfig.vieneuUrl.trim()) return false;
  if (activeTtsConfig.engine === 'system') return false;

  // Hybrid mode (recommended): Native EN voices for IPA accuracy + VieNeu 48kHz for Vietnamese
  if (activeTtsConfig.engine === 'hybrid') {
    return targetLang === 'vi-VN' && activeTtsConfig.useVieneuForVietnamese;
  }

  // Full VieNeu mode: Vietnamese always (if enabled) + English only if explicitly opted in
  if (targetLang === 'vi-VN') {
    return activeTtsConfig.useVieneuForVietnamese;
  }
  return activeTtsConfig.useVieneuForEnglish;
}

function speakInternal(
  text: string,
  targetLang: 'en-US' | 'en-GB' | 'en-AU' | 'vi-VN',
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

  if (!shouldRouteToVieneu(targetLang)) {
    speakWithSystemSpeech(text, targetLang, options.rate, options.onEnd);
    return;
  }

  emitSpeechState({ status: 'loading', text, lang: targetLang, engineUsed: 'vieneu' });

  const requestedRate = options.rate ?? activeTtsConfig.speed ?? 1.0;
  void synthesizeVieneuAudio(text, activeTtsConfig, requestedRate)
    .then((blob) => {
      if (seq !== speechRequestSeq) return;
      if (
        !blob ||
        typeof Audio === 'undefined' ||
        typeof URL === 'undefined' ||
        typeof URL.createObjectURL !== 'function'
      ) {
        speakWithSystemSpeech(text, targetLang, options.rate, options.onEnd);
        return;
      }

      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      // Apply client-side fine tempo if outside server bounds (< 0.75x)
      if (requestedRate < 0.75) {
        audio.playbackRate = Math.max(0.55, requestedRate / 0.75);
      }
      activeAudio = audio;
      activeAudioUrl = url;

      const cleanupAndDone = (callEnd: boolean) => {
        if (activeAudio === audio) {
          stopActiveVieneuAudio();
        } else if (typeof URL.revokeObjectURL === 'function') {
          URL.revokeObjectURL(url);
        }
        if (seq === speechRequestSeq) {
          emitSpeechState({ status: 'idle' });
          if (callEnd) options.onEnd?.();
        }
      };

      audio.onended = () => cleanupAndDone(true);
      audio.onerror = () => {
        cleanupAndDone(false);
        if (seq === speechRequestSeq) {
          speakWithSystemSpeech(text, targetLang, options.rate, options.onEnd);
        }
      };

      emitSpeechState({ status: 'playing', text, lang: targetLang, engineUsed: 'vieneu' });
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
  options: { accent?: EnglishAccent; rate?: number; onEnd?: () => void } = {}
): void {
  const accent = options.accent ?? activeTtsConfig.englishAccent ?? 'US General';
  const targetLang = accent === 'UK RP' ? 'en-GB' : accent === 'AUS' ? 'en-AU' : 'en-US';
  speakInternal(text, targetLang, options);
}

export function speakVietnamese(
  text: string,
  options: { rate?: number; onEnd?: () => void } = {}
): void {
  speakInternal(text, 'vi-VN', options);
}

/**
 * Bilingual Podcast Playback: Speaks English in native EN voice -> brief pause -> Vietnamese meaning in VieNeu 48kHz!
 */
export function speakBilingual(
  enText: string,
  viText: string,
  options: { accent?: EnglishAccent; rate?: number; onEnd?: () => void } = {}
): void {
  const seqAtStart = speechRequestSeq + 1;
  speakEnglish(enText, {
    accent: options.accent,
    rate: options.rate,
    onEnd: () => {
      if (!viText.trim()) {
        options.onEnd?.();
        return;
      }
      globalThis.setTimeout(() => {
        if (speechRequestSeq !== seqAtStart) return;
        speakVietnamese(viText, {
          rate: activeTtsConfig.speed,
          onEnd: options.onEnd,
        });
      }, 320);
    },
  });
}

export function stopSpeaking(): void {
  speechRequestSeq += 1;
  stopActiveVieneuAudio();
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
  emitSpeechState({ status: 'idle' });
}

export function showNativeVocabNotification(payload: {
  cardId: string;
  word: string;
  ipa: string;
  meaningVi: string;
  example: string;
  cefr: string;
}): boolean {
  if (hasNativeMacBridge()) {
    try {
      const win = window as unknown as {
        webkit: { messageHandlers: { tenglish: { postMessage: (msg: unknown) => void } } };
      };
      win.webkit.messageHandlers.tenglish.postMessage({
        action: 'showVocabNotification',
        ...payload,
      });
      return true;
    } catch {
      return false;
    }
  }
  // Browser Web Notification API fallback when tab is hidden or granted
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(`${payload.word} ${payload.ipa} (${payload.cefr})`, {
        body: `${payload.meaningVi}\n"${payload.example}"`,
        silent: false,
      });
      return true;
    } catch {
      return false;
    }
  }
  return false;
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
    callbacks.onError?.('WebView chưa hỗ trợ Web Speech Recognition — bạn vẫn ghi âm nghe lại A/B và nhập câu đọc để chấm IPA.');
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
