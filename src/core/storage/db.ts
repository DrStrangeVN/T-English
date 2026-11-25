import type { AIConfig, MemoryLedgerItem, TurnCorrection } from '../ai/tutorService';
import type { FsrsCard } from '../fsrs/fsrsEngine';
import type { ReaderArticle } from '../../data/readerArticles';
import type { RoleplayScenario } from '../../data/roleplayScenarios';
import { INITIAL_FSRS_CARDS } from '../../data/dictionaries';
import { saveStateToIdb } from './indexedDbStore';

export type ThemeMode = 'dark' | 'light';
export type GlassIntensity = 'clear' | 'balanced' | 'solid';
export type ViewportPreview = 'auto' | 'mac' | 'iphone' | 'menubar';
export type SpeechEngine = 'hybrid' | 'system' | 'vieneu';
export type VieneuMode = 'auto' | 'direct' | 'coordinator';
export type EnglishAccent = 'US General' | 'UK RP' | 'AUS';

export interface TtsConfig {
  engine: SpeechEngine;
  englishAccent: EnglishAccent;
  englishVoiceName: string;
  vieneuUrl: string;
  vieneuMode: VieneuMode;
  vieneuToken: string;
  voiceId: string;
  voiceName: string;
  speed: number;
  useVieneuForVietnamese: boolean;
  useVieneuForEnglish: boolean;
}

export type VocabNotifyInterval = 5 | 15 | 30 | 60 | 120;
export type VocabNotifySource = 'due' | 'new' | 'weak' | 'all';
export type VocabNotifyStyle = 'quiz' | 'flash';

export interface VocabNotificationConfig {
  enabled: boolean;
  intervalMinutes: VocabNotifyInterval;
  source: VocabNotifySource;
  deckFilter: string;
  style: VocabNotifyStyle;
  autoSpeak: boolean;
  useNativeHud: boolean;
  quietStartHour: number;
  quietEndHour: number;
  dailyCap: number;
}

export interface VocabNotificationLogItem {
  id: string;
  cardId: string;
  word: string;
  ipa: string;
  meaningVi: string;
  notifiedAt: number;
  outcome: 'pending' | 'remembered' | 'again' | 'dismissed' | 'quiz-correct' | 'quiz-wrong';
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
  vocabNotifications: VocabNotificationConfig;
}

export interface StudyStats {
  immersionMinutes: number; // 1,000-hour target = 60,000 mins
  streakDays: number;
  streakFreezesLeft: number;
  dailyMinutesDone: number;
  lastActiveDate: string;
  pronunciationScores: number[];
  phonemeMastery: Record<string, number>; // ipa symbol -> 0..100
  completedDailySteps: string[];
  completedUnitIds: string[];
  cefrLevel: string;
  typingWpmBest: number;
  xpTotal: number;
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
  customScenarios: RoleplayScenario[];
  tutorSessions: Record<string, SavedTutorSession>;
  notificationHistory: VocabNotificationLogItem[];
}

export const STORAGE_KEY = 't-english-state-v2';

export function getTodayIsoDate(now = Date.now()): string {
  const d = new Date(now);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function buildSeededActivityLog(streakDays = 14, now = Date.now()): Record<string, number> {
  const log: Record<string, number> = {};
  for (let i = 0; i < streakDays; i++) {
    const key = getTodayIsoDate(now - i * 86_400_000);
    log[key] = 2 + ((i * 3) % 4);
  }
  return log;
}

/**
 * Dynamically computes actual consecutive active streak days from dailyActivityLog.
 * Allows continuing yesterday's streak if today hasn't logged activity yet.
 */
export function computeRealStreakDays(
  log: Record<string, number>,
  now = Date.now()
): number {
  const todayKey = getTodayIsoDate(now);
  const yesterdayKey = getTodayIsoDate(now - 86_400_000);

  let cursorOffset = 0;
  if ((log[todayKey] ?? 0) > 0) {
    cursorOffset = 0;
  } else if ((log[yesterdayKey] ?? 0) > 0) {
    cursorOffset = 1;
  } else {
    return 0;
  }

  let streak = 0;
  for (let i = cursorOffset; i < 3650; i++) {
    const key = getTodayIsoDate(now - i * 86_400_000);
    if ((log[key] ?? 0) > 0) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
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

export const DEFAULT_TTS_CONFIG: TtsConfig = {
  engine: 'system',
  englishAccent: 'US General',
  englishVoiceName: '',
  vieneuUrl: 'http://127.0.0.1:8765',
  vieneuMode: 'auto',
  vieneuToken: '',
  voiceId: '',
  voiceName: 'Mặc định VieNeu (48kHz)',
  speed: 1.0,
  useVieneuForVietnamese: true,
  useVieneuForEnglish: false,
};

export const DEFAULT_VOCAB_NOTIFICATION_CONFIG: VocabNotificationConfig = {
  enabled: true,
  intervalMinutes: 30,
  source: 'due',
  deckFilter: 'All',
  style: 'quiz',
  autoSpeak: false,
  useNativeHud: true,
  quietStartHour: 22,
  quietEndHour: 7,
  dailyCap: 24,
};

export function createDefaultState(): TEnglishState {
  const seededLog = buildSeededActivityLog(14);
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
        ollamaUrl: 'http://127.0.0.1:11434',
      },
      ttsConfig: { ...DEFAULT_TTS_CONFIG },
      vocabNotifications: { ...DEFAULT_VOCAB_NOTIFICATION_CONFIG },
    },
    stats: {
      immersionMinutes: 1_260, // 21.0 hrs starter profile
      streakDays: computeRealStreakDays(seededLog),
      streakFreezesLeft: 2,
      dailyMinutesDone: 10,
      lastActiveDate: getTodayIsoDate(),
      pronunciationScores: [82, 85, 84, 87, 89, 88, 91],
      phonemeMastery: { ...DEFAULT_PHONEME_MASTERY },
      completedDailySteps: ['step-fsrs'],
      completedUnitIds: ['unit-a1-1'],
      cefrLevel: 'B2',
      typingWpmBest: 62,
      xpTotal: 1_450,
      wordFamiliarity: {
        architecture: 4,
        latency: 5,
        resilient: 3,
        scalability: 4,
        tradeoff: 3,
        eloquent: 2,
        bottleneck: 3,
      },
      dailyActivityLog: seededLog,
    },
    memoryLedger: DEFAULT_MEMORY_LEDGER,
    writingDrafts: {},
    customArticles: [],
    customScenarios: [],
    tutorSessions: {},
    notificationHistory: [],
  };
}

/**
 * Clean Learner Profile (zero fake hours/streak, fresh FSRS deck ready to study).
 */
export function createCleanStartState(): TEnglishState {
  const base = createDefaultState();
  return {
    ...base,
    stats: {
      ...base.stats,
      immersionMinutes: 0,
      streakDays: 0,
      streakFreezesLeft: 2,
      dailyMinutesDone: 0,
      lastActiveDate: getTodayIsoDate(),
      pronunciationScores: [],
      completedDailySteps: [],
      completedUnitIds: [],
      cefrLevel: 'A2',
      typingWpmBest: 0,
      xpTotal: 0,
      wordFamiliarity: {},
      dailyActivityLog: {},
    },
    memoryLedger: [],
    writingDrafts: {},
    customArticles: [],
    customScenarios: [],
    tutorSessions: {},
    notificationHistory: [],
  };
}

export function hydrateState(parsed: Partial<TEnglishState>): TEnglishState {
  const fallback = createDefaultState();
  const providerRaw = parsed.settings?.aiConfig?.provider as string | undefined;
  const safeProvider: AIConfig['provider'] =
    providerRaw === 'openai' || providerRaw === 'gemini' || providerRaw === 'ollama'
      ? providerRaw
      : 'builtin';

  const ttsEngineRaw = parsed.settings?.ttsConfig?.engine as string | undefined;
  const safeTtsEngine: SpeechEngine =
    ttsEngineRaw === 'vieneu' || ttsEngineRaw === 'hybrid' || ttsEngineRaw === 'system'
      ? ttsEngineRaw
      : 'system';

  const activityLog =
    parsed.stats?.dailyActivityLog && Object.keys(parsed.stats.dailyActivityLog).length > 0
      ? parsed.stats.dailyActivityLog
      : parsed.stats?.immersionMinutes === 0
        ? {}
        : fallback.stats.dailyActivityLog;

  // Merge new built-in cards seamlessly if upgrading from older version with fewer cards
  let mergedCards = Array.isArray(parsed.cards) && parsed.cards.length > 0 ? parsed.cards : fallback.cards;
  if (Array.isArray(parsed.cards) && parsed.cards.length > 0 && parsed.cards.length < 35) {
    const existingWords = new Set(parsed.cards.map((c) => c.word.toLowerCase()));
    const extras = INITIAL_FSRS_CARDS.filter((c) => !existingWords.has(c.word.toLowerCase()));
    if (extras.length > 0) {
      mergedCards = [...parsed.cards, ...extras];
    }
  }

  const today = getTodayIsoDate();
  const lastDate = parsed.stats?.lastActiveDate ?? today;
  const dailyMinutesDone = lastDate === today ? (parsed.stats?.dailyMinutesDone ?? fallback.stats.dailyMinutesDone) : 0;
  const completedDailySteps = lastDate === today ? (parsed.stats?.completedDailySteps ?? fallback.stats.completedDailySteps) : [];
  const realStreak = computeRealStreakDays(activityLog);

  return {
    cards: mergedCards,
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
        engine: safeTtsEngine,
      },
      vocabNotifications: {
        ...fallback.settings.vocabNotifications,
        ...(parsed.settings?.vocabNotifications ?? {}),
      },
    },
    stats: {
      ...fallback.stats,
      ...(parsed.stats ?? {}),
      dailyMinutesDone,
      completedDailySteps,
      lastActiveDate: today,
      streakDays: realStreak,
      phonemeMastery: {
        ...fallback.stats.phonemeMastery,
        ...(parsed.stats?.phonemeMastery ?? {}),
      },
      wordFamiliarity:
        parsed.stats?.wordFamiliarity !== undefined
          ? parsed.stats.wordFamiliarity
          : fallback.stats.wordFamiliarity,
      dailyActivityLog: activityLog,
    },
    memoryLedger: Array.isArray(parsed.memoryLedger) ? parsed.memoryLedger : fallback.memoryLedger,
    writingDrafts: parsed.writingDrafts && typeof parsed.writingDrafts === 'object' ? parsed.writingDrafts : {},
    customArticles: Array.isArray(parsed.customArticles) ? parsed.customArticles.slice(0, 30) : [],
    customScenarios: Array.isArray(parsed.customScenarios) ? parsed.customScenarios.slice(0, 20) : [],
    tutorSessions: parsed.tutorSessions && typeof parsed.tutorSessions === 'object' ? parsed.tutorSessions : {},
    notificationHistory: Array.isArray(parsed.notificationHistory) ? parsed.notificationHistory.slice(0, 100) : [],
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
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // If localStorage hits 5MB quota, IndexedDB below still stores the full state safely
    }
  }
  void saveStateToIdb(state);
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
  return JSON.stringify({ version: 3, exportedAt: new Date().toISOString(), data: sanitized }, null, 2);
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
