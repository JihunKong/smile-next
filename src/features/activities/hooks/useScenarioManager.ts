import { useState, useCallback } from 'react';
import type { CaseScenario } from '@/types/activities';

interface UseScenarioManagerOptions {
    scenarios?: CaseScenario[];
}

interface UseScenarioManagerReturn {
    scenarios: CaseScenario[];
    addScenario: (title: string, content: string) => void;
    removeScenario: (id: string) => void;
    updateScenario: (id: string, updates: Partial<CaseScenario>) => void;
    reset: () => void;
}

export function useScenarioManager(
    options: UseScenarioManagerOptions = {}
): UseScenarioManagerReturn {
    const [scenarios, setScenarios] = useState<CaseScenario[]>(options.scenarios ?? []);

    const addScenario = useCallback((title: string, content: string) => {
        const trimmedTitle = title.trim();
        const trimmedContent = content.trim();
        if (!trimmedTitle || !trimmedContent) return;

        const newScenario: CaseScenario = {
            id: crypto.randomUUID(),
            title: trimmedTitle,
            content: trimmedContent,
        };
        setScenarios((prev) => [...prev, newScenario]);
    }, []);

    const removeScenario = useCallback((id: string) => {
        setScenarios((prev) => prev.filter((s) => s.id !== id));
    }, []);

    const updateScenario = useCallback((id: string, updates: Partial<CaseScenario>) => {
        setScenarios((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    }, []);

    const reset = useCallback(() => {
        setScenarios(options.scenarios ?? []);
    }, [options.scenarios]);

    return { scenarios, addScenario, removeScenario, updateScenario, reset };
}
