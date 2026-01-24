import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CaseSettingsForm } from '@/features/activities/components/ModeSettings/CaseSettingsForm';
import { defaultCaseSettings } from '@/types/activities';

describe('CaseSettingsForm', () => {
    const defaultProps = {
        values: defaultCaseSettings,
        onChange: vi.fn(),
        scenarioManager: {
            scenarios: [{ id: '1', title: 'Scenario 1', content: 'Content 1' }],
            addScenario: vi.fn(),
            removeScenario: vi.fn(),
            updateScenario: vi.fn(),
            reset: vi.fn(),
        },
    };

    it('renders time per case input', () => {
        render(<CaseSettingsForm {...defaultProps} />);
        expect(screen.getByLabelText(/time per case/i)).toBeInTheDocument();
    });

    it('renders total time limit input', () => {
        render(<CaseSettingsForm {...defaultProps} />);
        expect(screen.getByLabelText(/total time limit/i)).toBeInTheDocument();
    });

    it('renders max attempts input', () => {
        render(<CaseSettingsForm {...defaultProps} />);
        expect(screen.getByLabelText(/max attempts/i)).toBeInTheDocument();
    });

    it('renders pass threshold input', () => {
        render(<CaseSettingsForm {...defaultProps} />);
        expect(screen.getByLabelText(/pass threshold/i)).toBeInTheDocument();
    });

    it('renders scenarios section', () => {
        render(<CaseSettingsForm {...defaultProps} />);
        expect(screen.getByText(/case scenarios/i)).toBeInTheDocument();
    });

    it('displays existing scenarios', () => {
        render(<CaseSettingsForm {...defaultProps} />);
        expect(screen.getByText('Scenario 1')).toBeInTheDocument();
    });

    it('shows add scenario form', () => {
        render(<CaseSettingsForm {...defaultProps} />);
        expect(screen.getByPlaceholderText(/scenario title/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/scenario content/i)).toBeInTheDocument();
    });

    it('calls addScenario when form submitted', () => {
        const addScenario = vi.fn();
        render(
            <CaseSettingsForm
                {...defaultProps}
                scenarioManager={{ ...defaultProps.scenarioManager, addScenario }}
            />
        );

        fireEvent.change(screen.getByPlaceholderText(/scenario title/i), {
            target: { value: 'New Scenario' },
        });
        fireEvent.change(screen.getByPlaceholderText(/scenario content/i), {
            target: { value: 'New Content' },
        });
        fireEvent.click(screen.getByRole('button', { name: /add scenario/i }));

        expect(addScenario).toHaveBeenCalledWith('New Scenario', 'New Content');
    });

    it('calls removeScenario when delete clicked', () => {
        const removeScenario = vi.fn();
        render(
            <CaseSettingsForm
                {...defaultProps}
                scenarioManager={{ ...defaultProps.scenarioManager, removeScenario }}
            />
        );

        const deleteButton = screen.getByRole('button', { name: /delete/i });
        fireEvent.click(deleteButton);

        expect(removeScenario).toHaveBeenCalledWith('1');
    });

    it('calls onChange when settings change', () => {
        const onChange = vi.fn();
        render(<CaseSettingsForm {...defaultProps} onChange={onChange} />);
        fireEvent.change(screen.getByLabelText(/time per case/i), { target: { value: '15' } });
        expect(onChange).toHaveBeenCalledWith('timePerCase', 15);
    });
});
