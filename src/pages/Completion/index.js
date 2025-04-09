// src/pages/Completion.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Paper, Typography, Button, Box } from '@mui/material';
import { useAssessment } from '../../contexts/AccessmentContext';

const Completion = () => {
  const { participantId } = useAssessment();
  const navigate = useNavigate();
  
  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Assessment Complete!
        </Typography>
        
        <Typography variant="body1" paragraph>
          Thank you for completing the language assessment. Your responses have been recorded.
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Participant ID: {participantId}
        </Typography>
        
        <Box sx={{ mt: 4 }}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/')}
          >
            Return to Home
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Completion;