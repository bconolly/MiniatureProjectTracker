import { ReactNode } from 'react'
import { Container, Box } from '@mui/material'
import Navigation from './Navigation'
import ErrorBoundary from './ErrorBoundary'

interface LayoutProps {
  children: ReactNode
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false
}

function Layout({ children, maxWidth = 'lg' }: LayoutProps) {
  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Navigation />
      
      <Container maxWidth={maxWidth} sx={{ mt: 4, mb: 4 }}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </Container>
    </Box>
  )
}

export default Layout