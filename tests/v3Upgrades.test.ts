import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildVocabQuizChoices,
  countNotificationsToday,
  isWithinQuietHours,
  pickNextNotificationCard,
} from '../src/core/fsrs/vocabNotifier';
import {
  checkVieneuHealth,
  clearSpeechCache,
  configureSpeechEngine,
  repairStreamingWavHeader,
  shouldRouteToVieneu,
  synthesizeVieneuAudio,
} from '../src/core/phonetics/speechIO';
import { wordToIpa } from '../src/core/phonetics/ipaScorer';
import { lookupCoreLexicon } from '../src/data/coreLexicon';
import {
  computeRealStreakDays,
  createCleanStartState,
  createDefaultState,
  DEFAULT_TTS_CONFIG,
  DEFAULT_VOCAB_NOTIFICATION_CONFIG,
  getTodayIsoDate,
  hydrateState,
  type VocabNotificationLogItem,
} from '../src/core/storage/db';
import { INITIAL_FSRS_CARDS } from '../src/data/dictionaries';
import { LUDWIG_CORPUS } from '../src/data/ludwigCorpus';
import { WRITING_PROMPTS } from '../src/data/writingPrompts';

describe('T-English v3.0 Upgrades: Vocab Notifier, Dual-Voice VieNeu 48kHz, Core Lexicon & Persistence', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    clearSpeechCache();
    configureSpeechEngine(DEFAULT_TTS_CONFIG);
  });

  it('evaluates overnight and daytime quiet hours accurately', () => {
    const overnight = { ...DEFAULT_VOCAB_NOTIFICATION_CONFIG, quietStartHour: 22, quietEndHour: 7 };
    expect(isWithinQuietHours(overnight, new Date(2026, 4, 10, 23, 30).getTime())).toBe(true);
    expect(isWithinQuietHours(overnight, new Date(2026, 4, 10, 6, 15).getTime())).toBe(true);
    expect(isWithinQuietHours(overnight, new Date(2026, 4, 10, 14, 0).getTime())).toBe(false);

    const daytime = { ...DEFAULT_VOCAB_NOTIFICATION_CONFIG, quietStartHour: 12, quietEndHour: 14 };
    expect(isWithinQuietHours(daytime, new Date(2026, 4, 10, 13, 0).getTime())).toBe(true);
    expect(isWithinQuietHours(daytime, new Date(2026, 4, 10, 15, 0).getTime())).toBe(false);

    const disabled = { ...DEFAULT_VOCAB_NOTIFICATION_CONFIG, quietStartHour: 0, quietEndHour: 0 };
    expect(isWithinQuietHours(disabled, new Date(2026, 4, 10, 0, 30).getTime())).toBe(false);
  });

  it('picks highest-priority vocabulary cards and avoids immediate repeats', () => {
    const now = Date.now();
    const first = pickNextNotificationCard(INITIAL_FSRS_CARDS, DEFAULT_VOCAB_NOTIFICATION_CONFIG, [], now);
    expect(first).not.toBeNull();

    const history: VocabNotificationLogItem[] = [
      {
        id: 'log-1',
        cardId: first!.id,
        word: first!.word,
        ipa: first!.ipa,
        meaningVi: first!.meaningVi,
        notifiedAt: now - 60_000,
        outcome: 'remembered',
      },
    ];
    expect(countNotificationsToday(history, now)).toBe(1);

    const second = pickNextNotificationCard(INITIAL_FSRS_CARDS, DEFAULT_VOCAB_NOTIFICATION_CONFIG, history, now);
    expect(second).not.toBeNull();
    expect(second!.id).not.toBe(first!.id);

    const deckSpecific = pickNextNotificationCard(
      INITIAL_FSRS_CARDS,
      { ...DEFAULT_VOCAB_NOTIFICATION_CONFIG, source: 'all', deckFilter: 'Daily Conversation (A1–A2)' },
      [],
      now
    );
    expect(deckSpecific?.deck).toBe('Daily Conversation (A1–A2)');
  });

  it('builds deterministic 4-choice micro-quiz options with exactly one correct answer', () => {
    const target = INITIAL_FSRS_CARDS[0];
    const choicesA = buildVocabQuizChoices(target, INITIAL_FSRS_CARDS);
    const choicesB = buildVocabQuizChoices(target, INITIAL_FSRS_CARDS);

    expect(choicesA).toHaveLength(4);
    expect(choicesA.filter((c) => c.isCorrect)).toHaveLength(1);
    expect(choicesA.find((c) => c.isCorrect)?.meaningVi).toBe(target.meaningVi);
    expect(new Set(choicesA.map((c) => c.meaningVi.toLowerCase())).size).toBe(4);
    expect(choicesA.map((c) => c.cardId)).toEqual(choicesB.map((c) => c.cardId));
  });

  it('repairs streaming RIFF WAV headers with 0xFFFFFFFF size fields for Safari/WKWebView', () => {
    const raw = new ArrayBuffer(44 + 16);
    const bytes = new Uint8Array(raw);
    bytes.set([0x52, 0x49, 0x46, 0x46], 0); // RIFF
    bytes.set([0x57, 0x41, 0x56, 0x45], 8); // WAVE
    const view = new DataView(raw);
    view.setUint32(4, 0xffffffff, true);
    view.setUint32(40, 0xffffffff, true);

    const repaired = repairStreamingWavHeader(raw);
    const repairedView = new DataView(repaired);
    expect(repairedView.getUint32(4, true)).toBe(44 + 16 - 8);
    expect(repairedView.getUint32(40, true)).toBe(16);
  });

  it('handles VieNeu Async HA Coordinator 202 -> /jobs/{id} -> /jobs/{id}/audio protocol with X-Task-Id', async () => {
    const validWav = new Uint8Array(48);
    validWav.set([0x52, 0x49, 0x46, 0x46], 0);
    validWav.set([0x57, 0x41, 0x56, 0x45], 8);
    const wavView = new DataView(validWav.buffer);
    wavView.setUint32(4, 40, true);
    wavView.setUint32(40, 4, true);

    const fetchMock = vi
      .fn()
      // 1. POST /v1/audio/speech -> 202 Accepted job descriptor
      .mockResolvedValueOnce({
        ok: true,
        status: 202,
        headers: { get: (k: string) => (k.toLowerCase() === 'content-type' ? 'application/json' : null) },
        arrayBuffer: async () => new TextEncoder().encode(JSON.stringify({ id: 'job-xyz', state: 'queued' })).buffer,
      })
      // 2. GET /jobs/job-xyz -> completed
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: (k: string) => (k.toLowerCase() === 'content-type' ? 'application/json' : null) },
        arrayBuffer: async () => new TextEncoder().encode(JSON.stringify({ id: 'job-xyz', state: 'completed' })).buffer,
      })
      // 3. GET /jobs/job-xyz/audio -> 48kHz WAV binary
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: (k: string) => {
            if (k.toLowerCase() === 'content-type') return 'audio/wav';
            if (k.toLowerCase() === 'x-sample-rate') return '48000';
            return null;
          },
        },
        arrayBuffer: async () => validWav.buffer,
      });

    vi.stubGlobal('fetch', fetchMock);

    const blob = await synthesizeVieneuAudio(
      'Xin chào từ vựng mới',
      {
        ...DEFAULT_TTS_CONFIG,
        engine: 'hybrid',
        vieneuUrl: 'http://127.0.0.1:8765',
        voiceId: 'binh-nam-bac',
        useVieneuForVietnamese: true,
      },
      1.0
    );

    expect(blob).not.toBeNull();
    expect(blob?.type).toBe('audio/wav');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const firstHeaders = (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(firstHeaders['X-Task-Id']).toMatch(/^teng-/);
    expect(firstHeaders['X-VieNeu-Worker']).toBe('auto');
    expect(String(fetchMock.mock.calls[1][0])).toBe('http://127.0.0.1:8765/jobs/job-xyz');
    expect(String(fetchMock.mock.calls[2][0])).toBe('http://127.0.0.1:8765/jobs/job-xyz/audio');
  });

  it('never wraps a JSON error body into fake WAV audio and detects 0-worker Coordinator health', async () => {
    const healthMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      arrayBuffer: async () =>
        new TextEncoder().encode(
          JSON.stringify({
            coordinator: 'vieneu-ha',
            workers: { w1: { ready: false }, w2: { ready: false } },
          })
        ).buffer,
    });
    vi.stubGlobal('fetch', healthMock);

    const health = await checkVieneuHealth('http://127.0.0.1:8765');
    expect(health.ok).toBe(false);
    expect(health.mode).toBe('coordinator');
    expect(health.message).toContain('8766');

    const badJobMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 202,
      headers: { get: () => 'application/json' },
      arrayBuffer: async () => new TextEncoder().encode(JSON.stringify({ id: 'j-fail', state: 'failed' })).buffer,
    });
    vi.stubGlobal('fetch', badJobMock);

    const failedBlob = await synthesizeVieneuAudio('Lỗi worker', {
      ...DEFAULT_TTS_CONFIG,
      engine: 'hybrid',
      vieneuUrl: 'http://127.0.0.1:8765',
    });
    expect(failedBlob).toBeNull();
  });

  it('routes English to System voices and Vietnamese to VieNeu in Hybrid dual-voice mode', () => {
    configureSpeechEngine({
      ...DEFAULT_TTS_CONFIG,
      engine: 'hybrid',
      vieneuUrl: 'http://127.0.0.1:8766',
      useVieneuForVietnamese: true,
      useVieneuForEnglish: false,
    });

    expect(shouldRouteToVieneu('en-US')).toBe(false);
    expect(shouldRouteToVieneu('en-GB')).toBe(false);
    expect(shouldRouteToVieneu('vi-VN')).toBe(true);

    configureSpeechEngine({
      ...DEFAULT_TTS_CONFIG,
      engine: 'vieneu',
      vieneuUrl: 'http://127.0.0.1:8766',
      useVieneuForVietnamese: true,
      useVieneuForEnglish: true,
    });
    expect(shouldRouteToVieneu('en-US')).toBe(true);
    expect(shouldRouteToVieneu('vi-VN')).toBe(true);
  });

  it('computes dynamic streaks and creates a true zeroed Clean Start state', () => {
    const now = new Date(2026, 4, 20, 12, 0).getTime();
    const d0 = getTodayIsoDate(now);
    const d1 = getTodayIsoDate(now - 86_400_000);
    const d2 = getTodayIsoDate(now - 2 * 86_400_000);
    const d4 = getTodayIsoDate(now - 4 * 86_400_000);

    expect(computeRealStreakDays({ [d0]: 2, [d1]: 1, [d2]: 3, [d4]: 5 }, now)).toBe(3);
    expect(computeRealStreakDays({ [d1]: 1, [d2]: 2 }, now)).toBe(2);
    expect(computeRealStreakDays({ [d4]: 3 }, now)).toBe(0);

    const clean = createCleanStartState();
    expect(clean.stats.immersionMinutes).toBe(0);
    expect(clean.stats.streakDays).toBe(0);
    expect(clean.stats.dailyMinutesDone).toBe(0);
    expect(clean.stats.xpTotal).toBe(0);

    // Hydrating legacy v2 state with <35 cards automatically merges new v3 cards without losing user progress
    const legacy = createDefaultState();
    legacy.cards = legacy.cards.slice(0, 10);
    const hydrated = hydrateState(legacy);
    expect(hydrated.cards.length).toBeGreaterThanOrEqual(54);
    expect(hydrated.settings.vocabNotifications.enabled).toBe(true);
  });

  it('resolves irregular English IPA words via Core Lexicon and provides Task 1 charts & expanded collocations', () => {
    expect(wordToIpa('island')).toBe('ˈaɪ.lənd');
    expect(wordToIpa('queue')).toBe('kjuː');
    expect(wordToIpa('chaos')).toBe('ˈkeɪ.ɑːs');
    expect(wordToIpa('subtle')).toBe('ˈsʌt.əl');
    expect(wordToIpa('receipt')).toBe('rɪˈsiːt');
    expect(lookupCoreLexicon('islands')?.ipa).toBe('/ˈaɪ.lənd/');

    expect(LUDWIG_CORPUS.length).toBeGreaterThanOrEqual(20);
    const task1WithCharts = WRITING_PROMPTS.filter((p) => p.category === 'IELTS Task 1' && p.chart);
    expect(task1WithCharts.length).toBeGreaterThanOrEqual(2);
  });
});
