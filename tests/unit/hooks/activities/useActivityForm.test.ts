import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useActivityForm } from '@/features/activities/hooks/useActivityForm';
import {
    ActivityModes,
    defaultExamSettings,
    defaultInquirySettings,
    defaultCaseSettings,
} from '@/types/activities';

describe('useActivityForm', () => {
    describe('initialization', () => {
        it('initializes with default values', () => {
            const { result } = renderHook(() => useActivityForm());
            expect(result.current.values.name).toBe('');
            expect(result.current.values.description).toBe('');
            expect(result.current.values.mode).toBe(ActivityModes.OPEN);
            expect(result.current.values.groupId).toBe('');
        });

        it('initializes with provided initial values', () => {
            const { result } = renderHook(() =>
                useActivityForm({
                    initialValues: {
                        name: 'Test Activity',
                        description: 'Description',
                        mode: ActivityModes.EXAM,
                        groupId: 'group-123',
                    },
                })
            );
            expect(result.current.values.name).toBe('Test Activity');
            expect(result.current.values.mode).toBe(ActivityModes.EXAM);
        });
    });

    describe('field updates', () => {
        it('updates name field', () => {
            const { result } = renderHook(() => useActivityForm());
            act(() => {
                result.current.setField('name', 'New Name');
            });
            expect(result.current.values.name).toBe('New Name');
        });

        it('updates mode and initializes mode-specific settings', () => {
            const { result } = renderHook(() => useActivityForm());
            act(() => {
                result.current.setField('mode', ActivityModes.EXAM);
            });
            expect(result.current.values.mode).toBe(ActivityModes.EXAM);
            expect(result.current.values.examSettings).toEqual(defaultExamSettings);
        });
    });

    describe('validation', () => {
        it('validates required name field', () => {
            const { result } = renderHook(() => useActivityForm());
            act(() => {
                result.current.validate();
            });
            expect(result.current.errors.name).toBe('Activity name is required');
        });

        it('validates required groupId', () => {
            const { result } = renderHook(() => useActivityForm());
            act(() => {
                result.current.validate();
            });
            expect(result.current.errors.groupId).toBe('Please select a group');
        });

        it('passes validation with valid data', () => {
            const { result } = renderHook(() =>
                useActivityForm({
                    initialValues: { name: 'Test', groupId: 'group-1' },
                })
            );
            let isValid = false;
            act(() => {
                isValid = result.current.validate();
            });
            expect(isValid).toBe(true);
            expect(result.current.errors).toEqual({});
        });
    });

    describe('mode-specific settings', () => {
        it('updates exam settings', () => {
            const { result } = renderHook(() =>
                useActivityForm({
                    initialValues: { mode: ActivityModes.EXAM },
                })
            );
            act(() => {
                result.current.setExamSetting('timeLimit', 60);
            });
            expect(result.current.values.examSettings?.timeLimit).toBe(60);
        });

        it('updates inquiry settings', () => {
            const { result } = renderHook(() =>
                useActivityForm({
                    initialValues: { mode: ActivityModes.INQUIRY },
                })
            );
            act(() => {
                result.current.setInquirySetting('questionsRequired', 10);
            });
            expect(result.current.values.inquirySettings?.questionsRequired).toBe(10);
        });

        it('updates case settings', () => {
            const { result } = renderHook(() =>
                useActivityForm({
                    initialValues: { mode: ActivityModes.CASE },
                })
            );
            act(() => {
                result.current.setCaseSetting('timePerCase', 15);
            });
            expect(result.current.values.caseSettings?.timePerCase).toBe(15);
        });
    });

    describe('reset', () => {
        it('resets form to initial values', () => {
            const { result } = renderHook(() =>
                useActivityForm({
                    initialValues: { name: 'Original' },
                })
            );
            act(() => {
                result.current.setField('name', 'Changed');
            });
            expect(result.current.values.name).toBe('Changed');
            act(() => {
                result.current.reset();
            });
            expect(result.current.values.name).toBe('Original');
        });
    });

    describe('getSubmitData', () => {
        it('returns formatted data for API submission', () => {
            const { result } = renderHook(() =>
                useActivityForm({
                    initialValues: {
                        name: 'Test Activity',
                        description: 'Description',
                        groupId: 'group-1',
                        mode: ActivityModes.EXAM,
                        aiRatingEnabled: true,
                    },
                })
            );
            const data = result.current.getSubmitData();
            expect(data).toMatchObject({
                name: 'Test Activity',
                description: 'Description',
                groupId: 'group-1',
                mode: ActivityModes.EXAM,
                aiRatingEnabled: true,
            });
        });
    });
});
