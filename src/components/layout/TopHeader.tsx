import React from 'react';
import type { NavTab } from '../../App';
import type { SpeechEngine, ThemeMode, ViewportPreview } from '../../core/storage/db';
import type { SpeechRuntimeState } from '../../core/phonetics/speechIO';
import {
  IconBell,
  IconBellRing,
  IconDeviceMac,
  IconDevicePhone,
  IconMenuBar,
  IconPlus,
  IconSearch,
  IconSidebar,
  IconStop,
  IconSunMoon,
} from '../icons/Icons';

interface TopHeaderProps {
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ReactNode;
  theme: ThemeMode;
  preview: ViewportPreview;
  onToggleSidebar: () => void;
  onOpenPalette: () => void;
  onToggleTheme: () => void;
  onChangePreview: (mode: ViewportPreview) => void;
  onQuickAddCard: () => void;
  activeTab: NavTab;
  ttsEngine?: SpeechEngine;
  speechRuntime?: SpeechRuntimeState;
  onStopSpeaking?: () => void;
  onOpenTtsSettings?: () => void;
  vocabNotifyEnabled?: boolean;
  onTriggerVocabNotify?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  title,
  subtitle,
  badge,
  icon,
  preview,
  onToggleSidebar,
  onOpenPalette,
  onToggleTheme,
  onChangePreview,
  onQuickAddCard,
  ttsEngine = 'system',
  speechRuntime,
  onStopSpeaking,
  onOpenTtsSettings,
  vocabNotifyEnabled = false,
  onTriggerVocabNotify,
}) => {
  const isSpeaking = speechRuntime && speechRuntime.status !== 'idle';
  const ttsLabel =
    ttsEngine === 'hybrid'
      ? 'Hybrid EN+VieNeu'
      : ttsEngine === 'vieneu'
        ? 'VieNeu 48kHz'
        : 'System TTS';

  return (
    <header className="top">
      <div className="top-l">
        <button
          id="b-sb-quick"
          type="button"
          className="ib"
          aria-label="Mở thanh điều hướng"
          onClick={onToggleSidebar}
        >
          <IconSidebar size={16} />
        </button>
        <div className="p-hero-ic">{icon}</div>
        <div>
          <h1>
            <span>{title}</span>
            <span className="ver-pill">{badge}</span>
          </h1>
          <div className="sub">{subtitle}</div>
        </div>
      </div>

      <div className="acts">
        {isSpeaking && onStopSpeaking && (
          <button
            type="button"
            className="gb sm hl"
            onClick={onStopSpeaking}
            title="Dừng phát giọng đọc hiện tại"
          >
            <span className="audio-dot" />
            <span>{speechRuntime.status === 'loading' ? 'Đang tạo giọng...' : 'Đang đọc'}</span>
            <IconStop size={11} />
          </button>
        )}

        <div className="seg hide-mobile" title="Chuyển đổi khung thiết bị Mac / iPhone / Menu Bar">
          <button
            type="button"
            className={preview === 'auto' || preview === 'mac' ? 'on' : ''}
            onClick={() => onChangePreview('auto')}
            title="Mac Desktop"
          >
            <IconDeviceMac size={13} />
            <span>Mac</span>
          </button>
          <button
            type="button"
            className={preview === 'iphone' ? 'on' : ''}
            onClick={() => onChangePreview('iphone')}
            title="iPhone 16 Pro Preview (390×844)"
          >
            <IconDevicePhone size={13} />
            <span>iPhone</span>
          </button>
          <button
            type="button"
            className={preview === 'menubar' ? 'on' : ''}
            onClick={() => onChangePreview('menubar')}
            title="macOS Menu Bar Popover (364px)"
          >
            <IconMenuBar size={13} />
            <span>364px</span>
          </button>
        </div>

        <button
          type="button"
          className="search"
          onClick={onOpenPalette}
          title="Mở Command Palette (⌘K)"
        >
          <IconSearch size={14} />
          <span>Tìm từ, lệnh...</span>
          <kbd>⌘K</kbd>
        </button>

        {onTriggerVocabNotify && (
          <button
            type="button"
            className={`ib ${vocabNotifyEnabled ? 'active' : ''}`}
            onClick={onTriggerVocabNotify}
            title="Hiện thông báo học 1 từ vựng ngay lập tức"
            aria-label="Thông báo học từ vựng ngay"
          >
            {vocabNotifyEnabled ? <IconBellRing size={16} /> : <IconBell size={16} />}
          </button>
        )}

        {onOpenTtsSettings && (
          <button
            type="button"
            className={`gb sm hide-mobile ${ttsEngine !== 'system' ? 'hl' : ''}`}
            onClick={onOpenTtsSettings}
            title="Cấu hình Engine giọng đọc (Hybrid / VieNeu 48kHz / System)"
          >
            <span>{ttsLabel}</span>
          </button>
        )}

        <button
          type="button"
          className="ib"
          onClick={onToggleTheme}
          title="Đổi Dark / Light Mode"
          aria-label="Đổi giao diện Sáng/Tối"
        >
          <IconSunMoon size={16} />
        </button>

        <button type="button" className="pb" onClick={onQuickAddCard}>
          <IconPlus size={14} />
          <span>Thêm thẻ</span>
        </button>
      </div>
    </header>
  );
};
