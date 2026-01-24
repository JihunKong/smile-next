import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScenarioManager } from '@/features/activities/hooks/useScenarioManager';
import type { CaseScenario } from '@/types/activities';

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
    randomUUID: () => 'mock-uuid-123',
});

describe('useScenarioManager', () => {
    it('initializes with empty scenarios by default', () => {
        const { result } = renderHook(() => useScenarioManager());
        expect(result.current.scenarios).toEqual([]);
    });

    it('initializes with provided scenarios', () => {
        const initial: CaseScenario[] = [{ id: '1', title: 'Test', content: 'Content' }];
        const { result } = renderHook(() => useScenarioManager({ scenarios: initial }));
        expect(result.current.scenarios).toEqual(initial);
    });

    it('adds a new scenario with generated ID', () => {
        const { result } = renderHook(() => useScenarioManager());
        act(() => {
            result.current.addScenario('Title', 'Content');
        });
        expect(result.current.scenarios).toHaveLength(1);
        expect(result.current.scenarios[0]).toMatchObject({
            id: 'mock-uuid-123',
            title: 'Title',
            content: 'Content',
        });
    });

    it('does not add scenario with empty title', () => {
        const { result } = renderHook(() => useScenarioManager());
        act(() => {
            result.current.addScenario('   ', 'Content');
        });
        expect(result.current.scenarios).toHaveLength(0);
    });

    it('does not add scenario with empty content', () => {
        const { result } = renderHook(() => useScenarioManager());
        act(() => {
            result.current.addScenario('Title', '   ');
        });
        expect(result.current.scenarios).toHaveLength(0);
    });

    it('removes scenario by ID', () => {
        const initial: CaseScenario[] = [
            { id: 'keep', title: 'Keep', content: 'Content' },
            { id: 'remove', title: 'Remove', content: 'Content' },
        ];
        const { result } = renderHook(() => useScenarioManager({ scenarios: initial }));
        act(() => {
            result.current.removeScenario('remove');
        });
        expect(result.current.scenarios).toHaveLength(1);
        expect(result.current.scenarios[0].id).toBe('keep');
    });

    it('updates existing scenario', () => {
        const initial: CaseScenario[] = [{ id: '1', title: 'Old Title', content: 'Old Content' }];
        const { result } = renderHook(() => useScenarioManager({ scenarios: initial }));
        act(() => {
            result.current.updateScenario('1', { title: 'New Title' });
        });
        expect(result.current.scenarios[0].title).toBe('New Title');
        expect(result.current.scenarios[0].content).toBe('Old Content');
    });

    it('resets to initial state', () => {
        const initial: CaseScenario[] = [{ id: '1', title: 'Initial', content: 'Content' }];
        const { result } = renderHook(() => useScenarioManager({ scenarios: initial }));
        act(() => {
            result.current.addScenario('New', 'Content');
        });
        expect(result.current.scenarios).toHaveLength(2);
        act(() => {
            result.current.reset();
        });
        expect(result.current.scenarios).toEqual(initial);
    });
});
