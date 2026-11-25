/**
 * Smart Vocabulary Notification & Micro-Learning Scheduler (WordBit / Drops / Anki FSRS inspired).
 * Selects the highest-impact vocabulary card right before the learner forgets it
 * and builds interactive 4-option micro-quizzes for 5-second desktop/in-app reviews.
 */
import { computeRetrievability, type FsrsCard } from './fsrsEngine';
import {
  getTodayIsoDate,
  type VocabNotificationConfig,
  type VocabNotificationLogItem,
} from '../storage/db';

export interface VocabQuizChoice {
  cardId: string;
  meaningVi: string;
  isCorrect: boolean;
}

export function isWithinQuietHours(config: VocabNotificationConfig, now = Date.now()): boolean {
  const hour = new Date(now).getHours();
  const start = config.quietStartHour;
  const end = config.quietEndHour;
  if (start === end) return false;
  if (start > end) {
    // Overnight window, e.g., 22:00 -> 07:00
    return hour >= start || hour < end;
  }
  return hour >= start && hour < end;
}

export function countNotificationsToday(
  history: VocabNotificationLogItem[],
  now = Date.now()
): number {
  const today = getTodayIsoDate(now);
  return history.filter((item) => getTodayIsoDate(item.notifiedAt) === today).length;
}

/**
 * Selects the optimal next card to push in a vocabulary notification.
 */
export function pickNextNotificationCard(
  cards: FsrsCard[],
  config: VocabNotificationConfig,
  history: VocabNotificationLogItem[],
  now = Date.now()
): FsrsCard | null {
  if (cards.length === 0) return null;

  const deckPool =
    config.deckFilter && config.deckFilter !== 'All'
      ? cards.filter((c) => c.deck === config.deckFilter)
      : cards;
  const basePool = deckPool.length > 0 ? deckPool : cards;

  let candidates: FsrsCard[] = [];
  if (config.source === 'due') {
    candidates = basePool.filter((c) => c.state !== 'new' && c.due <= now);
    if (candidates.length === 0) {
      candidates = basePool.filter((c) => c.state === 'new' || c.due <= now + 86_400_000);
    }
  } else if (config.source === 'new') {
    candidates = basePool.filter((c) => c.state === 'new');
  } else if (config.source === 'weak') {
    candidates = basePool.filter((c) => c.lapses > 0 || c.difficulty >= 6.0 || c.state === 'relearning');
  } else {
    candidates = basePool;
  }

  if (candidates.length === 0) {
    candidates = basePool;
  }

  // Avoid immediately repeating the last 4 pushed words if alternatives exist
  const recentIds = new Set(history.slice(0, 4).map((h) => h.cardId));
  const fresh = candidates.filter((c) => !recentIds.has(c.id));
  const finalPool = fresh.length > 0 ? fresh : candidates;

  // Sort by lowest current retrievability (most likely to be forgotten soon), then overdue time
  const sorted = [...finalPool].sort((a, b) => {
    const rA =
      a.state === 'new'
        ? 0.5
        : computeRetrievability(a.lastReview ? (now - a.lastReview) / 86_400_000 : 0, a.stability);
    const rB =
      b.state === 'new'
        ? 0.5
        : computeRetrievability(b.lastReview ? (now - b.lastReview) / 86_400_000 : 0, b.stability);
    if (Math.abs(rA - rB) > 0.03) return rA - rB;
    return a.due - b.due;
  });

  return sorted[0] ?? null;
}

/**
 * Generates 4 multiple-choice Vietnamese meanings (1 correct + 3 plausible distractors)
 * for interactive micro-learning notifications & Vocab Quiz Sprint.
 */
export function buildVocabQuizChoices(
  target: FsrsCard,
  allCards: FsrsCard[]
): VocabQuizChoice[] {
  const distractors: FsrsCard[] = [];
  const usedMeanings = new Set<string>([target.meaningVi.trim().toLowerCase()]);

  // Prefer same CEFR or same deck distractors for higher pedagogical quality
  const rankedPool = [...allCards]
    .filter((c) => c.id !== target.id)
    .sort((a, b) => {
      const scoreA = (a.deck === target.deck ? 2 : 0) + (a.cefr === target.cefr ? 1 : 0);
      const scoreB = (b.deck === target.deck ? 2 : 0) + (b.cefr === target.cefr ? 1 : 0);
      return scoreB - scoreA;
    });

  // Deterministic pseudo-shuffle seeded by target word length + char codes so UI doesn't jitter on re-render
  const seed = target.word.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const rotated = rankedPool.length > 0
    ? [...rankedPool.slice(seed % rankedPool.length), ...rankedPool.slice(0, seed % rankedPool.length)]
    : [];

  for (const cand of rotated) {
    const norm = cand.meaningVi.trim().toLowerCase();
    if (!usedMeanings.has(norm)) {
      usedMeanings.add(norm);
      distractors.push(cand);
      if (distractors.length === 3) break;
    }
  }

  const fallbackMeanings = [
    'Sự trì hoãn tạm thời trong tiến độ xử lý',
    'Khả năng thích ứng linh hoạt với hoàn cảnh mới',
    'Mối liên hệ mật thiết giữa các yếu tố cốt lõi',
  ];
  while (distractors.length < 3) {
    const fb = fallbackMeanings[distractors.length] ?? 'Nghĩa tham khảo khác';
    distractors.push({
      ...target,
      id: `fallback-${distractors.length}`,
      meaningVi: fb,
    });
  }

  const rawChoices: VocabQuizChoice[] = [
    { cardId: target.id, meaningVi: target.meaningVi, isCorrect: true },
    ...distractors.map((d) => ({ cardId: d.id, meaningVi: d.meaningVi, isCorrect: false })),
  ];

  // Deterministic placement of the correct option among indices 0..3
  const targetSlot = seed % 4;
  const swapped = [...rawChoices];
  const temp = swapped[targetSlot];
  swapped[targetSlot] = swapped[0];
  swapped[0] = temp;
  return swapped;
}
