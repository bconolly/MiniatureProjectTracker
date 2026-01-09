import React from 'react'
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material'
import { MoreVert as MoreVertIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import type { Project } from '../types'
import { GAME_SYSTEM_LABELS } from '../types'

interface ProjectCardProps {
  project: Project
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onEdit, onDelete }) => {
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleEdit = (event: React.MouseEvent) => {
    event.stopPropagation()
    handleMenuClose()
    onEdit(project)
  }

  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation()
    handleMenuClose()
    onDelete(project)
  }

  const handleCardClick = () => {
    navigate(`/projects/${project.id}`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <Card 
      sx={{ 
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4,
        }
      }}
      onClick={handleCardClick}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Typography variant="h6" component="h3" noWrap sx={{ flexGrow: 1, mr: 1 }}>
            {project.name}
          </Typography>
          <IconButton
            size="small"
            onClick={handleMenuClick}
            sx={{ ml: 1 }}
            aria-label="more options"
          >
            <MoreVertIcon />
          </IconButton>
        </Box>

        <Box display="flex" gap={1} mb={2}>
          <Chip 
            label={GAME_SYSTEM_LABELS[project.game_system]} 
            size="small" 
            color="primary"
            variant="outlined"
          />
          <Chip 
            label={project.army} 
            size="small" 
            color="secondary"
            variant="outlined"
          />
        </Box>

        {project.description && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {project.description}
          </Typography>
        )}

        <Typography variant="caption" color="text.secondary">
          Created: {formatDate(project.created_at)}
        </Typography>
      </CardContent>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>
    </Card>
  )
}

export default ProjectCard