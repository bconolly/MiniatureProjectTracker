import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import ProjectForm from './ProjectForm'
import type { Project } from '../types'
import { GameSystem } from '../types'

const mockProject: Project = {
  id: 1,
  name: 'Test Project',
  game_system: GameSystem.AgeOfSignar,
  army: 'Stormcast Eternals',
  description: 'A test project',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const renderProjectForm = (props: Partial<React.ComponentProps<typeof ProjectForm>> = {}) => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    loading: false,
    error: null,
    ...props,
  }

  return {
    ...render(<ProjectForm {...defaultProps} />),
    ...defaultProps,
  }
}

describe('ProjectForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders create form correctly', () => {
    renderProjectForm()

    expect(screen.getByText('Create New Project')).toBeInTheDocument()
    expect(screen.getByLabelText('Project Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Game System')).toBeInTheDocument()
    expect(screen.getByLabelText('Army')).toBeInTheDocument()
    expect(screen.getByLabelText('Description (Optional)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('renders edit form correctly', () => {
    renderProjectForm({ project: mockProject })

    expect(screen.getByText('Edit Project')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test Project')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Stormcast Eternals')).toBeInTheDocument()
    expect(screen.getByDisplayValue('A test project')).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    renderProjectForm()

    // Clear the name field to trigger validation
    const nameInput = screen.getByLabelText('Project Name')
    await user.clear(nameInput)
    
    // Type something and then clear to trigger onChange validation
    await user.type(nameInput, 'a')
    await user.clear(nameInput)

    await waitFor(() => {
      expect(screen.getByText('Project name is required')).toBeInTheDocument()
    })
  })

  it('submits valid form data', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderProjectForm()

    // Fill out form
    await user.type(screen.getByLabelText('Project Name'), 'New Project')
    await user.type(screen.getByLabelText('Army'), 'Space Marines')
    await user.type(screen.getByLabelText('Description (Optional)'), 'Test description')

    // Submit form
    const createButton = screen.getByRole('button', { name: 'Create' })
    await user.click(createButton)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'New Project',
        game_system: GameSystem.AgeOfSignar, // Default value
        army: 'Space Marines',
        description: 'Test description',
      })
    })
  })

  it('handles empty description correctly', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderProjectForm()

    // Fill out required fields only
    await user.type(screen.getByLabelText('Project Name'), 'Project Without Description')
    await user.type(screen.getByLabelText('Army'), 'Test Army')

    // Submit form
    const createButton = screen.getByRole('button', { name: 'Create' })
    await user.click(createButton)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Project Without Description',
        game_system: GameSystem.AgeOfSignar,
        army: 'Test Army',
        description: undefined,
      })
    })
  })

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup()
    const { onClose } = renderProjectForm()

    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    await user.click(cancelButton)

    expect(onClose).toHaveBeenCalled()
  })

  it('displays error message', () => {
    renderProjectForm({ error: 'Test error message' })

    expect(screen.getByText('Test error message')).toBeInTheDocument()
  })

  it('disables form when loading', () => {
    renderProjectForm({ loading: true })

    expect(screen.getByLabelText('Project Name')).toBeDisabled()
    expect(screen.getByLabelText('Army')).toBeDisabled()
    expect(screen.getByLabelText('Description (Optional)')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled()
  })
})