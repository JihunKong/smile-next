import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GroupSelector } from '@/features/activities/components/ActivityForm/GroupSelector';

describe('GroupSelector', () => {
    const mockGroups = [
        { id: 'group-1', name: 'Class A', role: 3 },
        { id: 'group-2', name: 'Class B', role: 2 },
        { id: 'group-3', name: 'Class C', role: 1 },
    ];

    const defaultProps = {
        groups: mockGroups,
        selectedGroupId: '',
        onGroupChange: vi.fn(),
        isLoading: false,
        error: null as string | null,
    };

    it('renders group dropdown', () => {
        render(<GroupSelector {...defaultProps} />);
        expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('renders all group options with role labels', () => {
        render(<GroupSelector {...defaultProps} />);
        expect(screen.getByText(/Class A \(Owner\)/)).toBeInTheDocument();
        expect(screen.getByText(/Class B \(Co-Owner\)/)).toBeInTheDocument();
        expect(screen.getByText(/Class C \(Admin\)/)).toBeInTheDocument();
    });

    it('shows loading state', () => {
        render(<GroupSelector {...defaultProps} isLoading={true} groups={[]} />);
        expect(screen.getByText(/loading groups/i)).toBeInTheDocument();
    });

    it('shows empty state when no groups available', () => {
        render(<GroupSelector {...defaultProps} groups={[]} />);
        expect(screen.getByText(/don't have permission/i)).toBeInTheDocument();
    });

    it('calls onGroupChange when selection changes', () => {
        const onGroupChange = vi.fn();
        render(<GroupSelector {...defaultProps} onGroupChange={onGroupChange} />);
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'group-2' } });
        expect(onGroupChange).toHaveBeenCalledWith('group-2');
    });

    it('displays selected group', () => {
        render(<GroupSelector {...defaultProps} selectedGroupId="group-1" />);
        expect(screen.getByDisplayValue(/Class A/)).toBeInTheDocument();
    });

    it('shows error message when provided', () => {
        render(<GroupSelector {...defaultProps} error="Failed to load groups" />);
        expect(screen.getByText('Failed to load groups')).toBeInTheDocument();
    });
});
