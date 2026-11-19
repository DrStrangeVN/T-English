/**
 * Cross-Platform Speech Synthesis, Speech Recognition & Haptic Feedback Bridge
 * Works identically across macOS WKWebView, iOS WKWebView / Safari, and Desktop Browsers.
 */

export function speakEnglish(
  text: string,
  options: { accent?: 'US General' | 'UK RP'; rate?: number; onEnd?: () => void } = {}
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    options.onEnd?.();
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const targetLang = options.accent === 'UK RP' ? 'en-GB' : 'en-US';
    utter.lang = targetLang;
    utter.rate = options.rate ?? 0.96;

    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((v) => v.lang.startsWith(targetLang) && /samantha|daniel|alex|google|aaron/i.test(v.name)) ||
      voices.find((v) => v.lang.startsWith(targetLang)) ||
      voices.find((v) => v.lang.startsWith('en'));
    if (preferred) utter.voice = preferred;

    if (options.onEnd) utter.onend = () => options.onEnd?.();
    window.speechSynthesis.speak(utter);
  } catch {
    options.onEnd?.();
  }
}

export function stopSpeaking(): void {
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
