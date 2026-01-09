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
  Card,
  CardContent,
  IconButton,
  Breadcrumbs,
  Link,
  Divider,
} from '@mui/material'
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
} from '@mui/icons-material'
import { useApi } from '../hooks/useApi'
import { projectApi, miniatureApi } from '../api/client'
import { LoadingSpinner } from '../components'
import ProjectForm from '../components/ProjectForm'
import MiniatureForm from '../components/MiniatureForm'
import DeleteConfirmDialog from '../components/DeleteConfirmDialog'
import type { Project, Miniature, UpdateProjectRequest, CreateMiniatureRequest, UpdateMiniatureRequest } from '../types'
import { GAME_SYSTEM_LABELS, PROGRESS_STATUS_LABELS } from '../types'

function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const projectId = parseInt(id || '0', 10)

  const [project, setProject] = useState<Project | null>(null)
  const [miniatures, setMiniatures] = useState<Miniature[]>([])
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showMiniatureForm, setShowMiniatureForm] = useState(false)

  // API hooks
  const {
    data: projectData,
    loading: loadingProject,
    error: projectError,
    execute: fetchProject,
  } = useApi(projectApi.get)

  const {
    data: miniaturesData,
    loading: loadingMiniatures,
    error: miniaturesError,
    execute: fetchMiniatures,
  } = useApi(miniatureApi.listByProject)

  const {
    loading: updatingProject,
    error: updateError,
    execute: updateProject,
  } = useApi(projectApi.update)

  const {
    loading: deletingProject,
    error: deleteError,
    execute: deleteProject,
  } = useApi(projectApi.delete)

  const {
    loading: creatingMiniature,
    error: createMiniatureError,
    execute: createMiniature,
  } = useApi(miniatureApi.create)

  // Load project and miniatures on component mount
  useEffect(() => {
    if (projectId) {
      fetchProject(projectId)
      fetchMiniatures(projectId)
    }
  }, [projectId, fetchProject, fetchMiniatures])

  // Update local state when data is loaded
  useEffect(() => {
    if (projectData) {
      setProject(projectData)
    }
  }, [projectData])

  useEffect(() => {
    if (miniaturesData) {
      setMiniatures(miniaturesData)
    }
  }, [miniaturesData])

  const handleUpdateProject = async (data: UpdateProjectRequest) => {
    if (!project) return

    const result = await updateProject(project.id, data)
    if (result) {
      setProject(result)
      setShowEditForm(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!project) return

    const result = await deleteProject(project.id)
    if (result !== null) {
      navigate('/projects')
    }
  }

  const handleMiniatureClick = (miniature: Miniature) => {
    navigate(`/miniatures/${miniature.id}`)
  }

  const handleCreateMiniature = async (data: CreateMiniatureRequest | UpdateMiniatureRequest) => {
    if (!project) return

    // For creation, we only handle CreateMiniatureRequest
    const result = await createMiniature(project.id, data as CreateMiniatureRequest)
    if (result) {
      setMiniatures(prev => [...prev, result])
      setShowMiniatureForm(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'detailed':
        return 'info'
      case 'basecoated':
        return 'warning'
      case 'primed':
        return 'secondary'
      default:
        return 'default'
    }
  }

  const getProgressStats = () => {
    const total = miniatures.length
    if (total === 0) return { completed: 0, percentage: 0 }

    const completed = miniatures.filter(m => m.progress_status === 'completed').length
    const percentage = Math.round((completed / total) * 100)
    
    return { completed, total, percentage }
  }

  if (loadingProject) {
    return <LoadingSpinner />
  }

  if (projectError || !project) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          {projectError || 'Project not found'}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/projects')}
        >
          Back to Projects
        </Button>
      </Box>
    )
  }

  const stats = getProgressStats()

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
        <Typography variant="body2" color="text.primary">
          {project.name}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {project.name}
          </Typography>
          <Box display="flex" gap={1} mb={2}>
            <Chip 
              label={GAME_SYSTEM_LABELS[project.game_system]} 
              color="primary"
              variant="outlined"
            />
            <Chip 
              label={project.army} 
              color="secondary"
              variant="outlined"
            />
          </Box>
        </Box>
        
        <Box display="flex" gap={1}>
          <IconButton
            onClick={() => setShowEditForm(true)}
            color="primary"
            title="Edit Project"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            onClick={() => setShowDeleteDialog(true)}
            color="error"
            title="Delete Project"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Project Info */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            {project.description && (
              <>
                <Typography variant="h6" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body1" paragraph>
                  {project.description}
                </Typography>
              </>
            )}
            
            <Typography variant="body2" color="text.secondary">
              Created: {formatDate(project.created_at)}
              {project.updated_at !== project.created_at && (
                <> • Updated: {formatDate(project.updated_at)}</>
              )}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              Progress
            </Typography>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Typography variant="h3" color="primary.main">
                {stats.percentage}%
              </Typography>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {stats.completed} of {stats.total} completed
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Miniatures Section */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" component="h2">
          Miniatures ({miniatures.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowMiniatureForm(true)}
        >
          Add Miniature
        </Button>
      </Box>

      {miniaturesError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load miniatures: {miniaturesError}
        </Alert>
      )}

      {loadingMiniatures ? (
        <LoadingSpinner />
      ) : miniatures.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No miniatures yet
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Add your first miniature to start tracking painting progress
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowMiniatureForm(true)}
          >
            Add Miniature
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {miniatures.map((miniature) => (
            <Grid item xs={12} sm={6} md={4} key={miniature.id}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4,
                  }
                }}
                onClick={() => handleMiniatureClick(miniature)}
              >
                <CardContent>
                  <Typography variant="h6" component="h3" gutterBottom noWrap>
                    {miniature.name}
                  </Typography>
                  
                  <Box display="flex" gap={1} mb={2}>
                    <Chip 
                      label={miniature.miniature_type} 
                      size="small"
                      variant="outlined"
                    />
                    <Chip 
                      label={PROGRESS_STATUS_LABELS[miniature.progress_status]}
                      size="small"
                      color={getProgressColor(miniature.progress_status) as any}
                    />
                  </Box>

                  {miniature.notes && (
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
                      {miniature.notes}
                    </Typography>
                  )}

                  <Divider sx={{ my: 1 }} />
                  
                  <Typography variant="caption" color="text.secondary">
                    Updated: {formatDate(miniature.updated_at)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Edit Project Form */}
      <ProjectForm
        open={showEditForm}
        onClose={() => setShowEditForm(false)}
        onSubmit={handleUpdateProject}
        project={project}
        loading={updatingProject}
        error={updateError}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${project.name}"? This will also delete all associated miniatures and photos. This action cannot be undone.`}
        loading={deletingProject}
        error={deleteError}
      />

      {/* Add Miniature Form */}
      <MiniatureForm
        open={showMiniatureForm}
        onClose={() => setShowMiniatureForm(false)}
        onSubmit={handleCreateMiniature}
        loading={creatingMiniature}
        error={createMiniatureError}
      />
    </Box>
  )
}

export default ProjectDetail