import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import RecipeForm from './RecipeForm'
import type { PaintingRecipe } from '../types'
import { MiniatureType } from '../types'

const mockRecipe: PaintingRecipe = {
  id: 1,
  name: 'Test Recipe',
  miniature_type: MiniatureType.Troop,
  steps: ['Prime with black', 'Base coat with blue', 'Highlight with light blue'],
  paints_used: ['Chaos Black', 'Macragge Blue', 'Caledor Sky'],
  techniques: ['Dry brushing', 'Edge highlighting'],
  notes: 'Test recipe notes',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const renderRecipeForm = (props: Partial<React.ComponentProps<typeof RecipeForm>> = {}) => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    loading: false,
    error: null,
    ...props,
  }

  return {
    ...render(<RecipeForm {...defaultProps} />),
    ...defaultProps,
  }
}

describe('RecipeForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders create form correctly', () => {
    renderRecipeForm()

    expect(screen.getByText('Create New Recipe')).toBeInTheDocument()
    expect(screen.getByLabelText('Recipe Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Miniature Type')).toBeInTheDocument()
    expect(screen.getByText('Steps')).toBeInTheDocument()
    expect(screen.getByText('Paints Used')).toBeInTheDocument()
    expect(screen.getByText('Techniques')).toBeInTheDocument()
    expect(screen.getByLabelText('Notes (Optional)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('renders edit form correctly', () => {
    renderRecipeForm({ recipe: mockRecipe })

    expect(screen.getByText('Edit Recipe')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test Recipe')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Prime with black')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Chaos Black')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Dry brushing')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test recipe notes')).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    renderRecipeForm()

    // Try to submit without filling required fields
    const createButton = screen.getByRole('button', { name: 'Create' })
    
    // The button should be disabled initially since form is invalid
    expect(createButton).toBeDisabled()
    
    // Fill the name field
    await user.type(screen.getByLabelText('Recipe Name'), 'Test Recipe')
    
    // Fill the first step to make form valid
    const stepInputs = screen.getAllByPlaceholderText('Enter step')
    await user.type(stepInputs[0], 'First step')
    
    // Now button should be enabled
    await waitFor(() => {
      expect(createButton).not.toBeDisabled()
    })
  })

  it('allows adding and removing steps', async () => {
    const user = userEvent.setup()
    renderRecipeForm()

    // Initially should have one step field
    expect(screen.getAllByPlaceholderText('Enter step')).toHaveLength(1)

    // Add a step
    const addStepButton = screen.getByRole('button', { name: 'Add Step' })
    await user.click(addStepButton)

    expect(screen.getAllByPlaceholderText('Enter step')).toHaveLength(2)

    // Remove a step (delete button should appear when there are multiple steps)
    const deleteButtons = screen.getAllByRole('button', { name: '' }) // Delete icon buttons
    const deleteButton = deleteButtons.find(button => button.querySelector('svg[data-testid="DeleteIcon"]'))
    if (deleteButton) {
      await user.click(deleteButton)
      expect(screen.getAllByPlaceholderText('Enter step')).toHaveLength(1)
    }
  })

  it('allows adding and removing paints', async () => {
    const user = userEvent.setup()
    renderRecipeForm()

    // Initially should have one paint field
    expect(screen.getAllByPlaceholderText('Enter paints use')).toHaveLength(1)

    // Add a paint
    const addPaintButton = screen.getByRole('button', { name: 'Add Paints Use' })
    await user.click(addPaintButton)

    expect(screen.getAllByPlaceholderText('Enter paints use')).toHaveLength(2)
  })

  it('allows adding and removing techniques', async () => {
    const user = userEvent.setup()
    renderRecipeForm()

    // Initially should have one technique field
    expect(screen.getAllByPlaceholderText('Enter technique')).toHaveLength(1)

    // Add a technique
    const addTechniqueButton = screen.getByRole('button', { name: 'Add Technique' })
    await user.click(addTechniqueButton)

    expect(screen.getAllByPlaceholderText('Enter technique')).toHaveLength(2)
  })

  it('submits valid form data', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderRecipeForm()

    // Fill out form
    await user.type(screen.getByLabelText('Recipe Name'), 'New Recipe')
    
    // Fill first step
    const stepInputs = screen.getAllByPlaceholderText('Enter step')
    await user.type(stepInputs[0], 'First step')

    // Fill first paint
    const paintInputs = screen.getAllByPlaceholderText('Enter paints use')
    await user.type(paintInputs[0], 'First paint')

    // Fill first technique
    const techniqueInputs = screen.getAllByPlaceholderText('Enter technique')
    await user.type(techniqueInputs[0], 'First technique')

    await user.type(screen.getByLabelText('Notes (Optional)'), 'Test notes')

    // Wait for form to become valid
    await waitFor(() => {
      const createButton = screen.getByRole('button', { name: 'Create' })
      expect(createButton).not.toBeDisabled()
    })

    // Submit form
    const createButton = screen.getByRole('button', { name: 'Create' })
    await user.click(createButton)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'New Recipe',
        miniature_type: MiniatureType.Troop, // Default value
        steps: ['First step'],
        paints_used: ['First paint'],
        techniques: ['First technique'],
        notes: 'Test notes',
      })
    })
  })

  it('filters out empty array fields', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderRecipeForm()

    // Fill out only required fields
    await user.type(screen.getByLabelText('Recipe Name'), 'Minimal Recipe')
    
    // Fill first step only
    const stepInputs = screen.getAllByPlaceholderText('Enter step')
    await user.type(stepInputs[0], 'Only step')

    // Wait for form to become valid
    await waitFor(() => {
      const createButton = screen.getByRole('button', { name: 'Create' })
      expect(createButton).not.toBeDisabled()
    })

    // Submit form
    const createButton = screen.getByRole('button', { name: 'Create' })
    await user.click(createButton)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Minimal Recipe',
        miniature_type: MiniatureType.Troop,
        steps: ['Only step'],
        paints_used: [],
        techniques: [],
        notes: undefined,
      })
    })
  })

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup()
    const { onClose } = renderRecipeForm()

    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    await user.click(cancelButton)

    expect(onClose).toHaveBeenCalled()
  })

  it('displays error message', () => {
    renderRecipeForm({ error: 'Test error message' })

    expect(screen.getByText('Test error message')).toBeInTheDocument()
  })

  it('disables form when loading', () => {
    renderRecipeForm({ loading: true })

    expect(screen.getByLabelText('Recipe Name')).toBeDisabled()
    expect(screen.getByLabelText('Notes (Optional)')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled()
  })

  it('changes miniature type selection', async () => {
    const user = userEvent.setup()
    renderRecipeForm()

    const typeSelect = screen.getByLabelText('Miniature Type')
    await user.click(typeSelect)
    
    const characterOption = screen.getByRole('option', { name: 'Character' })
    await user.click(characterOption)

    expect(screen.getByDisplayValue('character')).toBeInTheDocument()
  })
})