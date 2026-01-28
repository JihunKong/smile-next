import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AvatarUploader } from '@/features/user/components/shared/AvatarUploader'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock URL.createObjectURL
const mockCreateObjectURL = vi.fn(() => 'blob:test-url')
const mockRevokeObjectURL = vi.fn()
global.URL.createObjectURL = mockCreateObjectURL
global.URL.revokeObjectURL = mockRevokeObjectURL

describe('AvatarUploader', () => {
  const defaultProps = {
    currentAvatarUrl: null,
    initials: 'JD',
    onUpload: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  describe('Display', () => {
    it('renders initials when no avatar URL is provided', () => {
      render(<AvatarUploader {...defaultProps} />)
      expect(screen.getByText('JD')).toBeInTheDocument()
    })

    it('renders avatar image when URL is provided', () => {
      render(
        <AvatarUploader
          {...defaultProps}
          currentAvatarUrl="https://example.com/avatar.jpg"
        />
      )
      const img = screen.getByAltText('Avatar')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg')
    })

    it('renders upload button', () => {
      render(<AvatarUploader {...defaultProps} />)
      // There's a camera icon button and a text link button
      const buttons = screen.getAllByRole('button', { name: /change avatar/i })
      expect(buttons.length).toBeGreaterThanOrEqual(1)
    })

    it('renders with custom size', () => {
      render(<AvatarUploader {...defaultProps} size="lg" />)
      const container = screen.getByTestId('avatar-container')
      expect(container).toHaveClass('w-24', 'h-24')
    })

    it('renders with default medium size', () => {
      render(<AvatarUploader {...defaultProps} />)
      const container = screen.getByTestId('avatar-container')
      expect(container).toHaveClass('w-20', 'h-20')
    })
  })

  describe('File Selection', () => {
    it('opens file picker when upload button is clicked', () => {
      render(<AvatarUploader {...defaultProps} />)

      const fileInput = screen.getByTestId('avatar-file-input')
      const clickSpy = vi.spyOn(fileInput, 'click')

      // Click the camera icon button (first one)
      const buttons = screen.getAllByRole('button', { name: /change avatar/i })
      fireEvent.click(buttons[0])
      expect(clickSpy).toHaveBeenCalled()
    })

    it('accepts only image files', () => {
      render(<AvatarUploader {...defaultProps} />)
      const fileInput = screen.getByTestId('avatar-file-input')
      expect(fileInput).toHaveAttribute('accept', 'image/*')
    })

    it('shows preview when file is selected', async () => {
      render(<AvatarUploader {...defaultProps} />)

      const file = new File(['test'], 'test.png', { type: 'image/png' })
      const fileInput = screen.getByTestId('avatar-file-input')

      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        const img = screen.getByAltText('Avatar preview')
        expect(img).toBeInTheDocument()
        expect(img).toHaveAttribute('src', 'blob:test-url')
      })
    })

    it('shows confirm and cancel buttons after file selection', async () => {
      render(<AvatarUploader {...defaultProps} />)

      const file = new File(['test'], 'test.png', { type: 'image/png' })
      const fileInput = screen.getByTestId('avatar-file-input')

      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
      })
    })
  })

  describe('File Validation', () => {
    it('shows error for files larger than 5MB', async () => {
      render(<AvatarUploader {...defaultProps} />)

      // Create a file larger than 5MB
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.png', {
        type: 'image/png',
      })
      const fileInput = screen.getByTestId('avatar-file-input')

      fireEvent.change(fileInput, { target: { files: [largeFile] } })

      await waitFor(() => {
        expect(screen.getByText(/file size must be less than 5MB/i)).toBeInTheDocument()
      })
    })

    it('shows error for non-image files', async () => {
      render(<AvatarUploader {...defaultProps} />)

      const textFile = new File(['test'], 'test.txt', { type: 'text/plain' })
      const fileInput = screen.getByTestId('avatar-file-input')

      fireEvent.change(fileInput, { target: { files: [textFile] } })

      await waitFor(() => {
        expect(screen.getByText(/please select an image file/i)).toBeInTheDocument()
      })
    })
  })

  describe('Upload', () => {
    it('calls onUpload with file when save is clicked', async () => {
      const onUpload = vi.fn().mockResolvedValue({ success: true })
      render(<AvatarUploader {...defaultProps} onUpload={onUpload} />)

      const file = new File(['test'], 'test.png', { type: 'image/png' })
      const fileInput = screen.getByTestId('avatar-file-input')

      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /save/i }))

      await waitFor(() => {
        expect(onUpload).toHaveBeenCalledWith(file)
      })
    })

    it('shows loading state during upload', async () => {
      const onUpload = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      )
      render(<AvatarUploader {...defaultProps} onUpload={onUpload} />)

      const file = new File(['test'], 'test.png', { type: 'image/png' })
      const fileInput = screen.getByTestId('avatar-file-input')

      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /save/i }))

      await waitFor(() => {
        expect(screen.getByText(/uploading/i)).toBeInTheDocument()
      })
    })

    it('shows success message after successful upload', async () => {
      const onUpload = vi.fn().mockResolvedValue({ success: true })
      render(<AvatarUploader {...defaultProps} onUpload={onUpload} />)

      const file = new File(['test'], 'test.png', { type: 'image/png' })
      const fileInput = screen.getByTestId('avatar-file-input')

      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /save/i }))

      await waitFor(() => {
        expect(screen.getByText(/avatar updated/i)).toBeInTheDocument()
      })
    })

    it('shows error message when upload fails', async () => {
      const onUpload = vi.fn().mockResolvedValue({
        success: false,
        error: 'Upload failed'
      })
      render(<AvatarUploader {...defaultProps} onUpload={onUpload} />)

      const file = new File(['test'], 'test.png', { type: 'image/png' })
      const fileInput = screen.getByTestId('avatar-file-input')

      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /save/i }))

      await waitFor(() => {
        expect(screen.getByText(/upload failed/i)).toBeInTheDocument()
      })
    })
  })

  describe('Cancel', () => {
    it('clears preview when cancel is clicked', async () => {
      render(<AvatarUploader {...defaultProps} />)

      const file = new File(['test'], 'test.png', { type: 'image/png' })
      const fileInput = screen.getByTestId('avatar-file-input')

      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByAltText('Avatar preview')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

      await waitFor(() => {
        expect(screen.queryByAltText('Avatar preview')).not.toBeInTheDocument()
        expect(screen.getByText('JD')).toBeInTheDocument()
      })
    })

    it('revokes object URL when cancelled', async () => {
      render(<AvatarUploader {...defaultProps} />)

      const file = new File(['test'], 'test.png', { type: 'image/png' })
      const fileInput = screen.getByTestId('avatar-file-input')

      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test-url')
    })
  })

  describe('Disabled State', () => {
    it('disables upload button when disabled prop is true', () => {
      render(<AvatarUploader {...defaultProps} disabled />)
      expect(screen.getByRole('button', { name: /change avatar/i })).toBeDisabled()
    })

    it('does not open file picker when disabled', () => {
      render(<AvatarUploader {...defaultProps} disabled />)

      const fileInput = screen.getByTestId('avatar-file-input')
      const clickSpy = vi.spyOn(fileInput, 'click')

      fireEvent.click(screen.getByRole('button', { name: /change avatar/i }))
      expect(clickSpy).not.toHaveBeenCalled()
    })
  })
})
