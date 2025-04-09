// src/components/QuestionDisplay.jsx
import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

const QuestionDisplay = ({ questionNumber, questionText, instructions }) => {
  return (
    <Paper elevation={1} sx={{ p: 3, mb: 3, backgroundColor: '#f8f9fa' }}>
      <Typography variant="h6" gutterBottom>
        Question {questionNumber}
      </Typography>
      
      <Typography variant="body1" paragraph>
        {questionText}
      </Typography>
      
      {instructions && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Instructions: {instructions}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default QuestionDisplay;