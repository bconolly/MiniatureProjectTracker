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
import type { 
  Miniature, 
  CreateMiniatureRequest, 
  UpdateMiniatureRequest, 
  MiniatureType,
  ProgressStatus 
} from '../types'
import { 
  MiniatureType as MiniatureTypeEnum, 
  ProgressStatus as ProgressStatusEnum,
  MINIATURE_TYPE_LABELS, 
  PROGRESS_STATUS_LABELS 
} from '../types'

interface MiniatureFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreateMiniatureRequest | UpdateMiniatureRequest) => Promise<void>
  miniature?: Miniature | null
  loading?: boolean
  error?: string | null
}

interface FormData {
  name: string
  miniature_type: MiniatureType
  progress_status?: ProgressStatus
  notes: string
}

const MiniatureForm: React.FC<MiniatureFormProps> = ({
  open,
  onClose,
  onSubmit,
  miniature,
  loading = false,
  error = null,
}) => {
  const isEditing = Boolean(miniature)
  
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<FormData>({
    defaultValues: {
      name: miniature?.name || '',
      miniature_type: miniature?.miniature_type || MiniatureTypeEnum.Troop,
      progress_status: miniature?.progress_status || ProgressStatusEnum.Unpainted,
      notes: miniature?.notes || '',
    },
    mode: 'onChange',
  })

  React.useEffect(() => {
    if (open) {
      reset({
        name: miniature?.name || '',
        miniature_type: miniature?.miniature_type || MiniatureTypeEnum.Troop,
        progress_status: miniature?.progress_status || ProgressStatusEnum.Unpainted,
        notes: miniature?.notes || '',
      })
    }
  }, [open, miniature, reset])

  const handleFormSubmit = async (data: FormData) => {
    const submitData: CreateMiniatureRequest | UpdateMiniatureRequest = {
      name: data.name.trim(),
      miniature_type: data.miniature_type,
      notes: data.notes.trim() || undefined,
    }

    // Add progress_status for updates
    if (isEditing && data.progress_status) {
      (submitData as UpdateMiniatureRequest).progress_status = data.progress_status
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
        {isEditing ? 'Edit Miniature' : 'Add New Miniature'}
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
              required: 'Miniature name is required',
              minLength: {
                value: 1,
                message: 'Miniature name cannot be empty',
              },
              maxLength: {
                value: 255,
                message: 'Miniature name must be less than 255 characters',
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Miniature Name"
                fullWidth
                error={Boolean(errors.name)}
                helperText={errors.name?.message}
                disabled={loading}
                autoFocus
                placeholder="e.g., Space Marine Captain, Ork Boyz Squad"
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

          {isEditing && (
            <Controller
              name="progress_status"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel id="progress-status-label">Progress Status</InputLabel>
                  <Select
                    {...field}
                    labelId="progress-status-label"
                    label="Progress Status"
                    disabled={loading}
                  >
                    {Object.values(ProgressStatusEnum).map((status) => (
                      <MenuItem key={status} value={status}>
                        {PROGRESS_STATUS_LABELS[status]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
          )}

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
                placeholder="Add any notes about this miniature, painting techniques, or special considerations..."
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
          {loading ? 'Saving...' : (isEditing ? 'Update' : 'Add')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default MiniatureForm