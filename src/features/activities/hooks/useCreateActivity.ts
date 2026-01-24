import { useState, useCallback } from 'react';

interface CreateActivityData {
    name: string;
    groupId: string;
    mode: number;
    description?: string;
    aiRatingEnabled?: boolean;
    isAnonymousAuthorAllowed?: boolean;
    hideUsernames?: boolean;
    examSettings?: object;
    inquirySettings?: object;
    caseSettings?: object;
}

interface UseCreateActivityOptions {
    onSuccess?: (activityId: string) => void;
}

interface UseCreateActivityReturn {
    createActivity: (data: CreateActivityData) => Promise<void>;
    isLoading: boolean;
    error: string | null;
    data: { activityId: string } | null;
    reset: () => void;
}

export function useCreateActivity(
    options: UseCreateActivityOptions = {}
): UseCreateActivityReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<{ activityId: string } | null>(null);

    const createActivity = useCallback(
        async (formData: CreateActivityData) => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch('/api/activities', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });

                const result = await response.json();

                if (!response.ok) {
                    setError(result.error || 'Failed to create activity');
                    setData(null);
                } else {
                    setData(result.data);
                    options.onSuccess?.(result.data.activityId);
                }
            } catch {
                setError('Failed to create activity. Please try again.');
                setData(null);
            } finally {
                setIsLoading(false);
            }
        },
        [options]
    );

    const reset = useCallback(() => {
        setIsLoading(false);
        setError(null);
        setData(null);
    }, []);

    return { createActivity, isLoading, error, data, reset };
}
