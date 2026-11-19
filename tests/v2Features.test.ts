import { afterEach, describe, expect, it, vi } from 'vitest';
import { evaluateWriting, evaluateWritingWithAI } from '../src/core/ai/writingEvaluator';
import { generateTutorReply } from '../src/core/ai/tutorService';
import { startSpeechCapture } from '../src/core/phonetics/speechIO';
import { createDefaultState, exportStateBackup, importStateBackup } from '../src/core/storage/db';
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
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('returns Band 0 on empty writing and caps short drafts below 4.5', () => {
    const prompt = WRITING_PROMPTS[0];
    const emptyEval = evaluateWriting('   ', prompt);
    expect(emptyEval.overallBand).toBe(0);
    expect(emptyEval.taskResponse).toBe(0);
    expect(emptyEval.coherenceCohesion).toBe(0);
    expect(emptyEval.lexicalResource).toBe(0);
    expect(emptyEval.grammaticalRange).toBe(0);

    const shortEval = evaluateWriting('Short draft with few words.', prompt);
    expect(shortEval.overallBand).toBeLessThanOrEqual(4.5);
  });

  it('evaluates IELTS writing across 4 criteria and flags inline diffs', () => {
    const prompt = WRITING_PROMPTS[0];
    const weakDraft =
      'I am agree that AI is very good and we should discuss about this problem. In the other hand, teachers are very important because students need human empathy.';
    const weakEval = evaluateWriting(weakDraft, prompt);

    expect(weakEval.inlineDiffs.length).toBeGreaterThanOrEqual(4);
    expect(weakEval.inlineDiffs.some((d) => d.originalSpan.toLowerCase() === 'i am agree')).toBe(true);
    expect(weakEval.inlineDiffs.some((d) => d.originalSpan.toLowerCase() === 'discuss about')).toBe(true);

    const band85Eval = evaluateWriting(prompt.modelBand85 + ' ' + prompt.modelBand85, prompt);
    expect(band85Eval.overallBand).toBeGreaterThan(weakEval.overallBand);
    expect(band85Eval.taskResponse).toBeGreaterThanOrEqual(6.5);
  });

  it('handles live AI writing grading, HTTP 401 fallback, and Gemini x-goog-api-key header', async () => {
    const prompt = WRITING_PROMPTS[0];
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    overallBand: 7.5,
                    taskResponse: 7.5,
                    coherenceCohesion: 7.5,
                    lexicalResource: 7.5,
                    grammaticalRange: 7.5,
                    coachSummaryVi: 'Bài viết mạch lạc, lập luận rõ ràng.',
                  }),
                },
              ],
            },
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const liveRes = await evaluateWritingWithAI(prompt.modelBand85, prompt, {
      provider: 'gemini',
      apiKey: 'AIza-test-secret',
      model: 'gemini-2.0-flash',
      ollamaUrl: '',
    });

    expect(liveRes.source).toBe('live');
    expect(liveRes.overallBand).toBe(7.5);
    const [calledUrl, init] = fetchMock.mock.calls[0];
    expect(String(calledUrl)).not.toContain('AIza-test-secret');
    expect((init as RequestInit).headers).toMatchObject({ 'x-goog-api-key': 'AIza-test-secret' });

    const failMock = vi.fn().mockResolvedValueOnce({ ok: false, status: 401 });
    vi.stubGlobal('fetch', failMock);
    const fallbackRes = await evaluateWritingWithAI(prompt.modelBand85, prompt, {
      provider: 'openai',
      apiKey: 'sk-bad',
      model: 'gpt-4o-mini',
      ollamaUrl: '',
    });
    expect(fallbackRes.source).toBe('builtin');
    expect(fallbackRes.fallbackReason).toContain('OpenAI HTTP 401');
  });

  it('passes conversation history and detects mistakes in AI Tutor service', async () => {
    const scenario = ROLEPLAY_SCENARIOS[0];
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                aiText: 'Thanks! Let us address that bottleneck next.',
                aiTextVi: 'Cảm ơn bạn! Hãy xử lý nút thắt đó tiếp theo.',
                corrected: 'We should discuss this incident now.',
                c1Upgrade: 'We ought to scrutinize the root cause immediately.',
                explainVi: 'Bỏ about sau discuss.',
              }),
            },
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const liveReply = await generateTutorReply({
      scenarioTitle: scenario.title,
      scenarioPrompt: scenario.openingLine,
      userText: 'I want to discuss about this issue.',
      history: [{ sender: 'ai', text: 'Welcome to the war room.' }],
      memoryLedger: [],
      config: { provider: 'openai', apiKey: 'sk-live', model: 'gpt-4o-mini', ollamaUrl: '' },
    });

    expect(liveReply.source).toBe('live');
    const body = JSON.parse(String(fetchMock.mock.calls[0][1].body));
    expect(body.messages.some((m: { content: string }) => m.content === 'Welcome to the war room.')).toBe(true);
    expect(liveReply.correction.detectedMistakePattern).toBe('discuss about -> discuss');

    const offlineReply = await generateTutorReply({
      scenarioTitle: scenario.title,
      scenarioPrompt: scenario.openingLine,
      userText: 'Actually, I am agree with the proposed rollout.',
      memoryLedger: [],
      config: { provider: 'builtin', apiKey: '', model: '', ollamaUrl: '' },
    });
    expect(offlineReply.source).toBe('fallback');
    expect(offlineReply.correction.detectedMistakePattern).toBe('I am agree -> I agree');
  });

  it('sanitizes secrets on backup export and validates backup JSON on import', () => {
    const state = createDefaultState();
    state.settings.aiConfig.provider = 'openai';
    state.settings.aiConfig.apiKey = 'sk-should-not-leak';

    const backupJson = exportStateBackup(state, false);
    expect(backupJson).not.toContain('sk-should-not-leak');

    const restored = importStateBackup(backupJson);
    expect(restored.cards.length).toBe(state.cards.length);
    expect(restored.settings.aiConfig.apiKey).toBe('');

    expect(() => importStateBackup('{"invalid":true}')).toThrow();
  });

  it('delivers speech recognition final transcript exactly once (idempotency guard)', () => {
    let instance: {
      lang: string;
      interimResults: boolean;
      continuous: boolean;
      onresult: (ev: { results: Array<{ 0: { transcript: string }; isFinal: boolean }> }) => void;
      onend: () => void;
      start: () => void;
      stop: () => void;
    } | null = null;

    class MockSpeechRecognition {
      lang = '';
      interimResults = false;
      continuous = false;
      onresult = () => {};
      onerror = () => {};
      onend = () => {};
      start() {
        instance = this;
      }
      stop() {}
    }

    vi.stubGlobal('window', { SpeechRecognition: MockSpeechRecognition });
    const onFinal = vi.fn();

    startSpeechCapture({ onFinal });
    expect(instance).not.toBeNull();
    instance!.onresult({
      results: [{ 0: { transcript: 'three thousand' }, isFinal: true }],
    });
    instance!.onend();
    expect(onFinal).toHaveBeenCalledTimes(1);
    expect(onFinal).toHaveBeenCalledWith('three thousand');
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

  it('contains rich v2.0 datasets and clean Membean word root translations', () => {
    expect(WORD_ROOTS_DATA.length).toBe(12);
    expect(WORD_ROOTS_DATA.every((r) => r.derivatives.length >= 6)).toBe(true);
    const versatileEntry = WORD_ROOTS_DATA.flatMap((r) => r.derivatives).find((d) => d.word === 'versatile');
    expect(versatileEntry?.meaningVi).toContain('đa năng');
    expect(
      WORD_ROOTS_DATA.flatMap((r) => r.derivatives).some((d) =>
        d.meaningVi.toLowerCase().includes('ubiquitous')
      )
    ).toBe(false);
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
