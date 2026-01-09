import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import App from './App'

const theme = createTheme()

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  )
}

describe('App', () => {
  it('renders the app title', () => {
    renderWithProviders(<App />)
    expect(screen.getByText('Miniature Painting Tracker')).toBeInTheDocument()
  })

  it('renders the dashboard by default', () => {
    renderWithProviders(<App />)
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByText(/Welcome to the Miniature Painting Tracker/)).toBeInTheDocument()
  })
})