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
} from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import type { Project, CreateProjectRequest, UpdateProjectRequest, GameSystem } from '../types'
import { GameSystem as GameSystemEnum, GAME_SYSTEM_LABELS } from '../types'

interface ProjectFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreateProjectRequest | UpdateProjectRequest) => Promise<void>
  project?: Project | null
  loading?: boolean
  error?: string | null
}

interface FormData {
  name: string
  game_system: GameSystem
  army: string
  description: string
}

const ProjectForm: React.FC<ProjectFormProps> = ({
  open,
  onClose,
  onSubmit,
  project,
  loading = false,
  error = null,
}) => {
  const isEditing = Boolean(project)
  
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<FormData>({
    defaultValues: {
      name: project?.name || '',
      game_system: project?.game_system || GameSystemEnum.AgeOfSigmar,
      army: project?.army || '',
      description: project?.description || '',
    },
    mode: 'onChange',
  })

  React.useEffect(() => {
    if (open) {
      reset({
        name: project?.name || '',
        game_system: project?.game_system || GameSystemEnum.AgeOfSigmar,
        army: project?.army || '',
        description: project?.description || '',
      })
    }
  }, [open, project, reset])

  const handleFormSubmit = async (data: FormData) => {
    const submitData = {
      name: data.name.trim(),
      game_system: data.game_system,
      army: data.army.trim(),
      description: data.description.trim() || undefined,
    }
    
    await onSubmit(submitData)
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        component: 'form',
        onSubmit: handleSubmit(handleFormSubmit),
      }}
    >
      <DialogTitle>
        {isEditing ? 'Edit Project' : 'Create New Project'}
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
              required: 'Project name is required',
              minLength: {
                value: 1,
                message: 'Project name cannot be empty',
              },
              maxLength: {
                value: 255,
                message: 'Project name must be less than 255 characters',
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Project Name"
                fullWidth
                error={Boolean(errors.name)}
                helperText={errors.name?.message}
                disabled={loading}
                autoFocus
              />
            )}
          />

          <Controller
            name="game_system"
            control={control}
            rules={{ required: 'Game system is required' }}
            render={({ field }) => (
              <FormControl fullWidth error={Boolean(errors.game_system)}>
                <InputLabel id="game-system-label">Game System</InputLabel>
                <Select
                  {...field}
                  labelId="game-system-label"
                  label="Game System"
                  disabled={loading}
                >
                  {Object.values(GameSystemEnum).map((system) => (
                    <MenuItem key={system} value={system}>
                      {GAME_SYSTEM_LABELS[system]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />

          <Controller
            name="army"
            control={control}
            rules={{
              required: 'Army is required',
              minLength: {
                value: 1,
                message: 'Army name cannot be empty',
              },
              maxLength: {
                value: 255,
                message: 'Army name must be less than 255 characters',
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Army"
                fullWidth
                error={Boolean(errors.army)}
                helperText={errors.army?.message}
                disabled={loading}
              />
            )}
          />

          <Controller
            name="description"
            control={control}
            rules={{
              maxLength: {
                value: 1000,
                message: 'Description must be less than 1000 characters',
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Description (Optional)"
                fullWidth
                multiline
                rows={3}
                error={Boolean(errors.description)}
                helperText={errors.description?.message}
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

export default ProjectForm