import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCreateActivity } from '@/features/activities/hooks/useCreateActivity';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useCreateActivity', () => {
    beforeEach(() => {
        mockFetch.mockReset();
    });

    it('initializes with idle state', () => {
        const { result } = renderHook(() => useCreateActivity());
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(result.current.data).toBeNull();
    });

    it('sets loading state while creating', async () => {
        mockFetch.mockImplementation(() => new Promise(() => { })); // Never resolves
        const { result } = renderHook(() => useCreateActivity());

        act(() => {
            result.current.createActivity({ name: 'Test', groupId: '1', mode: 0 });
        });

        expect(result.current.isLoading).toBe(true);
    });

    it('returns activity ID on success', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true, data: { activityId: 'new-activity-123' } }),
        });

        const { result } = renderHook(() => useCreateActivity());

        await act(async () => {
            await result.current.createActivity({ name: 'Test', groupId: '1', mode: 0 });
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.data?.activityId).toBe('new-activity-123');
        expect(result.current.error).toBeNull();
    });

    it('handles API error response', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'Failed to create activity' }),
        });

        const { result } = renderHook(() => useCreateActivity());

        await act(async () => {
            await result.current.createActivity({ name: 'Test', groupId: '1', mode: 0 });
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe('Failed to create activity');
        expect(result.current.data).toBeNull();
    });

    it('handles network error', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        const { result } = renderHook(() => useCreateActivity());

        await act(async () => {
            await result.current.createActivity({ name: 'Test', groupId: '1', mode: 0 });
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe('Failed to create activity. Please try again.');
    });

    it('calls onSuccess callback when provided', async () => {
        const onSuccess = vi.fn();
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true, data: { activityId: 'new-123' } }),
        });

        const { result } = renderHook(() => useCreateActivity({ onSuccess }));

        await act(async () => {
            await result.current.createActivity({ name: 'Test', groupId: '1', mode: 0 });
        });

        expect(onSuccess).toHaveBeenCalledWith('new-123');
    });

    it('resets state on reset call', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true, data: { activityId: 'test' } }),
        });

        const { result } = renderHook(() => useCreateActivity());

        await act(async () => {
            await result.current.createActivity({ name: 'Test', groupId: '1', mode: 0 });
        });

        expect(result.current.data).not.toBeNull();

        act(() => {
            result.current.reset();
        });

        expect(result.current.data).toBeNull();
        expect(result.current.error).toBeNull();
        expect(result.current.isLoading).toBe(false);
    });
});
