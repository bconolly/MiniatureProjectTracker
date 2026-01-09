import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Typography, Paper, Box, Button, Alert } from '@mui/material'
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material'
import { useApi } from '../hooks/useApi'
import { recipeApi } from '../api/client'
import { LoadingSpinner, RecipeForm, DeleteConfirmDialog } from '../components'
import type { UpdateRecipeRequest } from '../types'

function RecipeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [formOpen, setFormOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)

  const {
    data: recipe,
    loading: recipeLoading,
    error: recipeError,
    execute: fetchRecipe,
  } = useApi(recipeApi.get)

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

  // Load recipe on component mount
  React.useEffect(() => {
    if (id) {
      fetchRecipe(parseInt(id, 10))
    }
  }, [id, fetchRecipe])

  const handleUpdateRecipe = async (data: UpdateRecipeRequest) => {
    if (!recipe) return
    
    const updatedRecipe = await updateRecipe(recipe.id, data)
    if (updatedRecipe) {
      setFormOpen(false)
      // Refresh the recipe data
      fetchRecipe(recipe.id)
    }
  }

  const handleDeleteRecipe = async () => {
    if (!recipe) return
    
    const success = await deleteRecipe(recipe.id)
    if (success !== null) {
      navigate('/recipes')
    }
  }

  const handleBack = () => {
    navigate('/recipes')
  }

  const handleEdit = () => {
    setFormOpen(true)
  }

  const handleDelete = () => {
    setDeleteOpen(true)
  }

  const handleFormClose = () => {
    setFormOpen(false)
  }

  const handleDeleteClose = () => {
    setDeleteOpen(false)
  }

  const loading = recipeLoading || updateLoading || deleteLoading
  const error = recipeError || updateError || deleteError

  if (recipeLoading) {
    return <LoadingSpinner />
  }

  if (recipeError) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Back to Recipes
        </Button>
        <Alert severity="error">
          {recipeError}
        </Alert>
      </Box>
    )
  }

  if (!recipe) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Back to Recipes
        </Button>
        <Alert severity="info">
          Recipe not found
        </Alert>
      </Box>
    )
  }

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={handleBack}
        sx={{ mb: 2 }}
        disabled={loading}
      >
        Back to Recipes
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            {recipe.name}
          </Typography>
          <Box>
            <Button
              variant="outlined"
              onClick={handleEdit}
              disabled={loading}
              sx={{ mr: 1 }}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={handleDelete}
              disabled={loading}
            >
              Delete
            </Button>
          </Box>
        </Box>

        {/* Recipe details would be displayed here - for now showing basic info */}
        <Typography variant="body1" paragraph>
          Type: {recipe.miniature_type}
        </Typography>
        <Typography variant="body1" paragraph>
          Steps: {recipe.steps.length}
        </Typography>
        <Typography variant="body1" paragraph>
          Paints: {recipe.paints_used.length}
        </Typography>
        <Typography variant="body1" paragraph>
          Techniques: {recipe.techniques.length}
        </Typography>
        {recipe.notes && (
          <Typography variant="body1" paragraph>
            Notes: {recipe.notes}
          </Typography>
        )}
      </Paper>

      <RecipeForm
        open={formOpen}
        onClose={handleFormClose}
        onSubmit={handleUpdateRecipe}
        recipe={recipe}
        loading={updateLoading}
        error={updateError}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteRecipe}
        title="Delete Recipe"
        message={`Are you sure you want to delete "${recipe.name}"? This action cannot be undone.`}
        loading={deleteLoading}
      />
    </Box>
  )
}

export default RecipeDetail