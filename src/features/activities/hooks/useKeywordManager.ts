import { useState, useCallback } from 'react';

interface UseKeywordManagerOptions {
    pool1?: string[];
    pool2?: string[];
}

interface UseKeywordManagerReturn {
    pool1: string[];
    pool2: string[];
    addKeyword: (pool: 1 | 2, keyword: string) => void;
    removeKeyword: (pool: 1 | 2, index: number) => void;
    reset: () => void;
}

export function useKeywordManager(
    options: UseKeywordManagerOptions = {}
): UseKeywordManagerReturn {
    const [pool1, setPool1] = useState<string[]>(options.pool1 ?? []);
    const [pool2, setPool2] = useState<string[]>(options.pool2 ?? []);

    const addKeyword = useCallback((pool: 1 | 2, keyword: string) => {
        const trimmed = keyword.trim();
        if (!trimmed) return;

        if (pool === 1) {
            setPool1((prev) => [...prev, trimmed]);
        } else {
            setPool2((prev) => [...prev, trimmed]);
        }
    }, []);

    const removeKeyword = useCallback((pool: 1 | 2, index: number) => {
        if (pool === 1) {
            setPool1((prev) => prev.filter((_, i) => i !== index));
        } else {
            setPool2((prev) => prev.filter((_, i) => i !== index));
        }
    }, []);

    const reset = useCallback(() => {
        setPool1(options.pool1 ?? []);
        setPool2(options.pool2 ?? []);
    }, [options.pool1, options.pool2]);

    return { pool1, pool2, addKeyword, removeKeyword, reset };
}
