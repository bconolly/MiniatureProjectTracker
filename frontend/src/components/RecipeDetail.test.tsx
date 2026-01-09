import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import RecipeDetail from './RecipeDetail'
import type { PaintingRecipe } from '../types'
import { MiniatureType } from '../types'

const mockRecipe: PaintingRecipe = {
  id: 1,
  name: 'Test Recipe',
  miniature_type: MiniatureType.Troop,
  steps: ['Prime with black', 'Base coat with blue', 'Highlight with light blue'],
  paints_used: ['Chaos Black', 'Macragge Blue', 'Caledor Sky'],
  techniques: ['Dry brushing', 'Edge highlighting'],
  notes: 'Test recipe notes with detailed instructions',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-15T12:30:00Z',
}

const mockRecipeWithoutNotes: PaintingRecipe = {
  ...mockRecipe,
  id: 2,
  name: 'Recipe Without Notes',
  notes: undefined,
}

const renderRecipeDetail = (props: Partial<React.ComponentProps<typeof RecipeDetail>> = {}) => {
  const defaultProps = {
    recipe: mockRecipe,
    open: true,
    onClose: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    ...props,
  }

  return {
    ...render(<RecipeDetail {...defaultProps} />),
    ...defaultProps,
  }
}

describe('RecipeDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders recipe details correctly', () => {
    renderRecipeDetail()

    expect(screen.getByText('Test Recipe')).toBeInTheDocument()
    expect(screen.getByText('Troop')).toBeInTheDocument()
    
    // Check steps section
    expect(screen.getByText('Steps')).toBeInTheDocument()
    expect(screen.getByText('1. Prime with black')).toBeInTheDocument()
    expect(screen.getByText('2. Base coat with blue')).toBeInTheDocument()
    expect(screen.getByText('3. Highlight with light blue')).toBeInTheDocument()
    
    // Check paints section
    expect(screen.getByText('Paints Used')).toBeInTheDocument()
    expect(screen.getByText('Chaos Black')).toBeInTheDocument()
    expect(screen.getByText('Macragge Blue')).toBeInTheDocument()
    expect(screen.getByText('Caledor Sky')).toBeInTheDocument()
    
    // Check techniques section
    expect(screen.getByText('Techniques')).toBeInTheDocument()
    expect(screen.getByText('Dry brushing')).toBeInTheDocument()
    expect(screen.getByText('Edge highlighting')).toBeInTheDocument()
    
    // Check notes section
    expect(screen.getByText('Notes')).toBeInTheDocument()
    expect(screen.getByText('Test recipe notes with detailed instructions')).toBeInTheDocument()
    
    // Check dates
    expect(screen.getByText('Created: January 1, 2024')).toBeInTheDocument()
    expect(screen.getByText('Last Updated: January 15, 2024')).toBeInTheDocument()
  })

  it('renders recipe without notes correctly', () => {
    renderRecipeDetail({ recipe: mockRecipeWithoutNotes })

    expect(screen.getByText('Recipe Without Notes')).toBeInTheDocument()
    expect(screen.queryByText('Notes')).not.toBeInTheDocument()
    expect(screen.queryByText('Test recipe notes with detailed instructions')).not.toBeInTheDocument()
  })

  it('renders character type correctly', () => {
    const characterRecipe = { ...mockRecipe, miniature_type: MiniatureType.Character }
    renderRecipeDetail({ recipe: characterRecipe })

    expect(screen.getByText('Character')).toBeInTheDocument()
  })

  it('does not render when recipe is null', () => {
    const { container } = renderRecipeDetail({ recipe: null })
    expect(container.firstChild).toBeNull()
  })

  it('does not render when dialog is closed', () => {
    renderRecipeDetail({ open: false })
    
    // Dialog should not be visible
    expect(screen.queryByText('Test Recipe')).not.toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    const { onClose } = renderRecipeDetail()

    const closeButton = screen.getByTestId('CloseIcon').closest('button')!
    await user.click(closeButton)

    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when Close button is clicked', async () => {
    const user = userEvent.setup()
    const { onClose } = renderRecipeDetail()

    const closeButton = screen.getByRole('button', { name: 'Close' })
    await user.click(closeButton)

    expect(onClose).toHaveBeenCalled()
  })

  it('calls onEdit when edit button is clicked', async () => {
    const user = userEvent.setup()
    const { onEdit } = renderRecipeDetail()

    const editButton = screen.getByTestId('EditIcon').closest('button')!
    await user.click(editButton)

    expect(onEdit).toHaveBeenCalledWith(mockRecipe)
  })

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup()
    const { onDelete } = renderRecipeDetail()

    const deleteButton = screen.getByTestId('DeleteIcon').closest('button')!
    await user.click(deleteButton)

    expect(onDelete).toHaveBeenCalledWith(mockRecipe)
  })

  it('displays steps in correct order', () => {
    const recipeWithManySteps: PaintingRecipe = {
      ...mockRecipe,
      steps: ['First step', 'Second step', 'Third step', 'Fourth step', 'Fifth step'],
    }

    renderRecipeDetail({ recipe: recipeWithManySteps })

    expect(screen.getByText('1. First step')).toBeInTheDocument()
    expect(screen.getByText('2. Second step')).toBeInTheDocument()
    expect(screen.getByText('3. Third step')).toBeInTheDocument()
    expect(screen.getByText('4. Fourth step')).toBeInTheDocument()
    expect(screen.getByText('5. Fifth step')).toBeInTheDocument()
  })

  it('handles empty arrays correctly', () => {
    const recipeWithEmptyArrays: PaintingRecipe = {
      ...mockRecipe,
      steps: [],
      paints_used: [],
      techniques: [],
    }

    renderRecipeDetail({ recipe: recipeWithEmptyArrays })

    // Sections should still be present but empty
    expect(screen.getByText('Steps')).toBeInTheDocument()
    expect(screen.getByText('Paints Used')).toBeInTheDocument()
    expect(screen.getByText('Techniques')).toBeInTheDocument()
    
    // No step items should be present
    expect(screen.queryByText(/^\d+\./)).not.toBeInTheDocument()
  })

  it('preserves whitespace in notes', () => {
    const recipeWithMultilineNotes: PaintingRecipe = {
      ...mockRecipe,
      notes: 'Line 1\nLine 2\n\nLine 4 after empty line',
    }

    renderRecipeDetail({ recipe: recipeWithMultilineNotes })

    // Find the notes section and check for the style
    const notesSection = screen.getByText('Notes')
    const notesContainer = notesSection.parentElement!
    const notesElement = notesContainer.querySelector('[style*="white-space"]') || 
                        notesContainer.querySelector('p')
    
    expect(notesElement).toHaveStyle({ whiteSpace: 'pre-wrap' })
  })

  it('formats dates correctly', () => {
    const recipeWithSpecificDates: PaintingRecipe = {
      ...mockRecipe,
      created_at: '2023-12-25T14:30:00Z',
      updated_at: '2024-02-29T09:15:00Z',
    }

    renderRecipeDetail({ recipe: recipeWithSpecificDates })

    expect(screen.getByText('Created: December 25, 2023')).toBeInTheDocument()
    expect(screen.getByText('Last Updated: February 29, 2024')).toBeInTheDocument()
  })
})