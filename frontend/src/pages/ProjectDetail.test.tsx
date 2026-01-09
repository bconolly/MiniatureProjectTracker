import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ProjectDetail from './ProjectDetail'
import type { Project, Miniature } from '../types'
import { GameSystem, MiniatureType, ProgressStatus } from '../types'

// Mock the useApi hook
vi.mock('../hooks/useApi', () => ({
  useApi: vi.fn(),
}))

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: '1' }),
  }
})

const mockProject: Project = {
  id: 1,
  name: 'Test Project',
  game_system: GameSystem.AgeOfSignar,
  army: 'Stormcast Eternals',
  description: 'A test project for unit testing',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
}

const mockMiniatures: Miniature[] = [
  {
    id: 1,
    project_id: 1,
    name: 'Lord-Arcanum',
    miniature_type: MiniatureType.Character,
    progress_status: ProgressStatus.Completed,
    notes: 'Finished character',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    project_id: 1,
    name: 'Liberator Squad',
    miniature_type: MiniatureType.Troop,
    progress_status: ProgressStatus.Basecoated,
    notes: 'Work in progress',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
  {
    id: 3,
    project_id: 1,
    name: 'Sequitor Squad',
    miniature_type: MiniatureType.Troop,
    progress_status: ProgressStatus.Unpainted,
    notes: undefined,
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
  },
]

const renderProjectDetail = () => {
  return render(
    <BrowserRouter>
      <ProjectDetail />
    </BrowserRouter>
  )
}

import { useApi } from '../hooks/useApi'

// Mock the useApi hook
vi.mock('../hooks/useApi')

describe('ProjectDetail', () => {
  const mockUseApi = vi.mocked(useApi)

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock useApi to return different values for different calls
    mockUseApi
      .mockReturnValueOnce({
        data: mockProject,
        loading: false,
        error: null,
        execute: vi.fn(),
        reset: vi.fn(),
      })
      .mockReturnValueOnce({
        data: mockMiniatures,
        loading: false,
        error: null,
        execute: vi.fn(),
        reset: vi.fn(),
      })
      .mockReturnValue({
        data: null,
        loading: false,
        error: null,
        execute: vi.fn(),
        reset: vi.fn(),
      })
  })

  it('renders project information correctly', async () => {
    renderProjectDetail()

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument()
      expect(screen.getByText('Age of Sigmar')).toBeInTheDocument()
      expect(screen.getByText('Stormcast Eternals')).toBeInTheDocument()
      expect(screen.getByText('A test project for unit testing')).toBeInTheDocument()
      expect(screen.getByText(/Created: 1\/1\/2024/)).toBeInTheDocument()
      expect(screen.getByText(/Updated: 1\/2\/2024/)).toBeInTheDocument()
    })
  })

  it('displays breadcrumbs correctly', async () => {
    renderProjectDetail()

    await waitFor(() => {
      expect(screen.getByText('Projects')).toBeInTheDocument()
      expect(screen.getByText('Test Project')).toBeInTheDocument()
    })
  })

  it('navigates back to projects when breadcrumb is clicked', async () => {
    renderProjectDetail()

    await waitFor(() => {
      const projectsLink = screen.getByText('Projects')
      fireEvent.click(projectsLink)
    })

    expect(mockNavigate).toHaveBeenCalledWith('/projects')
  })

  it('calculates and displays progress correctly', async () => {
    renderProjectDetail()

    await waitFor(() => {
      // 1 completed out of 3 total = 33%
      expect(screen.getByText('33%')).toBeInTheDocument()
      expect(screen.getByText('1 of 3 completed')).toBeInTheDocument()
    })
  })

  it('displays miniatures with correct information', async () => {
    renderProjectDetail()

    await waitFor(() => {
      expect(screen.getByText('Lord-Arcanum')).toBeInTheDocument()
      expect(screen.getByText('Liberator Squad')).toBeInTheDocument()
      expect(screen.getByText('Sequitor Squad')).toBeInTheDocument()
      
      expect(screen.getByText('Character')).toBeInTheDocument()
      expect(screen.getAllByText('Troop')).toHaveLength(2)
      
      expect(screen.getByText('Completed')).toBeInTheDocument()
      expect(screen.getByText('Basecoated')).toBeInTheDocument()
      expect(screen.getByText('Unpainted')).toBeInTheDocument()
    })
  })

  it('navigates to miniature detail when miniature card is clicked', async () => {
    renderProjectDetail()

    await waitFor(() => {
      const miniatureCard = screen.getByText('Lord-Arcanum')
      fireEvent.click(miniatureCard.closest('div')!)
    })

    expect(mockNavigate).toHaveBeenCalledWith('/miniatures/1')
  })

  it('handles project not found error', async () => {
    mockUseApi
      .mockReturnValueOnce({
        data: null,
        loading: false,
        error: 'Project not found',
        execute: vi.fn(),
        reset: vi.fn(),
      })
      .mockReturnValue({
        data: null,
        loading: false,
        error: null,
        execute: vi.fn(),
        reset: vi.fn(),
      })

    renderProjectDetail()

    await waitFor(() => {
      expect(screen.getByText('Project not found')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Back to Projects' })).toBeInTheDocument()
    })
  })

  it('displays empty state when no miniatures exist', async () => {
    mockUseApi
      .mockReturnValueOnce({
        data: mockProject,
        loading: false,
        error: null,
        execute: vi.fn(),
        reset: vi.fn(),
      })
      .mockReturnValueOnce({
        data: [],
        loading: false,
        error: null,
        execute: vi.fn(),
        reset: vi.fn(),
      })
      .mockReturnValue({
        data: null,
        loading: false,
        error: null,
        execute: vi.fn(),
        reset: vi.fn(),
      })

    renderProjectDetail()

    await waitFor(() => {
      expect(screen.getByText('No miniatures yet')).toBeInTheDocument()
      expect(screen.getByText('Add your first miniature to start tracking painting progress')).toBeInTheDocument()
    })
  })

  it('shows add miniature button', async () => {
    renderProjectDetail()

    await waitFor(() => {
      const addButtons = screen.getAllByText('Add Miniature')
      expect(addButtons.length).toBeGreaterThan(0)
    })
  })

  it('shows correct miniature count in header', async () => {
    renderProjectDetail()

    await waitFor(() => {
      expect(screen.getByText('Miniatures (3)')).toBeInTheDocument()
    })
  })
})