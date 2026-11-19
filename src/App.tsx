import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  scheduleCard,
  type FsrsCard,
  type FsrsRating,
} from './core/fsrs/fsrsEngine';
import { wordToIpa } from './core/phonetics/ipaScorer';
import { notifyMacNativeHost, notifyMacStateSync } from './core/phonetics/speechIO';
import {
  STORAGE_KEY,
  bumpDailyActivity,
  createDefaultState,
  loadState,
  saveState,
  type AppSettings,
  type TEnglishState,
  type ViewportPreview,
} from './core/storage/db';
import {
  IconBook,
  IconCards,
  IconCurriculum,
  IconDashboard,
  IconKeyboard,
  IconLogo,
  IconPen,
  IconSettings,
  IconSidebar,
  IconSparkChat,
  IconWaveform,
} from './components/icons/Icons';
import { TopHeader } from './components/layout/TopHeader';
import { CommandPalette } from './components/layout/CommandPalette';
import { MenuBarPopover } from './components/layout/MenuBarPopover';
import { FloatingMiniDock } from './components/common/FloatingMiniDock';
import { DashboardView } from './components/modules/DashboardView';

const CurriculumView = lazy(() =>
  import('./components/modules/CurriculumView').then((m) => ({ default: m.CurriculumView }))
);
const ShadowingStudio = lazy(() =>
  import('./components/modules/ShadowingStudio').then((m) => ({ default: m.ShadowingStudio }))
);
const AITutorView = lazy(() =>
  import('./components/modules/AITutorView').then((m) => ({ default: m.AITutorView }))
);
const WritingStudioView = lazy(() =>
  import('./components/modules/WritingStudioView').then((m) => ({ default: m.WritingStudioView }))
);
const FSRSDeckView = lazy(() =>
  import('./components/modules/FSRSDeckView').then((m) => ({ default: m.FSRSDeckView }))
);
const ImmersiveReader = lazy(() =>
  import('./components/modules/ImmersiveReader').then((m) => ({ default: m.ImmersiveReader }))
);
const QwertyDictation = lazy(() =>
  import('./components/modules/QwertyDictation').then((m) => ({ default: m.QwertyDictation }))
);
const SettingsView = lazy(() =>
  import('./components/layout/SettingsView').then((m) => ({ default: m.SettingsView }))
);

export type NavTab =
  | 'dashboard'
  | 'curriculum'
  | 'shadowing'
  | 'tutor'
  | 'writing'
  | 'fsrs'
  | 'reader'
  | 'qwerty'
  | 'settings';

const TAB_META: Record<
  NavTab,
  { label: string; title: string; subtitle: string; badge: string }
> = {
  dashboard: {
    label: 'Dashboard',
    title: 'Command Center',
    subtitle: 'KPI FSRS v5, Heatmap 365 ngày, 6 Kỹ năng & lộ trình 1,000 giờ',
    badge: 'v2.0 Tahoe',
  },
  curriculum: {
    label: 'Lộ trình CEFR',
    title: 'CEFR Path & Placement Test',
    subtitle: 'Kiểm tra xếp lớp 12 câu & 6 chặng ngữ pháp thực chiến A1 → C2',
    badge: 'Test-English',
  },
  shadowing: {
    label: 'Shadowing IPA',
    title: 'AI Phonetics & Minimal Pairs',
    subtitle: 'Sơ đồ khoang miệng SVG, Minimal Pairs, Pitch F0 & Connected Speech',
    badge: 'Coach Shane',
  },
  tutor: {
    label: 'AI Roleplay',
    title: 'Real-Time AI Tutor',
    subtitle: '3-Star Roleplay Missions, Live Voice Call & Explain My Mistake',
    badge: 'Memory Ledger',
  },
  writing: {
    label: 'Writing Studio',
    title: 'IELTS Writing & Ludwig Studio',
    subtitle: 'Chấm điểm 4 tiêu chí IELTS, In-Line Diff & tra cứu Ludwig.guru',
    badge: 'Band 8.5 Lab',
  },
  fsrs: {
    label: 'FSRS Deck',
    title: 'FSRS v5, YouGlish & Word Roots',
    subtitle: 'Lặp lại ngắt quãng S/D/R, ví dụ US/UK/AUS & bản đồ gốc từ Membean',
    badge: 'FSRS v5',
  },
  reader: {
    label: 'Engoo Reader',
    title: 'Engoo 5-Step Dual-Sub Reader',
    subtitle: 'Đọc báo 5 bước, Popover 364px, phím tắt A/S/D & Grammar X-Ray',
    badge: '5-Step Flow',
  },
  qwerty: {
    label: 'Qwerty Lab',
    title: 'Monkeytype & DailyDictation',
    subtitle: 'Gõ từ vựng Zen Mode, âm thanh phím cơ & nghe chép câu nối âm',
    badge: '60+ Từ & 8 Bài',
  },
  settings: {
    label: 'Cài đặt',
    title: 'System & AI Preferences',
    subtitle: 'Cấu hình Liquid Glass, Web Audio, FSRS Retention & AI Providers',
    badge: 'Local-First',
  },
};

export const App: React.FC = () => {
  const [state, setState] = useState<TEnglishState>(() => loadState());
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [preview, setPreview] = useState<ViewportPreview>('auto');
  const [tutorSeedPrompt, setTutorSeedPrompt] = useState<string | null>(null);
  const [openAddFormNonce, setOpenAddFormNonce] = useState(0);
  const syncSourceRef = useRef<'local' | 'external'>('local');

  const isMenuBarUrlMode = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('mode') === 'menubar';
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (syncSourceRef.current === 'external') {
      syncSourceRef.current = 'local';
      return;
    }
    saveState(state);
    notifyMacStateSync();
  }, [state]);

  useEffect(() => {
    const handleExternalSync = () => {
      syncSourceRef.current = 'external';
      setState(loadState());
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === STORAGE_KEY) {
        handleExternalSync();
      }
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('tenglish-sync', handleExternalSync);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('tenglish-sync', handleExternalSync);
    };
  }, []);

  useEffect(() => {
    const body = document.body;
    const { theme, glass, reduceTransparency } = state.settings;
    body.classList.toggle('light', theme === 'light');
    body.classList.toggle('glass-clear', glass === 'clear');
    body.classList.toggle('glass-solid', glass === 'solid');
    body.classList.toggle('reduce-transparency', reduceTransparency);
    body.classList.toggle('sb-off', sidebarCollapsed);
    body.classList.toggle('mobile-nav-open', mobileDrawerOpen);

    const isNativeMac =
      typeof navigator !== 'undefined' &&
      /macintosh/i.test(navigator.userAgent) &&
      Boolean(
        (window as unknown as { webkit?: { messageHandlers?: { tenglish?: unknown } } }).webkit
          ?.messageHandlers?.tenglish
      );
    body.classList.toggle('native-macos', isNativeMac);

    const dueCount = state.cards.filter((c) => c.state === 'new' || c.due <= Date.now()).length;
    notifyMacNativeHost({
      theme,
      glass,
      reduceTransparency,
      statusSummary: `${state.stats.streakDays}d streak · ${dueCount} due · CEFR ${state.stats.cefrLevel}`,
    });
  }, [state.settings, state.cards, state.stats.streakDays, state.stats.cefrLevel, sidebarCollapsed, mobileDrawerOpen]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      } else if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        setSidebarCollapsed((v) => !v);
      } else if (e.metaKey || e.ctrlKey) {
        const idxMap: Record<string, NavTab> = {
          '1': 'dashboard',
          '2': 'curriculum',
          '3': 'shadowing',
          '4': 'tutor',
          '5': 'writing',
          '6': 'fsrs',
          '7': 'reader',
          '8': 'qwerty',
          '9': 'settings',
        };
        if (idxMap[e.key]) {
          e.preventDefault();
          setActiveTab(idxMap[e.key]);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const dueCount = useMemo(
    () => state.cards.filter((c) => c.state === 'new' || c.due <= Date.now()).length,
    [state.cards]
  );

  const handleUpdateSettings = (patch: Partial<AppSettings>) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...patch },
    }));
  };

  const handleRateCard = (cardId: string, rating: FsrsRating) => {
    setState((prev) => ({
      ...prev,
      cards: prev.cards.map((c) =>
        c.id === cardId
          ? scheduleCard(c, rating, Date.now(), prev.settings.desiredRetention)
          : c
      ),
      stats: {
        ...prev.stats,
        dailyMinutesDone: prev.stats.dailyMinutesDone + 1,
        immersionMinutes: prev.stats.immersionMinutes + 1,
        dailyActivityLog: bumpDailyActivity(prev.stats.dailyActivityLog, 1),
      },
    }));
  };

  const handleAddCard = (input: {
    word: string;
    ipa: string;
    meaningVi: string;
    clozeSentence: string;
    deck: string;
    translationVi?: string;
    sourceTitle?: string;
  }) => {
    const exists = state.cards.some(
      (c) => c.word.toLowerCase() === input.word.trim().toLowerCase()
    );
    if (exists) {
      showToast(`Từ "${input.word}" đã có sẵn trong FSRS Deck`);
      return;
    }

    const ipaFormatted = input.ipa || `/${wordToIpa(input.word)}/`;
    const newCard: FsrsCard = {
      id: `card-${Date.now()}`,
      word: input.word,
      ipa: ipaFormatted,
      pos: 'vocab',
      meaningVi: input.meaningVi,
      meaningEn: 'Captured from active immersion study',
      clozeSentence: input.clozeSentence,
      clozeAnswer: input.word,
      translationVi: input.translationVi ?? input.meaningVi,
      wordFamily: [input.word],
      collocations: [`${input.word} in context`],
      nuance: 'Thẻ được trích xuất trực tiếp từ quá trình luyện tập thực tế.',
      mnemonic: `Gắn với ngữ cảnh: ${input.clozeSentence.replace(/\{\{|\}\}/g, '')}`,
      deck: input.deck,
      cefr: 'C1',
      sourceTitle: input.sourceTitle,
      youglishContexts: [
        {
          accent: 'US',
          speaker: 'Immersion Clip',
          timestamp: '01:05',
          sentence: input.clozeSentence.replace(/\{\{|\}\}/g, ''),
        },
        {
          accent: 'UK',
          speaker: 'BBC Study Context',
          timestamp: '03:20',
          sentence: `Notice how "${input.word}" clarifies meaning in natural prose.`,
        },
        {
          accent: 'AUS',
          speaker: 'Melbourne Talk',
          timestamp: '04:12',
          sentence: `Try using "${input.word}" during your next speaking session.`,
        },
      ],
      state: 'new',
      stability: 0,
      difficulty: 0,
      elapsedDays: 0,
      scheduledDays: 0,
      reps: 0,
      lapses: 0,
      lastReview: null,
      due: Date.now() - 1000,
    };

    setState((prev) => ({ ...prev, cards: [newCard, ...prev.cards] }));
    showToast(`Đã thêm "${input.word}" vào FSRS Deck`);
  };

  const handleRecordPronunciation = (score: number, weakSymbols: string[]) => {
    setState((prev) => {
      const updatedMastery = { ...prev.stats.phonemeMastery };
      Object.keys(updatedMastery).forEach((sym) => {
        if (weakSymbols.includes(sym)) {
          updatedMastery[sym] = Math.max(45, updatedMastery[sym] - 2);
        } else if (score >= 85) {
          updatedMastery[sym] = Math.min(99, updatedMastery[sym] + 1);
        }
      });
      return {
        ...prev,
        stats: {
          ...prev.stats,
          pronunciationScores: [...prev.stats.pronunciationScores.slice(-11), score],
          phonemeMastery: updatedMastery,
          dailyMinutesDone: prev.stats.dailyMinutesDone + 2,
          immersionMinutes: prev.stats.immersionMinutes + 2,
          dailyActivityLog: bumpDailyActivity(prev.stats.dailyActivityLog, 2),
        },
      };
    });
  };

  const addStudyMinutes = useCallback((mins: number) => {
    setState((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        dailyMinutesDone: prev.stats.dailyMinutesDone + mins,
        immersionMinutes: prev.stats.immersionMinutes + mins,
        dailyActivityLog: bumpDailyActivity(prev.stats.dailyActivityLog, mins),
      },
    }));
  }, []);

  const navigateTo = (tab: NavTab) => {
    setActiveTab(tab);
    setMobileDrawerOpen(false);
  };

  const toggleSidebarOrDrawer = () => {
    const isNarrow =
      preview === 'iphone' || (typeof window !== 'undefined' && window.innerWidth <= 768);
    if (isNarrow) {
      setMobileDrawerOpen((v) => !v);
    } else {
      setSidebarCollapsed((v) => !v);
    }
  };

  const navItems: Array<{ id: NavTab; label: string; badge?: string; icon: React.ReactNode }> = [
    { id: 'dashboard', label: 'Dashboard', icon: <IconDashboard size={15} /> },
    { id: 'curriculum', label: 'Lộ trình CEFR', badge: state.stats.cefrLevel, icon: <IconCurriculum size={15} /> },
    { id: 'shadowing', label: 'Shadowing IPA', icon: <IconWaveform size={15} /> },
    { id: 'tutor', label: 'AI Roleplay', icon: <IconSparkChat size={15} /> },
    { id: 'writing', label: 'Writing Studio', icon: <IconPen size={15} /> },
    {
      id: 'fsrs',
      label: 'FSRS Deck',
      badge: dueCount > 0 ? String(dueCount) : undefined,
      icon: <IconCards size={15} />,
    },
    { id: 'reader', label: 'Engoo Reader', icon: <IconBook size={15} /> },
    { id: 'qwerty', label: 'Qwerty Lab', icon: <IconKeyboard size={15} /> },
    { id: 'settings', label: 'Cài đặt', icon: <IconSettings size={15} /> },
  ];

  if (isMenuBarUrlMode || preview === 'menubar') {
    return (
      <div
        style={{
          height: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: isMenuBarUrlMode ? 'flex-start' : 'center',
          padding: isMenuBarUrlMode ? 8 : 20,
          gap: 12,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <MenuBarPopover
          cards={state.cards}
          dailyMinutesDone={state.stats.dailyMinutesDone}
          dailyGoalMinutes={state.settings.dailyGoalMinutes}
          streakDays={state.stats.streakDays}
          onRateCard={handleRateCard}
          onOpenFullApp={isMenuBarUrlMode ? undefined : () => setPreview('auto')}
        />
        {!isMenuBarUrlMode && (
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            Chế độ xem trước Menu Bar Popover macOS (chuẩn rộng 364px)
          </div>
        )}
      </div>
    );
  }

  const immersionPct = Math.min(100, Math.round((state.stats.immersionMinutes / 60_000) * 100));
  const meta = TAB_META[activeTab];
  const currentIcon = navItems.find((n) => n.id === activeTab)?.icon ?? <IconDashboard size={16} />;

  const appShell = (
    <div className="shell">
      <div className="drawer-scrim" onClick={() => setMobileDrawerOpen(false)} aria-hidden="true" />

      <aside className="side" aria-label="Điều hướng chính">
        <div className="brand">
          <div className="logo">
            <IconLogo size={15} />
          </div>
          <b>T-English</b>
          <span className="ver-pill">v2.0</span>
          <button
            type="button"
            className="sb-collapse"
            aria-label="Thu gọn Sidebar"
            title="Thu gọn Sidebar (⌘\)"
            onClick={toggleSidebarOrDrawer}
          >
            <IconSidebar size={15} />
          </button>
        </div>

        <div className="slabel">Học tập &amp; Chinh phục CEFR</div>
        <nav className="nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`ni ${activeTab === item.id ? 'on' : ''}`}
              onClick={() => navigateTo(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge && <small>{item.badge}</small>}
            </button>
          ))}
        </nav>

        <div className="slabel">Truy cập nhanh</div>
        <div className="qlist">
          <button type="button" className="qi" onClick={() => navigateTo('curriculum')}>
            <span className="sdot" style={{ background: 'var(--green)' }} />
            <b>Placement Test (CEFR)</b>
          </button>
          <button type="button" className="qi" onClick={() => navigateTo('writing')}>
            <span className="sdot" style={{ background: 'var(--amber)' }} />
            <b>IELTS Writing &amp; Ludwig</b>
          </button>
          <button type="button" className="qi" onClick={() => navigateTo('shadowing')}>
            <span className="sdot" style={{ background: 'var(--cyan)' }} />
            <b>Minimal Pairs /θ/ vs /s/</b>
          </button>
          <button type="button" className="qi" onClick={() => navigateTo('fsrs')}>
            <span className="sdot" style={{ background: 'var(--indigo)' }} />
            <b>Membean Word Roots</b>
          </button>
        </div>

        <div className="sfoot">
          <div className="cap">
            <svg width="32" height="32" viewBox="0 0 36 36" aria-hidden="true">
              <circle cx="18" cy="18" r="14" fill="none" stroke="var(--track)" strokeWidth="3.5" />
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke="var(--cyan)"
                strokeWidth="3.5"
                strokeDasharray={`${Math.max(6, Math.round((immersionPct / 100) * 88))} 88`}
                strokeLinecap="round"
                transform="rotate(-90 18 18)"
              />
            </svg>
            <div className="cap-t">
              <b>{(state.stats.immersionMinutes / 60).toFixed(1)} / 1,000 hrs</b>
              <span>{state.stats.streakDays} ngày liên tiếp</span>
            </div>
          </div>
        </div>
      </aside>

      <div className="inset-sheet">
        <TopHeader
          title={meta.title}
          subtitle={meta.subtitle}
          badge={meta.badge}
          icon={currentIcon}
          theme={state.settings.theme}
          preview={preview}
          activeTab={activeTab}
          onToggleSidebar={toggleSidebarOrDrawer}
          onOpenPalette={() => setPaletteOpen(true)}
          onToggleTheme={() =>
            handleUpdateSettings({
              theme: state.settings.theme === 'dark' ? 'light' : 'dark',
            })
          }
          onChangePreview={(m) => {
            setMobileDrawerOpen(false);
            setPreview(m);
          }}
          onQuickAddCard={() => {
            setOpenAddFormNonce((n) => n + 1);
            navigateTo('fsrs');
          }}
        />

        <main className="main">
          <div className="wrap" style={{ paddingBottom: 76 }}>
            <Suspense
              fallback={
                <div className="panel" style={{ padding: 24, color: 'var(--muted)' }}>
                  Đang tải module học tập...
                </div>
              }
            >
              {activeTab === 'dashboard' && (
                <DashboardView
                  cards={state.cards}
                  stats={state.stats}
                  dailyGoalMinutes={state.settings.dailyGoalMinutes}
                  onNavigate={navigateTo}
                  onToggleDailyStep={(stepId) => {
                    setState((prev) => {
                      const exists = prev.stats.completedDailySteps.includes(stepId);
                      const nextSteps = exists
                        ? prev.stats.completedDailySteps.filter((s) => s !== stepId)
                        : [...prev.stats.completedDailySteps, stepId];
                      return {
                        ...prev,
                        stats: { ...prev.stats, completedDailySteps: nextSteps },
                      };
                    });
                  }}
                />
              )}

              {activeTab === 'curriculum' && (
                <CurriculumView
                  completedUnitIds={state.stats.completedUnitIds}
                  cefrLevel={state.stats.cefrLevel}
                  onCompleteUnit={(unitId) => {
                    setState((prev) => ({
                      ...prev,
                      stats: {
                        ...prev.stats,
                        completedUnitIds: prev.stats.completedUnitIds.includes(unitId)
                          ? prev.stats.completedUnitIds
                          : [...prev.stats.completedUnitIds, unitId],
                        dailyMinutesDone: prev.stats.dailyMinutesDone + 5,
                        immersionMinutes: prev.stats.immersionMinutes + 5,
                        dailyActivityLog: bumpDailyActivity(prev.stats.dailyActivityLog, 5),
                      },
                    }));
                    showToast('Đã ghi nhận hoàn thành Unit vào lộ trình CEFR!');
                  }}
                  onSavePlacementLevel={(cefr) => {
                    setState((prev) => ({
                      ...prev,
                      stats: { ...prev.stats, cefrLevel: cefr },
                    }));
                    showToast(`Đã cập nhật trình độ CEFR của bạn → ${cefr}`);
                  }}
                  onShowToast={showToast}
                />
              )}

              {activeTab === 'shadowing' && (
                <ShadowingStudio
                  onRecordScore={handleRecordPronunciation}
                  onShowToast={showToast}
                />
              )}

              {activeTab === 'tutor' && (
                <AITutorView
                  aiConfig={state.settings.aiConfig}
                  memoryLedger={state.memoryLedger}
                  savedSessions={state.tutorSessions}
                  initialTopicPrompt={tutorSeedPrompt}
                  onSaveSession={(scenarioId, session) => {
                    setState((prev) => ({
                      ...prev,
                      tutorSessions: {
                        ...prev.tutorSessions,
                        [scenarioId]: session,
                      },
                    }));
                  }}
                  onTutorOutcome={({ usedText, detectedMistakePattern }) => {
                    const lowerText = usedText.toLowerCase();
                    const now = Date.now();
                    setState((prev) => {
                      let nextLedger = prev.memoryLedger.map((item) => {
                        if (detectedMistakePattern && item.mistakePattern === detectedMistakePattern) {
                          return { ...item, lastPracticedAt: now, resolved: false };
                        }
                        const vocabHit =
                          item.targetVocab.length > 0 &&
                          lowerText.includes(item.targetVocab.toLowerCase());
                        if (vocabHit && !item.resolved) {
                          return { ...item, lastPracticedAt: now, resolved: true };
                        }
                        return item;
                      });

                      if (
                        detectedMistakePattern &&
                        !nextLedger.some((m) => m.mistakePattern === detectedMistakePattern)
                      ) {
                        nextLedger = [
                          {
                            id: `mem-${now}`,
                            mistakePattern: detectedMistakePattern,
                            targetVocab: usedText.slice(0, 28),
                            userGoal: 'Khắc phục lỗi diễn đạt trong hội thoại AI',
                            lastPracticedAt: now,
                            resolved: false,
                          },
                          ...nextLedger,
                        ];
                      }

                      return {
                        ...prev,
                        memoryLedger: nextLedger,
                        stats: {
                          ...prev.stats,
                          dailyActivityLog: bumpDailyActivity(prev.stats.dailyActivityLog, 1, now),
                        },
                      };
                    });
                  }}
                  onSaveWordToFsrs={(word, contextSentence) =>
                    handleAddCard({
                      word,
                      ipa: '',
                      meaningVi: `Từ luyện trong AI Tutor (${word})`,
                      clozeSentence: contextSentence.replace(
                        new RegExp(`\\b${word}\\b`, 'i'),
                        `{{${word}}}`
                      ),
                      deck: 'AI Tutor Mined',
                    })
                  }
                  onRecordPracticeMinutes={addStudyMinutes}
                  onShowToast={showToast}
                />
              )}

              {activeTab === 'writing' && (
                <WritingStudioView
                  aiConfig={state.settings.aiConfig}
                  writingDrafts={state.writingDrafts}
                  onUpdateDraft={(promptId, text) => {
                    setState((prev) => ({
                      ...prev,
                      writingDrafts: {
                        ...prev.writingDrafts,
                        [promptId]: text,
                      },
                    }));
                  }}
                  onRecordWritingMinutes={addStudyMinutes}
                  onSavePhraseToFsrs={(word, meaningVi, sentence) =>
                    handleAddCard({
                      word,
                      ipa: '',
                      meaningVi,
                      clozeSentence: sentence,
                      deck: 'IELTS Writing Upgrades',
                    })
                  }
                  onShowToast={showToast}
                />
              )}

              {activeTab === 'fsrs' && (
                <FSRSDeckView
                  cards={state.cards}
                  desiredRetention={state.settings.desiredRetention}
                  openAddFormNonce={openAddFormNonce}
                  onRateCard={handleRateCard}
                  onAddCard={(inp) => handleAddCard(inp)}
                  onBatchDelete={(ids) => {
                    setState((prev) => ({
                      ...prev,
                      cards: prev.cards.filter((c) => !ids.includes(c.id)),
                    }));
                    showToast(`Đã xóa ${ids.length} thẻ`);
                  }}
                  onBatchMoveDeck={(ids, deck) => {
                    setState((prev) => ({
                      ...prev,
                      cards: prev.cards.map((c) => (ids.includes(c.id) ? { ...c, deck } : c)),
                    }));
                    showToast(`Đã chuyển ${ids.length} thẻ vào "${deck}"`);
                  }}
                  onLaunchTutorWithWords={(words) => {
                    setTutorSeedPrompt(`Let us practice using these target words naturally: ${words.join(', ')}.`);
                    showToast(`Mở AI Tutor tập nói với: ${words.join(', ')}`);
                    navigateTo('tutor');
                  }}
                  onShowToast={showToast}
                />
              )}

              {activeTab === 'reader' && (
                <ImmersiveReader
                  wordFamiliarity={state.stats.wordFamiliarity}
                  customArticles={state.customArticles}
                  onAddCustomArticle={(article) => {
                    setState((prev) => ({
                      ...prev,
                      customArticles: [article, ...prev.customArticles],
                    }));
                  }}
                  onSetWordFamiliarity={(word, level) => {
                    setState((prev) => ({
                      ...prev,
                      stats: {
                        ...prev.stats,
                        wordFamiliarity: { ...prev.stats.wordFamiliarity, [word]: level },
                      },
                    }));
                    showToast(`Đã cập nhật mức thuộc "${word}" → Level ${level}`);
                  }}
                  onMineSentence={(payload) =>
                    handleAddCard({
                      word: payload.word,
                      ipa: payload.ipa,
                      meaningVi: payload.meaningVi,
                      clozeSentence: payload.clozeSentence,
                      translationVi: payload.translationVi,
                      sourceTitle: payload.sourceTitle,
                      deck: 'Mined from Reader',
                    })
                  }
                  onDiscussWithTutor={(question) => {
                    setTutorSeedPrompt(`Let's discuss this question from Engoo Reader: "${question}" — From my perspective, `);
                    navigateTo('tutor');
                    showToast('Đã chuyển câu hỏi thảo luận sang AI Tutor');
                  }}
                  onShowToast={showToast}
                />
              )}

              {activeTab === 'qwerty' && (
                <QwertyDictation
                  bestWpm={state.stats.typingWpmBest}
                  soundEffectsEnabled={state.settings.soundEffectsEnabled}
                  onUpdateBestWpm={(wpm) =>
                    setState((prev) => ({
                      ...prev,
                      stats: {
                        ...prev.stats,
                        typingWpmBest: wpm,
                        dailyActivityLog: bumpDailyActivity(prev.stats.dailyActivityLog, 1),
                      },
                    }))
                  }
                  onShowToast={showToast}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView
                  settings={state.settings}
                  cards={state.cards}
                  fullState={state}
                  onUpdateSettings={handleUpdateSettings}
                  onImportBackup={(imported) => setState(imported)}
                  onShowToast={showToast}
                  onResetAll={() => {
                    setState(createDefaultState());
                    showToast('Đã khôi phục toàn bộ dữ liệu mẫu T-English v2.0');
                  }}
                />
              )}
            </Suspense>
          </div>
        </main>

        <nav className="mobile-bottom-bar" aria-label="Thanh điều hướng nhanh iPhone">
          {(
            [
              { id: 'dashboard', label: 'Home', icon: <IconDashboard size={15} /> },
              { id: 'curriculum', label: 'CEFR', icon: <IconCurriculum size={15} /> },
              { id: 'tutor', label: 'Tutor', icon: <IconSparkChat size={15} /> },
              { id: 'writing', label: 'Write', icon: <IconPen size={15} /> },
              { id: 'fsrs', label: 'FSRS', icon: <IconCards size={15} /> },
            ] as Array<{ id: NavTab; label: string; icon: React.ReactNode }>
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              className={`mbb-btn ${activeTab === m.id ? 'on' : ''}`}
              onClick={() => navigateTo(m.id)}
            >
              {m.icon}
              <span>{m.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );

  return (
    <>
      {preview === 'iphone' ? (
        <div className="device-stage">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="tag">Chế độ xem trước iPhone 16 Pro (390×844)</span>
            <button type="button" className="gb sm" onClick={() => setPreview('auto')}>
              Quay lại Mac Desktop
            </button>
          </div>
          <div className="iphone-bezel">
            <div className="iphone-notch">
              <span>9:41</span>
              <div className="dynamic-island" />
              <span>5G</span>
            </div>
            {appShell}
          </div>
        </div>
      ) : (
        appShell
      )}

      {preview === 'auto' && (
        <FloatingMiniDock
          cards={state.cards}
          onAddStudyMinutes={addStudyMinutes}
          onShowToast={showToast}
        />
      )}

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        cards={state.cards}
        onNavigate={navigateTo}
        onToggleTheme={() =>
          handleUpdateSettings({
            theme: state.settings.theme === 'dark' ? 'light' : 'dark',
          })
        }
        onCycleGlass={() => {
          const order: Array<'clear' | 'balanced' | 'solid'> = ['clear', 'balanced', 'solid'];
          const next = order[(order.indexOf(state.settings.glass) + 1) % order.length];
          handleUpdateSettings({ glass: next });
          showToast(`Cường độ kính: ${next}`);
        }}
      />

      <div className={`toast ${toast ? 'on' : ''}`} role="status" aria-live="polite">
        {toast}
      </div>
    </>
  );
};
