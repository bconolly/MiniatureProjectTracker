import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import MiniatureForm from './MiniatureForm'
import type { Miniature } from '../types'
import { MiniatureType, ProgressStatus } from '../types'

const mockMiniature: Miniature = {
  id: 1,
  project_id: 1,
  name: 'Test Miniature',
  miniature_type: MiniatureType.Character,
  progress_status: ProgressStatus.Primed,
  notes: 'Test notes',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const renderMiniatureForm = (props: Partial<React.ComponentProps<typeof MiniatureForm>> = {}) => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    loading: false,
    error: null,
    ...props,
  }

  return {
    ...render(<MiniatureForm {...defaultProps} />),
    ...defaultProps,
  }
}

describe('MiniatureForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders create form correctly', () => {
    renderMiniatureForm()

    expect(screen.getByText('Add New Miniature')).toBeInTheDocument()
    expect(screen.getByLabelText('Miniature Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Miniature Type')).toBeInTheDocument()
    expect(screen.getByLabelText('Notes (Optional)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('renders edit form correctly', () => {
    renderMiniatureForm({ miniature: mockMiniature })

    expect(screen.getByText('Edit Miniature')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test Miniature')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test notes')).toBeInTheDocument()
    expect(screen.getByLabelText('Progress Status')).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    renderMiniatureForm()

    // Clear the name field to trigger validation
    const nameInput = screen.getByLabelText('Miniature Name')
    await user.clear(nameInput)
    
    // Type something and then clear to trigger onChange validation
    await user.type(nameInput, 'a')
    await user.clear(nameInput)

    await waitFor(() => {
      expect(screen.getByText('Miniature name is required')).toBeInTheDocument()
    })
  })

  it('submits valid form data for creation', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderMiniatureForm()

    // Fill out form
    await user.type(screen.getByLabelText('Miniature Name'), 'New Miniature')
    await user.click(screen.getByLabelText('Miniature Type'))
    await user.click(screen.getByRole('option', { name: 'Troop' }))
    await user.type(screen.getByLabelText('Notes (Optional)'), 'Test notes')

    // Submit form
    const addButton = screen.getByRole('button', { name: 'Add' })
    await user.click(addButton)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'New Miniature',
        miniature_type: MiniatureType.Troop,
        notes: 'Test notes',
      })
    })
  })

  it('submits valid form data for update', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderMiniatureForm({ miniature: mockMiniature })

    // Update name
    const nameInput = screen.getByLabelText('Miniature Name')
    await user.clear(nameInput)
    await user.type(nameInput, 'Updated Miniature')

    // Update progress status
    await user.click(screen.getByLabelText('Progress Status'))
    await user.click(screen.getByText('Completed'))

    // Submit form
    const updateButton = screen.getByRole('button', { name: 'Update' })
    await user.click(updateButton)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Updated Miniature',
        miniature_type: MiniatureType.Character,
        progress_status: ProgressStatus.Completed,
        notes: 'Test notes',
      })
    })
  })

  it('handles empty notes correctly', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderMiniatureForm()

    // Fill out required fields only
    await user.type(screen.getByLabelText('Miniature Name'), 'Miniature Without Notes')

    // Submit form
    const addButton = screen.getByRole('button', { name: 'Add' })
    await user.click(addButton)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Miniature Without Notes',
        miniature_type: MiniatureType.Troop, // Default value
        notes: undefined,
      })
    })
  })

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup()
    const { onClose } = renderMiniatureForm()

    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    await user.click(cancelButton)

    expect(onClose).toHaveBeenCalled()
  })

  it('displays error message', () => {
    renderMiniatureForm({ error: 'Test error message' })

    expect(screen.getByText('Test error message')).toBeInTheDocument()
  })

  it('disables form when loading', () => {
    renderMiniatureForm({ loading: true })

    expect(screen.getByLabelText('Miniature Name')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled()
  })
})