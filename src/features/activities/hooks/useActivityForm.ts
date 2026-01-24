import { useState, useCallback, useMemo } from 'react';
import type {
    ActivityMode,
    ExamSettings,
    InquirySettings,
    CaseSettings,
} from '@/types/activities';
import {
    ActivityModes,
    defaultExamSettings,
    defaultInquirySettings,
    defaultCaseSettings,
} from '@/types/activities';

export interface ActivityFormValues {
    name: string;
    description: string;
    groupId: string;
    mode: ActivityMode;
    aiRatingEnabled: boolean;
    isAnonymousAuthorAllowed: boolean;
    hideUsernames: boolean;
    examSettings?: ExamSettings;
    inquirySettings?: InquirySettings;
    caseSettings?: CaseSettings;
}

export interface ActivityFormErrors {
    name?: string;
    groupId?: string;
    description?: string;
}

const getDefaultValues = (initial?: Partial<ActivityFormValues>): ActivityFormValues => ({
    name: '',
    description: '',
    groupId: '',
    mode: ActivityModes.OPEN,
    aiRatingEnabled: true,
    isAnonymousAuthorAllowed: false,
    hideUsernames: false,
    ...initial,
    // Initialize mode-specific settings based on mode
    examSettings: initial?.mode === ActivityModes.EXAM ? defaultExamSettings : initial?.examSettings,
    inquirySettings:
        initial?.mode === ActivityModes.INQUIRY ? defaultInquirySettings : initial?.inquirySettings,
    caseSettings: initial?.mode === ActivityModes.CASE ? defaultCaseSettings : initial?.caseSettings,
});

interface UseActivityFormOptions {
    initialValues?: Partial<ActivityFormValues>;
}

interface UseActivityFormReturn {
    values: ActivityFormValues;
    errors: ActivityFormErrors;
    setField: <K extends keyof ActivityFormValues>(field: K, value: ActivityFormValues[K]) => void;
    setExamSetting: <K extends keyof ExamSettings>(key: K, value: ExamSettings[K]) => void;
    setInquirySetting: <K extends keyof InquirySettings>(key: K, value: InquirySettings[K]) => void;
    setCaseSetting: <K extends keyof CaseSettings>(key: K, value: CaseSettings[K]) => void;
    validate: () => boolean;
    reset: () => void;
    getSubmitData: () => ActivityFormValues;
}

export function useActivityForm(options: UseActivityFormOptions = {}): UseActivityFormReturn {
    const initialValues = useMemo(
        () => getDefaultValues(options.initialValues),
        [options.initialValues]
    );
    const [values, setValues] = useState<ActivityFormValues>(initialValues);
    const [errors, setErrors] = useState<ActivityFormErrors>({});

    const setField = useCallback(
        <K extends keyof ActivityFormValues>(field: K, value: ActivityFormValues[K]) => {
            setValues((prev) => {
                const updated = { ...prev, [field]: value };

                // Initialize mode-specific settings when mode changes
                if (field === 'mode') {
                    if (value === ActivityModes.EXAM && !updated.examSettings) {
                        updated.examSettings = defaultExamSettings;
                    } else if (value === ActivityModes.INQUIRY && !updated.inquirySettings) {
                        updated.inquirySettings = defaultInquirySettings;
                    } else if (value === ActivityModes.CASE && !updated.caseSettings) {
                        updated.caseSettings = defaultCaseSettings;
                    }
                }

                return updated;
            });
            // Clear error when field is updated
            if (errors[field as keyof ActivityFormErrors]) {
                setErrors((prev) => ({ ...prev, [field]: undefined }));
            }
        },
        [errors]
    );

    const setExamSetting = useCallback(
        <K extends keyof ExamSettings>(key: K, value: ExamSettings[K]) => {
            setValues((prev) => ({
                ...prev,
                examSettings: {
                    ...(prev.examSettings || defaultExamSettings),
                    [key]: value,
                },
            }));
        },
        []
    );

    const setInquirySetting = useCallback(
        <K extends keyof InquirySettings>(key: K, value: InquirySettings[K]) => {
            setValues((prev) => ({
                ...prev,
                inquirySettings: {
                    ...(prev.inquirySettings || defaultInquirySettings),
                    [key]: value,
                },
            }));
        },
        []
    );

    const setCaseSetting = useCallback(
        <K extends keyof CaseSettings>(key: K, value: CaseSettings[K]) => {
            setValues((prev) => ({
                ...prev,
                caseSettings: {
                    ...(prev.caseSettings || defaultCaseSettings),
                    [key]: value,
                },
            }));
        },
        []
    );

    const validate = useCallback(() => {
        const newErrors: ActivityFormErrors = {};

        if (!values.name.trim()) {
            newErrors.name = 'Activity name is required';
        }

        if (!values.groupId) {
            newErrors.groupId = 'Please select a group';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [values.name, values.groupId]);

    const reset = useCallback(() => {
        setValues(initialValues);
        setErrors({});
    }, [initialValues]);

    const getSubmitData = useCallback((): ActivityFormValues => {
        return { ...values };
    }, [values]);

    return {
        values,
        errors,
        setField,
        setExamSetting,
        setInquirySetting,
        setCaseSetting,
        validate,
        reset,
        getSubmitData,
    };
}
