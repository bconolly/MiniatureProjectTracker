import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import RecipeCard from './RecipeCard'
import type { PaintingRecipe } from '../types'
import { MiniatureType } from '../types'

const mockRecipe: PaintingRecipe = {
  id: 1,
  name: 'Test Recipe',
  miniature_type: MiniatureType.Troop,
  steps: ['Prime with black', 'Base coat with blue', 'Highlight with light blue'],
  paints_used: ['Chaos Black', 'Macragge Blue', 'Caledor Sky'],
  techniques: ['Dry brushing', 'Edge highlighting'],
  notes: 'Test recipe notes for display',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockRecipeWithoutNotes: PaintingRecipe = {
  ...mockRecipe,
  id: 2,
  name: 'Recipe Without Notes',
  notes: undefined,
}

const renderRecipeCard = (props: Partial<React.ComponentProps<typeof RecipeCard>> = {}) => {
  const defaultProps = {
    recipe: mockRecipe,
    onView: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    ...props,
  }

  return {
    ...render(<RecipeCard {...defaultProps} />),
    ...defaultProps,
  }
}

describe('RecipeCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders recipe information correctly', () => {
    renderRecipeCard()

    expect(screen.getByText('Test Recipe')).toBeInTheDocument()
    expect(screen.getByText('Troop')).toBeInTheDocument()
    expect(screen.getByText('Steps: 3')).toBeInTheDocument()
    expect(screen.getByText('Paints: 3')).toBeInTheDocument()
    expect(screen.getByText('Techniques: 2')).toBeInTheDocument()
    expect(screen.getByText('Test recipe notes for display')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'View Details' })).toBeInTheDocument()
  })

  it('renders recipe without notes correctly', () => {
    renderRecipeCard({ recipe: mockRecipeWithoutNotes })

    expect(screen.getByText('Recipe Without Notes')).toBeInTheDocument()
    expect(screen.getByText('Troop')).toBeInTheDocument()
    expect(screen.queryByText('Test recipe notes for display')).not.toBeInTheDocument()
  })

  it('renders character type correctly', () => {
    const characterRecipe = { ...mockRecipe, miniature_type: MiniatureType.Character }
    renderRecipeCard({ recipe: characterRecipe })

    expect(screen.getByText('Character')).toBeInTheDocument()
  })

  it('calls onView when card is clicked', async () => {
    const user = userEvent.setup()
    const { onView } = renderRecipeCard()

    const card = screen.getByText('Test Recipe').closest('[role="button"]') || 
                 screen.getByText('Test Recipe').closest('div')
    
    if (card) {
      await user.click(card)
      expect(onView).toHaveBeenCalledWith(mockRecipe)
    }
  })

  it('calls onView when View Details button is clicked', async () => {
    const user = userEvent.setup()
    const { onView } = renderRecipeCard()

    const viewButton = screen.getByRole('button', { name: 'View Details' })
    await user.click(viewButton)

    expect(onView).toHaveBeenCalledWith(mockRecipe)
  })

  it('opens menu when more options button is clicked', async () => {
    const user = userEvent.setup()
    renderRecipeCard()

    const moreButton = screen.getByRole('button', { name: '' }) // More options button
    await user.click(moreButton)

    expect(screen.getByText('View')).toBeInTheDocument()
    expect(screen.getByText('Edit')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('calls onView when View menu item is clicked', async () => {
    const user = userEvent.setup()
    const { onView } = renderRecipeCard()

    // Open menu
    const moreButton = screen.getByRole('button', { name: '' })
    await user.click(moreButton)

    // Click View menu item
    const viewMenuItem = screen.getByText('View')
    await user.click(viewMenuItem)

    expect(onView).toHaveBeenCalledWith(mockRecipe)
  })

  it('calls onEdit when Edit menu item is clicked', async () => {
    const user = userEvent.setup()
    const { onEdit } = renderRecipeCard()

    // Open menu
    const moreButton = screen.getByRole('button', { name: '' })
    await user.click(moreButton)

    // Click Edit menu item
    const editMenuItem = screen.getByText('Edit')
    await user.click(editMenuItem)

    expect(onEdit).toHaveBeenCalledWith(mockRecipe)
  })

  it('calls onDelete when Delete menu item is clicked', async () => {
    const user = userEvent.setup()
    const { onDelete } = renderRecipeCard()

    // Open menu
    const moreButton = screen.getByRole('button', { name: '' })
    await user.click(moreButton)

    // Click Delete menu item
    const deleteMenuItem = screen.getByText('Delete')
    await user.click(deleteMenuItem)

    expect(onDelete).toHaveBeenCalledWith(mockRecipe)
  })

  it('displays correct counts for arrays', () => {
    const recipeWithDifferentCounts: PaintingRecipe = {
      ...mockRecipe,
      steps: ['Step 1'],
      paints_used: ['Paint 1', 'Paint 2', 'Paint 3', 'Paint 4'],
      techniques: [],
    }

    renderRecipeCard({ recipe: recipeWithDifferentCounts })

    expect(screen.getByText('Steps: 1')).toBeInTheDocument()
    expect(screen.getByText('Paints: 4')).toBeInTheDocument()
    expect(screen.getByText('Techniques: 0')).toBeInTheDocument()
  })

  it('truncates long notes text', () => {
    const recipeWithLongNotes: PaintingRecipe = {
      ...mockRecipe,
      notes: 'This is a very long note that should be truncated when displayed in the card view because it exceeds the maximum number of lines that should be shown in the preview.',
    }

    renderRecipeCard({ recipe: recipeWithLongNotes })

    const notesElement = screen.getByText(recipeWithLongNotes.notes!)
    expect(notesElement).toHaveStyle({
      display: '-webkit-box',
      overflow: 'hidden',
    })
    // Note: WebkitLineClamp and WebkitBoxOrient may not be testable in jsdom
  })
})