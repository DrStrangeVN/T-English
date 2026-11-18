import type { AIConfig, MemoryLedgerItem } from '../ai/tutorService';
import type { FsrsCard } from '../fsrs/fsrsEngine';
import { INITIAL_FSRS_CARDS } from '../../data/dictionaries';

export type ThemeMode = 'dark' | 'light';
export type GlassIntensity = 'clear' | 'balanced' | 'solid';
export type ViewportPreview = 'auto' | 'mac' | 'iphone' | 'menubar';

export interface AppSettings {
  theme: ThemeMode;
  glass: GlassIntensity;
  reduceTransparency: boolean;
  desiredRetention: number;
  dailyGoalMinutes: number;
  aiConfig: AIConfig;
}

export interface StudyStats {
  immersionMinutes: number; // 1,000-hour target = 60,000 mins
  streakDays: number;
  dailyMinutesDone: number;
  pronunciationScores: number[];
  phonemeMastery: Record<string, number>; // ipa symbol -> 0..100
  completedDailySteps: string[];
  typingWpmBest: number;
  wordFamiliarity: Record<string, 1 | 2 | 3 | 4 | 5>; // LingQ 1..5 scale
}

export interface TEnglishState {
  cards: FsrsCard[];
  settings: AppSettings;
  stats: StudyStats;
  memoryLedger: MemoryLedgerItem[];
}

const STORAGE_KEY = 't-english-state-v1';

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
      desiredRetention: 0.9,
      dailyGoalMinutes: 25,
      aiConfig: {
        provider: 'builtin',
        apiKey: '',
        model: 'gpt-4o-mini',
        ollamaUrl: 'http://localhost:11434',
      },
    },
    stats: {
      immersionMinutes: 18_750, // 312.5 / 1,000 hours
      streakDays: 42,
      dailyMinutesDone: 14,
      pronunciationScores: [82, 85, 84, 87, 89, 88, 91],
      phonemeMastery: { ...DEFAULT_PHONEME_MASTERY },
      completedDailySteps: ['step-fsrs'],
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
    },
    memoryLedger: DEFAULT_MEMORY_LEDGER,
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
    return {
      cards: Array.isArray(parsed.cards) && parsed.cards.length > 0 ? parsed.cards : fallback.cards,
      settings: {
        ...fallback.settings,
        ...(parsed.settings ?? {}),
        aiConfig: {
          ...fallback.settings.aiConfig,
          ...(parsed.settings?.aiConfig ?? {}),
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
      },
      memoryLedger:
        Array.isArray(parsed.memoryLedger) && parsed.memoryLedger.length > 0
          ? parsed.memoryLedger
          : fallback.memoryLedger,
    };
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
