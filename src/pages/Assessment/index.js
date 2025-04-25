// src/pages/Assessment/index.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Button, 
  TextField, 
  CircularProgress, 
  LinearProgress,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { useAssessment } from '../../contexts/AccessmentContext';
import QuestionDisplay from '../../components/QuestionDisplay';
import AudioPlayer from '../../components/AudioPlayer';
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
    completeAssessment,
    assessmentPhase,
    instructionQuestions,
    practiceQuestions,
    testQuestions,
    getProgress,
    getPhaseProgress
  } = useAssessment();
  
  const navigate = useNavigate();
  
  // Reset recording completed state when question changes
  useEffect(() => {
    setRecordingCompleted(false);
  }, [currentQuestionIndex]);
  
  // Auto-complete recording for questions that don't require recording
  useEffect(() => {
    if (currentQuestion && currentQuestion.requiresRecording === false) {
      setRecordingCompleted(true);
    }
  }, [currentQuestion]);
  
  const handleStart = (e) => {
    e.preventDefault();
    if (id.trim()) {
      // Store ID in localStorage to persist between page reloads
      localStorage.setItem('participantId', id);
      
      // Start the assessment
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
  
  // Helper to get phase-specific count and progress
  const getPhaseInfo = () => {
    if (!currentQuestion) return { count: 0, index: 0 };
    
    let currentPhaseQuestions = [];
    let currentPhaseIndex = 0;
    
    if (currentQuestion.audioType === 'instruction') {
      currentPhaseQuestions = instructionQuestions;
    } else if (currentQuestion.audioType === 'practice') {
      currentPhaseQuestions = practiceQuestions;
    } else {
      currentPhaseQuestions = testQuestions;
    }
    
    currentPhaseIndex = currentPhaseQuestions.findIndex(q => 
      q._id === currentQuestion?._id
    );
    
    // If not found, default to 0
    if (currentPhaseIndex === -1) currentPhaseIndex = 0;
    
    return {
      count: currentPhaseQuestions.length,
      index: currentPhaseIndex + 1 // 1-based for display
    };
  };

  // Format display text based on question type and number
  const getQuestionDisplayText = () => {
    if (!currentQuestion) return "";
    
    if (currentQuestion.audioType === 'instruction') {
      return "Instructions";
    } else if (currentQuestion.audioType === 'practice') {
      return `Practice ${currentQuestion.displayNumber || getPhaseInfo().index}`;
    } else {
      return `Question ${currentQuestion.displayNumber || getPhaseInfo().index}`;
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
  
  // Determine the assessment phase title
  const phaseTitle = {
    'instruction': 'Instructions',
    'practice': 'Practice Questions',
    'test': 'Assessment Questions'
  }[currentQuestion?.audioType || 'test'] || 'Assessment';
  
  // Determine if recording is required for the current question
  const recordingRequired = currentQuestion?.requiresRecording !== false;
  
  // Get phase-specific question count
  const phaseInfo = getPhaseInfo();
  
  // Determine the active step for the stepper
  const activeStep = currentQuestion?.audioType === 'instruction' ? 0 : 
                     currentQuestion?.audioType === 'practice' ? 1 : 2;
  
  // If assessment is in progress and we have a current question
  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            {phaseTitle}
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            Participant ID: {participantId}
            {/* Show phase-specific progress */}
            {currentQuestion?.audioType === 'instruction' ? '' : 
              ` | ${getQuestionDisplayText()} of ${phaseInfo.count}`}
          </Typography>
          
          {/* Assessment phase progress */}
          <Box sx={{ mt: 3, mb: 3 }}>
            <Stepper activeStep={activeStep}>
              <Step>
                <StepLabel>Instructions</StepLabel>
              </Step>
              <Step>
                <StepLabel>Practice</StepLabel>
              </Step>
              <Step>
                <StepLabel>Assessment</StepLabel>
              </Step>
            </Stepper>
          </Box>
          
          {/* Overall progress bar */}
          <Box sx={{ width: '100%', mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Overall Progress: {Math.round(getProgress())}%
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={getProgress()} 
              sx={{ height: 8, borderRadius: 4 }} 
            />
          </Box>
          
          {/* Phase-specific progress bar */}
          <Box sx={{ width: '100%', mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {phaseTitle} Progress: {Math.round(getPhaseProgress())}%
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={getPhaseProgress()} 
              color="secondary"
              sx={{ height: 8, borderRadius: 4 }} 
            />
          </Box>
        </Box>
        
        {currentQuestion && (
          <>
            <QuestionDisplay 
              questionText={currentQuestion.text}
              instructions={currentQuestion.instructions}
              category={currentQuestion.audioType}
              questionNumber={currentQuestion.displayNumber}
            />
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                {currentQuestion.audioType === 'instruction' ? 'Listen to the instructions:' : 'Listen to the prompt:'}
              </Typography>
              <AudioPlayer 
                audioUrl={currentQuestion.audioPromptUrl} 
                onPlayComplete={() => {
                  // If this is an instruction without recording, we can automatically
                  // mark it as complete when the audio finishes
                  if (!recordingRequired) {
                    setRecordingCompleted(true);
                  }
                }}
              />
            </Box>
            
            {recordingRequired && (
              <AudioRecorder 
                questionId={currentQuestion._id}
                onRecordingComplete={handleRecordingComplete}
              />
            )}
            
            {recordingCompleted && (
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                >
                  {currentQuestionIndex === totalQuestions - 1 
                    ? 'Finish Assessment' 
                    : currentQuestion.audioType === 'instruction' 
                      ? 'Start Practice' 
                      : currentQuestion.audioType === 'practice' && testQuestions.length > 0 && phaseInfo.index === phaseInfo.count
                        ? 'Start Assessment'
                        : 'Next Question'}
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