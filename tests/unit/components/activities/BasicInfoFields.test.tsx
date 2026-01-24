import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BasicInfoFields } from '@/features/activities/components/ActivityForm/BasicInfoFields';

describe('BasicInfoFields', () => {
    const defaultProps = {
        values: { name: '', description: '', visible: true },
        onChange: vi.fn(),
        errors: {},
    };

    it('renders name input with label', () => {
        render(<BasicInfoFields {...defaultProps} />);
        expect(screen.getByLabelText(/activity name/i)).toBeInTheDocument();
    });

    it('renders description textarea', () => {
        render(<BasicInfoFields {...defaultProps} />);
        expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    it('displays current name value', () => {
        render(
            <BasicInfoFields {...defaultProps} values={{ ...defaultProps.values, name: 'Test Activity' }} />
        );
        expect(screen.getByDisplayValue('Test Activity')).toBeInTheDocument();
    });

    it('calls onChange when name changes', () => {
        const onChange = vi.fn();
        render(<BasicInfoFields {...defaultProps} onChange={onChange} />);
        fireEvent.change(screen.getByLabelText(/activity name/i), { target: { value: 'New Name' } });
        expect(onChange).toHaveBeenCalledWith('name', 'New Name');
    });

    it('calls onChange when description changes', () => {
        const onChange = vi.fn();
        render(<BasicInfoFields {...defaultProps} onChange={onChange} />);
        fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'New description' } });
        expect(onChange).toHaveBeenCalledWith('description', 'New description');
    });

    it('displays name error when provided', () => {
        render(<BasicInfoFields {...defaultProps} errors={{ name: 'Name is required' }} />);
        expect(screen.getByText('Name is required')).toBeInTheDocument();
    });

    it('marks name field as required', () => {
        render(<BasicInfoFields {...defaultProps} />);
        const nameInput = screen.getByLabelText(/activity name/i);
        expect(nameInput).toHaveAttribute('required');
    });

    it('enforces max length on name', () => {
        render(<BasicInfoFields {...defaultProps} />);
        const nameInput = screen.getByLabelText(/activity name/i);
        expect(nameInput).toHaveAttribute('maxLength', '200');
    });

    it('enforces max length on description', () => {
        render(<BasicInfoFields {...defaultProps} />);
        const descInput = screen.getByLabelText(/description/i);
        expect(descInput).toHaveAttribute('maxLength', '1000');
    });
});
