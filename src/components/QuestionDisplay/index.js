// src/components/QuestionDisplay/index.js
import React from 'react';
import { Paper, Typography, Box, Chip } from '@mui/material';
import { getTranslation } from '../../utils/translationService';

const QuestionDisplay = ({ questionNumber, questionText, instructions, category, language = 'english' }) => {
  // Get translations
  const t = (key) => getTranslation(key, language);
  
  // Determine the display title based on category and number
  let displayTitle = '';
  
  if (category === 'instruction') {
    displayTitle = t('instructions');
  } else if (category === 'practice') {
    displayTitle = `${t('practice')} ${questionNumber || ''}`;
  } else {
    displayTitle = `${questionText}`;
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
  
  // Get label for the chip based on category
  const getChipLabel = () => {
    if (category === 'instruction') return t('information');
    if (category === 'practice') return t('practice');
    return t('assessment');
  };
  
  return (
    <Paper elevation={1} sx={{ p: 3, mb: 3, backgroundColor: colors.bg, borderRadius: '12px' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: category === 'instruction' ? 0 : 2 }}>
        {category !== 'instruction' && (
          <Typography variant="h6">
            {displayTitle}
          </Typography>
        )}
        
        {category && (
          <Chip 
            label={getChipLabel()} 
            size="small"
            sx={{ 
              backgroundColor: colors.chip, 
              color: 'white',
              fontWeight: 'bold'
            }}
          />
        )}
      </Box>
      
      {/* Only show the text if it's not redundant with the title */}
      {(category === 'instruction') && (
        <Typography variant="body1" paragraph>
          {questionText}
        </Typography>
      )}
      
      {/* Only show instructions box if there are meaningful instructions */}
      {instructions && instructions !== t('instructions') && (
        <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" fontWeight="bold" gutterBottom>
            {t('instructions')}
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