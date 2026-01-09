import React from 'react'
import {
  Typography,
  Paper,
  Box,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Fab,
} from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import { useApi } from '../hooks/useApi'
import { recipeApi } from '../api/client'
import { LoadingSpinner, RecipeCard, RecipeForm, RecipeDetail, DeleteConfirmDialog } from '../components'
import type { PaintingRecipe, CreateRecipeRequest, UpdateRecipeRequest } from '../types'
import { MiniatureType as MiniatureTypeEnum, MINIATURE_TYPE_LABELS } from '../types'

function RecipeList() {
  const [recipes, setRecipes] = React.useState<PaintingRecipe[]>([])
  const [filteredRecipes, setFilteredRecipes] = React.useState<PaintingRecipe[]>([])
  const [typeFilter, setTypeFilter] = React.useState<string>('all')
  const [formOpen, setFormOpen] = React.useState(false)
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [selectedRecipe, setSelectedRecipe] = React.useState<PaintingRecipe | null>(null)
  const [editingRecipe, setEditingRecipe] = React.useState<PaintingRecipe | null>(null)

  const {
    data: recipesData,
    loading: recipesLoading,
    error: recipesError,
    execute: fetchRecipes,
  } = useApi(recipeApi.list)

  const {
    loading: createLoading,
    error: createError,
    execute: createRecipe,
  } = useApi(recipeApi.create)

  const {
    loading: updateLoading,
    error: updateError,
    execute: updateRecipe,
  } = useApi(recipeApi.update)

  const {
    loading: deleteLoading,
    error: deleteError,
    execute: deleteRecipe,
  } = useApi(recipeApi.delete)

  // Load recipes on component mount
  React.useEffect(() => {
    fetchRecipes()
  }, [fetchRecipes])

  // Update local state when recipes are fetched
  React.useEffect(() => {
    if (recipesData) {
      setRecipes(recipesData)
    }
  }, [recipesData])

  // Filter recipes when type filter or recipes change
  React.useEffect(() => {
    if (typeFilter === 'all') {
      setFilteredRecipes(recipes)
    } else {
      setFilteredRecipes(recipes.filter(recipe => recipe.miniature_type === typeFilter))
    }
  }, [recipes, typeFilter])

  const handleCreateRecipe = async (data: CreateRecipeRequest) => {
    const newRecipe = await createRecipe(data)
    if (newRecipe) {
      setRecipes(prev => [...prev, newRecipe])
      setFormOpen(false)
      setEditingRecipe(null)
    }
  }

  const handleUpdateRecipe = async (data: UpdateRecipeRequest) => {
    if (!editingRecipe) return
    
    const updatedRecipe = await updateRecipe(editingRecipe.id, data)
    if (updatedRecipe) {
      setRecipes(prev => prev.map(recipe => 
        recipe.id === editingRecipe.id ? updatedRecipe : recipe
      ))
      setFormOpen(false)
      setEditingRecipe(null)
      if (selectedRecipe?.id === editingRecipe.id) {
        setSelectedRecipe(updatedRecipe)
      }
    }
  }

  const handleFormSubmit = async (data: CreateRecipeRequest | UpdateRecipeRequest) => {
    if (editingRecipe) {
      await handleUpdateRecipe(data as UpdateRecipeRequest)
    } else {
      await handleCreateRecipe(data as CreateRecipeRequest)
    }
  }

  const handleDeleteRecipe = async () => {
    if (!selectedRecipe) return
    
    const success = await deleteRecipe(selectedRecipe.id)
    if (success !== null) {
      setRecipes(prev => prev.filter(recipe => recipe.id !== selectedRecipe.id))
      setDeleteOpen(false)
      setDetailOpen(false)
      setSelectedRecipe(null)
    }
  }

  const handleViewRecipe = (recipe: PaintingRecipe) => {
    setSelectedRecipe(recipe)
    setDetailOpen(true)
  }

  const handleEditRecipe = (recipe: PaintingRecipe) => {
    setEditingRecipe(recipe)
    setFormOpen(true)
    setDetailOpen(false)
  }

  const handleDeleteClick = (recipe: PaintingRecipe) => {
    setSelectedRecipe(recipe)
    setDeleteOpen(true)
    setDetailOpen(false)
  }

  const handleCreateClick = () => {
    setEditingRecipe(null)
    setFormOpen(true)
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setEditingRecipe(null)
  }

  const handleDetailClose = () => {
    setDetailOpen(false)
    setSelectedRecipe(null)
  }

  const handleDeleteClose = () => {
    setDeleteOpen(false)
    setSelectedRecipe(null)
  }

  const loading = recipesLoading || createLoading || updateLoading || deleteLoading
  const error = recipesError || createError || updateError || deleteError

  if (recipesLoading && recipes.length === 0) {
    return <LoadingSpinner />
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Painting Recipes
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateClick}
          disabled={loading}
        >
          Create Recipe
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Type</InputLabel>
            <Select
              value={typeFilter}
              label="Filter by Type"
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <MenuItem value="all">All Types</MenuItem>
              {Object.values(MiniatureTypeEnum).map((type) => (
                <MenuItem key={type} value={type}>
                  {MINIATURE_TYPE_LABELS[type]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="body2" color="text.secondary">
            Showing {filteredRecipes.length} of {recipes.length} recipes
          </Typography>
        </Box>
      </Paper>

      {filteredRecipes.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {recipes.length === 0 ? 'No recipes yet' : 'No recipes match the current filter'}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {recipes.length === 0 
              ? 'Create your first painting recipe to get started.'
              : 'Try changing the filter or create a new recipe.'
            }
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateClick}
            disabled={loading}
          >
            Create Recipe
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredRecipes.map((recipe) => (
            <Grid item xs={12} sm={6} md={4} key={recipe.id}>
              <RecipeCard
                recipe={recipe}
                onView={handleViewRecipe}
                onEdit={handleEditRecipe}
                onDelete={handleDeleteClick}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <Fab
        color="primary"
        aria-label="add recipe"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={handleCreateClick}
        disabled={loading}
      >
        <AddIcon />
      </Fab>

      <RecipeForm
        open={formOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        recipe={editingRecipe}
        loading={createLoading || updateLoading}
        error={createError || updateError}
      />

      <RecipeDetail
        recipe={selectedRecipe}
        open={detailOpen}
        onClose={handleDetailClose}
        onEdit={handleEditRecipe}
        onDelete={handleDeleteClick}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteRecipe}
        title="Delete Recipe"
        message={`Are you sure you want to delete "${selectedRecipe?.name}"? This action cannot be undone.`}
        loading={deleteLoading}
      />
    </Box>
  )
}

export default RecipeList