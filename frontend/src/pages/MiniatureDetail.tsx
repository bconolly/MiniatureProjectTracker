import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Typography,
  Box,
  Button,
  Paper,
  Chip,
  Alert,
  Grid,
  IconButton,
  Breadcrumbs,
  Link,
  Divider,
  ImageList,
  ImageListItem,
  Dialog,
  DialogContent,
  DialogActions,
} from '@mui/material'
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Close as CloseIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material'
import { useApi } from '../hooks/useApi'
import { miniatureApi, photoApi, projectApi } from '../api/client'
import { LoadingSpinner, ProgressTracker, RecipeLink } from '../components'
import MiniatureForm from '../components/MiniatureForm'
import DeleteConfirmDialog from '../components/DeleteConfirmDialog'
import PhotoUpload from '../components/PhotoUpload'
import type { Miniature, Photo, Project, UpdateMiniatureRequest, ProgressStatus } from '../types'
import { MINIATURE_TYPE_LABELS, PROGRESS_STATUS_LABELS } from '../types'

function MiniatureDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const miniatureId = parseInt(id || '0', 10)

  const [miniature, setMiniature] = useState<Miniature | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)

  // API hooks
  const {
    data: miniatureData,
    loading: loadingMiniature,
    error: miniatureError,
    execute: fetchMiniature,
  } = useApi(miniatureApi.get)

  const {
    data: projectData,
    execute: fetchProject,
  } = useApi(projectApi.get)

  const {
    data: photosData,
    loading: loadingPhotos,
    error: photosError,
    execute: fetchPhotos,
  } = useApi(photoApi.listByMiniature)

  const {
    loading: updatingMiniature,
    error: updateError,
    execute: updateMiniature,
  } = useApi(miniatureApi.update)

  const {
    loading: deletingMiniature,
    error: deleteError,
    execute: deleteMiniature,
  } = useApi(miniatureApi.delete)

  const {
    loading: deletingPhoto,
    error: deletePhotoError,
    execute: deletePhoto,
  } = useApi(photoApi.delete)

  // Load miniature and photos on component mount
  useEffect(() => {
    if (miniatureId) {
      fetchMiniature(miniatureId)
      fetchPhotos(miniatureId)
    }
  }, [miniatureId, fetchMiniature, fetchPhotos])

  // Load project when miniature is loaded
  useEffect(() => {
    if (miniatureData && !project) {
      fetchProject(miniatureData.project_id)
    }
  }, [miniatureData, project, fetchProject])

  // Update local state when data is loaded
  useEffect(() => {
    if (miniatureData) {
      setMiniature(miniatureData)
    }
  }, [miniatureData])

  useEffect(() => {
    if (projectData) {
      setProject(projectData)
    }
  }, [projectData])

  useEffect(() => {
    if (photosData) {
      // Sort photos by upload date (chronological order)
      const sortedPhotos = [...photosData].sort((a, b) => 
        new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime()
      )
      setPhotos(sortedPhotos)
    }
  }, [photosData])

  const handleUpdateMiniature = async (data: UpdateMiniatureRequest) => {
    if (!miniature) return

    const result = await updateMiniature(miniature.id, data)
    if (result) {
      setMiniature(result)
      setShowEditForm(false)
    }
  }

  const handleProgressUpdate = async (newStatus: ProgressStatus) => {
    if (!miniature) return

    const result = await updateMiniature(miniature.id, { progress_status: newStatus })
    if (result) {
      setMiniature(result)
    }
  }

  const handleConfirmDelete = async () => {
    if (!miniature || !project) return

    const result = await deleteMiniature(miniature.id)
    if (result !== null) {
      navigate(`/projects/${project.id}`)
    }
  }

  const handlePhotoUploadSuccess = (newPhoto: Photo) => {
    setPhotos(prev => [...prev, newPhoto].sort((a, b) => 
      new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime()
    ))
    setShowUploadDialog(false)
  }

  const handleDeletePhoto = async (photo: Photo) => {
    const result = await deletePhoto(photo.id)
    if (result !== null) {
      setPhotos(prev => prev.filter(p => p.id !== photo.id))
      setSelectedPhoto(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loadingMiniature) {
    return <LoadingSpinner />
  }

  if (miniatureError || !miniature) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          {miniatureError || 'Miniature not found'}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component="button"
          variant="body2"
          onClick={() => navigate('/projects')}
          sx={{ textDecoration: 'none' }}
        >
          Projects
        </Link>
        {project && (
          <Link
            component="button"
            variant="body2"
            onClick={() => navigate(`/projects/${project.id}`)}
            sx={{ textDecoration: 'none' }}
          >
            {project.name}
          </Link>
        )}
        <Typography variant="body2" color="text.primary">
          {miniature.name}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {miniature.name}
          </Typography>
          <Box display="flex" gap={1} mb={2}>
            <Chip 
              label={MINIATURE_TYPE_LABELS[miniature.miniature_type]} 
              color="primary"
              variant="outlined"
            />
            <Chip 
              label={PROGRESS_STATUS_LABELS[miniature.progress_status]}
              color="secondary"
              variant="outlined"
            />
          </Box>
        </Box>
        
        <Box display="flex" gap={1}>
          <IconButton
            onClick={() => setShowEditForm(true)}
            color="primary"
            title="Edit Miniature"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            onClick={() => setShowDeleteDialog(true)}
            color="error"
            title="Delete Miniature"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Miniature Info and Progress */}
        <Grid item xs={12} md={6}>
          {/* Miniature Info */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Details
            </Typography>
            
            {miniature.notes && (
              <>
                <Typography variant="body1" paragraph>
                  {miniature.notes}
                </Typography>
                <Divider sx={{ my: 2 }} />
              </>
            )}
            
            <Typography variant="body2" color="text.secondary">
              Created: {formatDate(miniature.created_at)}
              {miniature.updated_at !== miniature.created_at && (
                <> • Updated: {formatDate(miniature.updated_at)}</>
              )}
            </Typography>
          </Paper>

          {/* Progress Tracker */}
          <ProgressTracker
            currentStatus={miniature.progress_status}
            onStatusChange={handleProgressUpdate}
            interactive={true}
            showLabels={true}
            variant="stepper"
          />

          {/* Linked Recipes */}
          <Paper sx={{ p: 3, mt: 3 }}>
            <RecipeLink miniatureId={miniature.id} />
          </Paper>
        </Grid>

        {/* Right Column - Photos */}
        <Grid item xs={12} md={6}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Photos ({photos.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowUploadDialog(true)}
            >
              Add Photo
            </Button>
          </Box>

          {photosError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              Failed to load photos: {photosError}
            </Alert>
          )}

          {loadingPhotos ? (
            <LoadingSpinner />
          ) : photos.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No photos yet
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Add photos to track your painting progress visually
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowUploadDialog(true)}
              >
                Add First Photo
              </Button>
            </Paper>
          ) : (
            <ImageList variant="masonry" cols={2} gap={8}>
              {photos.map((photo) => (
                <ImageListItem 
                  key={photo.id}
                  sx={{ 
                    cursor: 'pointer',
                    borderRadius: 1,
                    overflow: 'hidden',
                    '&:hover': {
                      opacity: 0.8,
                    }
                  }}
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <img
                    src={`/api/photos/${photo.id}`}
                    alt={photo.filename}
                    loading="lazy"
                    style={{
                      borderRadius: 4,
                      display: 'block',
                      width: '100%',
                    }}
                  />
                </ImageListItem>
              ))}
            </ImageList>
          )}
        </Grid>
      </Grid>

      {/* Edit Miniature Form */}
      <MiniatureForm
        open={showEditForm}
        onClose={() => setShowEditForm(false)}
        onSubmit={handleUpdateMiniature}
        miniature={miniature}
        loading={updatingMiniature}
        error={updateError}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Miniature"
        message={`Are you sure you want to delete "${miniature.name}"? This will also delete all associated photos. This action cannot be undone.`}
        loading={deletingMiniature}
        error={deleteError}
      />

      {/* Photo Upload Dialog */}
      <PhotoUpload
        open={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        miniatureId={miniature.id}
        onUploadSuccess={handlePhotoUploadSuccess}
      />

      {/* Photo Detail Dialog */}
      <Dialog
        open={Boolean(selectedPhoto)}
        onClose={() => setSelectedPhoto(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedPhoto && (
          <>
            <DialogContent sx={{ p: 0, position: 'relative' }}>
              <IconButton
                onClick={() => setSelectedPhoto(null)}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  zIndex: 1,
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.7)',
                  }
                }}
              >
                <CloseIcon />
              </IconButton>
              <img
                src={`/api/photos/${selectedPhoto.id}`}
                alt={selectedPhoto.filename}
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                }}
              />
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'space-between', p: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {selectedPhoto.filename} • {formatFileSize(selectedPhoto.file_size)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Uploaded: {formatDate(selectedPhoto.uploaded_at)}
                </Typography>
              </Box>
              <Button
                color="error"
                onClick={() => handleDeletePhoto(selectedPhoto)}
                disabled={deletingPhoto}
                startIcon={<DeleteIcon />}
              >
                {deletingPhoto ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogActions>
            {deletePhotoError && (
              <Alert severity="error" sx={{ m: 2, mt: 0 }}>
                Failed to delete photo: {deletePhotoError}
              </Alert>
            )}
          </>
        )}
      </Dialog>
    </Box>
  )
}

export default MiniatureDetail