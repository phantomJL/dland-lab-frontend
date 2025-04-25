// src/components/QuestionDisplay/index.js
import React from 'react';
import { Paper, Typography, Box, Chip } from '@mui/material';

const QuestionDisplay = ({ questionNumber, questionText, instructions, category }) => {
  // Determine the display title based on category and number
  let displayTitle = '';
  
  if (category === 'instruction') {
    displayTitle = 'Instructions';
  } else if (category === 'practice') {
    displayTitle = `Practice ${questionNumber || ''}`;
  } else {
    displayTitle = `Question ${questionNumber || ''}`;
  }
  
  // Determine the colors based on category
  const colors = {
    instruction: {
      bg: '#e3f2fd', // Light blue background
      chip: '#2196f3' // Blue chip
    },
    practice: {
      bg: '#e8f5e9', // Light green background
      chip: '#4caf50' // Green chip
    },
    test: {
      bg: '#f8f9fa', // Light grey background
      chip: '#9BBDB1' // Project's primary color
    }
  }[category] || { bg: '#f8f9fa', chip: '#9BBDB1' };
  
  return (
    <Paper elevation={1} sx={{ p: 3, mb: 3, backgroundColor: colors.bg }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">
          {displayTitle}
        </Typography>
        
        {category && (
          <Chip 
            label={category === 'instruction' ? 'Information' : category === 'practice' ? 'Practice' : 'Assessment'} 
            size="small"
            sx={{ 
              backgroundColor: colors.chip, 
              color: 'white',
              fontWeight: 'bold'
            }}
          />
        )}
      </Box>
      
      <Typography variant="body1" paragraph>
        {questionText}
      </Typography>
      
      {instructions && (
        <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" fontWeight="bold" gutterBottom>
            Instructions:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {instructions}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default QuestionDisplay;