import React from 'react'
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepButton,
  Paper,
  Chip,
  LinearProgress,
} from '@mui/material'
import { 
  Brush as BrushIcon,
  Palette as PaletteIcon,
  AutoFixHigh as DetailIcon,
  CheckCircle as CompleteIcon,
  RadioButtonUnchecked as UnpaintedIcon,
} from '@mui/icons-material'
import type { ProgressStatus } from '../types'
import { ProgressStatus as ProgressStatusEnum, PROGRESS_STATUS_LABELS } from '../types'

interface ProgressTrackerProps {
  currentStatus: ProgressStatus
  onStatusChange?: (newStatus: ProgressStatus) => void
  interactive?: boolean
  showLabels?: boolean
  variant?: 'stepper' | 'linear' | 'compact'
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  currentStatus,
  onStatusChange,
  interactive = false,
  showLabels = true,
  variant = 'stepper',
}) => {
  const steps = [
    {
      status: ProgressStatusEnum.Unpainted,
      label: 'Unpainted',
      icon: <UnpaintedIcon />,
      description: 'Model is unpainted',
    },
    {
      status: ProgressStatusEnum.Primed,
      label: 'Primed',
      icon: <BrushIcon />,
      description: 'Base primer applied',
    },
    {
      status: ProgressStatusEnum.Basecoated,
      label: 'Basecoated',
      icon: <PaletteIcon />,
      description: 'Base colors applied',
    },
    {
      status: ProgressStatusEnum.Detailed,
      label: 'Detailed',
      icon: <DetailIcon />,
      description: 'Details and highlights added',
    },
    {
      status: ProgressStatusEnum.Completed,
      label: 'Completed',
      icon: <CompleteIcon />,
      description: 'Painting finished',
    },
  ]

  const currentStepIndex = steps.findIndex(step => step.status === currentStatus)
  
  const getProgressValue = () => {
    return ((currentStepIndex + 1) / steps.length) * 100
  }

  const getStepColor = (stepIndex: number) => {
    if (stepIndex < currentStepIndex) return 'success'
    if (stepIndex === currentStepIndex) return 'primary'
    return 'default'
  }

  const handleStepClick = (status: ProgressStatus) => {
    if (interactive && onStatusChange) {
      onStatusChange(status)
    }
  }

  if (variant === 'linear') {
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="body2" color="text.secondary">
            Progress
          </Typography>
          <Chip 
            label={PROGRESS_STATUS_LABELS[currentStatus]}
            size="small"
            color={getStepColor(currentStepIndex) as any}
          />
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={getProgressValue()} 
          color={getStepColor(currentStepIndex) as any}
          sx={{ height: 8, borderRadius: 4 }}
        />
        {showLabels && (
          <Box display="flex" justifyContent="space-between" mt={1}>
            <Typography variant="caption" color="text.secondary">
              Unpainted
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Completed
            </Typography>
          </Box>
        )}
      </Box>
    )
  }

  if (variant === 'compact') {
    return (
      <Box display="flex" alignItems="center" gap={2}>
        <Box display="flex" alignItems="center" gap={1}>
          {steps[currentStepIndex].icon}
          <Typography variant="body2">
            {steps[currentStepIndex].label}
          </Typography>
        </Box>
        <Box flexGrow={1}>
          <LinearProgress 
            variant="determinate" 
            value={getProgressValue()} 
            color={getStepColor(currentStepIndex) as any}
            sx={{ height: 4, borderRadius: 2 }}
          />
        </Box>
        <Typography variant="caption" color="text.secondary">
          {Math.round(getProgressValue())}%
        </Typography>
      </Box>
    )
  }

  // Default stepper variant
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Painting Progress
      </Typography>
      
      <Stepper activeStep={currentStepIndex} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.status} completed={index < currentStepIndex}>
            <StepLabel
              StepIconComponent={() => (
                <Box
                  sx={{
                    color: index <= currentStepIndex ? 'primary.main' : 'text.disabled',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {step.icon}
                </Box>
              )}
            >
              {interactive ? (
                <StepButton
                  onClick={() => handleStepClick(step.status)}
                  sx={{ textAlign: 'left' }}
                >
                  <Box>
                    <Typography variant="body1" fontWeight={index === currentStepIndex ? 'bold' : 'normal'}>
                      {step.label}
                    </Typography>
                    {showLabels && (
                      <Typography variant="body2" color="text.secondary">
                        {step.description}
                      </Typography>
                    )}
                  </Box>
                </StepButton>
              ) : (
                <Box>
                  <Typography variant="body1" fontWeight={index === currentStepIndex ? 'bold' : 'normal'}>
                    {step.label}
                  </Typography>
                  {showLabels && (
                    <Typography variant="body2" color="text.secondary">
                      {step.description}
                    </Typography>
                  )}
                </Box>
              )}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box mt={3} p={2} bgcolor="grey.50" borderRadius={1}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Overall Progress
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <LinearProgress 
            variant="determinate" 
            value={getProgressValue()} 
            color={getStepColor(currentStepIndex) as any}
            sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
          />
          <Typography variant="body2" fontWeight="bold">
            {Math.round(getProgressValue())}%
          </Typography>
        </Box>
      </Box>
    </Paper>
  )
}

export default ProgressTracker