// src/pages/Assessment.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Button, 
  Stepper, 
  Step, 
  StepLabel, 
  CircularProgress,
  LinearProgress
} from '@mui/material';
import AudioPlayer from '../../components/AudioPlayer';
import AudioRecorder from '../../components/AudioRecorder';
import QuestionDisplay from '../../components/QuestionDisplay';
import { updateAssessmentStatus } from '../../utils/api';
import { useAssessment } from '../../contexts/AccessmentContext';

const Assessment = () => {
  const [recordingCompleted, setRecordingCompleted] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  
  const { 
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
  
  useEffect(() => {
    // Reset recording status when question changes
    setRecordingCompleted(false);
    setActiveStep(0);
  }, [currentQuestionIndex]);
  
  const handleRecordingComplete = async (recording) => {
    setRecordingCompleted(true);
    setActiveStep(2);
    
    // Update assessment status in backend
    try {
      await updateAssessmentStatus(
        participantId, 
        'in_progress', 
        currentQuestionIndex
      );
    } catch (err) {
      console.error("Error updating assessment status:", err);
    }
  };
  
  const handleNext = async () => {
    const hasNextQuestion = goToNextQuestion();
    
    if (!hasNextQuestion) {
      // Assessment is complete
      try {
        await updateAssessmentStatus(participantId, 'completed', currentQuestionIndex);
        completeAssessment();
        navigate('/completion');
      } catch (err) {
        console.error("Error completing assessment:", err);
      }
    }
  };
  
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: '#fff9f9' }}>
          <Typography color="error" variant="h6">
            {error}
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => window.location.reload()}
            sx={{ mt: 2 }}
          >
            Try Again
          </Button>
        </Paper>
      </Container>
    );
  }
  
  if (!currentQuestion) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5">No questions available</Typography>
        </Paper>
      </Container>
    );
  }
  
  const handlePlayComplete = () => {
    setActiveStep(1); // Move to recording step
  };
  
  const steps = ['Listen to question', 'Record your answer', 'Review and continue'];
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          Assessment in Progress
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body1">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            Participant ID: {participantId}
          </Typography>
        </Box>
        
        <Box sx={{ width: '100%', my: 3 }}>
          <LinearProgress 
            variant="determinate" 
            value={(currentQuestionIndex / totalQuestions) * 100} 
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Box>
      </Box>
      
      <Paper sx={{ p: 4, mb: 4 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <QuestionDisplay 
          questionNumber={currentQuestionIndex + 1} 
          questionText={currentQuestion.text} 
        />
        
        <AudioPlayer 
          audioUrl={currentQuestion.audioPromptUrl} 
          onPlayComplete={handlePlayComplete}
        />
        
        {activeStep >= 1 && (
          <AudioRecorder 
            questionId={currentQuestion.id} 
            onRecordingComplete={handleRecordingComplete}
          />
        )}
        
        {recordingCompleted && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              onClick={handleNext}
            >
              {currentQuestionIndex === totalQuestions - 1 ? 'Complete Assessment' : 'Next Question'}
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Assessment;