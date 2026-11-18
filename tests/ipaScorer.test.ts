import { describe, expect, it } from 'vitest';
import {
  estimatePitchHz,
  evaluatePronunciation,
  IPA_44_PHONEMES,
  tokenizeIpa,
  wordToIpa,
} from '../src/core/phonetics/ipaScorer';

describe('IPA Phonetics & Pronunciation Scorer', () => {
  it('provides all 44 standard English IPA phonemes with Vietnamese coaching', () => {
    expect(IPA_44_PHONEMES.length).toBe(44);
    const th = IPA_44_PHONEMES.find((p) => p.symbol === 'θ');
    expect(th).toBeDefined();
    expect(th?.tipVi.length).toBeGreaterThan(10);
  });

  it('transcribes known and unseen English words into IPA tokens', () => {
    expect(wordToIpa('architecture')).toContain('ɑːr');
    const tokens = tokenizeIpa(wordToIpa('think'));
    expect(tokens[0]).toBe('θ');
  });

  it('scores exact pronunciation highly and flags mispronounced phonemes', () => {
    const perfect = evaluatePronunciation(
      'We think this architecture is resilient',
      'We think this architecture is resilient'
    );
    expect(perfect.overallScore).toBeGreaterThanOrEqual(90);
    expect(perfect.weakPhonemes).toHaveLength(0);

    const mispronounced = evaluatePronunciation(
      'We think this architecture is resilient',
      'We sink dis arkitex is resilien'
    );
    expect(mispronounced.overallScore).toBeLessThan(perfect.overallScore);
    expect(mispronounced.weakPhonemes.length).toBeGreaterThan(0);
    expect(mispronounced.pitchNative).toHaveLength(24);
    expect(mispronounced.pitchUser).toHaveLength(24);
  });

  it('estimates F0 pitch accurately from synthetic sine wave PCM samples', () => {
    const sampleRate = 16000;
    const freq = 160; // Typical human voice F0
    const buf = new Float32Array(1024);
    for (let i = 0; i < buf.length; i++) {
      buf[i] = 0.5 * Math.sin((2 * Math.PI * freq * i) / sampleRate);
    }
    const detected = estimatePitchHz(buf, sampleRate);
    expect(detected).not.toBeNull();
    expect(Math.abs((detected ?? 0) - freq)).toBeLessThanOrEqual(5);
  });
});
