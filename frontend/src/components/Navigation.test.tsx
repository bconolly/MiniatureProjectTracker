import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import Navigation from './Navigation'
import { describe, it, expect } from 'vitest'

const theme = createTheme()

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  )
}

describe('Navigation', () => {
  it('renders the app title', () => {
    renderWithRouter(<Navigation />)
    expect(screen.getByText('Miniature Painting Tracker')).toBeInTheDocument()
  })

  it('renders navigation items', () => {
    renderWithRouter(<Navigation />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Projects')).toBeInTheDocument()
    expect(screen.getByText('Recipes')).toBeInTheDocument()
  })

  it('handles navigation clicks', () => {
    renderWithRouter(<Navigation />)
    const projectsButton = screen.getByText('Projects')
    fireEvent.click(projectsButton)
    // Navigation behavior is handled by React Router, so we just test that the click doesn't error
    expect(projectsButton).toBeInTheDocument()
  })
})