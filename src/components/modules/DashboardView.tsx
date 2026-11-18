import React, { useMemo, useState } from 'react';
import type { NavTab } from '../../App';
import type { FsrsCard } from '../../core/fsrs/fsrsEngine';
import { computeRetrievability, forecastWorkload } from '../../core/fsrs/fsrsEngine';
import { IPA_44_PHONEMES, mapScoreToIeltsBand } from '../../core/phonetics/ipaScorer';
import type { StudyStats } from '../../core/storage/db';
import { speakEnglish } from '../../core/phonetics/speechIO';
import { IconCheck, IconPlay, IconVolume } from '../icons/Icons';

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
  const [selectedPhoneme, setSelectedPhoneme] = useState(IPA_44_PHONEMES[30]); // /θ/ default

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

  const dailySteps: Array<{
    id: string;
    title: string;
    duration: string;
    detail: string;
    targetTab: NavTab;
  }> = [
    {
      id: 'step-fsrs',
      title: '1. Ôn thẻ FSRS v5 đến hạn',
      duration: '5 phút',
      detail: `${metrics.dueCount + metrics.newCount} thẻ cần xử lý để giữ Retention ${metrics.avgRet}%`,
      targetTab: 'fsrs',
    },
    {
      id: 'step-ipa',
      title: '2. Luyện phát âm 5 âm vị yếu',
      duration: '5 phút',
      detail: `Tập trung sửa khẩu hình âm ${metrics.weakestPhoneme}`,
      targetTab: 'shadowing',
    },
    {
      id: 'step-shadow',
      title: '3. Shadowing AB-Loop & Pitch F0',
      duration: '8 phút',
      detail: 'Nhại giọng theo sóng âm bản xứ ở tốc độ 0.9x → 1.0x',
      targetTab: 'shadowing',
    },
    {
      id: 'step-tutor',
      title: '4. Hội thoại AI Roleplay ứng dụng từ mới',
      duration: '7 phút',
      detail: 'Thực hành ngay với AI Memory Ledger & Explain My Mistake',
      targetTab: 'tutor',
    },
  ];

  return (
    <div>
      {/* 4-Column Geist 1px Structural Grid KPI Strip */}
      <div className="geist-grid cols-4">
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
              CEFR B2+
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

      {/* Smart Daily Study Queue + 14-Day FSRS Forecast */}
      <div className="split-2" style={{ marginBottom: 14 }}>
        <div className="panel">
          <div className="ph">
            <div>
              <b>Smart Daily Study Queue (25 phút/ngày)</b>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                Hoàn thành đủ 4 chặng để tối ưu đường cong nhớ FSRS &amp; phản xạ nói
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

        {/* 14-Day FSRS Workload & Retrievability Forecast */}
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
              height: 140,
              padding: '12px 6px 4px',
              borderRadius: 12,
              background: 'var(--raised)',
              border: '1px solid var(--line)',
            }}
          >
            {forecast.map((pt) => {
              const barH = Math.max(8, Math.round((pt.dueCount / maxDue) * 96));
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
