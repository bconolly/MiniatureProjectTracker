import { Typography, Paper, Box } from '@mui/material'

function Dashboard() {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Welcome to the Miniature Painting Tracker! This dashboard will show project overview and statistics.
        </Typography>
      </Paper>
    </Box>
  )
}

export default Dashboard