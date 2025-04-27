// src/pages/Completion/index.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Paper, Typography, Button, Box } from '@mui/material';
import { useAssessment } from '../../contexts/AccessmentContext';
import { getTranslation } from '../../utils/translationService';

const Completion = () => {
  const { participantId, resetAssessment, language } = useAssessment();
  const navigate = useNavigate();
  
  // Get translations
  const t = (key) => getTranslation(key, language);
  
  const handleReturnHome = () => {
    // Reset the assessment completely
    resetAssessment();
    
    // Navigate to home
    navigate('/', { replace: true });
  };
  
  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('assessmentComplete')}
        </Typography>
        
        <Typography variant="body1" paragraph>
          {t('thankYou')}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          {t('participantId')} {participantId}
        </Typography>
        
        <Box sx={{ mt: 4 }}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleReturnHome}
          >
            {t('returnHome')}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Completion;