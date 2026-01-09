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
  LinearProgress,
} from '@mui/material'
import { 
  MoreVert as MoreVertIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Photo as PhotoIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import type { Miniature } from '../types'
import { MINIATURE_TYPE_LABELS, PROGRESS_STATUS_LABELS, ProgressStatus } from '../types'

interface MiniatureCardProps {
  miniature: Miniature
  onEdit: (miniature: Miniature) => void
  onDelete: (miniature: Miniature) => void
  onProgressUpdate: (miniature: Miniature, newStatus: ProgressStatus) => void
  photoCount?: number
}

const MiniatureCard: React.FC<MiniatureCardProps> = ({ 
  miniature, 
  onEdit, 
  onDelete, 
  onProgressUpdate,
  photoCount = 0
}) => {
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const [progressAnchorEl, setProgressAnchorEl] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const progressOpen = Boolean(progressAnchorEl)

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleProgressMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    setProgressAnchorEl(event.currentTarget)
  }

  const handleProgressMenuClose = () => {
    setProgressAnchorEl(null)
  }

  const handleEdit = (event: React.MouseEvent) => {
    event.stopPropagation()
    handleMenuClose()
    onEdit(miniature)
  }

  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation()
    handleMenuClose()
    onDelete(miniature)
  }

  const handleProgressChange = (newStatus: ProgressStatus) => {
    handleProgressMenuClose()
    onProgressUpdate(miniature, newStatus)
  }

  const handleCardClick = () => {
    navigate(`/miniatures/${miniature.id}`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getProgressColor = (status: ProgressStatus) => {
    switch (status) {
      case ProgressStatus.Completed:
        return 'success'
      case ProgressStatus.Detailed:
        return 'info'
      case ProgressStatus.Basecoated:
        return 'warning'
      case ProgressStatus.Primed:
        return 'secondary'
      default:
        return 'default'
    }
  }

  const getProgressValue = (status: ProgressStatus) => {
    switch (status) {
      case ProgressStatus.Unpainted:
        return 0
      case ProgressStatus.Primed:
        return 20
      case ProgressStatus.Basecoated:
        return 40
      case ProgressStatus.Detailed:
        return 80
      case ProgressStatus.Completed:
        return 100
      default:
        return 0
    }
  }

  const progressValue = getProgressValue(miniature.progress_status)
  const progressColor = getProgressColor(miniature.progress_status)

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
            {miniature.name}
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
            label={MINIATURE_TYPE_LABELS[miniature.miniature_type]} 
            size="small" 
            color="primary"
            variant="outlined"
          />
          {photoCount > 0 && (
            <Chip 
              icon={<PhotoIcon />}
              label={photoCount} 
              size="small" 
              color="default"
              variant="outlined"
            />
          )}
        </Box>

        {/* Progress Display */}
        <Box mb={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Progress
            </Typography>
            <Chip 
              label={PROGRESS_STATUS_LABELS[miniature.progress_status]}
              size="small"
              color={progressColor as any}
              clickable
              onClick={handleProgressMenuClick}
            />
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progressValue} 
            color={progressColor as any}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>

        {miniature.notes && (
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
            {miniature.notes}
          </Typography>
        )}

        <Typography variant="caption" color="text.secondary">
          Updated: {formatDate(miniature.updated_at)}
        </Typography>
      </CardContent>

      {/* Main Menu */}
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

      {/* Progress Update Menu */}
      <Menu
        anchorEl={progressAnchorEl}
        open={progressOpen}
        onClose={handleProgressMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        {Object.values(ProgressStatus).map((status) => (
          <MenuItem 
            key={status}
            onClick={() => handleProgressChange(status)}
            selected={status === miniature.progress_status}
          >
            {PROGRESS_STATUS_LABELS[status]}
          </MenuItem>
        ))}
      </Menu>
    </Card>
  )
}

export default MiniatureCard