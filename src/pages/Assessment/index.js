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
  StepLabel,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material';
import { useAssessment } from '../../contexts/AccessmentContext';
import QuestionDisplay from '../../components/QuestionDisplay';
import AudioPlayer from '../../components/AudioPlayer';
import AudioRecorder from '../../components/AudioRecorder';

// Function to generate a unique participant ID
const generateParticipantId = () => {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `P${datePart}-${randomPart}`;
};

const Assessment = () => {
  const [id, setId] = useState(generateParticipantId());
  const [recordingCompleted, setRecordingCompleted] = useState(false);
  const [language, setLanguage] = useState(localStorage.getItem('assessmentLanguage') || 'english');
  
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
    getPhaseProgress,
    setLanguagePreference
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
  
  const handleLanguageChange = (event) => {
    const newLanguage = event.target.value;
    setLanguage(newLanguage);
    localStorage.setItem('assessmentLanguage', newLanguage);
  };
  
  const handleStart = (e) => {
    e.preventDefault();
    if (id.trim()) {
      // Store ID and language in localStorage
      localStorage.setItem('participantId', id);
      localStorage.setItem('assessmentLanguage', language);
      
      // Pass the language to the assessment context
      setLanguagePreference(language);
      
      // Start the assessment
      startAssessment(id, language);
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
    
    if (currentPhaseIndex === -1) currentPhaseIndex = 0;
    
    return {
      count: currentPhaseQuestions.length,
      index: currentPhaseIndex + 1
    };
  };

  // Translations for UI elements
  const translations = {
    english: {
      welcome: "Let's Learn Together!",
      intro: "Hi there! We're going to play some fun listening and speaking games. Ready to begin?",
      codeLabel: "Your special code:",
      codeHelp: "This code helps us keep track of your answers. You can write it down if you need to take a break and come back later!",
      startButton: "Let's Begin! 🎮",
      languageSelect: "Select Language:",
      english: "English",
      chinese: "中文 (Chinese)",
      loading: "Loading our fun activities...",
      error: "Oops! Something went wrong",
      tryAgain: "Let's Try Again",
      listen: "Listen",
      practice: "Practice",
      answer: "Answer",
      listenCarefully: "Listen carefully:",
      next: "Next",
      finish: "Finish",
      letsPractice: "Let's Practice",
      startActivities: "Start Activities",
      code: "Code:",
      of: "of"
    },
    chinese: {
      welcome: "一起来学习!",
      intro: "你好！我们将玩一些有趣的听力和口语游戏。准备好开始了吗？",
      codeLabel: "你的特别代码:",
      codeHelp: "这个代码帮助我们跟踪你的答案。如果你需要休息并稍后回来，可以把它写下来！",
      startButton: "开始吧! 🎮",
      languageSelect: "选择语言:",
      english: "English (英语)",
      chinese: "中文",
      loading: "正在加载有趣的活动...",
      error: "哎呀！出了点问题",
      tryAgain: "让我们再试一次",
      listen: "听",
      practice: "练习",
      answer: "回答",
      listenCarefully: "仔细听:",
      next: "下一个",
      finish: "完成",
      letsPractice: "让我们练习",
      startActivities: "开始活动",
      code: "代码:",
      of: "/"
    }
  };

  // Get translations for current language
  const t = translations[language] || translations.english;
  
  // Custom styles
  const styles = {
    container: {
      py: 4
    },
    paper: {
      p: 4,
      borderRadius: 4,
      border: '2px solid #9BBDB1',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
    },
    title: {
      color: '#5783A9',
      fontWeight: 600
    },
    stepLabel: {
      color: '#5783A9'
    },
    progressBar: {
      height: 10,
      borderRadius: 5
    },
    nextButton: {
      borderRadius: 20,
      px: 3,
      py: 1.2,
      fontWeight: 600,
      boxShadow: '0 4px 8px rgba(155, 189, 177, 0.3)'
    },
    languageSelector: {
      mt: 3,
      mb: 3,
      p: 2,
      border: '1px solid #e0e0e0',
      borderRadius: 2,
      bgcolor: '#f9f9f9'
    }
  };
  
  // If still loading questions
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ textAlign: 'center', py: 8 }}>
        <CircularProgress size={60} sx={{ color: '#9BBDB1' }} />
        <Typography variant="h6" sx={{ mt: 2, color: '#5783A9' }}>
          {t.loading}
        </Typography>
      </Container>
    );
  }
  
  // If there was an error loading
  if (error) {
    return (
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ ...styles.paper, bgcolor: '#fff9f9' }}>
          <Typography variant="h5" color="error" gutterBottom>
            {t.error}
          </Typography>
          <Typography>{error}</Typography>
          <Button 
            variant="contained" 
            onClick={() => window.location.reload()}
            sx={{ mt: 3, bgcolor: '#9BBDB1', '&:hover': { bgcolor: '#80a396' } }}
          >
            {t.tryAgain}
          </Button>
        </Paper>
      </Container>
    );
  }
  
  // If assessment hasn't started yet, show the participant ID input
  if (assessmentStatus === 'not_started' || !participantId) {
    return (
      <Container maxWidth="md" sx={styles.container}>
        <Paper elevation={3} sx={styles.paper}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <span role="img" aria-label="animal" style={{ fontSize: '2.5rem' }}>🦊</span>
            <Typography variant="h4" component="h1" gutterBottom sx={{ ml: 2, color: '#5783A9', fontWeight: 600 }}>
              {t.welcome}
            </Typography>
          </Box>
          
          <Typography variant="body1" paragraph sx={{ color: '#555', fontSize: '1.1rem' }}>
            {t.intro}
          </Typography>
          
          {/* Language selector */}
          <Box sx={styles.languageSelector}>
            <Typography variant="subtitle1" sx={{ mb: 1, color: '#5783A9', fontWeight: 500 }}>
              {t.languageSelect}
            </Typography>
            <FormControl component="fieldset">
              <RadioGroup
                row
                name="language"
                value={language}
                onChange={handleLanguageChange}
              >
                <FormControlLabel 
                  value="english" 
                  control={<Radio color="primary" />} 
                  label={t.english} 
                />
                <FormControlLabel 
                  value="chinese" 
                  control={<Radio color="primary" />} 
                  label={t.chinese} 
                />
              </RadioGroup>
            </FormControl>
          </Box>
          
          <Box component="form" onSubmit={handleStart} sx={{ mt: 4, maxWidth: '500px', mx: 'auto' }}>
            <Typography variant="subtitle1" align="left" gutterBottom sx={{ color: '#5783A9' }}>
              {t.codeLabel}
            </Typography>
            <TextField
              fullWidth
              value={id}
              onChange={(e) => setId(e.target.value)}
              variant="outlined"
              InputProps={{
                readOnly: false,
                sx: { borderRadius: 2, borderColor: '#9BBDB1' }
              }}
              sx={{ mb: 2 }}
            />
            <Typography variant="body2" color="text.secondary" paragraph align="left">
              {t.codeHelp}
            </Typography>
            
            <Button 
              type="submit" 
              variant="contained" 
              size="large" 
              sx={{ 
                mt: 3, 
                bgcolor: '#9BBDB1', 
                '&:hover': { bgcolor: '#80a396' },
                borderRadius: 4,
                py: 1.5,
                fontSize: '1.1rem'
              }}
              fullWidth
            >
              {t.startButton}
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }
  
  // Determine animal emoji based on phase
  const animalEmoji = currentQuestion?.audioType === 'instruction' ? '🦊' : 
                     currentQuestion?.audioType === 'practice' ? '🐰' : '🐢';
                     
  // Determine button text based on phase
  const nextButtonText = currentQuestionIndex === totalQuestions - 1 
                        ? t.finish
                        : currentQuestion?.audioType === 'instruction' 
                          ? t.letsPractice
                          : currentQuestion?.audioType === 'practice' && testQuestions.length > 0 && phaseInfo.index === phaseInfo.count
                            ? t.startActivities
                            : t.next;
  
  // Determine the active step for the stepper
  const activeStep = currentQuestion?.audioType === 'instruction' ? 0 : 
                     currentQuestion?.audioType === 'practice' ? 1 : 2;
                     
  // Get phase-specific question count
  const phaseInfo = getPhaseInfo();
  
  // Determine if recording is required for the current question
  const recordingRequired = currentQuestion?.requiresRecording !== false;
  
  // If assessment is in progress and we have a current question
  return (
    <Container maxWidth="md" sx={styles.container}>
      <Paper elevation={3} sx={styles.paper}>
        {/* Simple header with animal emoji and participant code */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <span role="img" aria-label="animal" style={{ fontSize: '2rem' }}>
              {animalEmoji}
            </span>
            <Typography 
              variant="body2" 
              sx={{ ml: 2, color: '#666' }}
            >
              {t.code} {participantId}
            </Typography>
          </Box>
          
          {/* Progress counter for practice and test phases */}
          {currentQuestion?.audioType !== 'instruction' && (
            <Typography 
              variant="body2" 
              sx={{ 
                bgcolor: '#f0f7ff', 
                px: 2, 
                py: 1, 
                borderRadius: 10,
                color: '#5783A9',
                fontWeight: 500
              }}
            >
              {phaseInfo.index} {t.of} {phaseInfo.count}
            </Typography>
          )}
        </Box>
        
        {/* Progress Stepper */}
        <Box sx={{ mb: 4 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            <Step>
              <StepLabel sx={styles.stepLabel}>{t.listen}</StepLabel>
            </Step>
            <Step>
              <StepLabel sx={styles.stepLabel}>{t.practice}</StepLabel>
            </Step>
            <Step>
              <StepLabel sx={styles.stepLabel}>{t.answer}</StepLabel>
            </Step>
          </Stepper>
        </Box>
        
        {/* Overall progress bar */}
        <Box sx={{ width: '100%', mb: 4 }}>
          <LinearProgress 
            variant="determinate" 
            value={getProgress()} 
            sx={{ ...styles.progressBar, bgcolor: '#e0e0e0' }}
            color="primary"
          />
        </Box>
        
        {currentQuestion && (
          <>
            {/* Question Display (will handle its own visibility) */}
            <QuestionDisplay 
              questionText={currentQuestion.text}
              instructions={currentQuestion.instructions}
              category={currentQuestion.audioType}
              questionNumber={currentQuestion.displayNumber}
              language={language}
            />
            
            {/* Audio Player Section - Always shown */}
            <Box sx={{ 
              mb: 3, 
              p: 3, 
              bgcolor: '#f5f9fc', 
              borderRadius: 3,
              border: '1px solid #e0e0e0'
            }}>
              <Typography variant="subtitle1" gutterBottom sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                color: '#5783A9',
                fontWeight: 500  
              }}>
                <span role="img" aria-label="headphones" style={{ marginRight: '8px', fontSize: '1.2rem' }}>🎧</span>
                {t.listenCarefully}
              </Typography>
              <AudioPlayer 
                audioUrl={currentQuestion.audioPromptUrl} 
                onPlayComplete={() => {
                  if (!recordingRequired) {
                    setRecordingCompleted(true);
                  }
                }}
              />
            </Box>
            
            {/* Recording Section */}
            {recordingRequired && (
              <AudioRecorder 
                key={`recorder-${currentQuestionIndex}-${currentQuestion?._id}`}
                questionId={currentQuestion._id}
                onRecordingComplete={handleRecordingComplete}
                language={language}
              />
            )}
            
            {/* Next Button */}
            {recordingCompleted && (
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                  sx={styles.nextButton}
                >
                  {nextButtonText}
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