// Shared types matching the Rust backend
export enum GameSystem {
  AgeOfSignar = 'age_of_sigmar',
  HorusHeresy = 'horus_heresy',
  Warhammer40k = 'warhammer_40k',
}

export enum MiniatureType {
  Troop = 'troop',
  Character = 'character',
}

export enum ProgressStatus {
  Unpainted = 'unpainted',
  Primed = 'primed',
  Basecoated = 'basecoated',
  Detailed = 'detailed',
  Completed = 'completed',
}

export interface Project {
  id: number
  name: string
  game_system: GameSystem
  army: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Miniature {
  id: number
  project_id: number
  name: string
  miniature_type: MiniatureType
  progress_status: ProgressStatus
  notes?: string
  created_at: string
  updated_at: string
}

export interface PaintingRecipe {
  id: number
  name: string
  miniature_type: MiniatureType
  steps: string[]
  paints_used: string[]
  techniques: string[]
  notes?: string
  created_at: string
  updated_at: string
}

export interface Photo {
  id: number
  miniature_id: number
  filename: string
  file_path: string
  file_size: number
  mime_type: string
  uploaded_at: string
}

// Request/Response DTOs
export interface CreateProjectRequest {
  name: string
  game_system: GameSystem
  army: string
  description?: string
}

export interface UpdateProjectRequest {
  name?: string
  game_system?: GameSystem
  army?: string
  description?: string
}

export interface CreateMiniatureRequest {
  name: string
  miniature_type: MiniatureType
  notes?: string
}

export interface UpdateMiniatureRequest {
  name?: string
  progress_status?: ProgressStatus
  notes?: string
}

export interface CreateRecipeRequest {
  name: string
  miniature_type: MiniatureType
  steps: string[]
  paints_used: string[]
  techniques: string[]
  notes?: string
}

export interface UpdateRecipeRequest {
  name?: string
  steps?: string[]
  paints_used?: string[]
  techniques?: string[]
  notes?: string
}

export interface ErrorResponse {
  error: {
    error_type: string
    message: string
    details?: any
    timestamp: string
  }
}

// UI State types
export interface LoadingState {
  loading: boolean
  error: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
}

// Form validation types
export interface ValidationError {
  field: string
  message: string
}

// Utility types for better type safety
export type ProjectWithMiniatures = Project & {
  miniatures: Miniature[]
}

export type MiniatureWithPhotos = Miniature & {
  photos: Photo[]
}

// Constants for UI
export const GAME_SYSTEM_LABELS: Record<GameSystem, string> = {
  [GameSystem.AgeOfSignar]: 'Age of Sigmar',
  [GameSystem.HorusHeresy]: 'Horus Heresy',
  [GameSystem.Warhammer40k]: 'Warhammer 40K',
}

export const MINIATURE_TYPE_LABELS: Record<MiniatureType, string> = {
  [MiniatureType.Troop]: 'Troop',
  [MiniatureType.Character]: 'Character',
}

export const PROGRESS_STATUS_LABELS: Record<ProgressStatus, string> = {
  [ProgressStatus.Unpainted]: 'Unpainted',
  [ProgressStatus.Primed]: 'Primed',
  [ProgressStatus.Basecoated]: 'Basecoated',
  [ProgressStatus.Detailed]: 'Detailed',
  [ProgressStatus.Completed]: 'Completed',
}