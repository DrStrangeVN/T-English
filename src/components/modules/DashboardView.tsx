import React, { useMemo, useState } from 'react';
import type { NavTab } from '../../App';
import type { FsrsCard } from '../../core/fsrs/fsrsEngine';
import { computeRetrievability, forecastWorkload } from '../../core/fsrs/fsrsEngine';
import { IPA_44_PHONEMES, mapScoreToIeltsBand } from '../../core/phonetics/ipaScorer';
import type { StudyStats } from '../../core/storage/db';
import { speakEnglish } from '../../core/phonetics/speechIO';
import { IconCheck, IconCurriculum, IconPen, IconPlay, IconVolume } from '../icons/Icons';

interface DashboardViewProps {
  cards: FsrsCard[];
  stats: StudyStats;
  dailyGoalMinutes: number;
  onNavigate: (tab: NavTab) => void;
  onToggleDailyStep: (stepId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  cards,
  stats,
  dailyGoalMinutes,
  onNavigate,
  onToggleDailyStep,
}) => {
  const [selectedPhoneme, setSelectedPhoneme] = useState(IPA_44_PHONEMES[30]); // /θ/

  const metrics = useMemo(() => {
    const now = Date.now();
    const dueCards = cards.filter((c) => c.state !== 'new' && c.due <= now);
    const newCards = cards.filter((c) => c.state === 'new');
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
        : 88;

    const weakestEntry = Object.entries(stats.phonemeMastery).sort((a, b) => a[1] - b[1])[0];
    const hoursDone = (stats.immersionMinutes / 60).toFixed(1);
    const immersionPct = Math.min(100, (stats.immersionMinutes / 60_000) * 100);

    return {
      dueCount: dueCards.length,
      newCount: newCards.length,
      avgRet,
      avgPron,
      ieltsBand: mapScoreToIeltsBand(avgPron),
      weakestPhoneme: weakestEntry ? `/${weakestEntry[0]}/ (${weakestEntry[1]}%)` : '/θ/',
      hoursDone,
      immersionPct,
      totalVocab: 4812 + cards.length,
    };
  }, [cards, stats]);

  const forecast = useMemo(() => forecastWorkload(cards, 14), [cards]);
  const maxDue = Math.max(4, ...forecast.map((f) => f.dueCount));

  // Deterministic 364-day (52 weeks x 7 days) Anki/GitHub activity heatmap
  const heatmapWeeks = useMemo(() => {
    return Array.from({ length: 52 }, (_, w) =>
      Array.from({ length: 7 }, (_, d) => {
        const dayIdx = w * 7 + d;
        const isRecentStreak = dayIdx >= 364 - stats.streakDays;
        const level = isRecentStreak
          ? ((dayIdx % 3) + 2)
          : (dayIdx * 7 + w * 3) % 5 === 0
            ? 0
            : ((dayIdx + w) % 4);
        return { dayIdx, level };
      })
    );
  }, [stats.streakDays]);

  const skillMatrix = [
    { name: 'Listening & Dictation', score: 86, tab: 'qwerty' as NavTab, color: 'var(--cyan)' },
    { name: 'Speaking & Roleplay', score: 84, tab: 'tutor' as NavTab, color: 'var(--green)' },
    { name: 'Phonetics & IPA', score: metrics.avgPron, tab: 'shadowing' as NavTab, color: 'var(--indigo)' },
    { name: 'Reading (Engoo 5-Step)', score: 90, tab: 'reader' as NavTab, color: 'var(--cyan)' },
    { name: 'Writing (IELTS & RFC)', score: 78, tab: 'writing' as NavTab, color: 'var(--amber)' },
    { name: 'Lexical & FSRS Recall', score: Math.round(metrics.avgRet), tab: 'fsrs' as NavTab, color: 'var(--green)' },
  ];

  const dailySteps: Array<{
    id: string;
    title: string;
    duration: string;
    detail: string;
    targetTab: NavTab;
  }> = [
    {
      id: 'step-fsrs',
      title: '1. Ôn thẻ FSRS v5 đến hạn (kèm YouGlish & Gốc từ)',
      duration: '5 phút',
      detail: `${metrics.dueCount + metrics.newCount} thẻ cần xử lý để giữ Retention ${metrics.avgRet}%`,
      targetTab: 'fsrs',
    },
    {
      id: 'step-ipa',
      title: '2. Luyện Minimal Pairs & Sơ đồ Khoang miệng IPA',
      duration: '5 phút',
      detail: `Tập trung sửa khẩu hình âm ${metrics.weakestPhoneme}`,
      targetTab: 'shadowing',
    },
    {
      id: 'step-shadow',
      title: '3. Đọc tin Engoo 5 Bước & Chép Connected Speech',
      duration: '8 phút',
      detail: 'Đọc báo song ngữ, giải quiz và đào câu sang FSRS',
      targetTab: 'reader',
    },
    {
      id: 'step-tutor',
      title: '4. AI Roleplay (3-Mission) hoặc Viết IELTS In-Line Diff',
      duration: '7 phút',
      detail: 'Hoàn thành 3 nhiệm vụ nói hoặc chấm điểm 4 tiêu chí IELTS Writing',
      targetTab: 'tutor',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Quick Launch Strip for Placement Test, Curriculum & Writing Studio */}
      <div
        className="panel"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          padding: '11px 16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="tag" style={{ color: 'var(--cyan)', background: 'var(--cyan-s)', fontWeight: 700 }}>
            CEFR {stats.cefrLevel}
          </span>
          <span style={{ fontSize: 12.5, fontWeight: 600 }}>
            Lộ trình Cá nhân hóa ({stats.completedUnitIds.length}/6 Units hoàn thành)
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="gb sm" onClick={() => onNavigate('curriculum')}>
            <IconCurriculum size={13} />
            <span>Kiểm tra Xếp lớp &amp; Lộ trình CEFR</span>
          </button>
          <button type="button" className="pb sm" onClick={() => onNavigate('writing')}>
            <IconPen size={13} />
            <span>Mở IELTS Writing &amp; Ludwig Studio</span>
          </button>
        </div>
      </div>

      {/* 4-Column Geist 1px Structural Grid KPI Strip */}
      <div className="geist-grid cols-4" style={{ marginBottom: 0 }}>
        <div className="geist-cell">
          <div className="kpi-label">
            <span>FSRS Memory Retention</span>
            <span className="tag" style={{ color: 'var(--green)', background: 'var(--green-s)' }}>
              FSRS v5
            </span>
          </div>
          <div className="kpi-val ok">{metrics.avgRet}%</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
            Due: <b>{metrics.dueCount}</b> · New: <b>{metrics.newCount}</b>
          </div>
          <div className="bar">
            <div className="b-ok" style={{ width: `${Math.min(100, metrics.avgRet)}%` }} />
          </div>
        </div>

        <div className="geist-cell">
          <div className="kpi-label">
            <span>Pronunciation &amp; IELTS</span>
            <span className="tag" style={{ color: 'var(--cyan)', background: 'var(--cyan-s)' }}>
              Band {metrics.ieltsBand}
            </span>
          </div>
          <div className="kpi-val">{metrics.avgPron}/100</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
            Âm yếu nhất: <span className="mono warn">{metrics.weakestPhoneme}</span>
          </div>
          <div className="bar">
            <div className="b-cyan" style={{ width: `${metrics.avgPron}%` }} />
          </div>
        </div>

        <div className="geist-cell">
          <div className="kpi-label">
            <span>Active Vocabulary</span>
            <span className="tag" style={{ color: 'var(--indigo)', background: 'var(--indigo-s)' }}>
              CEFR {stats.cefrLevel}
            </span>
          </div>
          <div className="kpi-val">{metrics.totalVocab.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
            Tăng trưởng tuần: <span className="ok">+145 từ</span> · {stats.typingWpmBest} WPM
          </div>
          <div className="bar">
            <div className="b-indigo" style={{ width: '76%' }} />
          </div>
        </div>

        <div className="geist-cell">
          <div className="kpi-label">
            <span>1,000-Hour Immersion</span>
            <span className="tag" style={{ color: 'var(--amber)', background: 'var(--amber-s)' }}>
              {stats.streakDays}d Streak
            </span>
          </div>
          <div className="kpi-val">{metrics.hoursDone}h</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
            Hôm nay: <b>{stats.dailyMinutesDone}/{dailyGoalMinutes}m</b> · Mục tiêu 1,000h
          </div>
          <div className="bar">
            <div className="b-warn" style={{ width: `${Math.max(4, metrics.immersionPct)}%` }} />
          </div>
        </div>
      </div>

      {/* 365-Day Anki/GitHub Activity Heatmap + 6-Skill CEFR Matrix */}
      <div className="split-2">
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="ph" style={{ marginBottom: 0 }}>
            <div>
              <b>Biểu đồ Nhiệt Học tập 365 Ngày (Consistency Heatmap)</b>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                Chuỗi liên tiếp {stats.streakDays} ngày · 52 tuần tích lũy 1,000 giờ
              </div>
            </div>
            <span className="tag" style={{ color: 'var(--green)', background: 'var(--green-s)' }}>
              Active Daily
            </span>
          </div>

          <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(52, 9px)', gap: 2.5, minWidth: 580 }}>
              {heatmapWeeks.map((week, wIdx) => (
                <div key={wIdx} style={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
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
                        key={day.dayIdx}
                        style={{
                          width: 9,
                          height: 9,
                          borderRadius: 2.5,
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

        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="ph" style={{ marginBottom: 0 }}>
            <b>Ma trận 6 Kỹ năng Toàn diện</b>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {skillMatrix.map((sk) => (
              <button
                key={sk.name}
                type="button"
                onClick={() => onNavigate(sk.tab)}
                style={{
                  textAlign: 'left',
                  padding: '8px 10px',
                  borderRadius: 10,
                  border: '1px solid var(--line)',
                  background: 'var(--raised)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: 'var(--muted)' }}>{sk.name}</span>
                  <b style={{ color: sk.color }}>{sk.score}%</b>
                </div>
                <div className="bar" style={{ marginTop: 0 }}>
                  <div style={{ width: `${sk.score}%`, background: sk.color }} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Smart Daily Study Queue + 14-Day FSRS Forecast */}
      <div className="split-2">
        <div className="panel">
          <div className="ph">
            <div>
              <b>Smart Daily Study Queue (25 phút/ngày)</b>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                Hoàn thành đủ 4 chặng để tối ưu đường cong nhớ FSRS &amp; phản xạ thực chiến
              </div>
            </div>
            <span className="tag">
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
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: '1px solid var(--line)',
                    background: done ? 'var(--green-s)' : 'var(--raised)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
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
                          fontSize: 12.5,
                          textDecoration: done ? 'line-through' : 'none',
                          color: done ? 'var(--muted)' : 'var(--text)',
                        }}
                      >
                        {step.title}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{step.detail}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span className="tag">{step.duration}</span>
                    <button
                      type="button"
                      className="gb sm"
                      onClick={() => onNavigate(step.targetTab)}
                    >
                      <IconPlay size={11} />
                      <span>Học</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 14-Day FSRS Workload Forecast */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div className="ph">
            <div>
              <b>Dự báo Tải lượng Ôn tập FSRS (14 ngày)</b>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                Phân bổ thẻ đến hạn &amp; xác suất nhớ trung bình R(t, S)
              </div>
            </div>
            <span className="tag" style={{ color: 'var(--cyan)', background: 'var(--cyan-s)' }}>
              R = {forecast[0]?.avgRetention ?? 94}%
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(14, minmax(0, 1fr))',
              alignItems: 'end',
              gap: 5,
              height: 150,
              padding: '12px 6px 4px',
              borderRadius: 12,
              background: 'var(--raised)',
              border: '1px solid var(--line)',
            }}
          >
            {forecast.map((pt) => {
              const barH = Math.max(8, Math.round((pt.dueCount / maxDue) * 102));
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
                  <div style={{ fontSize: 9.5, color: 'var(--dim)' }}>
                    {pt.dueCount > 0 ? pt.dueCount : ''}
                  </div>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: 18,
                      height: barH,
                      borderRadius: 5,
                      background: pt.dayOffset === 0 ? 'var(--cyan)' : 'var(--indigo)',
                      opacity: pt.dayOffset === 0 ? 1 : 0.72,
                    }}
                  />
                  <div style={{ fontSize: 9, color: 'var(--muted)' }}>
                    {pt.dayOffset % 2 === 0 ? pt.dateLabel : ''}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, fontSize: 11, color: 'var(--muted)' }}>
            <span>Hôm nay: {forecast[0]?.dueCount ?? 0} thẻ</span>
            <span>Mục tiêu giữ nhớ: 90%+</span>
          </div>
        </div>
      </div>

      {/* 44-Phoneme IPA Mastery Heatmap */}
      <div className="panel">
        <div className="ph">
          <div>
            <b>Ma trận 44 Âm vị IPA (Phoneme Mastery Heatmap)</b>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              Bấm vào từng âm vị để nghe từ mẫu và xem hướng dẫn khẩu hình bằng tiếng Việt
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="tag" style={{ color: 'var(--green)', background: 'var(--green-s)' }}>≥85% Chuẩn</span>
            <span className="tag" style={{ color: 'var(--amber)', background: 'var(--amber-s)' }}>70–84%</span>
            <span className="tag" style={{ color: 'var(--rose)', background: 'var(--rose-s)' }}>&lt;70% Cần sửa</span>
          </div>
        </div>

        <div className="ipa-grid" style={{ marginBottom: 12 }}>
          {IPA_44_PHONEMES.map((ph) => {
            const val = stats.phonemeMastery[ph.symbol] ?? 80;
            const color = val >= 85 ? 'var(--green)' : val >= 70 ? 'var(--amber)' : 'var(--rose)';
            const isSel = selectedPhoneme.symbol === ph.symbol;
            return (
              <button
                key={ph.symbol}
                type="button"
                className="ipa-tile"
                style={{
                  borderColor: isSel ? 'var(--cyan)' : undefined,
                  background: isSel ? 'var(--sel)' : undefined,
                }}
                onClick={() => {
                  setSelectedPhoneme(ph);
                  speakEnglish(ph.example);
                }}
              >
                <span className="mono" style={{ fontWeight: 700, fontSize: 13 }}>
                  /{ph.symbol}/
                </span>
                <span style={{ fontSize: 10, color, fontWeight: 620 }}>{val}%</span>
              </button>
            );
          })}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '10px 14px',
            borderRadius: 12,
            border: '1px solid var(--line)',
            background: 'var(--raised)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
            <div className="av mono" style={{ color: 'var(--cyan)', width: 44, height: 44, fontSize: 15 }}>
              /{selectedPhoneme.symbol}/
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 650, fontSize: 13 }}>
                Từ mẫu: &ldquo;{selectedPhoneme.example}&rdquo; ·{' '}
                <span style={{ color: 'var(--muted)', fontWeight: 500 }}>
                  {selectedPhoneme.category.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                {selectedPhoneme.tipVi}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="gb"
            onClick={() => speakEnglish(selectedPhoneme.example)}
          >
            <IconVolume size={14} />
            <span>Nghe mẫu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
