import React from 'react';
import type { AppSettings, GlassIntensity, ThemeMode } from '../../core/storage/db';
import type { AIProvider } from '../../core/ai/tutorService';
import type { FsrsCard } from '../../core/fsrs/fsrsEngine';
import { exportCardsToAnkiCsv } from '../../core/fsrs/fsrsEngine';
import { IconDownload } from '../icons/Icons';

interface SettingsViewProps {
  settings: AppSettings;
  cards: FsrsCard[];
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  onShowToast: (msg: string) => void;
  onResetAll: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  cards,
  onUpdateSettings,
  onShowToast,
  onResetAll,
}) => {
  const handleDownloadAnki = () => {
    const csv = exportCardsToAnkiCsv(cards);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'T-English-FSRS-Deck.csv';
    a.click();
    URL.revokeObjectURL(url);
    onShowToast(`Đã xuất ${cards.length} thẻ FSRS sang file CSV chuẩn Anki`);
  };

  return (
    <div style={{ maxWidth: 840 }}>
      <div style={{ fontSize: 11.5, fontWeight: 650, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
        Giao diện Minimal Specular Liquid Glass (Mac &amp; iPhone)
      </div>
      <div className="panel" style={{ padding: 0, overflow: 'hidden', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--line)', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 600 }}>Chế độ Màu sắc (Theme)</div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
              Dark (#0C0E14) hoặc Light (#F4F5F8) đồng bộ tức thì với macOS NSAppearance
            </div>
          </div>
          <div className="seg">
            {(['dark', 'light'] as ThemeMode[]).map((t) => (
              <button
                key={t}
                type="button"
                className={settings.theme === t ? 'on' : ''}
                onClick={() => onUpdateSettings({ theme: t })}
              >
                {t === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--line)', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 600 }}>Cường độ Kính mờ (Liquid Glass)</div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
              Clear / Balanced (mặc định Tahoe 26) / Solid độ tương phản cao
            </div>
          </div>
          <div className="seg">
            {(['clear', 'balanced', 'solid'] as GlassIntensity[]).map((g) => (
              <button
                key={g}
                type="button"
                className={settings.glass === g ? 'on' : ''}
                onClick={() => onUpdateSettings({ glass: g })}
              >
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 600 }}>Reduce Transparency (Trợ năng &amp; Tiết kiệm Pin)</div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
              Chuyển bề mặt kính sang nền đặc sắc nét, tắt backdrop-filter
            </div>
          </div>
          <label className="sw">
            <input
              type="checkbox"
              checked={settings.reduceTransparency}
              onChange={(e) => onUpdateSettings({ reduceTransparency: e.target.checked })}
            />
            <i />
          </label>
        </div>
      </div>

      <div style={{ fontSize: 11.5, fontWeight: 650, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
        Thuật toán FSRS v5 &amp; Mục tiêu Ngày
      </div>
      <div className="panel" style={{ padding: 0, overflow: 'hidden', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--line)', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 600 }}>Desired Retention ({Math.round(settings.desiredRetention * 100)}%)</div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
              Tỷ lệ ghi nhớ mục tiêu của FSRS v5 (90% là tối ưu giữa số thẻ ôn &amp; độ nhớ)
            </div>
          </div>
          <input
            type="range"
            min={80}
            max={97}
            value={Math.round(settings.desiredRetention * 100)}
            onChange={(e) => onUpdateSettings({ desiredRetention: Number(e.target.value) / 100 })}
            style={{ width: 160 }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 600 }}>Mục tiêu Thời lượng Hằng ngày</div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
              Tích lũy cho lộ trình 1,000 Giờ Nghe–Đọc–Nói
            </div>
          </div>
          <div className="seg">
            {[15, 25, 45, 60].map((m) => (
              <button
                key={m}
                type="button"
                className={settings.dailyGoalMinutes === m ? 'on' : ''}
                onClick={() => onUpdateSettings({ dailyGoalMinutes: m })}
              >
                {m}m
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 11.5, fontWeight: 650, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
        Cấu hình AI Tutor Provider (Cloud hoặc Offline)
      </div>
      <div className="panel" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontWeight: 600 }}>Nhà cung cấp AI</div>
          <div className="seg">
            {(['builtin', 'openai', 'gemini', 'ollama'] as AIProvider[]).map((p) => (
              <button
                key={p}
                type="button"
                className={settings.aiConfig.provider === p ? 'on' : ''}
                onClick={() =>
                  onUpdateSettings({
                    aiConfig: { ...settings.aiConfig, provider: p },
                  })
                }
              >
                {p === 'builtin' ? 'Built-in Offline' : p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {settings.aiConfig.provider !== 'builtin' && settings.aiConfig.provider !== 'ollama' && (
          <div className="grid2">
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>API Key (lưu cục bộ trên máy)</span>
              <input
                type="password"
                className="input-field"
                value={settings.aiConfig.apiKey}
                placeholder="sk-... hoặc AIza..."
                onChange={(e) =>
                  onUpdateSettings({
                    aiConfig: { ...settings.aiConfig, apiKey: e.target.value },
                  })
                }
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>Model</span>
              <input
                className="input-field"
                value={settings.aiConfig.model}
                placeholder="gpt-4o-mini / gemini-2.0-flash"
                onChange={(e) =>
                  onUpdateSettings({
                    aiConfig: { ...settings.aiConfig, model: e.target.value },
                  })
                }
              />
            </label>
          </div>
        )}

        {settings.aiConfig.provider === 'ollama' && (
          <div className="grid2">
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>Ollama Endpoint</span>
              <input
                className="input-field"
                value={settings.aiConfig.ollamaUrl}
                onChange={(e) =>
                  onUpdateSettings({
                    aiConfig: { ...settings.aiConfig, ollamaUrl: e.target.value },
                  })
                }
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>Local Model Name</span>
              <input
                className="input-field"
                value={settings.aiConfig.model}
                placeholder="llama3.2 / qwen2.5"
                onChange={(e) =>
                  onUpdateSettings({
                    aiConfig: { ...settings.aiConfig, model: e.target.value },
                  })
                }
              />
            </label>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button type="button" className="pb" onClick={handleDownloadAnki}>
          <IconDownload size={14} />
          <span>Xuất toàn bộ bộ thẻ FSRS (.csv cho Anki)</span>
        </button>
        <button
          type="button"
          className="gb"
          style={{ color: 'var(--rose)' }}
          onClick={onResetAll}
        >
          Khôi phục dữ liệu mẫu mặc định
        </button>
      </div>
    </div>
  );
};
