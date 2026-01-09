import { useEffect, useState } from 'react'
import {
  Typography,
  Box,
  Button,
  Grid,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Fab,
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
} from '@mui/icons-material'
import { useApi } from '../hooks/useApi'
import { projectApi } from '../api/client'
import { LoadingSpinner } from '../components'
import ProjectCard from '../components/ProjectCard'
import ProjectForm from '../components/ProjectForm'
import DeleteConfirmDialog from '../components/DeleteConfirmDialog'
import type { Project, CreateProjectRequest, UpdateProjectRequest, GameSystem } from '../types'
import { GAME_SYSTEM_LABELS } from '../types'

interface GroupedProjects {
  [gameSystem: string]: {
    [army: string]: Project[]
  }
}

function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [expandedSystems, setExpandedSystems] = useState<string[]>([])

  // API hooks
  const {
    data: projectsData,
    loading: loadingProjects,
    error: projectsError,
    execute: fetchProjects,
  } = useApi(projectApi.list)

  const {
    loading: creatingProject,
    error: createError,
    execute: createProject,
  } = useApi(projectApi.create)

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

  // Load projects on component mount
  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  // Update local state when projects are loaded
  useEffect(() => {
    if (projectsData) {
      setProjects(projectsData)
      // Auto-expand all systems initially
      const systems = [...new Set(projectsData.map(p => p.game_system))]
      setExpandedSystems(systems)
    }
  }, [projectsData])

  // Group projects by game system and army
  const groupedProjects: GroupedProjects = projects.reduce((acc, project) => {
    const system = project.game_system
    const army = project.army

    if (!acc[system]) {
      acc[system] = {}
    }
    if (!acc[system][army]) {
      acc[system][army] = []
    }
    acc[system][army].push(project)
    return acc
  }, {} as GroupedProjects)

  // Sort projects within each army by creation date (newest first)
  Object.keys(groupedProjects).forEach(system => {
    Object.keys(groupedProjects[system]).forEach(army => {
      groupedProjects[system][army].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    })
  })

  const handleFormSubmit = async (data: CreateProjectRequest | UpdateProjectRequest) => {
    if ('id' in data) {
      // This is an update
      await handleUpdateProject(data as UpdateProjectRequest)
    } else {
      // This is a create
      await handleCreateProject(data as CreateProjectRequest)
    }
  }

  const handleCreateProject = async (data: CreateProjectRequest) => {
    const result = await createProject(data)
    if (result) {
      setProjects(prev => [result, ...prev])
      setShowCreateForm(false)
    }
  }

  const handleEditProject = (project: Project) => {
    setSelectedProject(project)
    setShowEditForm(true)
  }

  const handleUpdateProject = async (data: UpdateProjectRequest) => {
    if (!selectedProject) return

    const result = await updateProject(selectedProject.id, data)
    if (result) {
      setProjects(prev => prev.map(p => p.id === selectedProject.id ? result : p))
      setShowEditForm(false)
      setSelectedProject(null)
    }
  }

  const handleDeleteProject = (project: Project) => {
    setSelectedProject(project)
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedProject) return

    const result = await deleteProject(selectedProject.id)
    if (result !== null) {
      setProjects(prev => prev.filter(p => p.id !== selectedProject.id))
      setShowDeleteDialog(false)
      setSelectedProject(null)
    }
  }

  const handleSystemToggle = (system: string) => {
    setExpandedSystems(prev => 
      prev.includes(system) 
        ? prev.filter(s => s !== system)
        : [...prev, system]
    )
  }

  const handleCloseCreateForm = () => {
    setShowCreateForm(false)
  }

  const handleCloseEditForm = () => {
    setShowEditForm(false)
    setSelectedProject(null)
  }

  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false)
    setSelectedProject(null)
  }

  if (loadingProjects) {
    return <LoadingSpinner />
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Projects
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowCreateForm(true)}
        >
          New Project
        </Button>
      </Box>

      {projectsError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load projects: {projectsError}
        </Alert>
      )}

      {projects.length === 0 && !loadingProjects && (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No projects yet
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Create your first miniature painting project to get started
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowCreateForm(true)}
          >
            Create Project
          </Button>
        </Box>
      )}

      {Object.keys(groupedProjects).map((gameSystem) => (
        <Accordion
          key={gameSystem}
          expanded={expandedSystems.includes(gameSystem)}
          onChange={() => handleSystemToggle(gameSystem)}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="h6">
                {GAME_SYSTEM_LABELS[gameSystem as GameSystem]}
              </Typography>
              <Chip
                label={`${Object.keys(groupedProjects[gameSystem]).length} armies`}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {Object.keys(groupedProjects[gameSystem]).map((army) => (
              <Box key={army} mb={3}>
                <Typography variant="h6" gutterBottom>
                  {army}
                  <Chip
                    label={`${groupedProjects[gameSystem][army].length} projects`}
                    size="small"
                    sx={{ ml: 2 }}
                  />
                </Typography>
                <Grid container spacing={2}>
                  {groupedProjects[gameSystem][army].map((project) => (
                    <Grid item xs={12} sm={6} md={4} key={project.id}>
                      <ProjectCard
                        project={project}
                        onEdit={handleEditProject}
                        onDelete={handleDeleteProject}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ))}
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Floating Action Button for mobile */}
      <Fab
        color="primary"
        aria-label="add project"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', sm: 'none' },
        }}
        onClick={() => setShowCreateForm(true)}
      >
        <AddIcon />
      </Fab>

      {/* Create Project Form */}
      <ProjectForm
        open={showCreateForm}
        onClose={handleCloseCreateForm}
        onSubmit={handleFormSubmit}
        loading={creatingProject}
        error={createError}
      />

      {/* Edit Project Form */}
      <ProjectForm
        open={showEditForm}
        onClose={handleCloseEditForm}
        onSubmit={handleUpdateProject}
        project={selectedProject}
        loading={updatingProject}
        error={updateError}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={showDeleteDialog}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Delete Project"
        message={
          selectedProject
            ? `Are you sure you want to delete "${selectedProject.name}"? This will also delete all associated miniatures and photos. This action cannot be undone.`
            : ''
        }
        loading={deletingProject}
        error={deleteError}
      />
    </Box>
  )
}

export default ProjectList