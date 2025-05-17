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
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  MenuItem,
  Select,
  InputLabel,
  Grid
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import LanguageIcon from '@mui/icons-material/Language';

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
  // Tab state
  const [tabValue, setTabValue] = useState(0);
  
  // State for new test
  const [newId, setNewId] = useState(generateParticipantId());
  const [existingId, setExistingId] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(
    localStorage.getItem('assessmentLanguage') || 'english'
  );
  
  // New state for demographic info
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  
  const [recordingCompleted, setRecordingCompleted] = useState(false);
  const [lookupError, setLookupError] = useState('');
  
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
    language,
    testIndex,
    setLanguagePreference,
    setTestIndexPreference,
    instructionQuestions,
    practiceQuestions,
    testQuestions,
    getProgress,
    getPhaseProgress,
    resetAssessment,
    lookupParticipant,
    participantAssessments,
    lookupMode,
    updateParticipantInfo
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

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setLookupError('');
  };
  
  const handleLanguageChange = (event) => {
    const newLanguage = event.target.value;
    setSelectedLanguage(newLanguage);
    localStorage.setItem('assessmentLanguage', newLanguage);
  };
  
  const handleStartNew = (e) => {
    e.preventDefault();
    if (newId.trim()) {
      // Start a new assessment with test index 0 and demographic info
      startAssessment(newId, selectedLanguage, 0, {
        age: age || null,
        sex: sex || null
      });
    }
  };
  
  const handleLookupParticipant = async (e) => {
    e.preventDefault();
    if (!existingId.trim()) {
      setLookupError('Please enter a participant ID');
      return;
    }
    
    try {
      setLookupError('');
      const assessments = await lookupParticipant(existingId);
      
      if (assessments.length === 0) {
        setLookupError('No assessments found for this participant ID');
      }
      
      // Check if all tests are completed
      const allCompleted = assessments.every(a => a.status === 'completed');
      
      // If all tests are completed, prompt the user to start a new test
      if (allCompleted && assessments.length > 0) {
        handleStartNewLanguage(assessments[0].language);
      }
    } catch (err) {
      setLookupError('Error looking up participant');
    }
  };
  
  
  const handleContinueAssessment = (assessment) => {
    // For a completed test, always start a new test with an incremented test index
    if (assessment.status === 'completed') {
      // Find the highest test index for this language
      const sameLanguageTests = participantAssessments.filter(
        a => a.language === assessment.language
      );
      const nextTestIndex = Math.max(...sameLanguageTests.map(a => a.testIndex)) + 1;
      
      // Start a new test in the same language
      startAssessment(
        assessment.participantId, 
        assessment.language, 
        nextTestIndex
      );
    } else {
      // For in-progress tests, continue from where they left off
      startAssessment(
        assessment.participantId, 
        assessment.language, 
        assessment.testIndex
      );
    }
  };
  
  const handleStartNewLanguage = (language) => {
    // Get the highest test index for this language
    const sameLanguageTests = participantAssessments.filter(a => a.language === language);
    const nextTestIndex = sameLanguageTests.length > 0 
      ? Math.max(...sameLanguageTests.map(a => a.testIndex)) + 1 
      : 0;
    
    // Start a new assessment with this language and the next test index
    startAssessment(participantId, language, nextTestIndex);
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
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not started';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Helper to calculate and display completion percentage
  const getCompletionStatus = (assessment) => {
    if (assessment.status === 'completed') return `100% - ${t.completed}`;
    if (assessment.completionPercentage !== undefined) {
      return `${assessment.completionPercentage}% - ${t.inProgress}`;
    }
    return assessment.status === 'not_started' ? t.notStarted : t.inProgress;
  };
  
  // Translations for UI elements
  const translations = {
    english: {
      welcome: "Let's Learn Together!",
      intro: "Hi there! We're going to play some fun listening and speaking games. Ready to begin?",
      codeLabel: "Your special code:",
      codeHelp: "This code helps us keep track of your answers. You can write it down if you need to take a break and come back later!",
      startButton: "Let's Begin! 🎮",
      languageLabel: "Choose your language:",
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
      of: "of",
      newTest: "New Test",
      continueTest: "Continue Test",
      existingId: "Enter your existing code:",
      lookup: "Look Up",
      yourTests: "Your Tests",
      startNewIn: "Start New Test in",
      continueThis: "Continue This Test",
      testStarted: "Test Started",
      progress: "Progress",
      language: "Language",
      testNumber: "Test #",
      noTests: "No tests found for this participant ID",
      completed: "Completed",
      inProgress: "In Progress",
      notStarted: "Not Started",
      // New translations for demographic info
      ageLabel: "Your age:",
      sexLabel: "Your sex:",
      male: "Male",
      female: "Female",
      other: "Other",
      preferNotToSay: "Prefer not to say",
      demographicInfo: "Your Information",
      demographicHelp: "This information helps our researchers better understand language development across different groups."
    },
    chinese: {
      welcome: "一起来学习!",
      intro: "你好！我们将玩一些有趣的听力和口语游戏。准备好开始了吗？",
      codeLabel: "你的特别代码:",
      codeHelp: "这个代码帮助我们跟踪你的答案。如果你需要休息并稍后回来，可以把它写下来！",
      startButton: "开始吧! 🎮",
      languageLabel: "选择你的语言:",
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
      of: "/",
      newTest: "新测试",
      continueTest: "继续测试",
      existingId: "输入您的现有代码:",
      lookup: "查找",
      yourTests: "您的测试",
      startNewIn: "开始新的测试，使用",
      continueThis: "继续此测试",
      testStarted: "测试开始于",
      progress: "进度",
      language: "语言",
      testNumber: "测试 #",
      noTests: "找不到此参与者ID的测试",
      completed: "已完成",
      inProgress: "进行中",
      notStarted: "未开始",
      // New translations for demographic info
      ageLabel: "您的年龄:",
      sexLabel: "您的性别:",
      male: "男",
      female: "女",
      other: "其他",
      preferNotToSay: "不愿透露",
      demographicInfo: "您的信息",
      demographicHelp: "这些信息帮助我们的研究人员更好地了解不同群体的语言发展。"
    }
  };
  
  // Get translations for selected language (for start page)
  const t = translations[selectedLanguage] || translations.english;
  
  // Get translations for current assessment language (for questions)
  const currentT = translations[language] || translations.english;
  
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
      mt: 4,
      mb: 4,
      p: 3,
      border: '1px solid #e0e0e0',
      borderRadius: 2,
      bgcolor: '#f9f9f9'
    },
    tab: {
      fontWeight: 600,
      fontSize: '1rem'
    },
    demographicSection: {
      mt: 4,
      mb: 4,
      p: 3,
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
  
  // If assessment hasn't started yet, show the start page with tabs for new or existing
  if (assessmentStatus === 'not_started' || !participantId) {
    return (
      <Container maxWidth="md" sx={styles.container}>
        <Paper elevation={3} sx={styles.paper}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <span role="img" aria-label="animal" style={{ fontSize: '2.5rem' }}>🦊</span>
            <Typography variant="h4" component="h1" gutterBottom sx={{ ml: 2, color: '#5783A9', fontWeight: 600 }}>
              {t.welcome}
            </Typography>
          </Box>
          
          <Typography variant="body1" paragraph sx={{ color: '#555', fontSize: '1.1rem' }}>
            {t.intro}
          </Typography>
          
          {/* Tabs for new or continue */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              variant="fullWidth"
              sx={{ mb: 2 }}
            >
              <Tab label={t.newTest} sx={styles.tab} />
              <Tab label={t.continueTest} sx={styles.tab} />
            </Tabs>
          </Box>
          
          {/* New Test Tab */}
          {tabValue === 0 && (
            <>
              {/* Language selection */}
              <Box sx={styles.languageSelector}>
                <FormControl component="fieldset">
                  <FormLabel 
                    component="legend" 
                    sx={{ 
                      color: '#5783A9', 
                      fontWeight: 500,
                      fontSize: '1.1rem', 
                      mb: 2
                    }}
                  >
                    {t.languageLabel}
                  </FormLabel>
                  
                  <RadioGroup
                    value={selectedLanguage}
                    onChange={handleLanguageChange}
                    sx={{
                      display: 'flex',
                      flexDirection: 'row',
                      gap: 4
                    }}
                  >
                    <FormControlLabel 
                      value="english" 
                      control={<Radio sx={{ color: '#5783A9' }} />} 
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <span role="img" aria-label="flag" style={{ marginRight: '8px', fontSize: '1.5rem' }}>🇺🇸</span>
                          <Typography>{t.english}</Typography>
                        </Box>
                      }
                      sx={{ 
                        p: 1, 
                        border: selectedLanguage === 'english' ? '2px solid #9BBDB1' : '2px solid transparent',
                        borderRadius: 2
                      }}
                    />
                    
                    <FormControlLabel 
                      value="chinese" 
                      control={<Radio sx={{ color: '#5783A9' }} />} 
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <span role="img" aria-label="flag" style={{ marginRight: '8px', fontSize: '1.5rem' }}>🇨🇳</span>
                          <Typography>{t.chinese}</Typography>
                        </Box>
                      }
                      sx={{ 
                        p: 1, 
                        border: selectedLanguage === 'chinese' ? '2px solid #9BBDB1' : '2px solid transparent',
                        borderRadius: 2
                      }}
                    />
                  </RadioGroup>
                </FormControl>
              </Box>
              
              {/* NEW: Demographic information section */}
              <Box sx={styles.demographicSection}>
                <Typography 
                  sx={{ 
                    color: '#5783A9', 
                    fontWeight: 500,
                    fontSize: '1.1rem', 
                    mb: 2
                  }}
                >
                  {t.demographicInfo}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" paragraph>
                  {t.demographicHelp}
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item size={6}>
                    <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                      <InputLabel id="age-select-label">{t.ageLabel}</InputLabel>
                      <Select
                        labelId="age-select-label"
                        id="age-select"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        label={t.ageLabel}
                      >
                        <MenuItem value=""><em>Select age</em></MenuItem>
                        {[...Array(100)].map((_, i) => (
                          <MenuItem key={i} value={i+1}>
                            {i+1}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item size={6}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel id="sex-select-label">{t.sexLabel}</InputLabel>
                      <Select
                        labelId="sex-select-label"
                        id="sex-select"
                        value={sex}
                        onChange={(e) => setSex(e.target.value)}
                        label={t.sexLabel}
                      >
                        <MenuItem value=""><em>Select sex</em></MenuItem>
                        <MenuItem value="male">{t.male}</MenuItem>
                        <MenuItem value="female">{t.female}</MenuItem>
                        <MenuItem value="other">{t.other}</MenuItem>
                        <MenuItem value="prefer_not_to_say">{t.preferNotToSay}</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>
              
              {/* Participant ID and start button */}
              <Box component="form" onSubmit={handleStartNew} sx={{ mt: 4, maxWidth: '500px', mx: 'auto' }}>
                <Typography variant="subtitle1" align="left" gutterBottom sx={{ color: '#5783A9' }}>
                  {t.codeLabel}
                </Typography>
                <TextField
                  fullWidth
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
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
            </>
          )}
          
          {/* Continue Test Tab */}
          {tabValue === 1 && (
            <>
              {/* Lookup form */}
              <Box component="form" onSubmit={handleLookupParticipant} sx={{ mb: 4 }}>
                <Typography variant="subtitle1" gutterBottom>
                  {t.existingId}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    value={existingId}
                    onChange={(e) => setExistingId(e.target.value)}
                    variant="outlined"
                    placeholder="e.g. P20220101-001"
                    sx={{ mb: 1 }}
                  />
                  <Button 
                    type="submit" 
                    variant="contained"
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : t.lookup}
                  </Button>
                </Box>
                
                {lookupError && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {lookupError}
                  </Alert>
                )}
              </Box>
              
              {/* Display participant's assessments if found */}
              {lookupMode && participantAssessments.length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {t.yourTests}
                  </Typography>
                  
                  <List>
                    {participantAssessments.map((assessment, index) => (
                      <React.Fragment key={`${assessment.language}-${assessment.testIndex}`}>
                        {index > 0 && <Divider />}
                        <ListItem 
                          sx={{ 
                            py: 2,
                            bgcolor: assessment.status === 'completed' 
                              ? '#f0f7f0' 
                              : assessment.status === 'in_progress' 
                                ? '#f0f7ff' 
                                : 'transparent',
                            '&:hover': { bgcolor: '#f9f9f9' } 
                          }}
                        >
                          <ListItemIcon>
                            {assessment.status === 'completed' ? (
                              <CheckCircleIcon color="success" />
                            ) : assessment.status === 'in_progress' ? (
                              <PlayArrowIcon color="primary" />
                            ) : (
                              <span role="img" aria-label="language" style={{ fontSize: '1.5rem' }}>
                                {assessment.language === 'chinese' ? '🇨🇳' : '🇺🇸'}
                              </span>
                            )}
                          </ListItemIcon>
                          
                          <ListItemText
                            primary={
                              <Typography variant="subtitle1">
                                {assessment.language === 'english' ? 'English' : '中文 (Chinese)'} - {t.testNumber} {assessment.testIndex + 1}
                              </Typography>
                            }
                            secondary={
                              <>
                                <Typography variant="body2" component="span">
                                  {assessment.startedAt ? (
                                    <>
                                      <strong>{t.testStarted}:</strong> {formatDate(assessment.startedAt)}
                                      <br />
                                    </>
                                  ) : null}
                                  <strong>{t.progress}:</strong> {getCompletionStatus(assessment)}
                                  </Typography>
                                </>
                              }
                          />
                          
                          <Button
                            variant="contained"
                            color={assessment.status === 'completed' ? 'success' : 'primary'}
                            onClick={() => handleContinueAssessment(assessment)}
                            sx={{ ml: 2 }}
                          >
                            {assessment.status === 'completed' 
                              ? t.startNewIn 
                              : t.continueThis}
                          </Button>
                        </ListItem>
                      </React.Fragment>
                    ))}
                  </List>
                  
                  {/* Start new test in another language */}
                  <Box sx={{ mt: 4, p: 3, bgcolor: '#f9f9f9', borderRadius: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      {t.startNewIn}:
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                      {/* English test option - show even if in progress, will create a new test index */}
                      <Button
                        variant="outlined"
                        startIcon={<span role="img" aria-label="flag" style={{ fontSize: '1.2rem' }}>🇺🇸</span>}
                        onClick={() => handleStartNewLanguage('english')}
                      >
                        English
                      </Button>
                      
                      {/* Chinese test option - show even if in progress */}
                      <Button
                        variant="outlined"
                        startIcon={<span role="img" aria-label="flag" style={{ fontSize: '1.2rem' }}>🇨🇳</span>}
                        onClick={() => handleStartNewLanguage('chinese')}
                      >
                        中文 (Chinese)
                      </Button>
                    </Box>
                  </Box>
                </Box>
              )}
              
              {lookupMode && participantAssessments.length === 0 && !lookupError && (
                <Alert severity="info">
                  {t.noTests}
                </Alert>
              )}
            </>
          )}
        </Paper>
      </Container>
    );
  }
  
  // Determine animal emoji based on phase
  const animalEmoji = currentQuestion?.audioType === 'instruction' ? '🦊' : 
                     currentQuestion?.audioType === 'practice' ? '🐰' : '🐢';
  // Get phase-specific question count
  const phaseInfo = getPhaseInfo();      

  // Determine button text based on phase
  const nextButtonText = currentQuestionIndex === totalQuestions - 1 
                        ? currentT.finish
                        : currentQuestion?.audioType === 'instruction' 
                          ? currentT.letsPractice
                          : currentQuestion?.audioType === 'practice' && testQuestions.length > 0 && phaseInfo.index === phaseInfo.count
                            ? currentT.startActivities
                            : currentT.next;
  
  // Determine the active step for the stepper
  const activeStep = currentQuestion?.audioType === 'instruction' ? 0 : 
                     currentQuestion?.audioType === 'practice' ? 1 : 2;

  // Determine if recording is required for the current question
  const recordingRequired = currentQuestion?.requiresRecording !== false;
  
  // If assessment is in progress and we have a current question
  return (
    <Container maxWidth="md" sx={styles.container}>
      <Paper elevation={3} sx={styles.paper}>
        {/* Header with language indicator, animal emoji and participant code */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <span role="img" aria-label="animal" style={{ fontSize: '2rem' }}>
              {animalEmoji}
            </span>
            <Typography 
              variant="body2" 
              sx={{ ml: 2, color: '#666' }}
            >
              {currentT.code} {participantId}
            </Typography>
          </Box>
          
          {/* Language and test number indicator */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            px: 2,
            py: 0.5,
            borderRadius: 4,
            bgcolor: '#f0f7ff'
          }}>
            <span role="img" aria-label="flag" style={{ marginRight: '4px' }}>
              {language === 'chinese' ? '🇨🇳' : '🇺🇸'}
            </span>
            <Typography variant="body2" sx={{ color: '#5783A9', fontWeight: 500 }}>
              {language === 'chinese' ? '中文' : 'English'} - {t.testNumber} {testIndex + 1}
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
              {phaseInfo.index} {currentT.of} {phaseInfo.count}
            </Typography>
          )}
        </Box>
        
        {/* Progress Stepper */}
        <Box sx={{ mb: 4 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            <Step>
              <StepLabel sx={styles.stepLabel}>{currentT.listen}</StepLabel>
            </Step>
            <Step>
              <StepLabel sx={styles.stepLabel}>{currentT.practice}</StepLabel>
            </Step>
            <Step>
              <StepLabel sx={styles.stepLabel}>{currentT.answer}</StepLabel>
            </Step>
          </Stepper>
        </Box>
        
        {/* Overall progress bar */}
        <Box sx={{ width: '100%', mb: 4 }}>
          <Typography variant='body2' mb={1}>
          {t.progress + ' ' + Math.round(getProgress()) + ' %'}
          </Typography>
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
                {currentT.listenCarefully}
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
                testIndex={testIndex}
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