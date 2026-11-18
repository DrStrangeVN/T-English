/**
 * FSRS v5 (Free Spaced Repetition Scheduler) Core Engine
 * Implements Stability (S), Difficulty (D), Retrievability (R),
 * and optimal interval scheduling with configurable desired retention.
 */

export type FsrsRating = 1 | 2 | 3 | 4; // 1: Again, 2: Hard, 3: Good, 4: Easy
export type CardState = 'new' | 'learning' | 'review' | 'relearning';

export interface FsrsCard {
  id: string;
  word: string;
  ipa: string;
  pos: string;
  meaningVi: string;
  meaningEn: string;
  clozeSentence: string;
  clozeAnswer: string;
  translationVi: string;
  wordFamily: string[];
  collocations: string[];
  nuance: string;
  mnemonic: string;
  deck: string;
  cefr: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  sourceTitle?: string;
  state: CardState;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  lastReview: number | null;
  due: number;
}

export interface SchedulingPreview {
  rating: FsrsRating;
  label: 'Again' | 'Hard' | 'Good' | 'Easy';
  intervalLabel: string;
  nextCard: FsrsCard;
}

export interface ForecastPoint {
  dayOffset: number;
  dateLabel: string;
  dueCount: number;
  avgRetention: number;
}

// Standard FSRS v5 19-parameter default weights
export const FSRS_V5_WEIGHTS: readonly number[] = [
  0.40255, 1.18385, 3.173, 15.69105,
  7.1949, 0.5345, 1.4604, 0.0046,
  1.54575, 0.1192, 1.01925, 1.9395,
  0.11, 0.29605, 2.2698, 0.2315,
  2.9898, 0.51655, 0.6621,
];

const DECAY = -0.5;
const FACTOR = 19 / 81; // Ensures R(S, S) = 0.9
const MS_PER_DAY = 86_400_000;

export function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

/**
 * Retrievability R(t, S) = (1 + FACTOR * t / S) ^ DECAY
 */
export function computeRetrievability(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 0;
  const t = Math.max(0, elapsedDays);
  return Math.pow(1 + (FACTOR * t) / stability, DECAY);
}

/**
 * Optimal interval in days to hit target retention R_d
 */
export function nextInterval(stability: number, desiredRetention = 0.9, maximumInterval = 36500): number {
  const r = clamp(desiredRetention, 0.7, 0.99);
  const raw = (stability / FACTOR) * (Math.pow(r, 1 / DECAY) - 1);
  return clamp(Math.round(raw), 1, maximumInterval);
}

function initStability(rating: FsrsRating, w = FSRS_V5_WEIGHTS): number {
  return Math.max(0.1, w[rating - 1]);
}

function initDifficulty(rating: FsrsRating, w = FSRS_V5_WEIGHTS): number {
  const d = w[4] - Math.exp(w[5] * (rating - 1)) + 1;
  return clamp(d, 1, 10);
}

function meanReversion(initD: number, currentD: number, w = FSRS_V5_WEIGHTS): number {
  return w[7] * initD + (1 - w[7]) * currentD;
}

function nextDifficulty(d: number, rating: FsrsRating, w = FSRS_V5_WEIGHTS): number {
  const deltaD = -w[6] * (rating - 3);
  const nextD = d + deltaD * ((10 - d) / 9);
  return clamp(meanReversion(initDifficulty(4, w), nextD, w), 1, 10);
}

function nextRecallStability(
  d: number,
  s: number,
  r: number,
  rating: FsrsRating,
  w = FSRS_V5_WEIGHTS
): number {
  const hardPenalty = rating === 2 ? w[15] : 1;
  const easyBonus = rating === 4 ? w[16] : 1;
  const gain =
    Math.exp(w[8]) *
    (11 - d) *
    Math.pow(s, -w[9]) *
    (Math.exp((1 - r) * w[10]) - 1) *
    hardPenalty *
    easyBonus;
  return Math.max(0.1, s * (1 + gain));
}

function nextForgetStability(d: number, s: number, r: number, w = FSRS_V5_WEIGHTS): number {
  const sMin =
    w[11] *
    Math.pow(d, -w[12]) *
    (Math.pow(s + 1, w[13]) - 1) *
    Math.exp((1 - r) * w[14]);
  return Math.max(0.1, Math.min(s, sMin));
}

export function formatIntervalLabel(days: number, minutesFallback?: number): string {
  if (minutesFallback !== undefined && days < 1) {
    return `${minutesFallback}m`;
  }
  if (days < 1) return '<1d';
  if (days < 30) return `${days}d`;
  if (days < 365) return `${(days / 30).toFixed(1).replace(/\.0$/, '')}mo`;
  return `${(days / 365).toFixed(1).replace(/\.0$/, '')}yr`;
}

/**
 * Schedules a single FSRS v5 review transition for a card.
 */
export function scheduleCard(
  card: FsrsCard,
  rating: FsrsRating,
  now = Date.now(),
  desiredRetention = 0.9
): FsrsCard {
  const elapsedDays =
    card.lastReview !== null ? Math.max(0, (now - card.lastReview) / MS_PER_DAY) : 0;

  let nextS: number;
  let nextD: number;
  let nextState: CardState;
  let lapses = card.lapses;
  let scheduledDays: number;
  let due: number;

  if (card.state === 'new') {
    nextS = initStability(rating);
    nextD = initDifficulty(rating);
    if (rating === 1) {
      nextState = 'learning';
      scheduledDays = 0;
      due = now + 5 * 60_000;
      lapses += 1;
    } else if (rating === 2) {
      nextState = 'learning';
      scheduledDays = 0;
      due = now + 10 * 60_000;
    } else if (rating === 3) {
      nextState = 'review';
      scheduledDays = nextInterval(nextS, desiredRetention);
      due = now + scheduledDays * MS_PER_DAY;
    } else {
      nextState = 'review';
      scheduledDays = Math.max(4, nextInterval(nextS, desiredRetention));
      due = now + scheduledDays * MS_PER_DAY;
    }
  } else {
    const r = computeRetrievability(elapsedDays, card.stability);
    nextD = nextDifficulty(card.difficulty, rating);

    if (rating === 1) {
      nextS = nextForgetStability(card.difficulty, card.stability, r);
      nextState = 'relearning';
      lapses += 1;
      scheduledDays = 0;
      due = now + 10 * 60_000;
    } else {
      nextS = nextRecallStability(card.difficulty, card.stability, r, rating);
      nextState = 'review';
      scheduledDays = nextInterval(nextS, desiredRetention);
      if (rating === 2) {
        scheduledDays = Math.max(1, Math.min(scheduledDays, Math.round(card.scheduledDays * 1.2) || 1));
      } else if (rating === 4) {
        scheduledDays = Math.max(scheduledDays + 1, Math.round(scheduledDays * 1.25));
      }
      due = now + scheduledDays * MS_PER_DAY;
    }
  }

  return {
    ...card,
    state: nextState,
    stability: Number(nextS.toFixed(4)),
    difficulty: Number(nextD.toFixed(4)),
    elapsedDays: Number(elapsedDays.toFixed(2)),
    scheduledDays,
    reps: card.reps + 1,
    lapses,
    lastReview: now,
    due,
  };
}

/**
 * Generates all 4 rating previews (Again, Hard, Good, Easy) for a flashcard.
 */
export function getSchedulingOptions(
  card: FsrsCard,
  now = Date.now(),
  desiredRetention = 0.9
): SchedulingPreview[] {
  const labels: Record<FsrsRating, SchedulingPreview['label']> = {
    1: 'Again',
    2: 'Hard',
    3: 'Good',
    4: 'Easy',
  };

  return ([1, 2, 3, 4] as FsrsRating[]).map((rating) => {
    const nextCard = scheduleCard(card, rating, now, desiredRetention);
    const diffMinutes = Math.max(1, Math.round((nextCard.due - now) / 60_000));
    const intervalLabel =
      nextCard.scheduledDays === 0
        ? formatIntervalLabel(0, diffMinutes)
        : formatIntervalLabel(nextCard.scheduledDays);
    return {
      rating,
      label: labels[rating],
      intervalLabel,
      nextCard,
    };
  });
}

/**
 * Forecasts 30-day review workload and average deck retrievability.
 */
export function forecastWorkload(cards: FsrsCard[], days = 30, now = Date.now()): ForecastPoint[] {
  const points: ForecastPoint[] = [];
  for (let d = 0; d < days; d++) {
    const dayStart = now + d * MS_PER_DAY;
    const dayEnd = dayStart + MS_PER_DAY;
    let dueCount = 0;
    let rSum = 0;
    let rCount = 0;

    for (const c of cards) {
      if (c.state === 'new') {
        if (d === 0) dueCount += 1;
        continue;
      }
      if (d === 0 && c.due <= dayEnd) {
        dueCount += 1;
      } else if (d > 0 && c.due >= dayStart && c.due < dayEnd) {
        dueCount += 1;
      }
      const elapsed = Math.max(0, (dayStart - (c.lastReview ?? now)) / MS_PER_DAY);
      rSum += computeRetrievability(elapsed, c.stability);
      rCount += 1;
    }

    const dt = new Date(dayStart);
    points.push({
      dayOffset: d,
      dateLabel: `${dt.getDate()}/${dt.getMonth() + 1}`,
      dueCount,
      avgRetention: rCount > 0 ? Math.round((rSum / rCount) * 1000) / 10 : 94.0,
    });
  }
  return points;
}

/**
 * Exports selected or all FSRS cards to Anki-compatible TSV/CSV format.
 */
export function exportCardsToAnkiCsv(cards: FsrsCard[]): string {
  const escape = (val: string) => `"${val.replace(/"/g, '""')}"`;
  const header = ['Word', 'IPA', 'POS', 'Meaning_VI', 'Meaning_EN', 'Cloze', 'Collocations', 'Mnemonic', 'Deck', 'CEFR'];
  const rows = cards.map((c) =>
    [
      escape(c.word),
      escape(c.ipa),
      escape(c.pos),
      escape(c.meaningVi),
      escape(c.meaningEn),
      escape(c.clozeSentence),
      escape(c.collocations.join('; ')),
      escape(c.mnemonic),
      escape(c.deck),
      escape(c.cefr),
    ].join(',')
  );
  return [header.join(','), ...rows].join('\n');
}
