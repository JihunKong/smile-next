import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GeneralSettings } from '@/features/activities/components/ActivityForm/GeneralSettings';

describe('GeneralSettings', () => {
    const defaultProps = {
        values: {
            aiRatingEnabled: true,
            allowAnonymous: false,
            hideUsernames: false,
            isPublished: false,
        },
        onChange: vi.fn(),
    };

    it('renders AI Rating toggle', () => {
        render(<GeneralSettings {...defaultProps} />);
        expect(screen.getByText(/ai rating/i)).toBeInTheDocument();
    });

    it('renders Anonymous Questions toggle', () => {
        render(<GeneralSettings {...defaultProps} />);
        expect(screen.getByText(/allow anonymous/i)).toBeInTheDocument();
    });

    it('renders Hide Usernames toggle', () => {
        render(<GeneralSettings {...defaultProps} />);
        expect(screen.getByText(/hide usernames/i)).toBeInTheDocument();
    });

    it('renders Publish toggle', () => {
        render(<GeneralSettings {...defaultProps} />);
        expect(screen.getByText(/publish activity/i)).toBeInTheDocument();
    });

    it('toggles AI rating when clicked', () => {
        const onChange = vi.fn();
        render(<GeneralSettings {...defaultProps} onChange={onChange} />);
        const toggle = screen.getAllByRole('checkbox')[0];
        fireEvent.click(toggle);
        expect(onChange).toHaveBeenCalledWith('aiRatingEnabled', false);
    });

    it('shows correct initial state for toggles', () => {
        render(
            <GeneralSettings
                {...defaultProps}
                values={{
                    ...defaultProps.values,
                    aiRatingEnabled: false,
                    allowAnonymous: true,
                }}
            />
        );
        const toggles = screen.getAllByRole('checkbox');
        expect(toggles[0]).not.toBeChecked(); // AI rating
        expect(toggles[1]).toBeChecked(); // Anonymous
    });
});
