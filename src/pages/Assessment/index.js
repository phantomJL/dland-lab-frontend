// src/pages/Assessment.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Paper, Typography, Box, Button, TextField, CircularProgress, LinearProgress } from '@mui/material';
import { useAssessment } from '../../contexts/AccessmentContext';
import QuestionDisplay from '../../components/QuestionDisplay';
import AudioRecorder from '../../components/AudioRecorder';

const Assessment = () => {
  const [id, setId] = useState('');
  const [recordingCompleted, setRecordingCompleted] = useState(false);
  const { 
    startAssessment, 
    assessmentStatus, 
    loading, 
    error, 
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    participantId,
    goToNextQuestion,
    completeAssessment
  } = useAssessment();
  
  const navigate = useNavigate();
  
  const handleStart = (e) => {
    e.preventDefault();
    if (id.trim()) {
      startAssessment(id);
    }
  };
  
  const handleRecordingComplete = (recording) => {
    setRecordingCompleted(true);
  };
  
  const handleNext = async () => {
    setRecordingCompleted(false);
    
    const hasNextQuestion = await goToNextQuestion();
    if (!hasNextQuestion) {
      await completeAssessment();
      navigate('/completion');
    }
  };
  
  // If still loading questions
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ textAlign: 'center', py: 8 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading assessment...
        </Typography>
      </Container>
    );
  }
  
  // If there was an error loading
  if (error) {
    return (
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center', bgcolor: '#fff9f9' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Error Loading Assessment
          </Typography>
          <Typography>{error}</Typography>
          <Button 
            variant="contained" 
            onClick={() => window.location.reload()}
            sx={{ mt: 3 }}
          >
            Try Again
          </Button>
        </Paper>
      </Container>
    );
  }
  
  // If assessment hasn't started yet, show the participant ID input
  if (assessmentStatus === 'not_started' || !participantId) {
    return (
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Language Assessment Tool
          </Typography>
          
          <Typography variant="body1" paragraph>
            Welcome to the DLanD Lab language assessment. This tool will ask you to respond to audio prompts.
          </Typography>
          
          <Box component="form" onSubmit={handleStart} sx={{ mt: 4, maxWidth: '400px', mx: 'auto' }}>
            <TextField
              fullWidth
              label="Participant ID"
              value={id}
              onChange={(e) => setId(e.target.value)}
              required
              margin="normal"
            />
            
            <Button 
              type="submit" 
              variant="contained" 
              size="large" 
              sx={{ mt: 3 }}
              fullWidth
            >
              Start Assessment
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }
  
  // If assessment is in progress and we have a current question
  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Language Assessment
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            Participant ID: {participantId} | Question {currentQuestionIndex + 1} of {totalQuestions}
          </Typography>
          
          <Box sx={{ width: '100%', mt: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={((currentQuestionIndex + 1) / totalQuestions) * 100} 
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Box>
        </Box>
        
        {currentQuestion && (
          <>
            <QuestionDisplay 
              questionNumber={currentQuestionIndex + 1}
              questionText={currentQuestion.text}
              instructions={currentQuestion.instructions}
            />
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Listen to the prompt:
              </Typography>
              <audio controls src={currentQuestion.audioPromptUrl} style={{ width: '100%' }} />
            </Box>
            
            <AudioRecorder 
              questionId={currentQuestion._id}
              onRecordingComplete={handleRecordingComplete}
            />
            
            {recordingCompleted && (
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                >
                  {currentQuestionIndex === totalQuestions - 1 ? 'Finish Assessment' : 'Next Question'}
                </Button>
              </Box>
            )}
          </>
        )}
      </Paper>
    </Container>
  );
};

export default Assessment;