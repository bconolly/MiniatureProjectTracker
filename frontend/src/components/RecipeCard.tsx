import React from 'react'
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material'
import type { PaintingRecipe } from '../types'
import { MINIATURE_TYPE_LABELS } from '../types'

interface RecipeCardProps {
  recipe: PaintingRecipe
  onView: (recipe: PaintingRecipe) => void
  onEdit: (recipe: PaintingRecipe) => void
  onDelete: (recipe: PaintingRecipe) => void
}

const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onView,
  onEdit,
  onDelete,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleView = () => {
    handleMenuClose()
    onView(recipe)
  }

  const handleEdit = () => {
    handleMenuClose()
    onEdit(recipe)
  }

  const handleDelete = () => {
    handleMenuClose()
    onDelete(recipe)
  }

  const handleCardClick = () => {
    onView(recipe)
  }

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        cursor: 'pointer',
        '&:hover': {
          boxShadow: 4,
        },
      }}
      onClick={handleCardClick}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Typography variant="h6" component="h3" noWrap>
            {recipe.name}
          </Typography>
          <IconButton
            size="small"
            onClick={handleMenuClick}
            sx={{ ml: 1 }}
          >
            <MoreVertIcon />
          </IconButton>
        </Box>

        <Chip
          label={MINIATURE_TYPE_LABELS[recipe.miniature_type]}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ mb: 2 }}
        />

        <Box mb={2}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Steps: {recipe.steps.length}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Paints: {recipe.paints_used.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Techniques: {recipe.techniques.length}
          </Typography>
        </Box>

        {recipe.notes && (
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {recipe.notes}
          </Typography>
        )}
      </CardContent>

      <CardActions>
        <Button size="small" onClick={handleView}>
          View Details
        </Button>
      </CardActions>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={handleView}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Card>
  )
}

export default RecipeCard