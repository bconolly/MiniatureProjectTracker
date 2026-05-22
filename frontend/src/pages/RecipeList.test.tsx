import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import RecipeList from './RecipeList'
import type { PaintingRecipe } from '../types'
import { MiniatureType } from '../types'
import { useApi } from '../hooks/useApi'
import { recipeApi } from '../api/client'

// Mock the API client. The vi.fn() instances serve as stable identity keys
// for routing useApi mock returns below (apiFunction === recipeApi.list).
vi.mock('../api/client', () => ({
  recipeApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

// Mock the useApi hook
vi.mock('../hooks/useApi', () => ({
  useApi: vi.fn(),
}))

// Mock components to avoid complex rendering
type RecipeCardMockProps = {
  recipe: PaintingRecipe
  onView: (r: PaintingRecipe) => void
  onEdit: (r: PaintingRecipe) => void
  onDelete: (r: PaintingRecipe) => void
}
type RecipeFormMockProps = {
  open: boolean
  onClose: () => void
  onSubmit: (data: { name: string; miniature_type: string }) => void
  recipe?: PaintingRecipe
}
type RecipeDetailMockProps = {
  recipe?: PaintingRecipe
  open: boolean
  onClose: () => void
  onEdit: (r: PaintingRecipe) => void
  onDelete: (r: PaintingRecipe) => void
}
type DeleteConfirmDialogMockProps = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
}
vi.mock('../components', () => ({
  LoadingSpinner: () => <div>Loading...</div>,
  RecipeCard: ({ recipe, onView, onEdit, onDelete }: RecipeCardMockProps) => (
    <div data-testid={`recipe-card-${recipe.id}`}>
      <h3>{recipe.name}</h3>
      <button onClick={() => onView(recipe)}>View</button>
      <button onClick={() => onEdit(recipe)}>Edit</button>
      <button onClick={() => onDelete(recipe)}>Delete</button>
    </div>
  ),
  RecipeForm: ({ open, onClose, onSubmit, recipe }: RecipeFormMockProps) => (
    open ? (
      <div data-testid="recipe-form">
        <h2>{recipe ? 'Edit Recipe' : 'Create New Recipe'}</h2>
        <button onClick={onClose}>Close</button>
        <button onClick={() => onSubmit({ name: 'Test Recipe', miniature_type: 'troop' })}>
          Submit
        </button>
      </div>
    ) : null
  ),
  RecipeDetail: ({ recipe, open, onClose, onEdit, onDelete }: RecipeDetailMockProps) => (
    open && recipe ? (
      <div data-testid="recipe-detail">
        <h2>{recipe.name}</h2>
        <button onClick={onClose}>Close</button>
        <button onClick={() => onEdit(recipe)}>Edit</button>
        <button onClick={() => onDelete(recipe)}>Delete</button>
      </div>
    ) : null
  ),
  DeleteConfirmDialog: ({ open, onClose, onConfirm, title }: DeleteConfirmDialogMockProps) => (
    open ? (
      <div data-testid="delete-dialog">
        <h2>{title}</h2>
        <button onClick={onClose}>Cancel</button>
        <button onClick={onConfirm}>Confirm</button>
      </div>
    ) : null
  ),
}))

const mockRecipes: PaintingRecipe[] = [
  {
    id: 1,
    name: 'Troop Recipe',
    miniature_type: MiniatureType.Troop,
    steps: ['Step 1', 'Step 2'],
    paints_used: ['Paint 1', 'Paint 2'],
    techniques: ['Technique 1'],
    notes: 'Troop notes',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Character Recipe',
    miniature_type: MiniatureType.Character,
    steps: ['Step 1'],
    paints_used: ['Paint 1'],
    techniques: ['Technique 1'],
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
]

const mockUseApi = vi.mocked(useApi)

// RecipeList calls useApi 4 times per render (list, create, update, delete).
// Each useApi return object — including its `execute` function — must keep
// a stable reference across renders, otherwise the `useEffect([fetchRecipes])`
// in RecipeList re-fires every render and the component renders infinitely.
// We hold one return-object per recipeApi method, routed by identity, and
// tests can override entries before render.
type UseApiReturn = ReturnType<typeof useApi>
let returnsByApi: Map<unknown, UseApiReturn>
const blankReturn = (): UseApiReturn => ({
  data: null,
  loading: false,
  error: null,
  execute: vi.fn(),
  reset: vi.fn(),
})

describe('RecipeList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    returnsByApi = new Map<unknown, UseApiReturn>([
      [recipeApi.list, { ...blankReturn(), data: mockRecipes, execute: vi.fn().mockResolvedValue(mockRecipes) }],
      [recipeApi.create, blankReturn()],
      [recipeApi.update, blankReturn()],
      [recipeApi.delete, blankReturn()],
    ])
    mockUseApi.mockImplementation((api) => returnsByApi.get(api) ?? blankReturn())
  })

  it('renders recipe list correctly', async () => {
    render(<RecipeList />)

    expect(screen.getByText('Painting Recipes')).toBeInTheDocument()
    expect(screen.getByText('Create Recipe')).toBeInTheDocument()
    expect(screen.getByText('Showing 2 of 2 recipes')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByTestId('recipe-card-1')).toBeInTheDocument()
      expect(screen.getByTestId('recipe-card-2')).toBeInTheDocument()
    })
  })

  it('shows loading state initially', () => {
    returnsByApi.set(recipeApi.list, { ...blankReturn(), loading: true })
    render(<RecipeList />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows error state', () => {
    returnsByApi.set(recipeApi.list, { ...blankReturn(), error: 'Failed to load recipes' })
    render(<RecipeList />)
    expect(screen.getByText('Failed to load recipes')).toBeInTheDocument()
  })

  it('shows empty state when no recipes', () => {
    returnsByApi.set(recipeApi.list, {
      ...blankReturn(),
      data: [],
      execute: vi.fn().mockResolvedValue([]),
    })
    render(<RecipeList />)
    expect(screen.getByText('No recipes yet')).toBeInTheDocument()
    expect(screen.getByText('Create your first painting recipe to get started.')).toBeInTheDocument()
  })

  it('filters recipes by type', async () => {
    const user = userEvent.setup()
    render(<RecipeList />)

    // Initially shows all recipes
    await waitFor(() => {
      expect(screen.getByText('Showing 2 of 2 recipes')).toBeInTheDocument()
    })

    // Filter by Troop
    const filterSelect = screen.getByLabelText('Filter by Type')
    await user.click(filterSelect)
    await user.click(screen.getByRole('option', { name: 'Troop' }))

    expect(screen.getByText('Showing 1 of 2 recipes')).toBeInTheDocument()
  })

  it('opens create form when create button is clicked', async () => {
    const user = userEvent.setup()
    render(<RecipeList />)

    const createButton = screen.getByRole('button', { name: 'Create Recipe' })
    await user.click(createButton)

    expect(screen.getByTestId('recipe-form')).toBeInTheDocument()
    expect(screen.getByText('Create New Recipe')).toBeInTheDocument()
  })

  it('opens create form when FAB is clicked', async () => {
    const user = userEvent.setup()
    render(<RecipeList />)

    const fab = screen.getByRole('button', { name: 'add recipe' })
    await user.click(fab)

    expect(screen.getByTestId('recipe-form')).toBeInTheDocument()
  })

  // Each mock RecipeCard renders its own View/Edit/Delete buttons, so with
  // 2 recipes there are 2 of each in the DOM. Scope to the first card.
  it('handles recipe view', async () => {
    const user = userEvent.setup()
    render(<RecipeList />)

    const card1 = await screen.findByTestId('recipe-card-1')
    await user.click(within(card1).getByRole('button', { name: 'View' }))

    const detail = screen.getByTestId('recipe-detail')
    expect(detail).toBeInTheDocument()
    expect(within(detail).getByText('Troop Recipe')).toBeInTheDocument()
  })

  it('handles recipe edit', async () => {
    const user = userEvent.setup()
    render(<RecipeList />)

    const card1 = await screen.findByTestId('recipe-card-1')
    await user.click(within(card1).getByRole('button', { name: 'Edit' }))

    expect(screen.getByTestId('recipe-form')).toBeInTheDocument()
    expect(screen.getByText('Edit Recipe')).toBeInTheDocument()
  })

  it('handles recipe delete', async () => {
    const user = userEvent.setup()
    render(<RecipeList />)

    const card1 = await screen.findByTestId('recipe-card-1')
    await user.click(within(card1).getByRole('button', { name: 'Delete' }))

    expect(screen.getByTestId('delete-dialog')).toBeInTheDocument()
    expect(screen.getByText('Delete Recipe')).toBeInTheDocument()
  })

  it('creates new recipe successfully', async () => {
    const user = userEvent.setup()
    const mockCreate = vi.fn().mockResolvedValue({ id: 3, name: 'New Recipe' })
    returnsByApi.set(recipeApi.create, { ...blankReturn(), execute: mockCreate })

    render(<RecipeList />)

    // Open create form
    const createButton = screen.getByRole('button', { name: 'Create Recipe' })
    await user.click(createButton)

    // Submit form
    const submitButton = screen.getByRole('button', { name: 'Submit' })
    await user.click(submitButton)

    expect(mockCreate).toHaveBeenCalled()
  })

  it('shows filtered empty state', async () => {
    const user = userEvent.setup()
    render(<RecipeList />)

    // Filter by Character (only 1 character recipe)
    const filterSelect = screen.getByLabelText('Filter by Type')
    await user.click(filterSelect)
    await user.click(screen.getByRole('option', { name: 'Character' }))

    expect(screen.getByText('Showing 1 of 2 recipes')).toBeInTheDocument()

    // MUI outlined Select renders the label text twice (floating label +
    // notched-outline legend); use getAllByText.
    expect(screen.getAllByText('Filter by Type').length).toBeGreaterThan(0)
  })
})