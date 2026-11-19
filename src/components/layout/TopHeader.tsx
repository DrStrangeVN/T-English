import React from 'react';
import type { NavTab } from '../../App';
import type { ThemeMode, ViewportPreview } from '../../core/storage/db';
import {
  IconDeviceMac,
  IconDevicePhone,
  IconMenuBar,
  IconPlus,
  IconSearch,
  IconSidebar,
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
  ttsEngine?: 'system' | 'vieneu';
  onOpenTtsSettings?: () => void;
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
  onOpenTtsSettings,
}) => {
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
        <div className="seg hide-mobile" title="Chuyển đổi khung thiết bị Mac / iPhone / Menu Bar">
          <button
            type="button"
            className={preview === 'auto' || preview === 'mac' ? 'on' : ''}
            onClick={() => onChangePreview('auto')}
            title="Mac Desktop (1180×810)"
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

        {onOpenTtsSettings && (
          <button
            type="button"
            className={`gb sm hide-mobile ${ttsEngine === 'vieneu' ? 'hl' : ''}`}
            onClick={onOpenTtsSettings}
            title="Cấu hình Engine giọng đọc (System / VieNeu Local)"
          >
            <span>{ttsEngine === 'vieneu' ? 'VieNeu TTS' : 'System TTS'}</span>
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
