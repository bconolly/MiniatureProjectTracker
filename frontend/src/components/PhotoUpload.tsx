import React, { useCallback, useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  LinearProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
} from '@mui/material'
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
} from '@mui/icons-material'
import { useDropzone } from 'react-dropzone'
import { useApi } from '../hooks/useApi'
import { photoApi } from '../api/client'
import type { Photo } from '../types'

interface PhotoUploadProps {
  open: boolean
  onClose: () => void
  miniatureId: number
  onUploadSuccess: (photo: Photo) => void
}

interface FileWithPreview extends File {
  preview?: string
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({
  open,
  onClose,
  miniatureId,
  onUploadSuccess,
}) => {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

  const {
    loading: uploading,
    error: uploadError,
    execute: uploadPhoto,
  } = useApi(photoApi.upload)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => 
      Object.assign(file, {
        preview: URL.createObjectURL(file)
      })
    )
    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
  } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
  })

  const removeFile = (fileToRemove: FileWithPreview) => {
    setFiles(prev => {
      const updated = prev.filter(file => file !== fileToRemove)
      // Revoke the preview URL to avoid memory leaks
      if (fileToRemove.preview) {
        URL.revokeObjectURL(fileToRemove.preview)
      }
      return updated
    })
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    try {
      for (const file of files) {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))
        
        const result = await uploadPhoto(miniatureId, file)
        
        if (result) {
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }))
          onUploadSuccess(result)
        }
      }
      
      // Clear files and close dialog after successful upload
      handleClose()
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  const handleClose = () => {
    // Clean up preview URLs
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview)
      }
    })
    setFiles([])
    setUploadProgress({})
    onClose()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const isValidFileType = (file: File) => {
    return file.type.startsWith('image/') && 
           ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)
  }

  const isValidFileSize = (file: File) => {
    return file.size <= 10 * 1024 * 1024 // 10MB
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md" 
      fullWidth
    >
      <DialogTitle>
        Upload Photos
      </DialogTitle>
      
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={3}>
          {uploadError && (
            <Alert severity="error">
              {uploadError}
            </Alert>
          )}

          {/* Dropzone */}
          <Paper
            {...getRootProps()}
            sx={{
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              border: '2px dashed',
              borderColor: isDragActive 
                ? 'primary.main' 
                : isDragReject 
                  ? 'error.main' 
                  : 'grey.300',
              bgcolor: isDragActive 
                ? 'primary.50' 
                : isDragReject 
                  ? 'error.50' 
                  : 'grey.50',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'primary.50',
              }
            }}
          >
            <input {...getInputProps()} />
            <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            
            {isDragActive ? (
              <Typography variant="h6" color="primary">
                Drop the photos here...
              </Typography>
            ) : isDragReject ? (
              <Typography variant="h6" color="error">
                Some files are not supported
              </Typography>
            ) : (
              <>
                <Typography variant="h6" gutterBottom>
                  Drag & drop photos here, or click to select
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Supports JPEG, PNG, and WebP files up to 10MB each
                </Typography>
              </>
            )}
          </Paper>

          {/* File List */}
          {files.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Selected Files ({files.length})
              </Typography>
              
              <List>
                {files.map((file, index) => (
                  <ListItem key={`${file.name}-${index}`} divider>
                    <Box display="flex" alignItems="center" mr={2}>
                      {file.preview ? (
                        <img
                          src={file.preview}
                          alt={file.name}
                          style={{
                            width: 40,
                            height: 40,
                            objectFit: 'cover',
                            borderRadius: 4,
                          }}
                        />
                      ) : (
                        <ImageIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
                      )}
                    </Box>
                    
                    <ListItemText
                      primary={file.name}
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {formatFileSize(file.size)}
                          </Typography>
                          {!isValidFileType(file) && (
                            <Typography variant="caption" color="error" display="block">
                              Unsupported file type
                            </Typography>
                          )}
                          {!isValidFileSize(file) && (
                            <Typography variant="caption" color="error" display="block">
                              File too large (max 10MB)
                            </Typography>
                          )}
                          {uploadProgress[file.name] !== undefined && (
                            <LinearProgress 
                              variant="determinate" 
                              value={uploadProgress[file.name]} 
                              sx={{ mt: 1 }}
                            />
                          )}
                        </Box>
                      }
                    />
                    
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => removeFile(file)}
                        disabled={uploading}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} disabled={uploading}>
          Cancel
        </Button>
        <Button 
          variant="contained"
          onClick={handleUpload}
          disabled={uploading || files.length === 0 || files.some(f => !isValidFileType(f) || !isValidFileSize(f))}
          startIcon={<UploadIcon />}
        >
          {uploading ? 'Uploading...' : `Upload ${files.length} Photo${files.length !== 1 ? 's' : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PhotoUpload