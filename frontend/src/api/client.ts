import axios, { AxiosError } from 'axios'
import type {
  Project,
  Miniature,
  PaintingRecipe,
  Photo,
  CreateProjectRequest,
  UpdateProjectRequest,
  CreateMiniatureRequest,
  UpdateMiniatureRequest,
  CreateRecipeRequest,
  UpdateRecipeRequest,
  ErrorResponse,
} from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
})

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`)
    return response
  },
  (error: AxiosError<ErrorResponse>) => {
    console.error('API Response Error:', error.response?.data || error.message)
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.warn('Unauthorized access detected')
    } else if (error.response?.status === 403) {
      // Handle forbidden access
      console.warn('Forbidden access detected')
    } else if (error.response?.status && error.response.status >= 500) {
      // Handle server errors
      console.error('Server error detected')
    }
    
    return Promise.reject(error)
  }
)

// Project API
export const projectApi = {
  list: async () => {
    const response = await apiClient.get<{ projects: Project[] }>('/projects')
    return { ...response, data: response.data.projects }
  },
  get: (id: number) => apiClient.get<Project>(`/projects/${id}`),
  create: (data: CreateProjectRequest) => apiClient.post<Project>('/projects', data),
  update: (id: number, data: UpdateProjectRequest) => apiClient.put<Project>(`/projects/${id}`, data),
  delete: (id: number) => apiClient.delete(`/projects/${id}`),
}

// Miniature API
export const miniatureApi = {
  listByProject: async (projectId: number) => {
    const response = await apiClient.get<{ miniatures: Miniature[] }>(`/projects/${projectId}/miniatures`)
    return { ...response, data: response.data.miniatures }
  },
  get: (id: number) => apiClient.get<Miniature>(`/miniatures/${id}`),
  create: (projectId: number, data: CreateMiniatureRequest) => 
    apiClient.post<Miniature>(`/projects/${projectId}/miniatures`, data),
  update: (id: number, data: UpdateMiniatureRequest) => 
    apiClient.put<Miniature>(`/miniatures/${id}`, data),
  delete: (id: number) => apiClient.delete(`/miniatures/${id}`),
}

// Recipe API
export const recipeApi = {
  list: async (type?: string) => {
    const params = type ? { type } : {}
    const response = await apiClient.get<{ recipes: PaintingRecipe[] }>('/recipes', { params })
    return { ...response, data: response.data.recipes }
  },
  get: (id: number) => apiClient.get<PaintingRecipe>(`/recipes/${id}`),
  create: (data: CreateRecipeRequest) => apiClient.post<PaintingRecipe>('/recipes', data),
  update: (id: number, data: UpdateRecipeRequest) => 
    apiClient.put<PaintingRecipe>(`/recipes/${id}`, data),
  delete: (id: number) => apiClient.delete(`/recipes/${id}`),
  getUsageCount: async (id: number) => {
    const response = await apiClient.get<{ recipe_id: number; miniature_count: number }>(`/recipes/${id}/usage`)
    return response.data.miniature_count
  },
}

// Miniature Recipe Linking API
export const miniatureRecipeApi = {
  getRecipes: async (miniatureId: number) => {
    const response = await apiClient.get<{ recipes: PaintingRecipe[] }>(`/miniatures/${miniatureId}/recipes`)
    return response.data.recipes
  },
  linkRecipe: (miniatureId: number, recipeId: number) =>
    apiClient.post(`/miniatures/${miniatureId}/recipes/${recipeId}`),
  unlinkRecipe: (miniatureId: number, recipeId: number) =>
    apiClient.delete(`/miniatures/${miniatureId}/recipes/${recipeId}`),
}

// Photo API
export const photoApi = {
  listByMiniature: (miniatureId: number) => 
    apiClient.get<Photo[]>(`/miniatures/${miniatureId}/photos`),
  upload: (miniatureId: number, file: File) => {
    const formData = new FormData()
    formData.append('photo', file)
    return apiClient.post<Photo>(`/miniatures/${miniatureId}/photos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  delete: (id: number) => apiClient.delete(`/photos/${id}`),
}

export default apiClient