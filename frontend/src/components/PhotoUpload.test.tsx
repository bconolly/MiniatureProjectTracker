import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import PhotoUpload from './PhotoUpload'

// Mock react-dropzone
vi.mock('react-dropzone', () => ({
  useDropzone: vi.fn(() => ({
    getRootProps: () => ({ 'data-testid': 'dropzone' }),
    getInputProps: () => ({ 'data-testid': 'file-input' }),
    isDragActive: false,
    isDragReject: false,
  })),
}))

// Mock API
vi.mock('../hooks/useApi', () => ({
  useApi: vi.fn(() => ({
    loading: false,
    error: null,
    execute: vi.fn(),
  })),
}))
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

describe('PhotoUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

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

    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    await user.click(cancelButton)

    expect(onClose).toHaveBeenCalled()
  })

  it('displays upload button as disabled when no files selected', () => {
    renderPhotoUpload()

    const uploadButton = screen.getByRole('button', { name: 'Upload 0 Photos' })
    expect(uploadButton).toBeDisabled()
  })
})