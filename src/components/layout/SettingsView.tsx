import React, { useMemo, useRef, useState } from 'react';
import {
  exportStateBackup,
  importStateBackup,
  type AppSettings,
  type EnglishAccent,
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
  getAvailableEnglishVoices,
  hasNativeMacBridge,
  speakBilingual,
  speakEnglish,
  speakVietnamese,
  startLocalVieneuDaemon,
  stopLocalVieneuDaemon,
  type VieneuVoice,
} from '../../core/phonetics/speechIO';
import { IconBellRing, IconDownload, IconHeadphones, IconPlay, IconStop, IconUpload, IconVolume } from '../icons/Icons';

interface SettingsViewProps {
  settings: AppSettings;
  cards: FsrsCard[];
  fullState?: TEnglishState;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  onImportBackup?: (nextState: TEnglishState) => void;
  onShowToast: (msg: string) => void;
  onTriggerVocabNotifyNow?: () => void;
  onCleanStart?: () => void;
  onResetAll: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  cards,
  fullState,
  onUpdateSettings,
  onImportBackup,
  onShowToast,
  onTriggerVocabNotifyNow,
  onCleanStart,
  onResetAll,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [vieneuStatus, setVieneuStatus] = useState<{
    state: 'idle' | 'checking' | 'ok' | 'error';
    message: string;
  }>({ state: 'idle', message: '' });
  const [vieneuVoices, setVieneuVoices] = useState<VieneuVoice[]>([]);
  const [voiceFilter, setVoiceFilter] = useState('');
  const [launchingDirect, setLaunchingDirect] = useState(false);

  const systemEnglishVoices = useMemo(() => getAvailableEnglishVoices(), []);

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

  const handleCheckVieneu = async (overrideUrl?: string) => {
    const targetUrl = overrideUrl ?? settings.ttsConfig.vieneuUrl;
    setVieneuStatus({ state: 'checking', message: 'Đang kết nối VieNeu Local Engine...' });
    const health = await checkVieneuHealth(targetUrl, settings.ttsConfig.vieneuToken);
    if (!health.ok) {
      setVieneuStatus({ state: 'error', message: health.message });
      onShowToast(health.message);
      return;
    }

    const voicesRes = await fetchVieneuVoices(targetUrl, settings.ttsConfig.vieneuToken);
    if (voicesRes.ok && voicesRes.voices.length > 0) {
      setVieneuVoices(voicesRes.voices);
      const currentValid = voicesRes.voices.some((v) => v.id === settings.ttsConfig.voiceId);
      if (!currentValid) {
        const first = voicesRes.voices[0];
        updateTts({ voiceId: first.id, voiceName: first.name, vieneuUrl: targetUrl });
      }
      const msg = `${health.message} · Đã nạp ${voicesRes.voices.length} giọng VieNeu`;
      setVieneuStatus({ state: 'ok', message: msg });
      onShowToast(msg);
    } else {
      setVieneuStatus({ state: 'ok', message: health.message });
      onShowToast(health.message);
    }
  };

  const handleLaunchDirectVieneu = async () => {
    setLaunchingDirect(true);
    const directUrl = 'http://127.0.0.1:8766';
    updateTts({ vieneuUrl: directUrl, engine: 'hybrid', vieneuMode: 'direct' });
    const res = await startLocalVieneuDaemon(8766);
    onShowToast(res.message);
    setVieneuStatus({ state: res.ok ? 'checking' : 'error', message: res.message });
    if (res.ok) {
      window.setTimeout(() => {
        void handleCheckVieneu(directUrl).finally(() => setLaunchingDirect(false));
      }, 3600);
    } else {
      setLaunchingDirect(false);
    }
  };

  const handleStopDirectVieneu = async () => {
    const res = await stopLocalVieneuDaemon();
    setVieneuStatus({ state: 'idle', message: res.message });
    onShowToast(res.message);
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
    <div style={{ maxWidth: 880, display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Appearance */}
      <section className="bento-card" style={{ gap: 0, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)', fontWeight: 680, fontSize: 14 }}>
          Giao diện Minimal Specular Liquid Glass (Mac &amp; iPhone)
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--line)', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 600 }}>Chế độ Màu sắc (Theme)</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              Dark (#0C0E14) hoặc Light (#F4F5F8) đồng bộ tức thì với macOS NSAppearance
            </div>
          </div>
          <div className="seg">
            {(['dark', 'light'] as ThemeMode[]).map((t) => (
              <button key={t} type="button" className={settings.theme === t ? 'on' : ''} onClick={() => onUpdateSettings({ theme: t })}>
                {t === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--line)', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 600 }}>Cường độ Kính mờ (Liquid Glass)</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              Clear / Balanced (chuẩn Tahoe 26) / Solid độ tương phản cao
            </div>
          </div>
          <div className="seg">
            {(['clear', 'balanced', 'solid'] as GlassIntensity[]).map((g) => (
              <button key={g} type="button" className={settings.glass === g ? 'on' : ''} onClick={() => onUpdateSettings({ glass: g })}>
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--line)', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 600 }}>Reduce Transparency (Trợ năng &amp; Tiết kiệm Pin)</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Chuyển bề mặt kính sang nền đặc sắc nét, tắt backdrop-filter</div>
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

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 600 }}>Âm thanh Tương tác (Web Audio Click &amp; Chime)</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Phát tiếng phím cơ nhẹ khi gõ Qwerty và chuông hoàn thành FSRS / Quiz</div>
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
      </section>

      {/* Dual-Voice Hybrid & VieNeu Local TTS Engine */}
      <section className="bento-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <b style={{ fontSize: 15 }}>Giọng đọc Song ngữ Hybrid &amp; VieNeu 48kHz trên máy</b>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              Khuyên dùng <b>Hybrid</b>: Giọng Anh/Mỹ bản xứ chuẩn IPA cho tiếng Anh + <b>VieNeu v3 Turbo (108 giọng 48kHz)</b> cho tiếng Việt
            </div>
          </div>
          <div className="seg">
            {(
              [
                { id: 'hybrid', label: 'Hybrid (Khuyên dùng)' },
                { id: 'system', label: 'System Speech' },
                { id: 'vieneu', label: 'VieNeu Local' },
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Giọng Tiếng Anh chuẩn IPA (US / UK / AUS)</span>
            <div className="seg" style={{ width: 'fit-content' }}>
              {(['US General', 'UK RP', 'AUS'] as EnglishAccent[]).map((acc) => (
                <button
                  key={acc}
                  type="button"
                  className={settings.ttsConfig.englishAccent === acc ? 'on' : ''}
                  onClick={() => updateTts({ englishAccent: acc })}
                >
                  {acc}
                </button>
              ))}
            </div>
          </div>

          {systemEnglishVoices.length > 0 && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Giọng macOS tiếng Anh ưu tiên</span>
              <select
                className="input-field"
                aria-label="Chọn giọng tiếng Anh trên máy"
                value={settings.ttsConfig.englishVoiceName}
                onChange={(e) => updateTts({ englishVoiceName: e.target.value })}
              >
                <option value="">Tự chọn giọng Enhanced/Premium tốt nhất</option>
                {systemEnglishVoices.slice(0, 40).map((v) => (
                  <option key={`${v.name}-${v.lang}`} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="grid2">
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>VieNeu Endpoint URL (Hỗ trợ cả Direct 200 &amp; HA Async 202)</span>
            <input
              id="settings-vieneu-url"
              name="vieneuUrl"
              aria-label="Địa chỉ VieNeu Local TTS Endpoint"
              className="input-field"
              value={settings.ttsConfig.vieneuUrl}
              placeholder="http://127.0.0.1:8766"
              onChange={(e) => updateTts({ vieneuUrl: e.target.value })}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
              Mã truy cập VieNeu Studio (chỉ cần khi dùng cổng 8765 HA Coordinator)
            </span>
            <input
              id="settings-vieneu-token"
              name="vieneuToken"
              aria-label="Mã truy cập VieNeu Studio Token"
              type="password"
              className="input-field"
              value={settings.ttsConfig.vieneuToken}
              placeholder="X-VieNeu-Studio-Token (bỏ trống nếu dùng Direct 8766)"
              onChange={(e) => updateTts({ vieneuToken: e.target.value })}
            />
          </label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>Cổng trên máy Mac:</span>
          {[
            { label: 'VieNeu Direct (8766 · Khuyên dùng)', url: 'http://127.0.0.1:8766' },
            { label: 'VieNeu HA Coordinator (8765)', url: 'http://127.0.0.1:8765' },
            { label: 'OpenAI Speech (8000)', url: 'http://127.0.0.1:8000' },
          ].map((preset) => (
            <button
              key={preset.url}
              type="button"
              className={`gb sm ${settings.ttsConfig.vieneuUrl === preset.url ? 'hl' : ''}`}
              onClick={() => updateTts({ vieneuUrl: preset.url })}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {hasNativeMacBridge() && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 14,
              background: 'var(--raised)',
              border: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ minWidth: 0, flex: '1 1 240px' }}>
              <div style={{ fontWeight: 640, fontSize: 13 }}>
                Khởi chạy VieNeu Direct 48kHz ngay trong macOS App (Không cần Tailscale)
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                Tự chạy ONNX int8 từ ~/Developer/chua-vieneu-runtime kèm 108 giọng đọc cá nhân, khởi động ~3 giây
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                className="pb sm"
                disabled={launchingDirect}
                onClick={handleLaunchDirectVieneu}
              >
                <IconPlay size={12} />
                <span>{launchingDirect ? 'Đang khởi động...' : 'Bật VieNeu Direct 8766'}</span>
              </button>
              <button type="button" className="gb sm" onClick={handleStopDirectVieneu}>
                <IconStop size={11} />
                <span>Tắt</span>
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>Tốc độ đọc VieNeu ({settings.ttsConfig.speed.toFixed(2)}x)</div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>0.75x (chậm rõ) → 1.00x (chuẩn) → 1.40x (ôn nhanh)</div>
          </div>
          <input
            id="settings-vieneu-speed"
            name="vieneuSpeed"
            aria-label="Tốc độ giọng đọc VieNeu"
            type="range"
            min={75}
            max={140}
            step={5}
            value={Math.round(settings.ttsConfig.speed * 100)}
            onChange={(e) => updateTts({ speed: Number(e.target.value) / 100 })}
            style={{ width: 170 }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>Đọc bản dịch &amp; giải thích tiếng Việt bằng VieNeu 48kHz</div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Phát giọng Việt tự nhiên trong Engoo Reader, Flashcard Song ngữ &amp; AI Roleplay</div>
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

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>Dùng VieNeu đọc cả câu tiếng Anh (Chỉ khi chọn mode VieNeu Local)</div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Khuyên TẮT để giữ giọng Anh/Mỹ bản xứ chuẩn IPA cho luyện Shadowing &amp; Minimal Pairs</div>
          </div>
          <label className="sw">
            <input
              id="settings-vieneu-en"
              type="checkbox"
              aria-label="Dùng VieNeu đọc tiếng Anh"
              checked={settings.ttsConfig.useVieneuForEnglish}
              onChange={(e) => updateTts({ useVieneuForEnglish: e.target.checked })}
            />
            <i />
          </label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="pb sm"
            disabled={vieneuStatus.state === 'checking'}
            onClick={() => void handleCheckVieneu()}
          >
            {vieneuStatus.state === 'checking' ? 'Đang kiểm tra...' : 'Kiểm tra kết nối & Nạp 108 giọng VieNeu'}
          </button>
          <button
            type="button"
            className="gb sm"
            onClick={() => speakEnglish('Resilient architectures balance latency and consistency.')}
          >
            <IconVolume size={13} />
            <span>Thử EN ({settings.ttsConfig.englishAccent})</span>
          </button>
          <button
            type="button"
            className="gb sm"
            onClick={() => speakVietnamese('Xin chào, đây là giọng đọc VieNeu 48kHz hỗ trợ học song ngữ trong T-English.')}
          >
            <IconVolume size={13} />
            <span>Thử VI (VieNeu)</span>
          </button>
          <button
            type="button"
            className="gb sm"
            onClick={() =>
              speakBilingual(
                'Consistency builds unstoppable momentum.',
                'Sự kiên trì tạo nên đà tiến triển không thể ngăn cản.'
              )
            }
          >
            <IconHeadphones size={13} />
            <span>Thử Song ngữ EN → VI</span>
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
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                Tìm giọng VieNeu ({filteredVoices.length}/{vieneuVoices.length})
              </span>
              <input
                id="settings-vieneu-voice-search"
                name="vieneuVoiceSearch"
                aria-label="Tìm kiếm giọng đọc VieNeu"
                className="input-field"
                value={voiceFilter}
                placeholder="Lọc theo tên (VD: Khánh An, Nhật Phong, Hải Đăng...)"
                onChange={(e) => setVoiceFilter(e.target.value)}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Giọng VieNeu đang chọn</span>
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
      </section>

      {/* FSRS & Vocab Notifications Quick Row */}
      <section className="bento-card" style={{ gap: 0, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)', fontWeight: 680, fontSize: 14 }}>
          Thuật toán FSRS v5, Mục tiêu Ngày &amp; Nhắc Từ vựng
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--line)', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 600 }}>Desired Retention ({Math.round(settings.desiredRetention * 100)}%)</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Tỷ lệ ghi nhớ mục tiêu của FSRS v5 (90% là tối ưu)</div>
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
            style={{ width: 170 }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--line)', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 600 }}>Mục tiêu Thời lượng Hằng ngày</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Tích lũy cho lộ trình 1,000 Giờ Nghe–Đọc–Nói</div>
          </div>
          <div className="seg">
            {[15, 25, 45, 60].map((m) => (
              <button key={m} type="button" className={settings.dailyGoalMinutes === m ? 'on' : ''} onClick={() => onUpdateSettings({ dailyGoalMinutes: m })}>
                {m}m
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 600 }}>
              Thông báo Học Từ vựng ({settings.vocabNotifications.enabled ? `Mỗi ${settings.vocabNotifications.intervalMinutes} phút` : 'Đang tắt'})
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              Đẩy thẻ Flashcard/Quiz nổi tự động trên Desktop macOS &amp; trong ứng dụng
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {onTriggerVocabNotifyNow && (
              <button type="button" className="gb sm" onClick={onTriggerVocabNotifyNow}>
                <IconBellRing size={13} />
                <span>Thử thông báo ngay</span>
              </button>
            )}
            <label className="sw">
              <input
                type="checkbox"
                aria-label="Bật tắt thông báo từ vựng"
                checked={settings.vocabNotifications.enabled}
                onChange={(e) =>
                  onUpdateSettings({
                    vocabNotifications: { ...settings.vocabNotifications, enabled: e.target.checked },
                  })
                }
              />
              <i />
            </label>
          </div>
        </div>
      </section>

      {/* AI Tutor & Writing Provider */}
      <section className="bento-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <b style={{ fontSize: 15 }}>Cấu hình AI Tutor &amp; Writing Provider</b>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Ollama chạy cục bộ tự động đi qua cầu nối native trên macOS (không bị chặn CORS)</div>
          </div>
          <div className="seg">
            {(['builtin', 'openai', 'gemini', 'ollama'] as AIProvider[]).map((p) => (
              <button
                key={p}
                type="button"
                className={settings.aiConfig.provider === p ? 'on' : ''}
                onClick={() => onUpdateSettings({ aiConfig: { ...settings.aiConfig, provider: p } })}
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
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>API Key (lưu cục bộ)</span>
                <input
                  id="settings-ai-api-key"
                  name="aiApiKey"
                  aria-label="API Key cho nhà cung cấp AI"
                  type="password"
                  className="input-field"
                  value={settings.aiConfig.apiKey}
                  placeholder="sk-... hoặc AIza..."
                  onChange={(e) => onUpdateSettings({ aiConfig: { ...settings.aiConfig, apiKey: e.target.value } })}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Model</span>
                <input
                  id="settings-ai-model"
                  name="aiModel"
                  aria-label="Tên Model AI"
                  className="input-field"
                  value={settings.aiConfig.model}
                  placeholder="gpt-4o-mini / gemini-2.0-flash"
                  onChange={(e) => onUpdateSettings({ aiConfig: { ...settings.aiConfig, model: e.target.value } })}
                />
              </label>
            </div>
            <div style={{ padding: '9px 12px', borderRadius: 10, background: 'var(--raised)', border: '1px solid var(--line)', fontSize: 11.5, color: 'var(--amber)' }}>
              API Key chỉ lưu cục bộ trên máy và được tự động loại bỏ khi xuất Backup JSON.
            </div>
          </>
        )}

        {settings.aiConfig.provider === 'ollama' && (
          <div className="grid2">
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Ollama Endpoint</span>
              <input
                id="settings-ollama-url"
                name="ollamaUrl"
                aria-label="Địa chỉ Ollama Endpoint"
                className="input-field"
                value={settings.aiConfig.ollamaUrl}
                onChange={(e) => onUpdateSettings({ aiConfig: { ...settings.aiConfig, ollamaUrl: e.target.value } })}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Local Model Name</span>
              <input
                id="settings-ollama-model"
                name="ollamaModel"
                aria-label="Tên Model Ollama Local"
                className="input-field"
                value={settings.aiConfig.model}
                placeholder="llama3.2 / qwen2.5"
                onChange={(e) => onUpdateSettings({ aiConfig: { ...settings.aiConfig, model: e.target.value } })}
              />
            </label>
          </div>
        )}
      </section>

      {/* Export / Import / Profile Reset */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button type="button" className="pb" onClick={handleDownloadAnki}>
          <IconDownload size={14} />
          <span>Xuất {cards.length} thẻ Anki (.csv)</span>
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
            <button type="button" className="gb" onClick={() => fileInputRef.current?.click()}>
              <IconUpload size={14} />
              <span>Nhập Backup JSON</span>
            </button>
          </>
        )}
        {onCleanStart && (
          <button type="button" className="gb" style={{ color: 'var(--cyan)' }} onClick={onCleanStart}>
            Bắt đầu Hồ sơ Mới (0 giờ · 0 Streak)
          </button>
        )}
        <button type="button" className="gb" style={{ color: 'var(--rose)' }} onClick={onResetAll}>
          Khôi phục dữ liệu mẫu mặc định
        </button>
      </div>
    </div>
  );
};
