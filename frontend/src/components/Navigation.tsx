import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import {
  Home as HomeIcon,
  FolderOpen as ProjectIcon,
  Palette as RecipeIcon,
  Menu as MenuIcon,
} from '@mui/icons-material'

const navigationItems = [
  { path: '/', label: 'Dashboard', icon: HomeIcon },
  { path: '/projects', label: 'Projects', icon: ProjectIcon },
  { path: '/recipes', label: 'Recipes', icon: RecipeIcon },
]

function Navigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null)

  const handleNavigate = (path: string) => {
    navigate(path)
    setMobileMenuAnchor(null)
  }

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchor(event.currentTarget)
  }

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null)
  }

  const isActivePath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <AppBar position="static" elevation={1}>
      <Toolbar>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: isMobile ? 1 : 0,
            mr: isMobile ? 0 : 4,
            cursor: 'pointer'
          }}
          onClick={() => handleNavigate('/')}
        >
          Miniature Painting Tracker
        </Typography>

        {isMobile ? (
          <>
            <IconButton
              color="inherit"
              aria-label="menu"
              onClick={handleMobileMenuOpen}
            >
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={mobileMenuAnchor}
              open={Boolean(mobileMenuAnchor)}
              onClose={handleMobileMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              {navigationItems.map((item) => {
                const IconComponent = item.icon
                return (
                  <MenuItem
                    key={item.path}
                    onClick={() => handleNavigate(item.path)}
                    selected={isActivePath(item.path)}
                  >
                    <IconComponent sx={{ mr: 1 }} />
                    {item.label}
                  </MenuItem>
                )
              })}
            </Menu>
          </>
        ) : (
          <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
            {navigationItems.map((item) => {
              const IconComponent = item.icon
              return (
                <Button
                  key={item.path}
                  color="inherit"
                  startIcon={<IconComponent />}
                  onClick={() => handleNavigate(item.path)}
                  variant={isActivePath(item.path) ? 'outlined' : 'text'}
                  sx={{
                    borderColor: isActivePath(item.path) ? 'white' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  {item.label}
                </Button>
              )
            })}
          </Box>
        )}
      </Toolbar>
    </AppBar>
  )
}

export default Navigation