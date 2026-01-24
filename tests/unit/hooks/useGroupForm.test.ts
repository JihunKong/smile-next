/**
 * @vitest-environment jsdom
 */
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useGroupForm } from '@/features/groups/hooks/useGroupForm'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useGroupForm', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockFetch.mockReset()
    })

    describe('initialization', () => {
        it('should initialize with default form data', () => {
            const { result } = renderHook(() =>
                useGroupForm({ mode: 'create' })
            )

            expect(result.current.formData).toEqual({
                name: '',
                description: '',
                isPrivate: false,
                requirePasscode: false,
                passcode: '',
                groupImageUrl: null,
                autoIconGradient: '0',
            })
            expect(result.current.errors).toEqual({})
            expect(result.current.isSubmitting).toBe(false)
            expect(result.current.submitError).toBeNull()
        })

        it('should initialize with provided initial data', () => {
            const initialData = {
                name: 'Test Group',
                description: 'A test description',
                isPrivate: true,
            }

            const { result } = renderHook(() =>
                useGroupForm({ mode: 'edit', groupId: '123', initialData })
            )

            expect(result.current.formData.name).toBe('Test Group')
            expect(result.current.formData.description).toBe('A test description')
            expect(result.current.formData.isPrivate).toBe(true)
        })
    })

    describe('updateField', () => {
        it('should update a single field', () => {
            const { result } = renderHook(() =>
                useGroupForm({ mode: 'create' })
            )

            act(() => {
                result.current.updateField('name', 'New Name')
            })

            expect(result.current.formData.name).toBe('New Name')
        })

        it('should clear error when field is updated', () => {
            const { result } = renderHook(() =>
                useGroupForm({ mode: 'create' })
            )

            // Trigger validation to set error
            act(() => {
                result.current.validate()
            })

            expect(result.current.errors.name).toBeDefined()

            // Update field should clear its error
            act(() => {
                result.current.updateField('name', 'Valid Name')
            })

            expect(result.current.errors.name).toBeUndefined()
        })
    })

    describe('validate', () => {
        it('should return false and set error when name is empty', () => {
            const { result } = renderHook(() =>
                useGroupForm({ mode: 'create' })
            )

            let isValid: boolean
            act(() => {
                isValid = result.current.validate()
            })

            expect(isValid!).toBe(false)
            expect(result.current.errors.name).toBe('Group name is required')
        })

        it('should return false when name exceeds 100 characters', () => {
            const { result } = renderHook(() =>
                useGroupForm({
                    mode: 'create',
                    initialData: { name: 'a'.repeat(101) },
                })
            )

            let isValid: boolean
            act(() => {
                isValid = result.current.validate()
            })

            expect(isValid!).toBe(false)
            expect(result.current.errors.name).toBe('Name must be 100 characters or less')
        })

        it('should return false when description exceeds 500 characters', () => {
            const { result } = renderHook(() =>
                useGroupForm({
                    mode: 'create',
                    initialData: { name: 'Valid', description: 'a'.repeat(501) },
                })
            )

            let isValid: boolean
            act(() => {
                isValid = result.current.validate()
            })

            expect(isValid!).toBe(false)
            expect(result.current.errors.description).toBe('Description must be 500 characters or less')
        })

        it('should return false when passcode is required but empty', () => {
            const { result } = renderHook(() =>
                useGroupForm({
                    mode: 'create',
                    initialData: {
                        name: 'Valid',
                        isPrivate: true,
                        requirePasscode: true,
                        passcode: '',
                    },
                })
            )

            let isValid: boolean
            act(() => {
                isValid = result.current.validate()
            })

            expect(isValid!).toBe(false)
            expect(result.current.errors.passcode).toBe('Passcode is required when enabled')
        })

        it('should return true for valid form data', () => {
            const { result } = renderHook(() =>
                useGroupForm({
                    mode: 'create',
                    initialData: { name: 'Valid Group Name' },
                })
            )

            let isValid: boolean
            act(() => {
                isValid = result.current.validate()
            })

            expect(isValid!).toBe(true)
            expect(result.current.errors).toEqual({})
        })
    })

    describe('submit', () => {
        it('should not submit if validation fails', async () => {
            const { result } = renderHook(() =>
                useGroupForm({ mode: 'create' })
            )

            let success: boolean
            await act(async () => {
                success = await result.current.submit()
            })

            expect(success!).toBe(false)
            expect(mockFetch).not.toHaveBeenCalled()
        })

        it('should POST to /api/groups for create mode', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: 'new-group-id' }),
            })

            const onSuccess = vi.fn()
            const { result } = renderHook(() =>
                useGroupForm({
                    mode: 'create',
                    initialData: { name: 'New Group' },
                    onSuccess,
                })
            )

            await act(async () => {
                await result.current.submit()
            })

            expect(mockFetch).toHaveBeenCalledWith('/api/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: expect.any(String),
            })
            expect(onSuccess).toHaveBeenCalledWith('new-group-id')
        })

        it('should PATCH to /api/groups/{id} for edit mode', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: '123' }),
            })

            const onSuccess = vi.fn()
            const { result } = renderHook(() =>
                useGroupForm({
                    mode: 'edit',
                    groupId: '123',
                    initialData: { name: 'Updated Group' },
                    onSuccess,
                })
            )

            await act(async () => {
                await result.current.submit()
            })

            expect(mockFetch).toHaveBeenCalledWith('/api/groups/123', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: expect.any(String),
            })
            expect(onSuccess).toHaveBeenCalledWith('123')
        })

        it('should set submitError on API failure', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                json: async () => ({ error: 'Group name already exists' }),
            })

            const { result } = renderHook(() =>
                useGroupForm({
                    mode: 'create',
                    initialData: { name: 'Duplicate Name' },
                })
            )

            await act(async () => {
                await result.current.submit()
            })

            expect(result.current.submitError).toBe('Group name already exists')
        })

        it('should set isSubmitting during API call', async () => {
            let resolvePromise: (value: unknown) => void
            const pendingPromise = new Promise((resolve) => {
                resolvePromise = resolve
            })

            mockFetch.mockReturnValueOnce(pendingPromise)

            const { result } = renderHook(() =>
                useGroupForm({
                    mode: 'create',
                    initialData: { name: 'Test Group' },
                })
            )

            // Start submission
            act(() => {
                result.current.submit()
            })

            // Should be submitting
            expect(result.current.isSubmitting).toBe(true)

            // Resolve the promise
            await act(async () => {
                resolvePromise!({
                    ok: true,
                    json: async () => ({ id: 'new-id' }),
                })
            })

            // Should no longer be submitting
            await waitFor(() => {
                expect(result.current.isSubmitting).toBe(false)
            })
        })
    })
})
