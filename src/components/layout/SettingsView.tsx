import React, { useMemo, useRef, useState } from 'react';
import {
  exportStateBackup,
  importStateBackup,
  type AppSettings,
  type GlassIntensity,
  type SpeechEngine,
  type TEnglishState,
  type ThemeMode,
} from '../../core/storage/db';
import type { AIProvider } from '../../core/ai/tutorService';
import type { FsrsCard } from '../../core/fsrs/fsrsEngine';
import { exportCardsToAnkiCsv } from '../../core/fsrs/fsrsEngine';
import {
  checkVieneuHealth,
  clearSpeechCache,
  exportTextFile,
  fetchVieneuVoices,
  speakEnglish,
  speakVietnamese,
  type VieneuVoice,
} from '../../core/phonetics/speechIO';
import { IconDownload, IconUpload, IconVolume } from '../icons/Icons';

interface SettingsViewProps {
  settings: AppSettings;
  cards: FsrsCard[];
  fullState?: TEnglishState;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  onImportBackup?: (nextState: TEnglishState) => void;
  onShowToast: (msg: string) => void;
  onResetAll: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  cards,
  fullState,
  onUpdateSettings,
  onImportBackup,
  onShowToast,
  onResetAll,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [vieneuStatus, setVieneuStatus] = useState<{
    state: 'idle' | 'checking' | 'ok' | 'error';
    message: string;
  }>({ state: 'idle', message: '' });
  const [vieneuVoices, setVieneuVoices] = useState<VieneuVoice[]>([]);
  const [voiceFilter, setVoiceFilter] = useState('');

  const updateTts = (patch: Partial<AppSettings['ttsConfig']>) => {
    clearSpeechCache();
    onUpdateSettings({
      ttsConfig: { ...settings.ttsConfig, ...patch },
    });
  };

  const filteredVoices = useMemo(() => {
    const q = voiceFilter.trim().toLowerCase();
    if (!q) return vieneuVoices;
    return vieneuVoices.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.id.toLowerCase().includes(q) ||
        (v.description?.toLowerCase().includes(q) ?? false)
    );
  }, [vieneuVoices, voiceFilter]);

  const handleCheckVieneu = async () => {
    setVieneuStatus({ state: 'checking', message: 'Đang kết nối VieNeu Local Engine...' });
    const health = await checkVieneuHealth(
      settings.ttsConfig.vieneuUrl,
      settings.ttsConfig.vieneuToken
    );
    if (!health.ok) {
      setVieneuStatus({ state: 'error', message: health.message });
      onShowToast(health.message);
      return;
    }

    const voicesRes = await fetchVieneuVoices(
      settings.ttsConfig.vieneuUrl,
      settings.ttsConfig.vieneuToken
    );
    if (voicesRes.ok && voicesRes.voices.length > 0) {
      setVieneuVoices(voicesRes.voices);
      const currentValid = voicesRes.voices.some((v) => v.id === settings.ttsConfig.voiceId);
      if (!currentValid) {
        const first = voicesRes.voices[0];
        updateTts({ voiceId: first.id, voiceName: first.name });
      }
      const msg = `Kết nối thành công · Đã nạp ${voicesRes.voices.length} giọng VieNeu`;
      setVieneuStatus({ state: 'ok', message: msg });
      onShowToast(msg);
    } else {
      setVieneuStatus({
        state: 'ok',
        message: 'VieNeu Engine sẵn sàng (dùng giọng mặc định của server).',
      });
      onShowToast('VieNeu Engine sẵn sàng!');
    }
  };

  const handleDownloadAnki = () => {
    const csv = exportCardsToAnkiCsv(cards);
    exportTextFile('T-English-FSRS-Deck.csv', csv, 'text/csv;charset=utf-8;');
    onShowToast(`Đã xuất ${cards.length} thẻ FSRS sang file CSV chuẩn Anki`);
  };

  const handleExportBackup = () => {
    if (!fullState) return;
    const json = exportStateBackup(fullState, false);
    exportTextFile('T-English-Backup.json', json, 'application/json;charset=utf-8;');
    onShowToast('Đã xuất bản sao lưu JSON (đã ẩn API key & token để bảo mật).');
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const imported = importStateBackup(text);
      onImportBackup?.(imported);
      onShowToast('Đã khôi phục toàn bộ tiến độ học tập từ Backup JSON.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'File backup không hợp lệ';
      onShowToast(`Không thể nhập Backup: ${msg}`);
    }
  };

  return (
    <div style={{ maxWidth: 840 }}>
      <div
        style={{
          fontSize: 11.5,
          fontWeight: 650,
          color: 'var(--muted)',
          marginBottom: 8,
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
        }}
      >
        Giao diện Minimal Specular Liquid Glass (Mac &amp; iPhone)
      </div>
      <div className="panel" style={{ padding: 0, overflow: 'hidden', marginBottom: 18 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid var(--line)',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
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

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid var(--line)',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
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

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid var(--line)',
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontWeight: 600 }}>Reduce Transparency (Trợ năng &amp; Tiết kiệm Pin)</div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
              Chuyển bề mặt kính sang nền đặc sắc nét, tắt backdrop-filter
            </div>
          </div>
          <label className="sw">
            <input
              id="settings-reduce-transparency"
              name="reduceTransparency"
              aria-label="Reduce Transparency"
              type="checkbox"
              checked={settings.reduceTransparency}
              onChange={(e) => onUpdateSettings({ reduceTransparency: e.target.checked })}
            />
            <i />
          </label>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontWeight: 600 }}>Âm thanh Tương tác (Web Audio Mechanical Click &amp; Chime)</div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
              Phát tiếng phím cơ nhẹ khi gõ Qwerty và chuông hoàn thành FSRS / Mission
            </div>
          </div>
          <label className="sw">
            <input
              id="settings-sound-effects"
              name="soundEffectsEnabled"
              aria-label="Bật tắt âm thanh tương tác"
              type="checkbox"
              checked={settings.soundEffectsEnabled}
              onChange={(e) => onUpdateSettings({ soundEffectsEnabled: e.target.checked })}
            />
            <i />
          </label>
        </div>
      </div>

      {/* VieNeu Local TTS Engine & Voice Config */}
      <div
        style={{
          fontSize: 11.5,
          fontWeight: 650,
          color: 'var(--muted)',
          marginBottom: 8,
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
        }}
      >
        Giọng đọc AI &amp; VieNeu Local TTS (macOS / Web)
      </div>
      <div className="panel" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontWeight: 600 }}>Engine phát âm giọng nói</div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
              Dùng giọng hệ thống macOS/iOS hoặc kết nối VieNeu v3 Turbo trên máy (tự fallback nếu offline)
            </div>
          </div>
          <div className="seg">
            {(
              [
                { id: 'system', label: 'System Speech' },
                { id: 'vieneu', label: 'VieNeu Local TTS' },
              ] as Array<{ id: SpeechEngine; label: string }>
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={settings.ttsConfig.engine === opt.id ? 'on' : ''}
                onClick={() => updateTts({ engine: opt.id })}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid2">
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>VieNeu Endpoint URL</span>
            <input
              id="settings-vieneu-url"
              name="vieneuUrl"
              aria-label="Địa chỉ VieNeu Local TTS Endpoint"
              className="input-field"
              value={settings.ttsConfig.vieneuUrl}
              placeholder="http://127.0.0.1:8765"
              onChange={(e) => updateTts({ vieneuUrl: e.target.value })}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>
              Mã truy cập VieNeu Studio (tùy chọn, lấy từ Share Studio / Engine)
            </span>
            <input
              id="settings-vieneu-token"
              name="vieneuToken"
              aria-label="Mã truy cập VieNeu Studio Token"
              type="password"
              className="input-field"
              value={settings.ttsConfig.vieneuToken}
              placeholder="X-VieNeu-Studio-Token (bỏ trống nếu cổng mở)"
              onChange={(e) => updateTts({ vieneuToken: e.target.value })}
            />
          </label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>Cổng gợi ý:</span>
          {[
            { label: 'VieNeu Studio (8765)', url: 'http://127.0.0.1:8765' },
            { label: 'VieNeu Web (7860)', url: 'http://127.0.0.1:7860' },
            { label: 'OpenAI Speech (23333)', url: 'http://127.0.0.1:23333' },
          ].map((preset) => (
            <button
              key={preset.url}
              type="button"
              className="gb sm"
              onClick={() => updateTts({ vieneuUrl: preset.url })}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>
              Tốc độ đọc VieNeu ({settings.ttsConfig.speed.toFixed(2)}x)
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
              0.75x (nghe chậm Shadowing) → 1.00x (chuẩn) → 1.35x (ôn tập nhanh)
            </div>
          </div>
          <input
            id="settings-vieneu-speed"
            name="vieneuSpeed"
            aria-label="Tốc độ giọng đọc VieNeu"
            type="range"
            min={75}
            max={135}
            step={5}
            value={Math.round(settings.ttsConfig.speed * 100)}
            onChange={(e) => updateTts({ speed: Number(e.target.value) / 100 })}
            style={{ width: 160 }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>Đọc bản dịch &amp; giải thích tiếng Việt bằng VieNeu</div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
              Phát giọng tiếng Việt tự nhiên trong Engoo Reader &amp; phản hồi AI Roleplay
            </div>
          </div>
          <label className="sw">
            <input
              id="settings-vieneu-vi"
              name="useVieneuForVietnamese"
              aria-label="Dùng VieNeu đọc giải thích tiếng Việt"
              type="checkbox"
              checked={settings.ttsConfig.useVieneuForVietnamese}
              onChange={(e) => updateTts({ useVieneuForVietnamese: e.target.checked })}
            />
            <i />
          </label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="pb sm"
            disabled={vieneuStatus.state === 'checking'}
            onClick={handleCheckVieneu}
          >
            {vieneuStatus.state === 'checking'
              ? 'Đang kiểm tra...'
              : 'Kiểm tra kết nối & Tải giọng VieNeu'}
          </button>
          <button
            type="button"
            className="gb sm"
            onClick={() => speakEnglish('Resilient architectures balance latency and consistency.')}
          >
            <IconVolume size={13} />
            <span>Nghe thử (EN)</span>
          </button>
          <button
            type="button"
            className="gb sm"
            onClick={() => speakVietnamese('Xin chào, đây là giọng đọc VieNeu hỗ trợ song ngữ trong T-English.')}
          >
            <IconVolume size={13} />
            <span>Nghe thử (VI)</span>
          </button>
          {vieneuStatus.message && (
            <span
              className="tag"
              style={{
                color: vieneuStatus.state === 'ok' ? 'var(--green)' : vieneuStatus.state === 'error' ? 'var(--rose)' : 'var(--cyan)',
                background: vieneuStatus.state === 'ok' ? 'var(--green-s)' : vieneuStatus.state === 'error' ? 'var(--rose-s)' : 'var(--cyan-s)',
              }}
            >
              {vieneuStatus.message}
            </span>
          )}
        </div>

        {vieneuVoices.length > 0 && (
          <div className="grid2">
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                Tìm giọng đọc ({filteredVoices.length}/{vieneuVoices.length})
              </span>
              <input
                id="settings-vieneu-voice-search"
                name="vieneuVoiceSearch"
                aria-label="Tìm kiếm giọng đọc VieNeu"
                className="input-field"
                value={voiceFilter}
                placeholder="Lọc theo tên giọng (VD: Nhật Phong, Common Voice...)"
                onChange={(e) => setVoiceFilter(e.target.value)}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>Giọng VieNeu đang chọn</span>
              <select
                id="settings-vieneu-voice"
                name="vieneuVoiceId"
                aria-label="Chọn giọng đọc VieNeu"
                className="input-field"
                value={settings.ttsConfig.voiceId}
                onChange={(e) => {
                  const chosen = vieneuVoices.find((v) => v.id === e.target.value);
                  updateTts({
                    voiceId: e.target.value,
                    voiceName: chosen?.name ?? e.target.value,
                  });
                }}
              >
                {filteredVoices.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}{v.description ? ` — ${v.description}` : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </div>

      <div
        style={{
          fontSize: 11.5,
          fontWeight: 650,
          color: 'var(--muted)',
          marginBottom: 8,
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
        }}
      >
        Thuật toán FSRS v5 &amp; Mục tiêu Ngày
      </div>
      <div className="panel" style={{ padding: 0, overflow: 'hidden', marginBottom: 18 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid var(--line)',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ fontWeight: 600 }}>Desired Retention ({Math.round(settings.desiredRetention * 100)}%)</div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
              Tỷ lệ ghi nhớ mục tiêu của FSRS v5 (90% là tối ưu giữa số thẻ ôn &amp; độ nhớ)
            </div>
          </div>
          <input
            id="settings-desired-retention"
            name="desiredRetention"
            aria-label="Tỷ lệ ghi nhớ mục tiêu FSRS"
            type="range"
            min={80}
            max={97}
            value={Math.round(settings.desiredRetention * 100)}
            onChange={(e) => onUpdateSettings({ desiredRetention: Number(e.target.value) / 100 })}
            style={{ width: 160 }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
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

      <div
        style={{
          fontSize: 11.5,
          fontWeight: 650,
          color: 'var(--muted)',
          marginBottom: 8,
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
        }}
      >
        Cấu hình AI Tutor &amp; Writing Provider (Cloud hoặc Offline)
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
          <>
            <div className="grid2">
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>API Key (lưu cục bộ trên máy)</span>
                <input
                  id="settings-ai-api-key"
                  name="aiApiKey"
                  aria-label="API Key cho nhà cung cấp AI"
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
                  id="settings-ai-model"
                  name="aiModel"
                  aria-label="Tên Model AI"
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
            <div
              style={{
                padding: '8px 10px',
                borderRadius: 10,
                background: 'var(--raised)',
                border: '1px solid var(--line)',
                fontSize: 11.5,
                color: 'var(--amber)',
              }}
            >
              Lưu ý bảo mật: Khi chạy trên Web, API Key được lưu trong <span className="mono">localStorage</span> của trình duyệt hiện tại và được tự động loại bỏ khi xuất Backup JSON. Chỉ nên sử dụng key có giới hạn chi tiêu hoặc dùng Ollama offline.
            </div>
          </>
        )}

        {settings.aiConfig.provider === 'ollama' && (
          <div className="grid2">
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>Ollama Endpoint</span>
              <input
                id="settings-ollama-url"
                name="ollamaUrl"
                aria-label="Địa chỉ Ollama Endpoint"
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
                id="settings-ollama-model"
                name="ollamaModel"
                aria-label="Tên Model Ollama Local"
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
        {fullState && (
          <button type="button" className="gb" onClick={handleExportBackup}>
            <IconDownload size={14} />
            <span>Xuất Backup JSON</span>
          </button>
        )}
        {onImportBackup && (
          <>
            <input
              ref={fileInputRef}
              id="settings-import-backup-file"
              name="importBackupFile"
              aria-label="Chọn file sao lưu JSON để khôi phục"
              type="file"
              accept="application/json,.json"
              style={{ display: 'none' }}
              onChange={handleImportFileChange}
            />
            <button
              type="button"
              className="gb"
              onClick={() => fileInputRef.current?.click()}
            >
              <IconUpload size={14} />
              <span>Nhập Backup JSON</span>
            </button>
          </>
        )}
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
