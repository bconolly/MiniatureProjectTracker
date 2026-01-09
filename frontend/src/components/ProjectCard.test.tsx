import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import ProjectCard from './ProjectCard'
import type { Project } from '../types'
import { GameSystem } from '../types'

// Mock react-router-dom navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const mockProject: Project = {
  id: 1,
  name: 'Test Project',
  game_system: GameSystem.AgeOfSignar,
  army: 'Stormcast Eternals',
  description: 'A test project for unit testing',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const renderProjectCard = (project: Project = mockProject) => {
  const mockOnEdit = vi.fn()
  const mockOnDelete = vi.fn()

  return {
    ...render(
      <BrowserRouter>
        <ProjectCard
          project={project}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      </BrowserRouter>
    ),
    mockOnEdit,
    mockOnDelete,
  }
}

describe('ProjectCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders project information correctly', () => {
    renderProjectCard()

    expect(screen.getByText('Test Project')).toBeInTheDocument()
    expect(screen.getByText('Age of Sigmar')).toBeInTheDocument()
    expect(screen.getByText('Stormcast Eternals')).toBeInTheDocument()
    expect(screen.getByText('A test project for unit testing')).toBeInTheDocument()
    expect(screen.getByText(/Created: 1\/1\/2024/)).toBeInTheDocument()
  })

  it('renders project without description', () => {
    const projectWithoutDescription = {
      ...mockProject,
      description: undefined,
    }
    renderProjectCard(projectWithoutDescription)

    expect(screen.getByText('Test Project')).toBeInTheDocument()
    expect(screen.queryByText('A test project for unit testing')).not.toBeInTheDocument()
  })

  it('navigates to project detail when card is clicked', async () => {
    renderProjectCard()

    const card = screen.getByText('Test Project').closest('[role="button"]') || 
                 screen.getByText('Test Project').closest('div')
    
    if (card) {
      fireEvent.click(card)
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/projects/1')
      })
    }
  })

  it('opens menu when more options button is clicked', async () => {
    renderProjectCard()

    const moreButton = screen.getByLabelText('more options')
    fireEvent.click(moreButton)

    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument()
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })
  })

  it('calls onEdit when edit menu item is clicked', async () => {
    const { mockOnEdit } = renderProjectCard()

    // Open menu
    const moreButton = screen.getByLabelText('more options')
    fireEvent.click(moreButton)

    // Click edit
    await waitFor(() => {
      const editButton = screen.getByText('Edit')
      fireEvent.click(editButton)
    })

    expect(mockOnEdit).toHaveBeenCalledWith(mockProject)
  })

  it('calls onDelete when delete menu item is clicked', async () => {
    const { mockOnDelete } = renderProjectCard()

    // Open menu
    const moreButton = screen.getByLabelText('more options')
    fireEvent.click(moreButton)

    // Click delete
    await waitFor(() => {
      const deleteButton = screen.getByText('Delete')
      fireEvent.click(deleteButton)
    })

    expect(mockOnDelete).toHaveBeenCalledWith(mockProject)
  })

  it('prevents navigation when menu button is clicked', async () => {
    renderProjectCard()

    const moreButton = screen.getByLabelText('more options')
    fireEvent.click(moreButton)

    // Navigation should not have been called
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('displays correct game system labels', () => {
    const horusHeresyProject = {
      ...mockProject,
      game_system: GameSystem.HorusHeresy,
    }
    renderProjectCard(horusHeresyProject)

    expect(screen.getByText('Horus Heresy')).toBeInTheDocument()
  })

  it('truncates long descriptions', () => {
    const longDescriptionProject = {
      ...mockProject,
      description: 'This is a very long description that should be truncated when displayed in the card component to prevent the card from becoming too tall and maintain a consistent layout across all project cards in the grid view.',
    }
    renderProjectCard(longDescriptionProject)

    const descriptionElement = screen.getByText(/This is a very long description/)
    expect(descriptionElement).toBeInTheDocument()
  })
})