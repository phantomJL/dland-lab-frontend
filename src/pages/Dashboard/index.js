// src/pages/Dashboard.jsx
import React from 'react';
import { Container, Typography, Paper, Box, Grid, Card, CardContent } from '@mui/material';

const Dashboard = () => {
  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Assessments
              </Typography>
              <Typography variant="h3">
                125
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Completed Today
              </Typography>
              <Typography variant="h3">
                8
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Average Completion Time
              </Typography>
              <Typography variant="h3">
                24 min
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Recent Assessments
        </Typography>
        
        <Box sx={{ overflowX: 'auto' }}>
          <Box sx={{ minWidth: 650 }}>
            <Typography>
              (Table of recent assessments would go here)
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Dashboard;