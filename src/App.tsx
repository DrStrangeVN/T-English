import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  scheduleCard,
  type FsrsCard,
  type FsrsRating,
} from './core/fsrs/fsrsEngine';
import { wordToIpa } from './core/phonetics/ipaScorer';
import { notifyMacNativeHost } from './core/phonetics/speechIO';
import {
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
  IconDashboard,
  IconKeyboard,
  IconLogo,
  IconSettings,
  IconSidebar,
  IconSparkChat,
  IconWaveform,
} from './components/icons/Icons';
import { TopHeader } from './components/layout/TopHeader';
import { CommandPalette } from './components/layout/CommandPalette';
import { MenuBarPopover } from './components/layout/MenuBarPopover';
import { SettingsView } from './components/layout/SettingsView';
import { DashboardView } from './components/modules/DashboardView';
import { ShadowingStudio } from './components/modules/ShadowingStudio';
import { AITutorView } from './components/modules/AITutorView';
import { FSRSDeckView } from './components/modules/FSRSDeckView';
import { ImmersiveReader } from './components/modules/ImmersiveReader';
import { QwertyDictation } from './components/modules/QwertyDictation';

export type NavTab =
  | 'dashboard'
  | 'shadowing'
  | 'tutor'
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
    subtitle: 'Tổng quan FSRS v5, IELTS Speaking Index & lộ trình 1,000 giờ',
    badge: 'Tahoe 26',
  },
  shadowing: {
    label: 'Shadowing IPA',
    title: 'AI Phonetics & Shadowing',
    subtitle: 'Phân tích từng âm vị IPA, sóng âm AB-Loop & đường cao độ Pitch F0',
    badge: 'CoreML / WebAudio',
  },
  tutor: {
    label: 'AI Roleplay',
    title: 'Real-Time AI Tutor',
    subtitle: 'Hội thoại thực chiến, sửa lỗi tức thì & Explain My Mistake',
    badge: 'Memory Ledger',
  },
  fsrs: {
    label: 'FSRS Deck',
    title: 'FSRS v5 Flashcards',
    subtitle: 'Lặp lại ngắt quãng khoa học S/D/R & Sentence Miner đa tầng',
    badge: 'FSRS v5',
  },
  reader: {
    label: 'Dual-Sub Reader',
    title: 'Immersive Reader Studio',
    subtitle: 'Phụ đề song ngữ, Popover tra từ 364px & AI Grammar X-Ray',
    badge: 'Comprehensible Input',
  },
  qwerty: {
    label: 'Qwerty Lab',
    title: 'Dictation & Muscle Memory',
    subtitle: 'Luyện gõ từ vựng tốc độ cao & nghe chép chính tả IELTS',
    badge: 'Typing Lab',
  },
  settings: {
    label: 'Cài đặt',
    title: 'System & AI Preferences',
    subtitle: 'Cấu hình Liquid Glass, FSRS Retention & AI Providers',
    badge: 'Sync Local-First',
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

  // Persist state locally
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Apply Liquid Glass classes on <body> & notify macOS native host
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
      statusSummary: `${state.stats.streakDays}d streak · ${dueCount} due`,
    });
  }, [state.settings, state.cards, state.stats.streakDays, sidebarCollapsed, mobileDrawerOpen]);

  // Keyboard shortcuts: Cmd+K, Cmd+\, Cmd+1..7
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
          '2': 'shadowing',
          '3': 'tutor',
          '4': 'fsrs',
          '5': 'reader',
          '6': 'qwerty',
          '7': 'settings',
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
        },
      };
    });
  };

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
    { id: 'shadowing', label: 'Shadowing IPA', icon: <IconWaveform size={15} /> },
    { id: 'tutor', label: 'AI Roleplay', icon: <IconSparkChat size={15} /> },
    {
      id: 'fsrs',
      label: 'FSRS Deck',
      badge: dueCount > 0 ? String(dueCount) : undefined,
      icon: <IconCards size={15} />,
    },
    { id: 'reader', label: 'Dual-Sub Reader', icon: <IconBook size={15} /> },
    { id: 'qwerty', label: 'Qwerty Lab', icon: <IconKeyboard size={15} /> },
    { id: 'settings', label: 'Cài đặt', icon: <IconSettings size={15} /> },
  ];

  // Standalone 364px Menu Bar Popover mode (used by macOS NSStatusItem & Preview)
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
      <div
        className="drawer-scrim"
        onClick={() => setMobileDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Left Liquid Glass Sidebar Rail (246px Desktop / 268px Mobile Drawer) */}
      <aside className="side" aria-label="Điều hướng chính">
        <div className="brand">
          <div className="logo">
            <IconLogo size={15} />
          </div>
          <b>T-English</b>
          <span className="ver-pill">v1.0</span>
          <button
            type="button"
            className="sb-collapse"
            title="Thu gọn Sidebar (⌘\)"
            onClick={toggleSidebarOrDrawer}
          >
            <IconSidebar size={15} />
          </button>
        </div>

        <div className="slabel">Học tập &amp; Luyện tập</div>
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
          <button type="button" className="qi" onClick={() => navigateTo('shadowing')}>
            <span className="sdot" style={{ background: 'var(--cyan)' }} />
            <b>Luyện âm yếu /θ/ &amp; /ð/</b>
          </button>
          <button type="button" className="qi" onClick={() => navigateTo('tutor')}>
            <span className="sdot" style={{ background: 'var(--green)' }} />
            <b>System Design Roleplay</b>
          </button>
          <button type="button" className="qi" onClick={() => navigateTo('reader')}>
            <span className="sdot" style={{ background: 'var(--indigo)' }} />
            <b>1000H Input Transcript</b>
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

      {/* Main Crisp Matte Inset Content Sheet */}
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
          onQuickAddCard={() => navigateTo('fsrs')}
        />

        <main className="main">
          <div className="wrap">
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
                onRecordPracticeMinutes={(mins) =>
                  setState((prev) => ({
                    ...prev,
                    stats: {
                      ...prev.stats,
                      dailyMinutesDone: prev.stats.dailyMinutesDone + mins,
                      immersionMinutes: prev.stats.immersionMinutes + mins,
                    },
                  }))
                }
                onShowToast={showToast}
              />
            )}

            {activeTab === 'fsrs' && (
              <FSRSDeckView
                cards={state.cards}
                desiredRetention={state.settings.desiredRetention}
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
                  showToast(`Mở AI Tutor tập nói với: ${words.join(', ')}`);
                  navigateTo('tutor');
                }}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'reader' && (
              <ImmersiveReader
                wordFamiliarity={state.stats.wordFamiliarity}
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
                onShowToast={showToast}
              />
            )}

            {activeTab === 'qwerty' && (
              <QwertyDictation
                bestWpm={state.stats.typingWpmBest}
                onUpdateBestWpm={(wpm) =>
                  setState((prev) => ({
                    ...prev,
                    stats: { ...prev.stats, typingWpmBest: wpm },
                  }))
                }
                onShowToast={showToast}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                settings={state.settings}
                cards={state.cards}
                onUpdateSettings={handleUpdateSettings}
                onShowToast={showToast}
                onResetAll={() => {
                  setState(createDefaultState());
                  showToast('Đã khôi phục toàn bộ dữ liệu mẫu T-English');
                }}
              />
            )}
          </div>
        </main>

        {/* Bottom Glass Pill Bar for iPhone */}
        <nav className="mobile-bottom-bar" aria-label="Thanh điều hướng nhanh iPhone">
          {(
            [
              { id: 'dashboard', label: 'Home', icon: <IconDashboard size={15} /> },
              { id: 'shadowing', label: 'IPA', icon: <IconWaveform size={15} /> },
              { id: 'tutor', label: 'Tutor', icon: <IconSparkChat size={15} /> },
              { id: 'fsrs', label: 'FSRS', icon: <IconCards size={15} /> },
              { id: 'reader', label: 'Read', icon: <IconBook size={15} /> },
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
