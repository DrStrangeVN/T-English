import React, { useEffect, useState } from 'react';
import type { FsrsCard } from '../../core/fsrs/fsrsEngine';
import { speakBilingual, speakEnglish, stopSpeaking } from '../../core/phonetics/speechIO';
import { IconClock, IconHeadphones, IconPlay, IconRepeat, IconVolume } from '../icons/Icons';

interface FloatingMiniDockProps {
  cards: FsrsCard[];
  onAddStudyMinutes: (mins: number) => void;
  onShowToast: (msg: string) => void;
}

export const FloatingMiniDock: React.FC<FloatingMiniDockProps> = ({
  cards,
  onAddStudyMinutes,
  onShowToast,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [audioLooping, setAudioLooping] = useState(false);
  const [bilingualLoop, setBilingualLoop] = useState(true);
  const [loopIndex, setLoopIndex] = useState(0);

  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setTimerRunning(false);
          onAddStudyMinutes(25);
          onShowToast('Hoàn thành phiên Pomodoro 25 phút (+25m & +250 XP)');
          return 25 * 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning, onAddStudyMinutes, onShowToast]);

  useEffect(() => {
    if (!audioLooping || cards.length === 0) return;
    const card = cards[loopIndex % cards.length];
    let cancelled = false;

    const cleanSentence = card.clozeSentence.replace(/\{\{|\}\}/g, '');
    const scheduleNext = () => {
      if (!cancelled) {
        window.setTimeout(() => {
          if (!cancelled) setLoopIndex((i) => (i + 1) % cards.length);
        }, 900);
      }
    };

    if (bilingualLoop) {
      speakBilingual(`${card.word}. ${cleanSentence}`, card.meaningVi, {
        rate: 0.94,
        onEnd: scheduleNext,
      });
    } else {
      speakEnglish(`${card.word}. ${cleanSentence}`, {
        rate: 0.94,
        onEnd: scheduleNext,
      });
    }

    return () => {
      cancelled = true;
      stopSpeaking();
    };
  }, [audioLooping, bilingualLoop, loopIndex, cards]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');
  const currentCard = cards[loopIndex % Math.max(1, cards.length)];

  return (
    <div className="floating-mini-dock hide-mobile">
      <button
        type="button"
        className={`gb sm ${timerRunning ? 'hl' : ''}`}
        onClick={() => setTimerRunning((r) => !r)}
        title="Bật/tắt đồng hồ tập trung Pomodoro 25 phút"
      >
        <IconClock size={12} />
        <span className="mono">{mm}:{ss}</span>
      </button>

      <div style={{ width: 1, height: 16, background: 'var(--line)' }} />

      <button
        type="button"
        className={`gb sm ${audioLooping ? 'hl' : ''}`}
        onClick={() => {
          if (audioLooping) stopSpeaking();
          setAudioLooping((v) => !v);
        }}
        title="Nghe lặp thụ động từ vựng FSRS"
      >
        {audioLooping ? <IconRepeat size={12} /> : <IconPlay size={12} />}
        <span>{audioLooping && currentCard ? currentCard.word : 'Audio Loop'}</span>
      </button>

      <button
        type="button"
        className={`ib sm ${bilingualLoop ? 'active' : ''}`}
        onClick={() => setBilingualLoop((v) => !v)}
        title={bilingualLoop ? 'Đang bật Podcast song ngữ (EN + VieNeu VI)' : 'Đang phát chỉ tiếng Anh'}
        aria-label="Bật tắt phát lặp song ngữ"
      >
        <IconHeadphones size={13} />
      </button>

      {currentCard && (
        <button
          type="button"
          className="ib sm"
          onClick={() => speakEnglish(currentCard.word)}
          title="Đọc từ hiện tại"
        >
          <IconVolume size={13} />
        </button>
      )}
    </div>
  );
};
