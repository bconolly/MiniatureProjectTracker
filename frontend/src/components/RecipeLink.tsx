import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  MenuBook as RecipeIcon,
} from '@mui/icons-material'
import { recipeApi, miniatureRecipeApi } from '../api/client'
import type { PaintingRecipe } from '../types'

interface RecipeLinkProps {
  miniatureId: number
}

export default function RecipeLink({ miniatureId }: RecipeLinkProps) {
  const [linkedRecipes, setLinkedRecipes] = useState<PaintingRecipe[]>([])
  const [allRecipes, setAllRecipes] = useState<PaintingRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [addingRecipe, setAddingRecipe] = useState<number | null>(null)
  const [removingRecipe, setRemovingRecipe] = useState<number | null>(null)

  // Load linked recipes
  const fetchLinkedRecipes = async () => {
    try {
      setLoading(true)
      setError(null)
      const recipes = await miniatureRecipeApi.getRecipes(miniatureId)
      setLinkedRecipes(recipes)
    } catch (err) {
      setError('Failed to load linked recipes')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Load all recipes for the add dialog
  const fetchAllRecipes = async () => {
    try {
      const recipes = await recipeApi.list()
      setAllRecipes(recipes.data)
    } catch (err) {
      console.error('Failed to load recipes:', err)
    }
  }

  useEffect(() => {
    fetchLinkedRecipes()
    fetchAllRecipes()
  }, [miniatureId])

  const handleLinkRecipe = async (recipeId: number) => {
    try {
      setAddingRecipe(recipeId)
      await miniatureRecipeApi.linkRecipe(miniatureId, recipeId)
      await fetchLinkedRecipes()
      setShowAddDialog(false)
    } catch (err) {
      setError('Failed to link recipe')
      console.error(err)
    } finally {
      setAddingRecipe(null)
    }
  }

  const handleUnlinkRecipe = async (recipeId: number) => {
    try {
      setRemovingRecipe(recipeId)
      await miniatureRecipeApi.unlinkRecipe(miniatureId, recipeId)
      setLinkedRecipes(prev => prev.filter(r => r.id !== recipeId))
    } catch (err) {
      setError('Failed to unlink recipe')
      console.error(err)
    } finally {
      setRemovingRecipe(null)
    }
  }

  // Get recipes that aren't already linked
  const availableRecipes = allRecipes.filter(
    recipe => !linkedRecipes.some(linked => linked.id === recipe.id)
  )

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress size={24} />
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Paint Recipes ({linkedRecipes.length})
        </Typography>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setShowAddDialog(true)}
          disabled={availableRecipes.length === 0}
        >
          Link Recipe
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {linkedRecipes.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <RecipeIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="body1" color="text.secondary" gutterBottom>
            No recipes linked
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Link paint recipes to track which colors and techniques you used
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowAddDialog(true)}
            disabled={allRecipes.length === 0}
          >
            Link a Recipe
          </Button>
        </Paper>
      ) : (
        <Box display="flex" flexWrap="wrap" gap={1}>
          {linkedRecipes.map(recipe => (
            <Chip
              key={recipe.id}
              label={recipe.name}
              icon={<RecipeIcon />}
              onDelete={() => handleUnlinkRecipe(recipe.id)}
              deleteIcon={
                removingRecipe === recipe.id ? (
                  <CircularProgress size={18} />
                ) : (
                  <DeleteIcon />
                )
              }
              disabled={removingRecipe === recipe.id}
              color="primary"
              variant="outlined"
              sx={{ 
                py: 2,
                '& .MuiChip-label': { px: 1 }
              }}
            />
          ))}
        </Box>
      )}

      {/* Add Recipe Dialog */}
      <Dialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Link a Paint Recipe</DialogTitle>
        <DialogContent dividers>
          {availableRecipes.length === 0 ? (
            <Typography color="text.secondary">
              All recipes are already linked to this miniature, or no recipes exist yet.
            </Typography>
          ) : (
            <List>
              {availableRecipes.map(recipe => (
                <ListItem key={recipe.id} divider>
                  <ListItemText
                    primary={recipe.name}
                    secondary={
                      <>
                        <Typography variant="body2" component="span" color="text.secondary">
                          {recipe.paints_used.slice(0, 3).join(', ')}
                          {recipe.paints_used.length > 3 && ` +${recipe.paints_used.length - 3} more`}
                        </Typography>
                        {recipe.techniques.length > 0 && (
                          <Typography variant="body2" component="span" color="text.secondary">
                            {' • '}{recipe.techniques.slice(0, 2).join(', ')}
                          </Typography>
                        )}
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      color="primary"
                      onClick={() => handleLinkRecipe(recipe.id)}
                      disabled={addingRecipe !== null}
                    >
                      {addingRecipe === recipe.id ? (
                        <CircularProgress size={24} />
                      ) : (
                        <AddIcon />
                      )}
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
