import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeywordManager } from '@/features/activities/hooks/useKeywordManager';

describe('useKeywordManager', () => {
    it('initializes with empty pools by default', () => {
        const { result } = renderHook(() => useKeywordManager());
        expect(result.current.pool1).toEqual([]);
        expect(result.current.pool2).toEqual([]);
    });

    it('initializes with provided initial values', () => {
        const { result } = renderHook(() =>
            useKeywordManager({ pool1: ['concept1'], pool2: ['action1'] })
        );
        expect(result.current.pool1).toEqual(['concept1']);
        expect(result.current.pool2).toEqual(['action1']);
    });

    it('adds keyword to pool 1', () => {
        const { result } = renderHook(() => useKeywordManager());
        act(() => {
            result.current.addKeyword(1, 'test-keyword');
        });
        expect(result.current.pool1).toContain('test-keyword');
    });

    it('adds keyword to pool 2', () => {
        const { result } = renderHook(() => useKeywordManager());
        act(() => {
            result.current.addKeyword(2, 'test-action');
        });
        expect(result.current.pool2).toContain('test-action');
    });

    it('removes keyword from pool 1 by index', () => {
        const { result } = renderHook(() =>
            useKeywordManager({ pool1: ['a', 'b', 'c'], pool2: [] })
        );
        act(() => {
            result.current.removeKeyword(1, 1);
        });
        expect(result.current.pool1).toEqual(['a', 'c']);
    });

    it('removes keyword from pool 2 by index', () => {
        const { result } = renderHook(() =>
            useKeywordManager({ pool1: [], pool2: ['x', 'y', 'z'] })
        );
        act(() => {
            result.current.removeKeyword(2, 0);
        });
        expect(result.current.pool2).toEqual(['y', 'z']);
    });

    it('trims whitespace from added keywords', () => {
        const { result } = renderHook(() => useKeywordManager());
        act(() => {
            result.current.addKeyword(1, '  padded  ');
        });
        expect(result.current.pool1).toContain('padded');
    });

    it('does not add empty keywords', () => {
        const { result } = renderHook(() => useKeywordManager());
        act(() => {
            result.current.addKeyword(1, '   ');
        });
        expect(result.current.pool1).toHaveLength(0);
    });

    it('resets pools to initial or empty state', () => {
        const { result } = renderHook(() => useKeywordManager());
        act(() => {
            result.current.addKeyword(1, 'keyword1');
            result.current.addKeyword(2, 'keyword2');
        });
        act(() => {
            result.current.reset();
        });
        expect(result.current.pool1).toEqual([]);
        expect(result.current.pool2).toEqual([]);
    });
});
