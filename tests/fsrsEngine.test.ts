import { describe, expect, it } from 'vitest';
import {
  computeRetrievability,
  exportCardsToAnkiCsv,
  forecastWorkload,
  getSchedulingOptions,
  nextInterval,
  scheduleCard,
  type FsrsCard,
} from '../src/core/fsrs/fsrsEngine';

const sampleCard: FsrsCard = {
  id: 'test-1',
  word: 'resilient',
  ipa: '/rɪˈzɪl.i.ənt/',
  pos: 'adj',
  meaningVi: 'kiên cường',
  meaningEn: 'able to recover quickly',
  clozeSentence: 'We build {{resilient}} systems.',
  clozeAnswer: 'resilient',
  translationVi: 'Chúng tôi xây dựng hệ thống chịu lỗi tốt.',
  wordFamily: ['resilience'],
  collocations: ['resilient architecture'],
  nuance: 'Strong recovery',
  mnemonic: 're- + silire',
  deck: 'Tech',
  cefr: 'C1',
  state: 'new',
  stability: 0,
  difficulty: 0,
  elapsedDays: 0,
  scheduledDays: 0,
  reps: 0,
  lapses: 0,
  lastReview: null,
  due: 0,
};

describe('FSRS v5 Engine', () => {
  it('computes retrievability R(S, S) = 0.9 accurately', () => {
    expect(computeRetrievability(10, 10)).toBeCloseTo(0.9, 5);
    expect(computeRetrievability(0, 10)).toBeCloseTo(1, 5);
    expect(computeRetrievability(20, 10)).toBeLessThan(0.9);
  });

  it('computes optimal interval matching desired retention', () => {
    expect(nextInterval(10, 0.9)).toBe(10);
    expect(nextInterval(10, 0.95)).toBeLessThan(10);
    expect(nextInterval(10, 0.85)).toBeGreaterThan(10);
  });

  it('schedules new cards across all 4 ratings with increasing stability', () => {
    const now = 1_700_000_000_000;
    const options = getSchedulingOptions(sampleCard, now, 0.9);
    expect(options).toHaveLength(4);

    const again = options[0].nextCard;
    const hard = options[1].nextCard;
    const good = options[2].nextCard;
    const easy = options[3].nextCard;

    expect(again.state).toBe('learning');
    expect(again.lapses).toBe(1);
    expect(hard.stability).toBeGreaterThan(again.stability);
    expect(good.stability).toBeGreaterThan(hard.stability);
    expect(easy.stability).toBeGreaterThan(good.stability);
    expect(easy.scheduledDays).toBeGreaterThanOrEqual(good.scheduledDays);
  });

  it('increases stability on successful subsequent recall and drops on lapse', () => {
    const t0 = 1_700_000_000_000;
    const afterGood = scheduleCard(sampleCard, 3, t0, 0.9);
    const t1 = afterGood.due;
    const afterSecondGood = scheduleCard(afterGood, 3, t1, 0.9);
    expect(afterSecondGood.stability).toBeGreaterThan(afterGood.stability);

    const afterLapse = scheduleCard(afterSecondGood, 1, t1 + 86_400_000, 0.9);
    expect(afterLapse.state).toBe('relearning');
    expect(afterLapse.lapses).toBe(1);
    expect(afterLapse.stability).toBeLessThan(afterSecondGood.stability);
  });

  it('forecasts workload and exports valid Anki CSV', () => {
    const now = Date.now();
    const forecast = forecastWorkload([{ ...sampleCard, due: now }], 14, now);
    expect(forecast).toHaveLength(14);
    expect(forecast[0].dueCount).toBe(1);

    const csv = exportCardsToAnkiCsv([sampleCard]);
    expect(csv).toContain('Word,IPA,POS');
    expect(csv).toContain('"resilient"');
  });
});
