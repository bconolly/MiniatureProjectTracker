import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  Typography,
  IconButton,
} from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import type { PaintingRecipe, CreateRecipeRequest, UpdateRecipeRequest, MiniatureType } from '../types'
import { MiniatureType as MiniatureTypeEnum, MINIATURE_TYPE_LABELS } from '../types'

interface RecipeFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreateRecipeRequest | UpdateRecipeRequest) => Promise<void>
  recipe?: PaintingRecipe | null
  loading?: boolean
  error?: string | null
}

interface FormData {
  name: string
  miniature_type: MiniatureType
  steps: { value: string }[]
  paints_used: { value: string }[]
  techniques: { value: string }[]
  notes: string
}

const RecipeForm: React.FC<RecipeFormProps> = ({
  open,
  onClose,
  onSubmit,
  recipe,
  loading = false,
  error = null,
}) => {
  const isEditing = Boolean(recipe)
  
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<FormData>({
    defaultValues: {
      name: recipe?.name || '',
      miniature_type: recipe?.miniature_type || MiniatureTypeEnum.Troop,
      steps: recipe?.steps?.map(step => ({ value: step })) || [{ value: '' }],
      paints_used: recipe?.paints_used?.map(paint => ({ value: paint })) || [{ value: '' }],
      techniques: recipe?.techniques?.map(technique => ({ value: technique })) || [{ value: '' }],
      notes: recipe?.notes || '',
    },
    mode: 'onChange',
  })

  const {
    fields: stepFields,
    append: appendStep,
    remove: removeStep,
  } = useFieldArray({
    control,
    name: 'steps',
  })

  const {
    fields: paintFields,
    append: appendPaint,
    remove: removePaint,
  } = useFieldArray({
    control,
    name: 'paints_used',
  })

  const {
    fields: techniqueFields,
    append: appendTechnique,
    remove: removeTechnique,
  } = useFieldArray({
    control,
    name: 'techniques',
  })

  React.useEffect(() => {
    if (open) {
      reset({
        name: recipe?.name || '',
        miniature_type: recipe?.miniature_type || MiniatureTypeEnum.Troop,
        steps: recipe?.steps?.map(step => ({ value: step })) || [{ value: '' }],
        paints_used: recipe?.paints_used?.map(paint => ({ value: paint })) || [{ value: '' }],
        techniques: recipe?.techniques?.map(technique => ({ value: technique })) || [{ value: '' }],
        notes: recipe?.notes || '',
      })
    }
  }, [open, recipe, reset])

  const handleFormSubmit = async (data: FormData) => {
    const submitData = {
      name: data.name.trim(),
      miniature_type: data.miniature_type,
      steps: data.steps.map(step => step.value.trim()).filter(step => step.length > 0),
      paints_used: data.paints_used.map(paint => paint.value.trim()).filter(paint => paint.length > 0),
      techniques: data.techniques.map(technique => technique.value.trim()).filter(technique => technique.length > 0),
      notes: data.notes.trim() || undefined,
    }
    
    await onSubmit(submitData)
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  const renderArrayField = (
    fields: any[],
    name: 'steps' | 'paints_used' | 'techniques',
    label: string,
    append: (value: { value: string }) => void,
    remove: (index: number) => void
  ) => (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        {label}
      </Typography>
      {fields.map((field, index) => (
        <Box key={field.id} display="flex" alignItems="center" gap={1} mb={1}>
          <Controller
            name={`${name}.${index}.value` as any}
            control={control}
            rules={{
              required: index === 0 ? `At least one ${label.toLowerCase()} is required` : false,
            }}
            render={({ field: inputField }) => (
              <TextField
                {...inputField}
                size="small"
                fullWidth
                placeholder={`Enter ${label.toLowerCase().slice(0, -1)}`}
                error={Boolean(errors[name]?.[index]?.value)}
                helperText={errors[name]?.[index]?.value?.message}
                disabled={loading}
              />
            )}
          />
          {fields.length > 1 && (
            <IconButton
              onClick={() => remove(index)}
              disabled={loading}
              size="small"
            >
              <DeleteIcon />
            </IconButton>
          )}
        </Box>
      ))}
      <Button
        startIcon={<AddIcon />}
        onClick={() => append({ value: '' })}
        disabled={loading}
        size="small"
      >
        Add {label.slice(0, -1)}
      </Button>
    </Box>
  )

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md" 
      fullWidth
      PaperProps={{
        component: 'form',
        onSubmit: handleSubmit(handleFormSubmit),
      }}
    >
      <DialogTitle>
        {isEditing ? 'Edit Recipe' : 'Create New Recipe'}
      </DialogTitle>
      
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={3} pt={1}>
          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          <Controller
            name="name"
            control={control}
            rules={{
              required: 'Recipe name is required',
              minLength: {
                value: 1,
                message: 'Recipe name cannot be empty',
              },
              maxLength: {
                value: 255,
                message: 'Recipe name must be less than 255 characters',
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Recipe Name"
                fullWidth
                error={Boolean(errors.name)}
                helperText={errors.name?.message}
                disabled={loading}
                autoFocus
              />
            )}
          />

          <Controller
            name="miniature_type"
            control={control}
            rules={{ required: 'Miniature type is required' }}
            render={({ field }) => (
              <FormControl fullWidth error={Boolean(errors.miniature_type)}>
                <InputLabel id="miniature-type-label">Miniature Type</InputLabel>
                <Select
                  {...field}
                  labelId="miniature-type-label"
                  label="Miniature Type"
                  disabled={loading}
                >
                  {Object.values(MiniatureTypeEnum).map((type) => (
                    <MenuItem key={type} value={type}>
                      {MINIATURE_TYPE_LABELS[type]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />

          {renderArrayField(stepFields, 'steps', 'Steps', appendStep, removeStep)}
          {renderArrayField(paintFields, 'paints_used', 'Paints Used', appendPaint, removePaint)}
          {renderArrayField(techniqueFields, 'techniques', 'Techniques', appendTechnique, removeTechnique)}

          <Controller
            name="notes"
            control={control}
            rules={{
              maxLength: {
                value: 1000,
                message: 'Notes must be less than 1000 characters',
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Notes (Optional)"
                fullWidth
                multiline
                rows={3}
                error={Boolean(errors.notes)}
                helperText={errors.notes?.message}
                disabled={loading}
              />
            )}
          />
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          variant="contained" 
          disabled={loading || !isValid}
        >
          {loading ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default RecipeForm