import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { GameSystem, MiniatureType, ProgressStatus } from './types'
import ProjectForm from './components/ProjectForm'
import MiniatureForm from './components/MiniatureForm'
import RecipeForm from './components/RecipeForm'

// Mock data
const mockProject = {
  id: 1,
  name: 'Space Marines Chapter',
  game_system: GameSystem.Warhammer40k,
  army: 'Ultramarines',
  description: 'Complete Ultramarines army project',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockMiniature = {
  id: 1,
  project_id: 1,
  name: 'Captain in Terminator Armor',
  miniature_type: MiniatureType.Character,
  progress_status: ProgressStatus.Unpainted,
  notes: 'Chapter Master conversion',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockRecipe = {
  id: 1,
  name: 'Standard Troop Painting',
  miniature_type: MiniatureType.Troop,
  steps: [
    'Prime with Chaos Black',
    'Base coat with Macragge Blue',
    'Highlight with Calgar Blue',
    'Detail with Balthasar Gold',
  ],
  paints_used: ['Chaos Black', 'Macragge Blue', 'Calgar Blue', 'Balthasar Gold'],
  techniques: ['Dry brushing', 'Edge highlighting'],
  notes: 'Standard scheme for Ultramarines troops',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

// Helper function to render components with router
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('Integration Tests - Component Workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Project Creation Workflow', () => {
    it('should handle complete project creation workflow', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn()
      const mockOnClose = vi.fn()

      renderWithRouter(
        <ProjectForm
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          loading={false}
          error={null}
        />
      )

      // Step 1: Fill out project form
      await user.type(screen.getByLabelText(/project name/i), 'Space Marines Chapter')
      await user.type(screen.getByLabelText(/army/i), 'Ultramarines')
      await user.type(screen.getByLabelText(/description/i), 'Complete Ultramarines army project')

      // Step 2: Submit project creation
      const submitButton = screen.getByRole('button', { name: /create/i })
      await user.click(submitButton)

      // Step 3: Verify form submission
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Space Marines Chapter',
          game_system: GameSystem.AgeOfSigmar, // Default value
          army: 'Ultramarines',
          description: 'Complete Ultramarines army project',
        })
      })

      // Step 4: Test form validation
      await user.clear(screen.getByLabelText(/project name/i))
      await user.type(screen.getByLabelText(/project name/i), 'a')
      await user.clear(screen.getByLabelText(/project name/i))

      await waitFor(() => {
        expect(screen.getByText(/project name is required/i)).toBeInTheDocument()
      })
    })

    it('should handle project editing workflow', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn()
      const mockOnClose = vi.fn()

      renderWithRouter(
        <ProjectForm
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          loading={false}
          error={null}
          project={mockProject}
        />
      )

      // Step 1: Verify existing data is populated
      expect(screen.getByDisplayValue('Space Marines Chapter')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Ultramarines')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Complete Ultramarines army project')).toBeInTheDocument()

      // Step 2: Modify project data
      const nameInput = screen.getByLabelText(/project name/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Space Marines Chapter')

      // Step 3: Submit update
      const updateButton = screen.getByRole('button', { name: /update/i })
      await user.click(updateButton)

      // Step 4: Verify update submission
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Updated Space Marines Chapter',
          game_system: GameSystem.Warhammer40k,
          army: 'Ultramarines',
          description: 'Complete Ultramarines army project',
        })
      })
    })
  })

  describe('Miniature Management Workflow', () => {
    it('should handle complete miniature creation and progress tracking', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn()
      const mockOnClose = vi.fn()

      renderWithRouter(
        <MiniatureForm
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          loading={false}
          error={null}
        />
      )

      // Step 1: Fill out miniature form
      await user.type(screen.getByLabelText(/miniature name/i), 'Captain in Terminator Armor')

      // MUI Select isn't a native <select>; click + click option.
      await user.click(screen.getByLabelText(/miniature type/i))
      await user.click(screen.getByRole('option', { name: 'Character' }))

      await user.type(screen.getByLabelText(/notes/i), 'Chapter Master conversion')

      // Step 2: Submit miniature creation. MiniatureForm uses "Add"/"Update".
      const submitButton = screen.getByRole('button', { name: /^add$/i })
      await user.click(submitButton)

      // Step 3: Verify form submission
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Captain in Terminator Armor',
          miniature_type: MiniatureType.Character,
          notes: 'Chapter Master conversion',
        })
      })
    })

    it('should handle miniature progress updates', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn()
      const mockOnClose = vi.fn()

      renderWithRouter(
        <MiniatureForm
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          loading={false}
          error={null}
          miniature={mockMiniature}
        />
      )

      // Step 1: Verify existing data is populated
      expect(screen.getByDisplayValue('Captain in Terminator Armor')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Chapter Master conversion')).toBeInTheDocument()

      // Step 2: Update progress status (MUI Select click + click option).
      await user.click(screen.getByLabelText(/progress status/i))
      await user.click(screen.getByRole('option', { name: 'Completed' }))

      // Step 3: Submit update. MiniatureForm edit button label is "Update".
      const updateButton = screen.getByRole('button', { name: /^update$/i })
      await user.click(updateButton)

      // Step 4: Verify update submission
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Captain in Terminator Armor',
          miniature_type: MiniatureType.Character,
          progress_status: ProgressStatus.Completed,
          notes: 'Chapter Master conversion',
        })
      })
    })
  })

  describe('Recipe Management Workflow', () => {
    // Recipe creation is covered by RecipeForm.test.tsx > submits valid form data.
    it('should handle recipe editing workflow', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn()
      const mockOnClose = vi.fn()

      renderWithRouter(
        <RecipeForm
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          loading={false}
          error={null}
          recipe={mockRecipe}
        />
      )

      // Step 1: Verify existing data is populated
      expect(screen.getByDisplayValue('Standard Troop Painting')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Standard scheme for Ultramarines troops')).toBeInTheDocument()

      // Step 2: Modify recipe data
      const nameInput = screen.getByLabelText(/recipe name/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Troop Painting')

      // Step 3: Submit update. RecipeForm edit button label is "Update".
      const updateButton = screen.getByRole('button', { name: /^update$/i })
      await user.click(updateButton)

      // Step 4: Verify update submission
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Updated Troop Painting',
          miniature_type: MiniatureType.Troop,
          steps: mockRecipe.steps,
          paints_used: mockRecipe.paints_used,
          techniques: mockRecipe.techniques,
          notes: 'Standard scheme for Ultramarines troops',
        })
      })
    })
  })

  // Photo upload flows are covered by PhotoUpload.test.tsx.

  describe('Error Handling Workflows', () => {
    it('should display and handle form validation errors', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn()
      const mockOnClose = vi.fn()

      renderWithRouter(
        <ProjectForm
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          loading={false}
          error="Project name is required"
        />
      )

      // Step 1: Verify error message is displayed
      expect(screen.getByText(/project name is required/i)).toBeInTheDocument()

      // Step 2: Fix the error by providing valid input
      await user.type(screen.getByLabelText(/project name/i), 'Valid Project Name')
      await user.type(screen.getByLabelText(/army/i), 'Valid Army')

      // Step 3: Submit form
      const submitButton = screen.getByRole('button', { name: /create/i })
      await user.click(submitButton)

      // Step 4: Verify successful submission
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Valid Project Name',
          game_system: GameSystem.AgeOfSigmar,
          army: 'Valid Army',
          description: undefined,
        })
      })
    })

    it('should handle loading states correctly', () => {
      const mockOnSubmit = vi.fn()
      const mockOnClose = vi.fn()

      renderWithRouter(
        <ProjectForm
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          loading={true}
          error={null}
        />
      )

      // Step 1: Verify form is disabled during loading
      expect(screen.getByLabelText(/project name/i)).toBeDisabled()
      expect(screen.getByLabelText(/army/i)).toBeDisabled()
      expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled()
    })

    it('should handle concurrent form submissions', async () => {
      const user = userEvent.setup()
      // onSubmit must be slow enough that isSubmitting stays true across the
      // three clicks — a sync vi.fn() resolves before the next click lands.
      let resolveSubmit: () => void = () => {}
      const mockOnSubmit = vi.fn(
        () => new Promise<void>((resolve) => { resolveSubmit = resolve })
      )
      const mockOnClose = vi.fn()

      renderWithRouter(
        <ProjectForm
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          loading={false}
          error={null}
        />
      )

      await user.type(screen.getByLabelText(/project name/i), 'Test Project')
      await user.type(screen.getByLabelText(/army/i), 'Test Army')

      const submitButton = screen.getByRole('button', { name: /create/i })
      await Promise.all([
        user.click(submitButton),
        user.click(submitButton),
        user.click(submitButton),
      ])

      // Only the first click should have fired onSubmit; the next two hit
      // a disabled button because isSubmitting is true.
      expect(mockOnSubmit).toHaveBeenCalledTimes(1)

      // Release the in-flight submission so the test tears down cleanly.
      resolveSubmit()
    })
  })
})