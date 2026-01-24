import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExamSettingsForm } from '@/features/activities/components/ModeSettings/ExamSettingsForm';
import { defaultExamSettings } from '@/types/activities';

describe('ExamSettingsForm', () => {
    const defaultProps = {
        values: defaultExamSettings,
        onChange: vi.fn(),
    };

    it('renders time limit input', () => {
        render(<ExamSettingsForm {...defaultProps} />);
        expect(screen.getByLabelText(/time limit/i)).toBeInTheDocument();
    });

    it('renders questions to show input', () => {
        render(<ExamSettingsForm {...defaultProps} />);
        expect(screen.getByLabelText(/questions to show/i)).toBeInTheDocument();
    });

    it('renders pass threshold input', () => {
        render(<ExamSettingsForm {...defaultProps} />);
        expect(screen.getByLabelText(/pass threshold/i)).toBeInTheDocument();
    });

    it('renders shuffle options', () => {
        render(<ExamSettingsForm {...defaultProps} />);
        expect(screen.getByLabelText(/shuffle questions/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/shuffle choices/i)).toBeInTheDocument();
    });

    it('renders max attempts input', () => {
        render(<ExamSettingsForm {...defaultProps} />);
        expect(screen.getByLabelText(/max attempts/i)).toBeInTheDocument();
    });

    it('displays current values', () => {
        render(<ExamSettingsForm {...defaultProps} values={{ ...defaultExamSettings, timeLimit: 45 }} />);
        expect(screen.getByLabelText(/time limit/i)).toHaveValue(45);
    });

    it('calls onChange when time limit changes', () => {
        const onChange = vi.fn();
        render(<ExamSettingsForm {...defaultProps} onChange={onChange} />);
        fireEvent.change(screen.getByLabelText(/time limit/i), { target: { value: '45' } });
        expect(onChange).toHaveBeenCalledWith('timeLimit', 45);
    });

    it('validates minimum time limit', () => {
        render(<ExamSettingsForm {...defaultProps} />);
        const input = screen.getByLabelText(/time limit/i);
        expect(input).toHaveAttribute('min', '1');
    });

    it('validates maximum pass threshold', () => {
        render(<ExamSettingsForm {...defaultProps} />);
        const input = screen.getByLabelText(/pass threshold/i);
        expect(input).toHaveAttribute('max', '100');
    });
});
