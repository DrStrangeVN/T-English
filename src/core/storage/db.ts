import type { AIConfig, MemoryLedgerItem, TurnCorrection } from '../ai/tutorService';
import type { FsrsCard } from '../fsrs/fsrsEngine';
import type { ReaderArticle } from '../../data/readerArticles';
import { INITIAL_FSRS_CARDS } from '../../data/dictionaries';

export type ThemeMode = 'dark' | 'light';
export type GlassIntensity = 'clear' | 'balanced' | 'solid';
export type ViewportPreview = 'auto' | 'mac' | 'iphone' | 'menubar';
export type SpeechEngine = 'system' | 'vieneu';

export interface TtsConfig {
  engine: SpeechEngine;
  vieneuUrl: string;
  vieneuToken: string;
  voiceId: string;
  voiceName: string;
  speed: number;
  useVieneuForVietnamese: boolean;
}

export interface SavedChatTurn {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  textVi?: string;
  correction?: TurnCorrection;
  memoryTriggered?: string;
  source?: 'live' | 'fallback';
  fallbackReason?: string;
}

export interface SavedTutorSession {
  turns: SavedChatTurn[];
  completedMissions: string[];
}

export interface AppSettings {
  theme: ThemeMode;
  glass: GlassIntensity;
  reduceTransparency: boolean;
  soundEffectsEnabled: boolean;
  desiredRetention: number;
  dailyGoalMinutes: number;
  aiConfig: AIConfig;
  ttsConfig: TtsConfig;
}

export interface StudyStats {
  immersionMinutes: number; // 1,000-hour target = 60,000 mins
  streakDays: number;
  dailyMinutesDone: number;
  pronunciationScores: number[];
  phonemeMastery: Record<string, number>; // ipa symbol -> 0..100
  completedDailySteps: string[];
  completedUnitIds: string[];
  cefrLevel: string;
  typingWpmBest: number;
  wordFamiliarity: Record<string, 1 | 2 | 3 | 4 | 5>; // LingQ 1..5 scale
  dailyActivityLog: Record<string, number>; // YYYY-MM-DD -> activity units
}

export interface TEnglishState {
  cards: FsrsCard[];
  settings: AppSettings;
  stats: StudyStats;
  memoryLedger: MemoryLedgerItem[];
  writingDrafts: Record<string, string>;
  customArticles: ReaderArticle[];
  tutorSessions: Record<string, SavedTutorSession>;
}

export const STORAGE_KEY = 't-english-state-v2';

export function getTodayIsoDate(now = Date.now()): string {
  const d = new Date(now);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function buildSeededActivityLog(streakDays = 42, now = Date.now()): Record<string, number> {
  const log: Record<string, number> = {};
  for (let i = 0; i < streakDays; i++) {
    const key = getTodayIsoDate(now - i * 86_400_000);
    log[key] = 2 + ((i * 3) % 4);
  }
  return log;
}

export function bumpDailyActivity(
  log: Record<string, number>,
  delta = 1,
  now = Date.now()
): Record<string, number> {
  const key = getTodayIsoDate(now);
  return {
    ...log,
    [key]: (log[key] ?? 0) + delta,
  };
}

export const DEFAULT_PHONEME_MASTERY: Record<string, number> = {
  'iː': 92, 'ɪ': 84, 'ʊ': 88, 'uː': 91, 'e': 89, 'ə': 86, 'ɜː': 76, 'ɔː': 85,
  'æ': 71, 'ʌ': 87, 'ɑː': 90, 'ɒ': 83,
  'ɪə': 84, 'eɪ': 93, 'ʊə': 79, 'ɔɪ': 91, 'əʊ': 85, 'eə': 82, 'aɪ': 94, 'aʊ': 89,
  'p': 91, 'b': 94, 't': 81, 'd': 90, 'tʃ': 74, 'dʒ': 78, 'k': 93, 'g': 92,
  'f': 95, 'v': 89, 'θ': 64, 'ð': 68, 's': 88, 'z': 77, 'ʃ': 73, 'ʒ': 70,
  'm': 96, 'n': 95, 'ŋ': 86, 'h': 94, 'l': 85, 'r': 75, 'w': 92, 'j': 93,
};

export const DEFAULT_MEMORY_LEDGER: MemoryLedgerItem[] = [
  {
    id: 'mem-1',
    mistakePattern: 'discuss about -> discuss',
    targetVocab: 'bottleneck',
    userGoal: 'System Design Interview & Senior Tech Lead',
    lastPracticedAt: Date.now() - 86_400_000,
    resolved: false,
  },
  {
    id: 'mem-2',
    mistakePattern: 'I am agree -> I agree',
    targetVocab: 'resilient',
    userGoal: 'IELTS Speaking Band 8.0',
    lastPracticedAt: Date.now() - 2 * 86_400_000,
    resolved: false,
  },
];

export function createDefaultState(): TEnglishState {
  return {
    cards: INITIAL_FSRS_CARDS,
    settings: {
      theme: 'dark',
      glass: 'balanced',
      reduceTransparency: false,
      soundEffectsEnabled: true,
      desiredRetention: 0.9,
      dailyGoalMinutes: 25,
      aiConfig: {
        provider: 'builtin',
        apiKey: '',
        model: 'gpt-4o-mini',
        ollamaUrl: 'http://localhost:11434',
      },
      ttsConfig: {
        engine: 'system',
        vieneuUrl: 'http://127.0.0.1:8765',
        vieneuToken: '',
        voiceId: '',
        voiceName: 'Mặc định VieNeu',
        speed: 1.0,
        useVieneuForVietnamese: true,
      },
    },
    stats: {
      immersionMinutes: 18_750, // 312.5 / 1,000 hours
      streakDays: 42,
      dailyMinutesDone: 14,
      pronunciationScores: [82, 85, 84, 87, 89, 88, 91],
      phonemeMastery: { ...DEFAULT_PHONEME_MASTERY },
      completedDailySteps: ['step-fsrs'],
      completedUnitIds: ['unit-a1-1'],
      cefrLevel: 'B2',
      typingWpmBest: 68,
      wordFamiliarity: {
        architecture: 4,
        latency: 5,
        resilient: 3,
        scalability: 4,
        tradeoff: 3,
        eloquent: 2,
        bottleneck: 3,
      },
      dailyActivityLog: buildSeededActivityLog(42),
    },
    memoryLedger: DEFAULT_MEMORY_LEDGER,
    writingDrafts: {},
    customArticles: [],
    tutorSessions: {},
  };
}

export function hydrateState(parsed: Partial<TEnglishState>): TEnglishState {
  const fallback = createDefaultState();
  const providerRaw = parsed.settings?.aiConfig?.provider as string | undefined;
  const safeProvider: AIConfig['provider'] =
    providerRaw === 'openai' || providerRaw === 'gemini' || providerRaw === 'ollama'
      ? providerRaw
      : 'builtin';

  return {
    cards: Array.isArray(parsed.cards) && parsed.cards.length > 0 ? parsed.cards : fallback.cards,
    settings: {
      ...fallback.settings,
      ...(parsed.settings ?? {}),
      aiConfig: {
        ...fallback.settings.aiConfig,
        ...(parsed.settings?.aiConfig ?? {}),
        provider: safeProvider,
      },
      ttsConfig: {
        ...fallback.settings.ttsConfig,
        ...(parsed.settings?.ttsConfig ?? {}),
        engine: parsed.settings?.ttsConfig?.engine === 'vieneu' ? 'vieneu' : 'system',
      },
    },
    stats: {
      ...fallback.stats,
      ...(parsed.stats ?? {}),
      phonemeMastery: {
        ...fallback.stats.phonemeMastery,
        ...(parsed.stats?.phonemeMastery ?? {}),
      },
      wordFamiliarity: {
        ...fallback.stats.wordFamiliarity,
        ...(parsed.stats?.wordFamiliarity ?? {}),
      },
      dailyActivityLog:
        parsed.stats?.dailyActivityLog && Object.keys(parsed.stats.dailyActivityLog).length > 0
          ? parsed.stats.dailyActivityLog
          : fallback.stats.dailyActivityLog,
    },
    memoryLedger:
      Array.isArray(parsed.memoryLedger) && parsed.memoryLedger.length > 0
        ? parsed.memoryLedger
        : fallback.memoryLedger,
    writingDrafts: parsed.writingDrafts && typeof parsed.writingDrafts === 'object' ? parsed.writingDrafts : {},
    customArticles: Array.isArray(parsed.customArticles) ? parsed.customArticles.slice(0, 20) : [],
    tutorSessions: parsed.tutorSessions && typeof parsed.tutorSessions === 'object' ? parsed.tutorSessions : {},
  };
}

export function loadState(): TEnglishState {
  const fallback = createDefaultState();
  if (typeof window === 'undefined' || !window.localStorage) {
    return fallback;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<TEnglishState>;
    return hydrateState(parsed);
  } catch {
    return fallback;
  }
}

export function saveState(state: TEnglishState): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota overflow safely
  }
}

export function exportStateBackup(state: TEnglishState, includeSecrets = false): string {
  const sanitized: TEnglishState = {
    ...state,
    settings: {
      ...state.settings,
      aiConfig: {
        ...state.settings.aiConfig,
        apiKey: includeSecrets ? state.settings.aiConfig.apiKey : '',
      },
      ttsConfig: {
        ...state.settings.ttsConfig,
        vieneuToken: includeSecrets ? state.settings.ttsConfig.vieneuToken : '',
      },
    },
  };
  return JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), data: sanitized }, null, 2);
}

export function importStateBackup(rawJson: string): TEnglishState {
  const parsed = JSON.parse(rawJson) as { version?: number; data?: Partial<TEnglishState> } | Partial<TEnglishState>;
  const candidate =
    parsed && typeof parsed === 'object' && 'data' in parsed && parsed.data
      ? parsed.data
      : (parsed as Partial<TEnglishState>);

  if (!candidate || typeof candidate !== 'object' || !Array.isArray(candidate.cards)) {
    throw new Error('Tệp backup JSON không hợp lệ hoặc thiếu danh sách thẻ FSRS.');
  }
  return hydrateState(candidate);
}
