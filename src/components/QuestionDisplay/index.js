// src/components/QuestionDisplay/index.js
import React from 'react';
import { Paper, Typography, Box, Chip } from '@mui/material';

const QuestionDisplay = ({ questionNumber, questionText, instructions, category }) => {
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
  
  // Check if we should display the content at all
  const shouldDisplay = () => {
    // Don't show if both text and instructions are generic/redundant
    const isGenericText = 
      questionText === 'Instructions' || 
      questionText === 'Practice' || 
      questionText === `Practice ${questionNumber}` ||
      questionText === `Question ${questionNumber}` ||
      questionText === 'Listen to the instructions';
    
    const isGenericInstruction = 
      !instructions || 
      instructions === 'Please listen to these instructions carefully.' ||
      instructions === 'This is a practice question. Please respond to familiarize yourself with the recording system.' ||
      instructions === 'Listen carefully and speak clearly into the microphone.';
    
    return !(isGenericText && isGenericInstruction);
  };
  
  // If there's nothing meaningful to display, return null
  if (!shouldDisplay()) {
    return null;
  }
  
  // Get a friendly display title if needed
  const getFriendlyTitle = () => {
    // Don't show redundant titles
    if (questionText === 'Instructions' || 
        questionText === `Practice ${questionNumber}` ||
        questionText === `Question ${questionNumber}`) {
      return null;
    }
    
    return questionText;
  };
  
  const friendlyTitle = getFriendlyTitle();
  
  return (
    <Paper elevation={1} sx={{ p: 3, mb: 3, backgroundColor: colors.bg, borderRadius: '12px' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: friendlyTitle ? 2 : 0 }}>
        {/* Only show chip, no title text in the header */}
        <Box sx={{ flex: 1 }}></Box>
        
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
      
      {/* Only show the title text if it's not redundant */}
      {friendlyTitle && (
        <Typography variant="body1" paragraph>
          {friendlyTitle}
        </Typography>
      )}
      
      {/* Only show instructions box if there are meaningful instructions */}
      {instructions && instructions !== 'Please listen to these instructions carefully.' && 
       instructions !== 'This is a practice question. Please respond to familiarize yourself with the recording system.' &&
       instructions !== 'Listen carefully and speak clearly into the microphone.' && (
        <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {instructions}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default QuestionDisplay;