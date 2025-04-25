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
  IconButton
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import DownloadIcon from '@mui/icons-material/Download';
import { fetchAllParticipants, getRecordingsByParticipant } from '../../utils/api';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [participantRecordings, setParticipantRecordings] = useState([]);
  const [loadingRecordings, setLoadingRecordings] = useState(false);
  const [recordingError, setRecordingError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [audioElement, setAudioElement] = useState(null);
  
  const navigate = useNavigate();
  
  // Create and manage a single audio element
  useEffect(() => {
    const audio = new Audio();
    
    audio.addEventListener('ended', () => {
      setPlayingAudio(null);
    });
    
    setAudioElement(audio);
    
    return () => {
      audio.pause();
      audio.src = '';
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
  
  // Load recordings for a participant when selected
  const handleViewParticipant = async (participant) => {
    setSelectedParticipant(participant);
    setTabValue(1); // Switch to participant tab
    
    try {
      setLoadingRecordings(true);
      setRecordingError(null);
      
      const recordings = await getRecordingsByParticipant(participant.participantId);
      
      // Group recordings by question type
      const groupedRecordings = recordings.reduce((acc, recording) => {
        const category = recording.questionId?.category || 'unknown';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(recording);
        return acc;
      }, {});
      
      setParticipantRecordings(groupedRecordings);
    } catch (err) {
      console.error('Error loading recordings:', err);
      setRecordingError('Failed to load participant recordings.');
    } finally {
      setLoadingRecordings(false);
    }
  };
  
  // Handle audio playback
  const handlePlayRecording = (recording) => {
    if (playingAudio === recording._id) {
      // If this recording is currently playing, pause it
      audioElement.pause();
      setPlayingAudio(null);
    } else {
      // If another recording is playing, stop it first
      if (audioElement.src) {
        audioElement.pause();
      }
      
      // Play the new recording
      audioElement.src = recording.audioUrl;
      audioElement.play().catch(error => {
        console.error('Error playing audio:', error);
        // Handle the error (e.g., show a notification)
      });
      
      setPlayingAudio(recording._id);
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
  
  // Calculate completion status
  const getCompletionStatus = (participant) => {
    if (!participant.assessment) return 'Not Started';
    
    switch (participant.assessment.status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      default:
        return 'Not Started';
    }
  };
  
  // Get color for status chip
  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'In Progress':
        return 'warning';
      default:
        return 'default';
    }
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
                  p.assessment && p.assessment.status === 'completed'
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
                  p.assessment && p.assessment.status === 'in_progress'
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
                  <TableCell>Gender</TableCell>
                  <TableCell>Language</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Started</TableCell>
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
                      <TableCell>{participant.gender || 'N/A'}</TableCell>
                      <TableCell>{participant.language || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={getCompletionStatus(participant)} 
                          color={getStatusColor(getCompletionStatus(participant))}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {participant.assessment && participant.assessment.startedAt 
                          ? formatDate(participant.assessment.startedAt) 
                          : 'N/A'}
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
                <Typography variant="subtitle2">Status</Typography>
                <Chip 
                  label={getCompletionStatus(selectedParticipant)} 
                  color={getStatusColor(getCompletionStatus(selectedParticipant))}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2">Age</Typography>
                <Typography variant="body1">
                  {selectedParticipant.age || 'Not provided'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2">Gender</Typography>
                <Typography variant="body1">
                  {selectedParticipant.gender || 'Not provided'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2">Language</Typography>
                <Typography variant="body1">
                  {selectedParticipant.language || 'Not provided'}
                </Typography>
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
            ) : (
              <>
                {/* Instruction recordings */}
                {participantRecordings.instruction && (
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
                            {participantRecordings.instruction.map(recording => (
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
                                  >
                                    {playingAudio === recording._id ? <PauseIcon /> : <PlayArrowIcon />}
                                  </IconButton>
                                  <IconButton 
                                    component="a" 
                                    href={recording.audioUrl} 
                                    download
                                    target="_blank"
                                  >
                                    <DownloadIcon />
                                  </IconButton>
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
                {participantRecordings.practice && (
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
                            {participantRecordings.practice.map(recording => (
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
                                  >
                                    {playingAudio === recording._id ? <PauseIcon /> : <PlayArrowIcon />}
                                  </IconButton>
                                  <IconButton 
                                    component="a" 
                                    href={recording.audioUrl} 
                                    download
                                    target="_blank"
                                  >
                                    <DownloadIcon />
                                  </IconButton>
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
                {participantRecordings.test && (
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
                            {participantRecordings.test.map(recording => (
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
                                  >
                                    {playingAudio === recording._id ? <PauseIcon /> : <PlayArrowIcon />}
                                  </IconButton>
                                  <IconButton 
                                    component="a" 
                                    href={recording.audioUrl} 
                                    download
                                    target="_blank"
                                  >
                                    <DownloadIcon />
                                  </IconButton>
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
                {participantRecordings.unknown && (
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
                            {participantRecordings.unknown.map(recording => (
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
                                  >
                                    {playingAudio === recording._id ? <PauseIcon /> : <PlayArrowIcon />}
                                  </IconButton>
                                  <IconButton 
                                    component="a" 
                                    href={recording.audioUrl} 
                                    download
                                    target="_blank"
                                  >
                                    <DownloadIcon />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </AccordionDetails>
                  </Accordion>
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