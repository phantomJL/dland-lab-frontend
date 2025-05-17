// src/pages/Dashboard/index.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Table, 
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  ButtonGroup
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import DownloadIcon from '@mui/icons-material/Download';
import LanguageIcon from '@mui/icons-material/Language';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { fetchAllParticipants, getRecordingsByParticipant } from '../../utils/api';
import { getTranslation } from '../../utils/translationService';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [participantRecordings, setParticipantRecordings] = useState({});
  const [loadingRecordings, setLoadingRecordings] = useState(false);
  const [recordingError, setRecordingError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [audioElement, setAudioElement] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  
  const navigate = useNavigate();
  
  // Create and manage a single audio element
  useEffect(() => {
    const audio = new Audio();
    
    audio.addEventListener('ended', () => {
      setPlayingAudio(null);
    });
    
    audio.addEventListener('error', (e) => {
      console.error('Audio playback error:', e);
      setPlayingAudio(null);
    });
    
    setAudioElement(audio);
    
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, []);
  
  // Load all participants on component mount
  useEffect(() => {
    const loadParticipants = async () => {
      try {
        setLoading(true);
        const data = await fetchAllParticipants();
        setParticipants(data);
        setError(null);
      } catch (err) {
        console.error('Error loading participants:', err);
        setError('Failed to load participants. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadParticipants();
  }, []);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Helper function to group recordings by test (language + testIndex)
  const groupRecordingsByTest = (recordings) => {
    return recordings.reduce((acc, recording) => {
      // Create a unique key for each test
      const testKey = `${recording.language || 'english'}_${recording.testIndex || 0}`;
      
      if (!acc[testKey]) {
        acc[testKey] = {
          language: recording.language || 'english',
          testIndex: recording.testIndex || 0,
          recordings: []
        };
      }
      
      acc[testKey].recordings.push(recording);
      return acc;
    }, {});
  };
  
  // In the handleViewParticipant function in Dashboard/index.js
  const handleViewParticipant = async (participant) => {
    setSelectedParticipant(participant);
    setTabValue(1); // Switch to participant tab
    setSelectedTest(null); // Reset selected test
    
    try {
      setLoadingRecordings(true);
      setRecordingError(null);
      
      const recordings = await getRecordingsByParticipant(participant.participantId);
      
      console.log('Recordings received:', recordings);
      
      if (!recordings || recordings.length === 0) {
        console.log('No recordings found for participant:', participant.participantId);
        setRecordingError("No recordings found for this participant.");
        setParticipantRecordings({});
        setLoadingRecordings(false);
        return;
      }
      
      // Group recordings by test first
      const groupedByTest = groupRecordingsByTest(recordings);
      console.log('Grouped by test:', groupedByTest);
      
      // For each test, group recordings by question type
      Object.keys(groupedByTest).forEach(testKey => {
        const testRecordings = groupedByTest[testKey].recordings;
        
        // Group by question category within each test
        groupedByTest[testKey].categories = testRecordings.reduce((acc, recording) => {
          // Check for various possible category field names
          let category = 'unknown';
          
          if (recording.questionId) {
            if (typeof recording.questionId === 'string') {
              // If questionId is just a string ID, default to 'unknown'
              category = 'unknown';
            } else {
              // Try various possible field names for category
              category = recording.questionId.category || 
                        recording.questionId.audioType || 
                        recording.questionType ||
                        recording.category ||
                        'unknown';
            }
          } else if (recording.category) {
            category = recording.category;
          } else if (recording.audioType) {
            category = recording.audioType;
          }
          
          console.log(`Recording ${recording._id} categorized as: ${category}`);
          
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(recording);
          return acc;
        }, {});
      });
      
      console.log('Final categorized recordings:', groupedByTest);
      
      setParticipantRecordings(groupedByTest);
      
      // Select the first test by default if there are any
      if (Object.keys(groupedByTest).length > 0) {
        setSelectedTest(Object.keys(groupedByTest)[0]);
      }
    } catch (err) {
      console.error('Error loading recordings:', err);
      setRecordingError('Failed to load participant recordings: ' + 
        (err.response?.data?.message || err.message || 'Unknown error'));
    } finally {
      setLoadingRecordings(false);
    }
  };
  
  // Handle audio playback
  const handlePlayRecording = (recording) => {
    if (playingAudio === recording._id) {
      // If this recording is currently playing, pause it
      if (audioElement) {
        audioElement.pause();
        setPlayingAudio(null);
      }
    } else {
      // If any audio is playing, stop it first
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
      
      // Play the new recording
      if (audioElement && recording.audioUrl) {
        audioElement.src = recording.audioUrl;
        
        // Handle playback errors
        const playPromise = audioElement.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            setPlayingAudio(recording._id);
          }).catch(error => {
            console.error('Error playing audio:', error);
            setPlayingAudio(null);
            // Optionally show a notification to the user
          });
        }
      }
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Format sex values for display
  const formatSex = (sex) => {
    if (!sex) return 'Not provided';
    
    const sexMapping = {
      'male': 'Male',
      'female': 'Female',
      'other': 'Other',
      'prefer_not_to_say': 'Prefer not to say'
    };
    
    return sexMapping[sex] || sex;
  };
  
  // Get latest completion status for a participant with multiple tests
  const getLatestCompletionStatus = (participant) => {
    if (!participant.tests || participant.tests.length === 0) {
      return 'Not Started';
    }
    
    // Check if any tests are in progress
    const hasInProgress = participant.tests.some(test => test.status === 'in_progress');
    if (hasInProgress) return 'In Progress';
    
    // Check if all tests are completed
    const allCompleted = participant.tests.every(test => test.status === 'completed');
    if (allCompleted) return 'Completed';
    
    return 'Mixed';
  };
  
  // Get the earliest start date from all tests
  const getFirstStartedDate = (participant) => {
    if (!participant.tests || participant.tests.length === 0) {
      return null;
    }
    
    // Find the earliest startedAt date from all tests
    const startDates = participant.tests
      .filter(test => test.startedAt)
      .map(test => new Date(test.startedAt).getTime());
    
    if (startDates.length === 0) return null;
    
    const earliestDate = new Date(Math.min(...startDates));
    return formatDate(earliestDate.toISOString());
  };
  
  // Get color for status chip
  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'In Progress':
        return 'warning';
      case 'Mixed':
        return 'info';
      default:
        return 'default';
    }
  };
  
  // Calculate accurate test progress
  const calculateTestProgress = (test) => {
    if (!test || !test.recordings) return 0;
    
    // Find the test in participant data for accurate question count
    const participantTest = selectedParticipant?.tests?.find(
      t => t.language === test.language && t.testIndex === test.testIndex
    );
    
    // Get completion percentage from participant data if available
    if (participantTest && participantTest.completionPercentage !== undefined) {
      return participantTest.completionPercentage;
    }
    
    // Estimate based on recording count and expected question count
    // Typically 6 questions (1 instruction, 2 practice, 3 test)
    const expectedQuestionCount = participantTest?.totalQuestions || 6;
    const recordingCount = test.recordings.length;
    
    // Filter out instruction recordings which aren't required
    const nonInstructionRecordings = test.recordings.filter(rec => 
      rec.questionId?.category !== 'instruction' && 
      rec.questionId?.audioType !== 'instruction'
    );
    
    // Calculate progress based on required recordings only
    return Math.round((nonInstructionRecordings.length / (expectedQuestionCount - 1)) * 100);
  };
  
  // Dashboard overview tab
  const renderOverviewTab = () => (
    <Box sx={{ mt: 3 }}>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Participants
              </Typography>
              <Typography variant="h3">
                {participants.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Completed Assessments
              </Typography>
              <Typography variant="h3">
                {participants.filter(p => 
                  getLatestCompletionStatus(p) === 'Completed'
                ).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                In Progress
              </Typography>
              <Typography variant="h3">
                {participants.filter(p => 
                  getLatestCompletionStatus(p) === 'In Progress'
                ).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          All Participants
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Age</TableCell>
                  <TableCell>Sex</TableCell>
                  <TableCell>Tests</TableCell>
                  <TableCell>Latest Status</TableCell>
                  <TableCell>First Started</TableCell>
                  <TableCell>Recordings</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {participants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No participants found
                    </TableCell>
                  </TableRow>
                ) : (
                  participants.map((participant) => (
                    <TableRow key={participant.participantId}>
                      <TableCell>{participant.participantId}</TableCell>
                      <TableCell>{participant.age || 'N/A'}</TableCell>
                      <TableCell>{formatSex(participant.sex) || 'N/A'}</TableCell>
                      <TableCell>
                        {participant.tests ? (
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {participant.tests.map(test => (
                              <Chip 
                                key={`${test.language}-${test.testIndex}`}
                                size="small"
                                label={`${test.language === 'chinese' ? '🇨🇳' : '🇺🇸'} #${test.testIndex + 1}`}
                                sx={{ mr: 0.5 }}
                              />
                            ))}
                          </Box>
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getLatestCompletionStatus(participant)} 
                          color={getStatusColor(getLatestCompletionStatus(participant))}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {getFirstStartedDate(participant) || 'N/A'}
                      </TableCell>
                      <TableCell>{participant.recordingCount || 0}</TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleViewParticipant(participant)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
  
  // Participant details tab
  const renderParticipantTab = () => (
    <Box sx={{ mt: 3 }}>
      {!selectedParticipant ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography>
            Select a participant from the overview tab to view their details.
          </Typography>
        </Paper>
      ) : (
        <>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Participant Details
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">ID</Typography>
                <Typography variant="body1" paragraph>
                  {selectedParticipant.participantId}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Latest Status</Typography>
                <Chip 
                  label={getLatestCompletionStatus(selectedParticipant)} 
                  color={getStatusColor(getLatestCompletionStatus(selectedParticipant))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Age</Typography>
                <Typography variant="body1">
                  {selectedParticipant.age || 'Not provided'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Sex</Typography>
                <Typography variant="body1">
                  {formatSex(selectedParticipant.sex) || 'Not provided'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>Language Tests</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedParticipant.tests && selectedParticipant.tests.length > 0 ? (
                    selectedParticipant.tests.map(test => (
                      <Chip 
                        key={`${test.language}-${test.testIndex}`}
                        label={`${test.language === 'chinese' ? '中文' : 'English'} - Test #${test.testIndex + 1}`}
                        icon={test.language === 'chinese' ? <span>🇨🇳</span> : <span>🇺🇸</span>}
                        variant={test.status === 'completed' ? 'default' : 'outlined'}
                        color={test.status === 'completed' ? 'success' : 'primary'}
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No language tests taken yet
                    </Typography>
                  )}
                </Box>
              </Grid>
              {selectedParticipant.notes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Notes</Typography>
                  <Typography variant="body1">
                    {selectedParticipant.notes}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
          
          {/* Test selector */}
          {Object.keys(participantRecordings).length > 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Tests
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  {Object.keys(participantRecordings).map(testKey => {
                    const test = participantRecordings[testKey];
                    const progressPercentage = calculateTestProgress(test);
                    
                    // Find the matching test from participant data
                    const participantTest = selectedParticipant?.tests?.find(
                      t => t.language === test.language && t.testIndex === test.testIndex
                    );
                    
                    // Use status from participant data if available
                    const testStatus = participantTest ? participantTest.status : 
                                     (progressPercentage === 100 ? 'completed' : 'in_progress');
                    
                    return (
                      <Button 
                        key={testKey}
                        variant={selectedTest === testKey ? "contained" : "outlined"}
                        onClick={() => setSelectedTest(testKey)}
                        startIcon={
                          <span role="img" aria-label="language">
                            {test.language === 'chinese' ? '🇨🇳' : '🇺🇸'}
                          </span>
                        }
                        sx={{ 
                          minWidth: '200px',
                          justifyContent: 'flex-start',
                          borderColor: selectedTest === testKey ? 'primary.main' : '#e0e0e0',
                          backgroundColor: selectedTest === testKey ? 'primary.main' : 
                            testStatus === 'completed' ? '#e8f5e9' : 
                            progressPercentage > 0 ? '#fff8e1' : 'transparent'
                        }}
                      >
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                          <Typography variant="body2">
                            {test.language === 'chinese' ? '中文 (Chinese)' : 'English'} - Test #{test.testIndex + 1}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Progress: {progressPercentage}% {testStatus === 'completed' ? '(Completed)' : ''}
                          </Typography>
                        </Box>
                      </Button>
                    );
                  })}
                </Box>
              </Box>
            </Paper>
          )}
          
          {/* Recordings for selected test */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recordings
            </Typography>
            
            {loadingRecordings ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : recordingError ? (
              <Typography color="error">{recordingError}</Typography>
            ) : Object.keys(participantRecordings).length === 0 ? (
              <Typography>
                No recordings found for this participant.
              </Typography>
            ) : !selectedTest ? (
              <Typography>
                Select a test to view recordings.
              </Typography>
            ) : (
              <>
                {/* Display recordings for the selected test, grouped by category */}
                {participantRecordings[selectedTest] && (
                  <Box>
                    <Typography variant="subtitle1" sx={{ mb: 2 }}>
                      {participantRecordings[selectedTest].language === 'chinese' ? '中文 (Chinese)' : 'English'} - 
                      Test #{participantRecordings[selectedTest].testIndex + 1}
                    </Typography>
                    
                    {/* Instruction recordings - Only show if they exist */}
                    {participantRecordings[selectedTest].categories && 
                     participantRecordings[selectedTest].categories.instruction && 
                     participantRecordings[selectedTest].categories.instruction.length > 0 && (
                      <Accordion defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography variant="subtitle1">Instructions</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Question</TableCell>
                                  <TableCell>Recorded</TableCell>
                                  <TableCell>Duration</TableCell>
                                  <TableCell>Actions</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {participantRecordings[selectedTest].categories.instruction.map(recording => (
                                  <TableRow key={recording._id}>
                                    <TableCell>
                                      {recording.questionId?.text || 'Unknown Question'}
                                    </TableCell>
                                    <TableCell>{formatDate(recording.createdAt)}</TableCell>
                                    <TableCell>
                                      {recording.durationMs 
                                        ? `${Math.round(recording.durationMs / 1000)}s` 
                                        : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                      <IconButton 
                                        onClick={() => handlePlayRecording(recording)}
                                        color={playingAudio === recording._id ? "primary" : "default"}
                                        disabled={!recording.audioUrl}
                                      >
                                        {playingAudio === recording._id ? <PauseIcon /> : <PlayArrowIcon />}
                                      </IconButton>
                                      {recording.audioUrl && (
                                        <IconButton 
                                          component="a" 
                                          href={recording.audioUrl} 
                                          download
                                          target="_blank"
                                        >
                                          <DownloadIcon />
                                        </IconButton>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </AccordionDetails>
                      </Accordion>
                    )}
                    
                    {/* Practice recordings */}
                    {participantRecordings[selectedTest].categories && 
                     participantRecordings[selectedTest].categories.practice && 
                     participantRecordings[selectedTest].categories.practice.length > 0 && (
                      <Accordion defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography variant="subtitle1">Practice Questions</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Question</TableCell>
                                  <TableCell>Recorded</TableCell>
                                  <TableCell>Duration</TableCell>
                                  <TableCell>Actions</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {participantRecordings[selectedTest].categories.practice.map(recording => (
                                  <TableRow key={recording._id}>
                                    <TableCell>
                                      {recording.questionId?.text || 'Unknown Question'}
                                    </TableCell>
                                    <TableCell>{formatDate(recording.createdAt)}</TableCell>
                                    <TableCell>
                                      {recording.durationMs 
                                        ? `${Math.round(recording.durationMs / 1000)}s` 
                                        : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                      <IconButton 
                                        onClick={() => handlePlayRecording(recording)}
                                        color={playingAudio === recording._id ? "primary" : "default"}
                                        disabled={!recording.audioUrl}
                                      >
                                        {playingAudio === recording._id ? <PauseIcon /> : <PlayArrowIcon />}
                                      </IconButton>
                                      {recording.audioUrl && (
                                        <IconButton 
                                          component="a" 
                                          href={recording.audioUrl} 
                                          download
                                          target="_blank"
                                        >
                                          <DownloadIcon />
                                        </IconButton>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </AccordionDetails>
                      </Accordion>
                    )}
                    
                    {/* Test recordings */}
                    {participantRecordings[selectedTest].categories && 
                     participantRecordings[selectedTest].categories.test && 
                     participantRecordings[selectedTest].categories.test.length > 0 && (
                      <Accordion defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography variant="subtitle1">Assessment Questions</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Question</TableCell>
                                  <TableCell>Recorded</TableCell>
                                  <TableCell>Duration</TableCell>
                                  <TableCell>Actions</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {participantRecordings[selectedTest].categories.test.map(recording => (
                                  <TableRow key={recording._id}>
                                    <TableCell>
                                      {recording.questionId?.text || 'Unknown Question'}
                                    </TableCell>
                                    <TableCell>{formatDate(recording.createdAt)}</TableCell>
                                    <TableCell>
                                      {recording.durationMs 
                                        ? `${Math.round(recording.durationMs / 1000)}s` 
                                        : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                      <IconButton 
                                        onClick={() => handlePlayRecording(recording)}
                                        color={playingAudio === recording._id ? "primary" : "default"}
                                        disabled={!recording.audioUrl}
                                      >
                                        {playingAudio === recording._id ? <PauseIcon /> : <PlayArrowIcon />}
                                      </IconButton>
                                      {recording.audioUrl && (
                                        <IconButton 
                                          component="a" 
                                          href={recording.audioUrl} 
                                          download
                                          target="_blank"
                                        >
                                          <DownloadIcon />
                                        </IconButton>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </AccordionDetails>
                      </Accordion>
                    )}
                    
                    {/* Unknown type recordings (fallback) */}
                    {participantRecordings[selectedTest].categories && 
                     participantRecordings[selectedTest].categories.unknown && 
                     participantRecordings[selectedTest].categories.unknown.length > 0 && (
                      <Accordion defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography variant="subtitle1">Other Recordings</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Recording ID</TableCell>
                                  <TableCell>Recorded</TableCell>
                                  <TableCell>Duration</TableCell>
                                  <TableCell>Actions</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {participantRecordings[selectedTest].categories.unknown.map(recording => (
                                  <TableRow key={recording._id}>
                                    <TableCell>{recording._id}</TableCell>
                                    <TableCell>{formatDate(recording.createdAt)}</TableCell>
                                    <TableCell>
                                      {recording.durationMs 
                                        ? `${Math.round(recording.durationMs / 1000)}s` 
                                        : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                      <IconButton 
                                        onClick={() => handlePlayRecording(recording)}
                                        color={playingAudio === recording._id ? "primary" : "default"}
                                        disabled={!recording.audioUrl}
                                      >
                                        {playingAudio === recording._id ? <PauseIcon /> : <PlayArrowIcon />}
                                      </IconButton>
                                      {recording.audioUrl && (
                                        <IconButton 
                                          component="a" 
                                          href={recording.audioUrl} 
                                          download
                                          target="_blank"
                                        >
                                          <DownloadIcon />
                                        </IconButton>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </AccordionDetails>
                      </Accordion>
                    )}
                  </Box>
                )}
              </>
            )}
          </Paper>
        </>
      )}
    </Box>
  );
  
  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Overview" />
          <Tab label="Participant Details" />
        </Tabs>
      </Box>
      
      {tabValue === 0 && renderOverviewTab()}
      {tabValue === 1 && renderParticipantTab()}
    </Container>
  );
};

export default Dashboard;