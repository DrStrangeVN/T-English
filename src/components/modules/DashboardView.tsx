import React, { useMemo, useState } from 'react';
import type { NavTab } from '../../App';
import type { FsrsCard, FsrsRating } from '../../core/fsrs/fsrsEngine';
import { computeRetrievability, forecastWorkload } from '../../core/fsrs/fsrsEngine';
import { IPA_44_PHONEMES, mapScoreToIeltsBand } from '../../core/phonetics/ipaScorer';
import {
  getTodayIsoDate,
  type StudyStats,
  type VocabNotificationConfig,
} from '../../core/storage/db';
import { speakBilingual, speakEnglish } from '../../core/phonetics/speechIO';
import {
  IconBellRing,
  IconBook,
  IconCheck,
  IconCurriculum,
  IconFlame,
  IconHeadphones,
  IconPen,
  IconPlay,
  IconSparkChat,
  IconVolume,
  IconZap,
} from '../icons/Icons';

interface DashboardViewProps {
  cards: FsrsCard[];
  stats: StudyStats;
  dailyGoalMinutes: number;
  vocabNotifications?: VocabNotificationConfig;
  notificationsToday?: number;
  onNavigate: (tab: NavTab) => void;
  onToggleDailyStep: (stepId: string) => void;
  onQuickRateCard?: (cardId: string, rating: FsrsRating) => void;
  onTriggerVocabNotifyNow?: () => void;
}

function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Chào buổi sáng';
  if (h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  cards,
  stats,
  dailyGoalMinutes,
  vocabNotifications,
  notificationsToday = 0,
  onNavigate,
  onToggleDailyStep,
  onQuickRateCard,
  onTriggerVocabNotifyNow,
}) => {
  const [selectedPhoneme, setSelectedPhoneme] = useState(IPA_44_PHONEMES[30]); // /θ/
  const [flashRevealed, setFlashRevealed] = useState(false);
  const [showDeepAnalytics, setShowDeepAnalytics] = useState(false);

  const metrics = useMemo(() => {
    const now = Date.now();
    const dueCards = cards.filter((c) => c.state !== 'new' && c.due <= now);
    const newCards = cards.filter((c) => c.state === 'new');
    const learningCards = cards.filter(
      (c) => c.state === 'learning' || c.state === 'relearning' || (c.state === 'review' && c.stability < 7)
    );
    const masteredCards = cards.filter((c) => c.state === 'review' && c.stability >= 7);
    const reviewed = cards.filter((c) => c.state !== 'new' && c.stability > 0);
    const avgRet =
      reviewed.length > 0
        ? Math.round(
            (reviewed.reduce((acc, c) => {
              const elapsed = c.lastReview ? (now - c.lastReview) / 86_400_000 : 0;
              return acc + computeRetrievability(elapsed, c.stability);
            }, 0) /
              reviewed.length) *
              1000
          ) / 10
        : 94.2;

    const avgPron =
      stats.pronunciationScores.length > 0
        ? Math.round(
            stats.pronunciationScores.reduce((a, b) => a + b, 0) / stats.pronunciationScores.length
          )
        : 84;

    const sortedPhonemes = Object.entries(stats.phonemeMastery).sort((a, b) => a[1] - b[1]);
    const weakestFour = sortedPhonemes.slice(0, 4).map(([sym, pct]) => ({
      symbol: sym,
      pct,
      info: IPA_44_PHONEMES.find((p) => p.symbol === sym),
    }));

    const hoursDone = (stats.immersionMinutes / 60).toFixed(1);
    const goalPct = Math.min(100, Math.round((stats.dailyMinutesDone / Math.max(1, dailyGoalMinutes)) * 100));
    const goalTier =
      stats.dailyMinutesDone >= dailyGoalMinutes
        ? 'Hoàn thành mục tiêu'
        : stats.dailyMinutesDone >= 15
          ? 'Đạt mốc Chuẩn (15p)'
          : stats.dailyMinutesDone >= 5
            ? 'Giữ chuỗi (5p+)'
            : 'Bắt đầu mốc 5p nhẹ';

    const spotlightCard =
      dueCards[0] ?? newCards[0] ?? cards[0] ?? null;

    return {
      dueCount: dueCards.length,
      newCount: newCards.length,
      learningCount: learningCards.length,
      masteredCount: masteredCards.length,
      avgRet,
      avgPron,
      ieltsBand: mapScoreToIeltsBand(avgPron),
      weakestPhoneme: weakestFour[0] ? `/${weakestFour[0].symbol}/ (${weakestFour[0].pct}%)` : '/θ/',
      weakestFour,
      hoursDone,
      goalPct,
      goalTier,
      deckTotal: cards.length,
      knownWordsCount: Object.values(stats.wordFamiliarity).filter((lv) => lv >= 4).length,
      spotlightCard,
    };
  }, [cards, stats, dailyGoalMinutes]);

  const forecast = useMemo(() => forecastWorkload(cards, 14), [cards]);
  const maxDue = Math.max(4, ...forecast.map((f) => f.dueCount));

  const heatmapWeeks = useMemo(() => {
    const today = Date.now();
    const totalDays = 52 * 7;
    return Array.from({ length: 52 }, (_, w) =>
      Array.from({ length: 7 }, (_, d) => {
        const offsetFromToday = totalDays - 1 - (w * 7 + d);
        const dateKey = getTodayIsoDate(today - offsetFromToday * 86_400_000);
        const count = stats.dailyActivityLog[dateKey] ?? 0;
        const level = count === 0 ? 0 : count <= 1 ? 1 : count <= 3 ? 2 : 3;
        return { dateKey, count, level };
      })
    );
  }, [stats.dailyActivityLog]);

  const skillMatrix = useMemo(() => {
    const typingScore = Math.min(99, Math.max(42, Math.round((stats.typingWpmBest / 75) * 100)));
    const curriculumScore = Math.min(100, Math.max(30, Math.round((stats.completedUnitIds.length / 6) * 100)));
    const readerKnownRatio =
      Object.keys(stats.wordFamiliarity).length > 0
        ? Math.round(
            (Object.values(stats.wordFamiliarity).reduce((a, b) => a + b, 0) /
              (Object.keys(stats.wordFamiliarity).length * 5)) *
              100
          )
        : 64;
    const cefrBase = stats.cefrLevel === 'C2' ? 94 : stats.cefrLevel === 'C1' ? 86 : stats.cefrLevel === 'B2' ? 76 : 62;

    return [
      { short: 'Vocab', name: 'Từ vựng', score: Math.round(metrics.avgRet), tab: 'fsrs' as NavTab, color: 'var(--green)' },
      { short: 'Speak', name: 'Nói AI', score: cefrBase, tab: 'tutor' as NavTab, color: 'var(--cyan)' },
      { short: 'IPA', name: 'Âm IPA', score: metrics.avgPron, tab: 'shadowing' as NavTab, color: 'var(--indigo)' },
      { short: 'Read', name: 'Đọc báo', score: readerKnownRatio, tab: 'reader' as NavTab, color: 'var(--cyan)' },
      { short: 'Write', name: 'Viết IELTS', score: curriculumScore, tab: 'writing' as NavTab, color: 'var(--amber)' },
      { short: 'Listen', name: 'Nghe chép', score: typingScore, tab: 'qwerty' as NavTab, color: 'var(--green)' },
    ];
  }, [stats, metrics]);

  // Compute SVG Hexagon Radar coordinates (center 90,90 radius 64)
  const radarPolygonPoints = useMemo(() => {
    const cx = 92;
    const cy = 88;
    const maxR = 62;
    return skillMatrix
      .map((s, idx) => {
        const angle = (Math.PI * 2 * idx) / 6 - Math.PI / 2;
        const r = (Math.max(20, s.score) / 100) * maxR;
        return `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`;
      })
      .join(' ');
  }, [skillMatrix]);

  const dailySteps: Array<{
    id: string;
    title: string;
    duration: string;
    detail: string;
    targetTab: NavTab;
  }> = [
    {
      id: 'step-fsrs',
      title: 'Ôn cụm 5–10 thẻ FSRS v5 & Chơi Quiz nhanh',
      duration: '5 phút',
      detail: `${metrics.dueCount + metrics.newCount} thẻ sẵn sàng · Độ nhớ hiện tại ${metrics.avgRet}%`,
      targetTab: 'fsrs',
    },
    {
      id: 'step-ipa',
      title: 'Luyện Shadowing tự thu âm & Sửa âm yếu IPA',
      duration: '5 phút',
      detail: `Ưu tiên khẩu hình âm ${metrics.weakestPhoneme}`,
      targetTab: 'shadowing',
    },
    {
      id: 'step-shadow',
      title: 'Đọc 1 bài Engoo 5 Bước & Đào câu song ngữ',
      duration: '8 phút',
      detail: '8 bài A1–C2 kèm giọng đọc Anh bản xứ + VieNeu Việt 48kHz',
      targetTab: 'reader',
    },
    {
      id: 'step-tutor',
      title: 'Hội thoại AI Roleplay 3 Nhiệm vụ hoặc Viết IELTS',
      duration: '7 phút',
      detail: 'Phản xạ nói không áp lực với gợi ý câu trả lời thông minh',
      targetTab: 'tutor',
    },
  ];

  const totalActionable = metrics.dueCount + metrics.newCount;
  const ringCircumference = 2 * Math.PI * 36;
  const ringStroke = Math.max(8, (metrics.goalPct / 100) * ringCircumference);
  const masteredPct = Math.round((metrics.masteredCount / Math.max(1, metrics.deckTotal)) * 100);
  const learningPct = Math.round((metrics.learningCount / Math.max(1, metrics.deckTotal)) * 100);
  const newPct = Math.max(0, 100 - masteredPct - learningPct);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ROW 1: Asymmetric Fluid Hero Bento (Actionable Momentum + Interactive Micro-Flashcard) */}
      <div className="bento-hero">
        <section className="bento-card-hero">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: '1 1 280px', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span className="pill-stat cyan">CEFR {stats.cefrLevel}</span>
                <span className="pill-stat amber">
                  <IconFlame size={13} />
                  <span>{stats.streakDays} ngày liên tiếp</span>
                </span>
                <span className="pill-stat green">
                  <IconZap size={12} />
                  <span>{stats.xpTotal ?? 0} XP</span>
                </span>
              </div>

              <h2 className="hero-headline">
                {getTimeGreeting()} — sẵn sàng cho phiên học ngắn hiệu quả?
              </h2>
              <p className="hero-sub">
                Bạn có <b>{totalActionable} thẻ từ vựng</b> sẵn sàng ôn ({metrics.dueCount} đến hạn, {metrics.newCount} từ mới) và điểm phát âm đang ở mức{' '}
                <b>IELTS {metrics.ieltsBand}</b>. Chỉ cần 5 phút để giữ trọn đà học hôm nay.
              </p>
            </div>

            {/* Concentric Apple-style Daily Goal Ring */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                padding: '10px 14px',
                borderRadius: 16,
                background: 'var(--raised)',
                border: '1px solid var(--line)',
                minWidth: 126,
              }}
            >
              <div style={{ position: 'relative', width: 84, height: 84, display: 'grid', placeItems: 'center' }}>
                <svg width="84" height="84" viewBox="0 0 84 84" aria-hidden="true">
                  <circle cx="42" cy="42" r="36" fill="none" stroke="var(--track)" strokeWidth="7" />
                  <circle
                    cx="42"
                    cy="42"
                    r="36"
                    fill="none"
                    stroke={metrics.goalPct >= 100 ? 'var(--green)' : 'var(--cyan)'}
                    strokeWidth="7"
                    strokeDasharray={`${ringStroke.toFixed(1)} ${ringCircumference.toFixed(1)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 42 42)"
                  />
                </svg>
                <div style={{ position: 'absolute', textAlign: 'center' }}>
                  <div style={{ fontSize: 17, fontWeight: 750, lineHeight: 1.1 }}>{stats.dailyMinutesDone}p</div>
                  <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>/ {dailyGoalMinutes}p</div>
                </div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 620, color: metrics.goalPct >= 100 ? 'var(--green)' : 'var(--muted)' }}>
                {metrics.goalTier}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="pb" style={{ height: 35, padding: '0 14px' }} onClick={() => onNavigate('fsrs')}>
              <IconPlay size={13} />
              <span>Ôn nhanh FSRS</span>
            </button>
            <button type="button" className="gb" style={{ height: 35, padding: '0 12px' }} onClick={() => onNavigate('tutor')}>
              <IconSparkChat size={14} />
              <span>Luyện nói AI</span>
            </button>
            <button type="button" className="gb" style={{ height: 35, padding: '0 12px' }} onClick={() => onNavigate('reader')}>
              <IconBook size={14} />
              <span>Đọc Song ngữ</span>
            </button>
            <button type="button" className="gb" style={{ height: 35, padding: '0 12px' }} onClick={() => onNavigate('curriculum')}>
              <IconCurriculum size={14} />
              <span>Lộ trình CEFR</span>
            </button>
          </div>
        </section>

        {/* Interactive Word-of-the-Moment Card (Micro-Learning + Vocab Notification Control) */}
        <section className="bento-card" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span className="pill-stat indigo">Từ vựng khoảnh khắc</span>
            {metrics.spotlightCard && (
              <span className="tag">{metrics.spotlightCard.cefr} · {metrics.spotlightCard.deck.split(' ')[0]}</span>
            )}
          </div>

          {metrics.spotlightCard ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 24, fontWeight: 750, letterSpacing: '-0.025em', lineHeight: 1.15 }}>
                    {metrics.spotlightCard.word}
                  </div>
                  <div className="mono" style={{ fontSize: 12.5, color: 'var(--cyan)', marginTop: 2 }}>
                    {metrics.spotlightCard.ipa} · {metrics.spotlightCard.pos}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  <button
                    type="button"
                    className="ib"
                    title="Nghe phát âm tiếng Anh"
                    aria-label={`Nghe phát âm ${metrics.spotlightCard.word}`}
                    onClick={() => speakEnglish(metrics.spotlightCard!.word)}
                  >
                    <IconVolume size={16} />
                  </button>
                  <button
                    type="button"
                    className="ib"
                    title="Đọc song ngữ (EN + VieNeu VI)"
                    aria-label="Nghe song ngữ từ khoảnh khắc"
                    onClick={() =>
                      speakBilingual(
                        metrics.spotlightCard!.clozeSentence.replace(/\{\{|\}\}/g, ''),
                        metrics.spotlightCard!.meaningVi
                      )
                    }
                  >
                    <IconHeadphones size={16} />
                  </button>
                </div>
              </div>

              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 12,
                  background: 'var(--raised)',
                  border: '1px solid var(--line)',
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: 'var(--text)',
                }}
              >
                &ldquo;{metrics.spotlightCard.clozeSentence.replace(/\{\{|\}\}/g, '')}&rdquo;
              </div>

              {flashRevealed ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 650, color: 'var(--green)' }}>
                    {metrics.spotlightCard.meaningVi}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      className="gb sm"
                      style={{ flex: 1, justifyContent: 'center', color: 'var(--rose)', borderColor: 'var(--rose)' }}
                      onClick={() => {
                        onQuickRateCard?.(metrics.spotlightCard!.id, 1);
                        setFlashRevealed(false);
                      }}
                    >
                      Chưa nhớ
                    </button>
                    <button
                      type="button"
                      className="pb sm"
                      style={{ flex: 1, justifyContent: 'center' }}
                      onClick={() => {
                        onQuickRateCard?.(metrics.spotlightCard!.id, 3);
                        setFlashRevealed(false);
                      }}
                    >
                      Đã nhớ (Good)
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="gb"
                  style={{ width: '100%', justifyContent: 'center', height: 32 }}
                  onClick={() => {
                    setFlashRevealed(true);
                    speakEnglish(metrics.spotlightCard!.word);
                  }}
                >
                  Lật nghĩa &amp; Ôn nhanh tại chỗ
                </button>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>
              Bạn đã hoàn thành hết thẻ! Hãy thêm từ mới hoặc đọc báo Engoo để đào thêm câu.
            </div>
          )}

          {/* Vocab Notification Status Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              paddingTop: 10,
              borderTop: '1px solid var(--line)',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
              <IconBellRing size={14} />
              <span>
                Nhắc từ vựng:{' '}
                <b style={{ color: vocabNotifications?.enabled ? 'var(--green)' : 'var(--dim)' }}>
                  {vocabNotifications?.enabled ? `Mỗi ${vocabNotifications.intervalMinutes}p` : 'Đang tắt'}
                </b>{' '}
                ({notificationsToday} hôm nay)
              </span>
            </div>
            {onTriggerVocabNotifyNow && (
              <button type="button" className="gb sm hl" onClick={onTriggerVocabNotifyNow}>
                Thông báo 1 từ ngay
              </button>
            )}
          </div>
        </section>
      </div>

      {/* ROW 2: 3-Column Visual Mastery Bento (6-Skill Radar + Vocab Pipeline + Weak IPA Focus) */}
      <div className="bento-3">
        {/* Card 1: 6-Skill Hexagon Radar */}
        <section className="bento-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <b style={{ fontSize: 14.5 }}>Bản đồ 6 Kỹ năng</b>
              <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Bấm vào kỹ năng để luyện ngay</div>
            </div>
            <span className="tag">IELTS {metrics.ieltsBand}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="164" height="156" viewBox="0 0 184 176" style={{ flexShrink: 0 }} aria-label="Biểu đồ Radar 6 kỹ năng">
              {[0.35, 0.68, 1].map((scale) => {
                const pts = Array.from({ length: 6 }, (_, i) => {
                  const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                  return `${(92 + 62 * scale * Math.cos(a)).toFixed(1)},${(88 + 62 * scale * Math.sin(a)).toFixed(1)}`;
                }).join(' ');
                return (
                  <polygon
                    key={scale}
                    points={pts}
                    fill="none"
                    stroke="var(--line)"
                    strokeWidth="1"
                  />
                );
              })}
              <polygon
                points={radarPolygonPoints}
                fill="rgba(56, 189, 248, 0.16)"
                stroke="var(--cyan)"
                strokeWidth="2"
              />
              {skillMatrix.map((sk, idx) => {
                const a = (Math.PI * 2 * idx) / 6 - Math.PI / 2;
                const lx = 92 + 75 * Math.cos(a);
                const ly = 88 + 72 * Math.sin(a);
                return (
                  <text
                    key={sk.short}
                    x={lx}
                    y={ly}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="10"
                    fill="var(--muted)"
                    fontWeight="600"
                  >
                    {sk.short}
                  </text>
                );
              })}
            </svg>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, minWidth: 0 }}>
              {skillMatrix.map((sk) => (
                <button
                  key={sk.name}
                  type="button"
                  onClick={() => onNavigate(sk.tab)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '4px 8px',
                    borderRadius: 8,
                    background: 'var(--raised)',
                    border: '1px solid var(--line)',
                    fontSize: 11.5,
                    gap: 6,
                  }}
                >
                  <span style={{ color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {sk.name}
                  </span>
                  <b style={{ color: sk.color }}>{sk.score}%</b>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Card 2: Vocabulary Mastery Pipeline (LingQ / Migaku Ratio Bar) */}
        <section className="bento-card" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <b style={{ fontSize: 14.5 }}>Tiến độ Từ vựng FSRS</b>
              <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                {metrics.deckTotal} thẻ · Độ nhớ trung bình {metrics.avgRet}%
              </div>
            </div>
            <span className="pill-stat green">{metrics.hoursDone}h</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="ratio-bar" aria-label="Tỷ lệ thuộc từ vựng">
              <div className="ratio-seg" style={{ width: `${Math.max(4, masteredPct)}%`, background: 'var(--green)' }} title={`Đã vững: ${metrics.masteredCount}`} />
              <div className="ratio-seg" style={{ width: `${Math.max(4, learningPct)}%`, background: 'var(--cyan)' }} title={`Đang học: ${metrics.learningCount}`} />
              <div className="ratio-seg" style={{ width: `${Math.max(4, newPct)}%`, background: 'var(--indigo)' }} title={`Từ mới: ${metrics.newCount}`} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              <div style={{ padding: '8px 10px', borderRadius: 12, background: 'var(--raised)', border: '1px solid var(--line)' }}>
                <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 620 }}>Đã vững</div>
                <div style={{ fontSize: 18, fontWeight: 740 }}>{metrics.masteredCount}</div>
              </div>
              <div style={{ padding: '8px 10px', borderRadius: 12, background: 'var(--raised)', border: '1px solid var(--line)' }}>
                <div style={{ fontSize: 11, color: 'var(--cyan)', fontWeight: 620 }}>Đang học</div>
                <div style={{ fontSize: 18, fontWeight: 740 }}>{metrics.learningCount}</div>
              </div>
              <div style={{ padding: '8px 10px', borderRadius: 12, background: 'var(--raised)', border: '1px solid var(--line)' }}>
                <div style={{ fontSize: 11, color: 'var(--indigo)', fontWeight: 620 }}>Từ mới</div>
                <div style={{ fontSize: 18, fontWeight: 740 }}>{metrics.newCount}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="gb sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => onNavigate('fsrs')}>
              Ôn FSRS &amp; Quiz Sprint
            </button>
            <button type="button" className="gb sm" onClick={() => onNavigate('writing')}>
              <IconPen size={12} />
              <span>Writing Lab</span>
            </button>
          </div>
        </section>

        {/* Card 3: Weakest IPA Phonemes Focus (ELSA Style) */}
        <section className="bento-card" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <b style={{ fontSize: 14.5 }}>Âm IPA cần ưu tiên sửa</b>
              <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                Điểm trung bình {metrics.avgPron}/100 · Nghe mẫu ngay
              </div>
            </div>
            <button type="button" className="gb sm" onClick={() => onNavigate('shadowing')}>
              Luyện âm
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {metrics.weakestFour.map((item) => (
              <button
                key={item.symbol}
                type="button"
                onClick={() => {
                  if (item.info) {
                    setSelectedPhoneme(item.info);
                    speakEnglish(item.info.example);
                  }
                }}
                style={{
                  padding: '10px 12px',
                  borderRadius: 13,
                  background: 'var(--raised)',
                  border: '1px solid var(--line)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 6,
                  textAlign: 'left',
                }}
              >
                <div>
                  <div className="mono" style={{ fontSize: 16, fontWeight: 740, color: 'var(--rose)' }}>
                    /{item.symbol}/
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                    {item.info?.example ?? 'sample'} · {item.pct}%
                  </div>
                </div>
                <IconVolume size={14} />
              </button>
            ))}
          </div>

          <div
            style={{
              padding: '9px 11px',
              borderRadius: 11,
              background: 'var(--raised)',
              border: '1px solid var(--line)',
              fontSize: 12,
              color: 'var(--muted)',
              lineHeight: 1.45,
            }}
          >
            <b style={{ color: 'var(--cyan)' }}>/{selectedPhoneme.symbol}/</b> ({selectedPhoneme.example}):{' '}
            {selectedPhoneme.tipVi}
          </div>
        </section>
      </div>

      {/* ROW 3: Smart Guided Study Queue + 14-Day FSRS Forecast */}
      <div className="split-2">
        <div className="bento-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div>
              <b style={{ fontSize: 15 }}>Lộ trình Học Thông minh Hôm nay</b>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                Hoàn thành 4 bước nhỏ (~25 phút) để tối ưu ghi nhớ dài hạn
              </div>
            </div>
            <span className="pill-stat green">
              {stats.completedDailySteps.length}/{dailySteps.length} xong
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {dailySteps.map((step) => {
              const done = stats.completedDailySteps.includes(step.id);
              return (
                <div
                  key={step.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    padding: '11px 14px',
                    borderRadius: 14,
                    border: '1px solid var(--line)',
                    background: done ? 'var(--green-s)' : 'var(--raised)',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: '1 1 200px' }}>
                    <button
                      type="button"
                      className={`chk ${done ? 'on' : ''}`}
                      onClick={() => onToggleDailyStep(step.id)}
                      aria-label={`Đánh dấu ${step.title}`}
                    >
                      {done && <IconCheck size={11} />}
                    </button>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 620,
                          fontSize: 13,
                          textDecoration: done ? 'line-through' : 'none',
                          color: done ? 'var(--muted)' : 'var(--text)',
                        }}
                      >
                        {step.title}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{step.detail}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span className="tag">{step.duration}</span>
                    <button type="button" className="gb sm" onClick={() => onNavigate(step.targetTab)}>
                      <IconPlay size={11} />
                      <span>Học</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bento-card" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div>
              <b style={{ fontSize: 15 }}>Dự báo Ôn tập FSRS (14 ngày)</b>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                Phân bổ thẻ đến hạn &amp; xác suất nhớ trung bình R(t, S)
              </div>
            </div>
            <span className="pill-stat cyan">R = {forecast[0]?.avgRetention ?? 94}%</span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(14, minmax(0, 1fr))',
              alignItems: 'end',
              gap: 5,
              height: 158,
              padding: '14px 8px 6px',
              borderRadius: 14,
              background: 'var(--raised)',
              border: '1px solid var(--line)',
            }}
          >
            {forecast.map((pt) => {
              const barH = Math.max(8, Math.round((pt.dueCount / maxDue) * 106));
              return (
                <div
                  key={pt.dayOffset}
                  title={`${pt.dateLabel}: ${pt.dueCount} thẻ (${pt.avgRetention}% nhớ)`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    height: '100%',
                    justifyContent: 'flex-end',
                  }}
                >
                  <div style={{ fontSize: 10.5, color: 'var(--dim)' }}>
                    {pt.dueCount > 0 ? pt.dueCount : ''}
                  </div>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: 18,
                      height: barH,
                      borderRadius: 6,
                      background: pt.dayOffset === 0 ? 'var(--cyan)' : 'var(--indigo)',
                      opacity: pt.dayOffset === 0 ? 1 : 0.72,
                    }}
                  />
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                    {pt.dayOffset === 0 ? 'Nay' : pt.dayOffset % 3 === 0 ? pt.dateLabel : ''}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--muted)' }}>
            <span>Tích lũy 1,000 giờ: <b>{metrics.hoursDone}h</b> · WPM: <b>{stats.typingWpmBest}</b></span>
            <button
              type="button"
              className="gb sm"
              onClick={() => setShowDeepAnalytics((v) => !v)}
            >
              {showDeepAnalytics ? 'Ẩn thống kê sâu' : 'Xem Heatmap 365 ngày & 44 Âm IPA'}
            </button>
          </div>
        </div>
      </div>

      {/* ROW 4: Progressive Disclosure Deep Analytics (365-Day Heatmap + 44-IPA Interactive Chart) */}
      {showDeepAnalytics && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="bento-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div>
                <b style={{ fontSize: 15 }}>Biểu đồ Nhiệt Học tập 365 Ngày</b>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {Object.keys(stats.dailyActivityLog).length} ngày có ghi nhận · Chuỗi thực tế {stats.streakDays} ngày
                </div>
              </div>
              <span className="pill-stat green">Lịch sử thực</span>
            </div>

            <div style={{ width: '100%', maxWidth: '100%', overflowX: 'auto', paddingBottom: 4 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(52, 10px)', gap: 3, width: 'max-content' }}>
                {heatmapWeeks.map((week, wIdx) => (
                  <div key={wIdx} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {week.map((day) => {
                      const bg =
                        day.level === 0
                          ? 'var(--raised)'
                          : day.level === 1
                            ? 'rgba(52, 211, 153, 0.25)'
                            : day.level === 2
                              ? 'rgba(52, 211, 153, 0.55)'
                              : 'var(--green)';
                      return (
                        <div
                          key={day.dateKey}
                          title={`${day.dateKey}: ${day.count} hoạt động`}
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 3,
                            background: bg,
                            border: '1px solid var(--line)',
                          }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bento-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <b style={{ fontSize: 15 }}>Ma trận 44 Âm vị IPA Tương tác</b>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  Bấm vào từng âm vị để nghe ví dụ bản xứ và xem mẹo đặt lưỡi
                </div>
              </div>
              <button type="button" className="gb sm" onClick={() => speakEnglish(selectedPhoneme.example)}>
                <IconVolume size={13} />
                <span>/{selectedPhoneme.symbol}/ — {selectedPhoneme.example}</span>
              </button>
            </div>

            <div className="ipa-grid">
              {IPA_44_PHONEMES.map((p) => {
                const mastery = stats.phonemeMastery[p.symbol] ?? 80;
                const color = mastery >= 85 ? 'var(--green)' : mastery >= 72 ? 'var(--amber)' : 'var(--rose)';
                const isSel = selectedPhoneme.symbol === p.symbol;
                return (
                  <button
                    key={p.symbol}
                    type="button"
                    className="ipa-tile"
                    style={{
                      borderColor: isSel ? 'var(--cyan)' : undefined,
                      background: isSel ? 'var(--sel)' : undefined,
                    }}
                    onClick={() => {
                      setSelectedPhoneme(p);
                      speakEnglish(p.example);
                    }}
                  >
                    <span className="mono" style={{ fontSize: 14, fontWeight: 700, color }}>{p.symbol}</span>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>{mastery}%</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
