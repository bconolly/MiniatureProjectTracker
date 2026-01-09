import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
} from '@mui/material'
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from '@mui/icons-material'
import type { PaintingRecipe } from '../types'
import { MINIATURE_TYPE_LABELS } from '../types'

interface RecipeDetailProps {
  recipe: PaintingRecipe | null
  open: boolean
  onClose: () => void
  onEdit: (recipe: PaintingRecipe) => void
  onDelete: (recipe: PaintingRecipe) => void
}

const RecipeDetail: React.FC<RecipeDetailProps> = ({
  recipe,
  open,
  onClose,
  onEdit,
  onDelete,
}) => {
  if (!recipe) return null

  const handleEdit = () => {
    onEdit(recipe)
  }

  const handleDelete = () => {
    onDelete(recipe)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md" 
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" component="h2">
            {recipe.name}
          </Typography>
          <Box>
            <IconButton onClick={handleEdit} color="primary">
              <EditIcon />
            </IconButton>
            <IconButton onClick={handleDelete} color="error">
              <DeleteIcon />
            </IconButton>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={3}>
          <Box>
            <Chip
              label={MINIATURE_TYPE_LABELS[recipe.miniature_type]}
              color="primary"
              variant="outlined"
            />
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom>
              Steps
            </Typography>
            <List dense>
              {recipe.steps.map((step, index) => (
                <ListItem key={index} sx={{ pl: 0 }}>
                  <ListItemText
                    primary={`${index + 1}. ${step}`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          <Divider />

          <Box>
            <Typography variant="h6" gutterBottom>
              Paints Used
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {recipe.paints_used.map((paint, index) => (
                <Chip
                  key={index}
                  label={paint}
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          </Box>

          <Divider />

          <Box>
            <Typography variant="h6" gutterBottom>
              Techniques
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {recipe.techniques.map((technique, index) => (
                <Chip
                  key={index}
                  label={technique}
                  variant="outlined"
                  size="small"
                  color="secondary"
                />
              ))}
            </Box>
          </Box>

          {recipe.notes && (
            <>
              <Divider />
              <Box>
                <Typography variant="h6" gutterBottom>
                  Notes
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {recipe.notes}
                </Typography>
              </Box>
            </>
          )}

          <Divider />

          <Box>
            <Typography variant="body2" color="text.secondary">
              Created: {formatDate(recipe.created_at)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Last Updated: {formatDate(recipe.updated_at)}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default RecipeDetail