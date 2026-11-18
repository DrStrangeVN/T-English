import { describe, expect, it } from 'vitest';
import {
  analyzeSentenceSyntax,
  analyzeUtteranceLocally,
  generateTutorReply,
} from '../src/core/ai/tutorService';

describe('AI Tutor & Linguistic Engine', () => {
  it('detects common Vietnamese-English grammar mistakes and upgrades to C1', () => {
    const res = analyzeUtteranceLocally('I am agree we should discuss about this very important problem');
    expect(res.corrected).toContain('I agree');
    expect(res.corrected).not.toContain('discuss about');
    expect(res.c1Upgrade.toLowerCase()).toContain('paramount');
    expect(res.c1Upgrade.toLowerCase()).toContain('bottleneck');
    expect(res.highlightedIssues.some((s) => s.isError)).toBe(true);
  });

  it('generates contextual tutor replies and triggers long-term memory ledger', async () => {
    const reply = await generateTutorReply({
      scenarioTitle: 'System Design Interview',
      scenarioPrompt: 'Staff Engineer Interviewer',
      userText: 'We need low latency cache for scalability',
      memoryLedger: [
        {
          id: 'm1',
          mistakePattern: 'discuss about',
          targetVocab: 'bottleneck',
          userGoal: 'System Design',
          lastPracticedAt: Date.now(),
          resolved: false,
        },
      ],
      config: {
        provider: 'builtin',
        apiKey: '',
        model: 'gpt-4o-mini',
        ollamaUrl: 'http://localhost:11434',
      },
    });

    expect(reply.aiText).toContain('bottleneck');
    expect(reply.memoryTriggered).toBe('bottleneck');
  });

  it('splits complex sentences in Grammar X-Ray', () => {
    const clauses = analyzeSentenceSyntax(
      'Although cloud models remain ubiquitous, hybrid pipelines remove the biggest bottleneck.'
    );
    expect(clauses.length).toBeGreaterThanOrEqual(1);
    expect(clauses.some((c) => c.role.includes('Adverbial'))).toBe(true);
  });
});
