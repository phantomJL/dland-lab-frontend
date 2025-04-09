// src/pages/Results.jsx
import React from 'react';
import { Container, Typography, Paper } from '@mui/material';

const Results = () => {
  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Assessment Results
      </Typography>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          This page would display detailed results from the assessments.
        </Typography>
      </Paper>
    </Container>
  );
};

export default Results;