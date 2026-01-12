import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ProjectList from './ProjectList'
import type { Project } from '../types'
import { GameSystem } from '../types'
import { useApi } from '../hooks/useApi'

// Mock react-router-dom navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock the useApi hook
vi.mock('../hooks/useApi')
const mockUseApi = vi.mocked(useApi)

const mockProjects: Project[] = [
  {
    id: 1,
    name: 'Stormcast Project',
    game_system: GameSystem.AgeOfSigmar,
    army: 'Stormcast Eternals',
    description: 'My first AoS project',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Space Marines Project',
    game_system: GameSystem.Warhammer40k,
    army: 'Ultramarines',
    description: 'Classic blue marines',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
  {
    id: 3,
    name: 'Another Stormcast Project',
    game_system: GameSystem.AgeOfSigmar,
    army: 'Stormcast Eternals',
    description: 'Second AoS project',
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
  },
]

const renderProjectList = () => {
  return render(
    <BrowserRouter>
      <ProjectList />
    </BrowserRouter>
  )
}

describe('ProjectList', () => {
  // Create mock functions for each API call
  const mockListExecute = vi.fn()
  const mockCreateExecute = vi.fn()
  const mockUpdateExecute = vi.fn()
  const mockDeleteExecute = vi.fn()
  const mockReset = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock useApi to return different values based on call order
    let callIndex = 0
    mockUseApi.mockImplementation(() => {
      const currentCall = callIndex++
      
      if (currentCall === 0) {
        // First call: projectApi.list
        return {
          data: mockProjects,
          loading: false,
          error: null,
          execute: mockListExecute,
          reset: mockReset,
        }
      } else if (currentCall === 1) {
        // Second call: projectApi.create
        return {
          data: null,
          loading: false,
          error: null,
          execute: mockCreateExecute,
          reset: mockReset,
        }
      } else if (currentCall === 2) {
        // Third call: projectApi.update
        return {
          data: null,
          loading: false,
          error: null,
          execute: mockUpdateExecute,
          reset: mockReset,
        }
      } else {
        // Fourth call: projectApi.delete
        return {
          data: null,
          loading: false,
          error: null,
          execute: mockDeleteExecute,
          reset: mockReset,
        }
      }
    })
  })

  it('renders project list header', async () => {
    renderProjectList()

    expect(screen.getByText('Projects')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'New Project' })).toBeInTheDocument()
  })

  it('displays loading state initially', () => {
    // Override the mock for this specific test
    let callIndex = 0
    mockUseApi.mockImplementation(() => {
      const currentCall = callIndex++
      
      if (currentCall === 0) {
        // First call: projectApi.list - loading
        return {
          data: null,
          loading: true,
          error: null,
          execute: mockListExecute,
          reset: mockReset,
        }
      } else {
        // Other calls
        return {
          data: null,
          loading: false,
          error: null,
          execute: vi.fn(),
          reset: mockReset,
        }
      }
    })

    renderProjectList()
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('organizes projects by game system and army', async () => {
    renderProjectList()

    await waitFor(() => {
      // Check that both game systems are present in accordion headers
      const ageOfSigmarHeaders = screen.getAllByText('Age of Sigmar')
      const warhammer40kHeaders = screen.getAllByText('Warhammer 40K')
      expect(ageOfSigmarHeaders.length).toBeGreaterThan(0)
      expect(warhammer40kHeaders.length).toBeGreaterThan(0)
    }, { timeout: 3000 })
    
    await waitFor(() => {
      // Check army groupings - use getAllByText since they appear multiple times
      const stormcastElements = screen.getAllByText('Stormcast Eternals')
      const ultramarinesElements = screen.getAllByText('Ultramarines')
      expect(stormcastElements.length).toBeGreaterThan(0)
      expect(ultramarinesElements.length).toBeGreaterThan(0)
    }, { timeout: 3000 })
  })

  it('displays project counts correctly', async () => {
    renderProjectList()

    await waitFor(() => {
      // Age of Sigmar should have 1 army - check for all instances
      const armyCountElements = screen.getAllByText('1 armies')
      expect(armyCountElements.length).toBeGreaterThan(0)
    }, { timeout: 3000 })
    
    await waitFor(() => {
      // Stormcast Eternals should have 2 projects
      expect(screen.getByText('2 projects')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('handles API errors gracefully', async () => {
    // Override the mock for this specific test
    let callIndex = 0
    mockUseApi.mockImplementation(() => {
      const currentCall = callIndex++
      
      if (currentCall === 0) {
        // First call: projectApi.list - error
        return {
          data: null,
          loading: false,
          error: 'API Error',
          execute: mockListExecute,
          reset: mockReset,
        }
      } else {
        // Other calls
        return {
          data: null,
          loading: false,
          error: null,
          execute: vi.fn(),
          reset: mockReset,
        }
      }
    })

    renderProjectList()

    // Use a more flexible text matcher and shorter timeout
    await waitFor(() => {
      expect(screen.getByText(/Failed to load projects/)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('displays empty state when no projects exist', async () => {
    // Override the mock for this specific test
    let callIndex = 0
    mockUseApi.mockImplementation(() => {
      const currentCall = callIndex++
      
      if (currentCall === 0) {
        // First call: projectApi.list - empty array
        return {
          data: [],
          loading: false,
          error: null,
          execute: mockListExecute,
          reset: mockReset,
        }
      } else {
        // Other calls
        return {
          data: null,
          loading: false,
          error: null,
          execute: vi.fn(),
          reset: mockReset,
        }
      }
    })

    renderProjectList()

    await waitFor(() => {
      expect(screen.getByText('No projects yet')).toBeInTheDocument()
      expect(screen.getByText('Create your first miniature painting project to get started')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Create Project' })).toBeInTheDocument()
    })
  })

  it('sorts projects by creation date within armies', async () => {
    renderProjectList()

    await waitFor(() => {
      const stormcastProjects = screen.getAllByText(/Stormcast Project|Another Stormcast Project/)
      // "Another Stormcast Project" should come first (newer)
      expect(stormcastProjects[0]).toHaveTextContent('Another Stormcast Project')
      expect(stormcastProjects[1]).toHaveTextContent('Stormcast Project')
    }, { timeout: 3000 })
  })

  it('shows floating action button on mobile', () => {
    renderProjectList()

    const fab = screen.getByLabelText('add project')
    expect(fab).toBeInTheDocument()
  })

  it('opens create project form when new project button is clicked', async () => {
    const user = userEvent.setup()
    renderProjectList()

    const newProjectButton = screen.getByRole('button', { name: 'New Project' })
    await user.click(newProjectButton)

    await waitFor(() => {
      expect(screen.getByText('Create New Project')).toBeInTheDocument()
    })
  })
})