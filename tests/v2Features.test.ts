import { describe, expect, it } from 'vitest';
import { evaluateWriting } from '../src/core/ai/writingEvaluator';
import { WRITING_PROMPTS } from '../src/data/writingPrompts';
import { searchLudwigCorpus } from '../src/data/ludwigCorpus';
import { WORD_ROOTS_DATA } from '../src/data/wordRoots';
import { MINIMAL_PAIRS_DATA } from '../src/data/minimalPairs';
import {
  CURRICULUM_UNITS,
  evaluatePlacementScore,
  PLACEMENT_TEST_QUESTIONS,
} from '../src/data/curriculumData';
import { INITIAL_FSRS_CARDS, QWERTY_DICTIONARY_PACKS } from '../src/data/dictionaries';
import { READER_ARTICLES } from '../src/data/readerArticles';
import { ROLEPLAY_SCENARIOS } from '../src/data/roleplayScenarios';
import { SHADOWING_TRACKS } from '../src/data/shadowingMedia';

describe('T-English v2.0 Expanded Engines & Curricula', () => {
  it('evaluates IELTS writing across 4 criteria and flags inline diffs', () => {
    const prompt = WRITING_PROMPTS[0];
    const weakDraft =
      'I am agree that AI is very good and we should discuss about this problem. In the other hand, teachers are very important.';
    const weakEval = evaluateWriting(weakDraft, prompt);

    expect(weakEval.inlineDiffs.length).toBeGreaterThanOrEqual(4);
    expect(weakEval.inlineDiffs.some((d) => d.originalSpan.toLowerCase() === 'i am agree')).toBe(true);
    expect(weakEval.inlineDiffs.some((d) => d.originalSpan.toLowerCase() === 'discuss about')).toBe(true);

    const band85Eval = evaluateWriting(prompt.modelBand85 + ' ' + prompt.modelBand85, prompt);
    expect(band85Eval.overallBand).toBeGreaterThan(weakEval.overallBand);
    expect(band85Eval.taskResponse).toBeGreaterThanOrEqual(6.5);
  });

  it('supports Ludwig.guru wildcard (*) and comparison (vs) queries', () => {
    const wildcardHits = searchLudwigCorpus('mitigate * risk');
    expect(wildcardHits.length).toBeGreaterThanOrEqual(1);
    expect(wildcardHits[0].preferredPhrase).toContain('mitigate');

    const vsHits = searchLudwigCorpus('depend on vs depend of');
    expect(vsHits.length).toBeGreaterThanOrEqual(1);
    expect(vsHits[0].preferredFreqPct).toBe(99);
  });

  it('evaluates CEFR placement test scores accurately across A1-C2', () => {
    expect(PLACEMENT_TEST_QUESTIONS.length).toBe(12);
    expect(CURRICULUM_UNITS.length).toBe(6);

    expect(evaluatePlacementScore(11, 12).cefr).toBe('C2');
    expect(evaluatePlacementScore(9, 12).cefr).toBe('C1');
    expect(evaluatePlacementScore(7, 12).cefr).toBe('B2');
    expect(evaluatePlacementScore(2, 12).cefr).toBe('A1');
  });

  it('contains rich v2.0 datasets across Membean roots, Minimal Pairs, FSRS, Qwerty, Engoo Reader, and Roleplay', () => {
    expect(WORD_ROOTS_DATA.length).toBe(12);
    expect(WORD_ROOTS_DATA.every((r) => r.derivatives.length >= 6)).toBe(true);
    expect(MINIMAL_PAIRS_DATA.length).toBe(12);
    expect(WRITING_PROMPTS.length).toBe(12);
    expect(INITIAL_FSRS_CARDS.length).toBe(24);
    expect(QWERTY_DICTIONARY_PACKS.length).toBe(6);
    expect(READER_ARTICLES.length).toBe(4);
    expect(ROLEPLAY_SCENARIOS.length).toBe(8);
    expect(ROLEPLAY_SCENARIOS.every((s) => s.missions.length === 3)).toBe(true);
    expect(SHADOWING_TRACKS.length).toBe(8);
  });
});
