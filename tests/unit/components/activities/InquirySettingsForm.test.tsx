import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InquirySettingsForm } from '@/features/activities/components/ModeSettings/InquirySettingsForm';
import { defaultInquirySettings } from '@/types/activities';

describe('InquirySettingsForm', () => {
    const defaultProps = {
        values: defaultInquirySettings,
        onChange: vi.fn(),
        keywordManager: {
            pool1: ['concept1', 'concept2'],
            pool2: ['action1'],
            addKeyword: vi.fn(),
            removeKeyword: vi.fn(),
            reset: vi.fn(),
        },
    };

    it('renders questions required input', () => {
        render(<InquirySettingsForm {...defaultProps} />);
        expect(screen.getByLabelText(/questions required/i)).toBeInTheDocument();
    });

    it('renders time per question input', () => {
        render(<InquirySettingsForm {...defaultProps} />);
        expect(screen.getByLabelText(/time per question/i)).toBeInTheDocument();
    });

    it('renders pass threshold input', () => {
        render(<InquirySettingsForm {...defaultProps} />);
        expect(screen.getByLabelText(/pass threshold/i)).toBeInTheDocument();
    });

    it('renders keyword pool 1 section', () => {
        render(<InquirySettingsForm {...defaultProps} />);
        expect(screen.getByText(/concept keywords/i)).toBeInTheDocument();
    });

    it('renders keyword pool 2 section', () => {
        render(<InquirySettingsForm {...defaultProps} />);
        expect(screen.getByText(/action keywords/i)).toBeInTheDocument();
    });

    it('displays existing keywords in pools', () => {
        render(<InquirySettingsForm {...defaultProps} />);
        expect(screen.getByText('concept1')).toBeInTheDocument();
        expect(screen.getByText('action1')).toBeInTheDocument();
    });

    it('calls addKeyword when adding to pool 1', () => {
        const addKeyword = vi.fn();
        render(
            <InquirySettingsForm
                {...defaultProps}
                keywordManager={{ ...defaultProps.keywordManager, addKeyword }}
            />
        );
        const input = screen.getByPlaceholderText(/add concept keyword/i);
        fireEvent.change(input, { target: { value: 'new-keyword' } });
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(addKeyword).toHaveBeenCalledWith(1, 'new-keyword');
    });

    it('calls removeKeyword when removing from pool', () => {
        const removeKeyword = vi.fn();
        render(
            <InquirySettingsForm
                {...defaultProps}
                keywordManager={{ ...defaultProps.keywordManager, removeKeyword }}
            />
        );
        const removeButtons = screen.getAllByRole('button', { name: /remove/i });
        fireEvent.click(removeButtons[0]);
        expect(removeKeyword).toHaveBeenCalled();
    });

    it('calls onChange when settings change', () => {
        const onChange = vi.fn();
        render(<InquirySettingsForm {...defaultProps} onChange={onChange} />);
        fireEvent.change(screen.getByLabelText(/questions required/i), { target: { value: '10' } });
        expect(onChange).toHaveBeenCalledWith('questionsRequired', 10);
    });
});
