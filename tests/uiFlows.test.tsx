// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { App } from '../src/App';
import { CurriculumView } from '../src/components/modules/CurriculumView';
import { WritingStudioView } from '../src/components/modules/WritingStudioView';

describe('T-English UI Component & State Persistence Flows', () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('keeps Placement Test submit button disabled until all 12 questions are answered', () => {
    const onSavePlacementLevel = vi.fn();
    render(
      <CurriculumView
        completedUnitIds={[]}
        cefrLevel="B2"
        onCompleteUnit={vi.fn()}
        onSavePlacementLevel={onSavePlacementLevel}
        onShowToast={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Kiểm tra Xếp lớp/i }));
    const submitBtn = screen.getByRole('button', { name: /Nộp bài & Xếp hạng CEFR/i }) as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);
    expect(onSavePlacementLevel).not.toHaveBeenCalled();
  });

  it('applies In-Line Diff case-insensitively and removes resolved diffs immediately', async () => {
    const onSavePhraseToFsrs = vi.fn();
    render(
      <WritingStudioView
        onRecordWritingMinutes={vi.fn()}
        onSavePhraseToFsrs={onSavePhraseToFsrs}
        onShowToast={vi.fn()}
      />
    );

    const editor = screen.getByLabelText(/Soạn thảo bài viết IELTS/i) as HTMLTextAreaElement;
    fireEvent.change(editor, {
      target: {
        value: 'First of all, i am agree with the policy. Furthermore, we should study more carefully.',
      },
    });

    fireEvent.click(screen.getByRole('button', { name: /Chấm điểm IELTS & Diff/i }));
    await screen.findByText(/Kết quả Cambridge Write & Improve/i);
    expect(screen.getByText('i am agree')).toBeTruthy();

    const applyButtons = screen.getAllByRole('button', { name: /Áp dụng & Lưu/i });
    fireEvent.click(applyButtons[0]);

    expect(editor.value.toLowerCase()).not.toContain('i am agree');
    expect(screen.queryByText('i am agree')).toBeNull();
    expect(onSavePhraseToFsrs).toHaveBeenCalledTimes(1);
  });

  it('opens FSRS Add Card form when clicking TopHeader quick add button and persists Writing drafts across tab switches', async () => {
    render(<App />);

    // Navigate to Writing Studio and edit essay draft
    const navButtons = screen.getAllByRole('button', { name: /Writing Studio/i });
    fireEvent.click(navButtons[0]);

    const editor = (await screen.findByLabelText(/Soạn thảo bài viết IELTS/i)) as HTMLTextAreaElement;
    fireEvent.change(editor, { target: { value: 'Persistent draft test content for IELTS essay.' } });

    // Switch back to Dashboard and return to Writing Studio
    fireEvent.click(screen.getAllByRole('button', { name: /^Dashboard$/i })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: /Writing Studio/i })[0]);

    const restoredEditor = (await screen.findByLabelText(/Soạn thảo bài viết IELTS/i)) as HTMLTextAreaElement;
    expect(restoredEditor.value).toBe('Persistent draft test content for IELTS essay.');

    // Click TopHeader "+ Thêm thẻ" and confirm FSRS deck form opens automatically
    const quickAddBtn = screen.getByRole('button', { name: /Thêm thẻ/i });
    fireEvent.click(quickAddBtn);

    const newWordInput = await screen.findByPlaceholderText(/Từ vựng \(VD: ephemeral\)/i);
    expect(newWordInput).toBeTruthy();
  });

  it('triggers interactive Vocabulary Notification Popup from TopHeader bell and records FSRS review', async () => {
    render(<App />);

    const bellBtn = screen.getByRole('button', { name: /Thông báo học từ vựng ngay/i });
    fireEvent.click(bellBtn);

    const dialog = await screen.findByRole('dialog', { name: /Thông báo học từ vựng:/i });
    expect(dialog).toBeTruthy();

    // Switch to Flashcard mode, reveal meaning, and mark Remembered
    fireEvent.click(screen.getByRole('button', { name: /Đổi Flash/i }));
    fireEvent.click(screen.getByRole('button', { name: /Lật xem nghĩa/i }));
    fireEvent.click(screen.getByRole('button', { name: /Đã nhớ/i }));

    expect(screen.queryByRole('dialog', { name: /Thông báo học từ vựng:/i })).toBeNull();
  });
});
