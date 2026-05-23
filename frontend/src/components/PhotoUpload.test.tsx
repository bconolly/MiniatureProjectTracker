import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { useDropzone } from 'react-dropzone'
import PhotoUpload from './PhotoUpload'
import { useApi } from '../hooks/useApi'
import type { Photo } from '../types'

// Capture the onDrop callback so tests can stage files directly, bypassing
// react-dropzone's MIME filtering when we want to exercise the component's
// own isValidFileType check.
let capturedOnDrop: ((files: File[]) => void) | null = null

vi.mock('react-dropzone', () => ({
  useDropzone: vi.fn(),
}))

vi.mock('../hooks/useApi', () => ({
  useApi: vi.fn(),
}))

beforeEach(() => {
  // jsdom doesn't implement Blob URL helpers; PhotoUpload calls them for
  // image previews.
  if (typeof URL.createObjectURL !== 'function') {
    URL.createObjectURL = vi.fn(() => 'blob:mock')
    URL.revokeObjectURL = vi.fn()
  }
  capturedOnDrop = null
  ;(useDropzone as Mock).mockImplementation((opts: { onDrop: (files: File[]) => void }) => {
    capturedOnDrop = opts.onDrop
    return {
      getRootProps: () => ({ 'data-testid': 'dropzone' }),
      getInputProps: () => ({ 'data-testid': 'file-input' }),
      isDragActive: false,
      isDragReject: false,
    }
  })
  ;(useApi as Mock).mockReturnValue({
    data: null,
    loading: false,
    error: null,
    execute: vi.fn(),
    reset: vi.fn(),
  })
})

const renderPhotoUpload = (props: Partial<React.ComponentProps<typeof PhotoUpload>> = {}) => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    miniatureId: 1,
    onUploadSuccess: vi.fn(),
    ...props,
  }

  return {
    ...render(<PhotoUpload {...defaultProps} />),
    ...defaultProps,
  }
}

const stageFiles = (files: File[]) => {
  if (!capturedOnDrop) throw new Error('useDropzone mock not initialised')
  act(() => capturedOnDrop!(files))
}

describe('PhotoUpload', () => {
  it('renders upload dialog correctly', () => {
    renderPhotoUpload()

    expect(screen.getByText('Upload Photos')).toBeInTheDocument()
    expect(screen.getByText(/Drag & drop photos here/)).toBeInTheDocument()
    expect(screen.getByText(/Supports JPEG, PNG, and WebP files/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup()
    const { onClose } = renderPhotoUpload()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onClose).toHaveBeenCalled()
  })

  it('displays upload button as disabled when no files selected', () => {
    renderPhotoUpload()

    expect(screen.getByRole('button', { name: 'Upload 0 Photos' })).toBeDisabled()
  })

  it('stages a valid file and enables the upload button', () => {
    renderPhotoUpload()

    const file = new File(['x'], 'progress.jpg', { type: 'image/jpeg' })
    stageFiles([file])

    expect(screen.getByText('progress.jpg')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Upload 1 Photo' })).not.toBeDisabled()
  })

  it('uploads a staged file and notifies the parent', async () => {
    const user = userEvent.setup()
    const photo: Photo = {
      id: 7,
      miniature_id: 1,
      filename: 'progress.jpg',
      file_path: '/photos/progress.jpg',
      file_size: 1234,
      mime_type: 'image/jpeg',
      uploaded_at: '2024-01-01T00:00:00Z',
    }
    const execute = vi.fn().mockResolvedValue(photo)
    ;(useApi as Mock).mockReturnValue({
      data: null,
      loading: false,
      error: null,
      execute,
      reset: vi.fn(),
    })

    const { onUploadSuccess } = renderPhotoUpload()

    const file = new File(['x'], 'progress.jpg', { type: 'image/jpeg' })
    stageFiles([file])

    await user.click(screen.getByRole('button', { name: 'Upload 1 Photo' }))

    expect(execute).toHaveBeenCalledWith(1, file)
    expect(onUploadSuccess).toHaveBeenCalledWith(photo)
  })

  it('flags invalid file types in the staged list and keeps Upload disabled', () => {
    renderPhotoUpload()

    // Bypass react-dropzone's accept filter to exercise the secondary
    // isValidFileType check in PhotoUpload.
    const txt = new File(['hello'], 'note.txt', { type: 'text/plain' })
    stageFiles([txt])

    expect(screen.getByText('note.txt')).toBeInTheDocument()
    expect(screen.getByText('Unsupported file type')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Upload 1 Photo' })).toBeDisabled()
  })
})
