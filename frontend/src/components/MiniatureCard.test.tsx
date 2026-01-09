import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import MiniatureCard from './MiniatureCard'
import type { Miniature } from '../types'
import { MiniatureType, ProgressStatus } from '../types'

const mockMiniature: Miniature = {
  id: 1,
  project_id: 1,
  name: 'Space Marine Captain',
  miniature_type: MiniatureType.Character,
  progress_status: ProgressStatus.Basecoated,
  notes: 'Test miniature notes',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
}

const renderMiniatureCard = (props: Partial<React.ComponentProps<typeof MiniatureCard>> = {}) => {
  const defaultProps = {
    miniature: mockMiniature,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onProgressUpdate: vi.fn(),
    photoCount: 0,
    ...props,
  }

  return {
    ...render(
      <BrowserRouter>
        <MiniatureCard {...defaultProps} />
      </BrowserRouter>
    ),
    ...defaultProps,
  }
}

describe('MiniatureCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders miniature information correctly', () => {
    renderMiniatureCard()

    expect(screen.getByText('Space Marine Captain')).toBeInTheDocument()
    expect(screen.getByText('Character')).toBeInTheDocument()
    expect(screen.getByText('Basecoated')).toBeInTheDocument()
    expect(screen.getByText('Test miniature notes')).toBeInTheDocument()
    expect(screen.getByText(/Updated:/)).toBeInTheDocument()
  })

  it('displays photo count when photos exist', () => {
    renderMiniatureCard({ photoCount: 3 })

    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('shows progress bar with correct value', () => {
    renderMiniatureCard()

    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '40') // Basecoated = 40%
  })

  it('opens menu when more options button is clicked', async () => {
    const user = userEvent.setup()
    renderMiniatureCard()

    const moreButton = screen.getByLabelText('more options')
    await user.click(moreButton)

    expect(screen.getByText('Edit')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('calls onEdit when edit menu item is clicked', async () => {
    const user = userEvent.setup()
    const { onEdit } = renderMiniatureCard()

    const moreButton = screen.getByLabelText('more options')
    await user.click(moreButton)

    const editButton = screen.getByText('Edit')
    await user.click(editButton)

    expect(onEdit).toHaveBeenCalledWith(mockMiniature)
  })

  it('calls onDelete when delete menu item is clicked', async () => {
    const user = userEvent.setup()
    const { onDelete } = renderMiniatureCard()

    const moreButton = screen.getByLabelText('more options')
    await user.click(moreButton)

    const deleteButton = screen.getByText('Delete')
    await user.click(deleteButton)

    expect(onDelete).toHaveBeenCalledWith(mockMiniature)
  })

  it('opens progress menu when progress chip is clicked', async () => {
    const user = userEvent.setup()
    renderMiniatureCard()

    const progressChip = screen.getByText('Basecoated')
    await user.click(progressChip)

    expect(screen.getByText('Unpainted')).toBeInTheDocument()
    expect(screen.getByText('Primed')).toBeInTheDocument()
    expect(screen.getByText('Detailed')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('calls onProgressUpdate when progress status is changed', async () => {
    const user = userEvent.setup()
    const { onProgressUpdate } = renderMiniatureCard()

    const progressChip = screen.getByText('Basecoated')
    await user.click(progressChip)

    const completedOption = screen.getByText('Completed')
    await user.click(completedOption)

    expect(onProgressUpdate).toHaveBeenCalledWith(mockMiniature, ProgressStatus.Completed)
  })

  it('truncates long notes text', () => {
    const longNotes = 'This is a very long note that should be truncated when displayed in the card to prevent the card from becoming too tall and maintain a consistent layout across all miniature cards in the grid view.'
    
    renderMiniatureCard({
      miniature: { ...mockMiniature, notes: longNotes }
    })

    const notesElement = screen.getByText(longNotes)
    expect(notesElement).toHaveStyle({
      display: '-webkit-box',
      overflow: 'hidden',
    })
    // Note: WebkitLineClamp and WebkitBoxOrient may not be testable in jsdom
  })
})