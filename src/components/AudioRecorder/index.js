// src/components/AudioRecorder.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Button, CircularProgress, Box, Typography, LinearProgress } from '@mui/material';
import { uploadRecording } from '../../utils/api';
import { useAssessment } from '../../contexts/AccessmentContext';

const AudioRecorder = ({ questionId, onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  
  const { participantId, addRecording } = useAssessment();
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  
  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
    };
  }, [audioURL]);
  
  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      setAudioBlob(null);
      setAudioURL('');
      setUploadError('');
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioURL(url);
      };
      
      // Start the timer
      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds++;
        setRecordingTime(seconds);
      }, 1000);
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setUploadError('Microphone access denied. Please check your browser permissions.');
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Release microphone
      const tracks = mediaRecorderRef.current.stream.getTracks();
      tracks.forEach(track => track.stop());
    }
  };
  
  const handleUpload = async () => {
    if (!audioBlob) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError('');
    
    try {
      // Create a mock progress indicator
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 10;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 200);
      
      const response = await uploadRecording({
        questionId,
        participantId,
        audioBlob,
        duration: recordingTime * 1000 // Convert to milliseconds
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Add recording to context
      addRecording({
        questionId,
        audioUrl: response.recording.audioUrl,
        timestamp: new Date()
      });
      
      // Wait a moment to show 100% completion
      setTimeout(() => {
        setIsUploading(false);
        onRecordingComplete(response.recording);
      }, 500);
      
    } catch (error) {
      setUploadError(`Upload failed: ${error.message || 'Unknown error'}`);
      setIsUploading(false);
    }
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <Box className="audio-recorder" sx={{ mt: 3, p: 2, border: '1px solid #eee', borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        {!audioBlob ? 'Record your answer' : 'Review your recording'}
      </Typography>
      
      {!audioBlob ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {isRecording ? (
            <>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                mb: 2 
              }}>
                <Typography variant="h4" color="error" sx={{ mr: 1 }}>●</Typography>
                <Typography variant="body1">{formatTime(recordingTime)}</Typography>
              </Box>
              <Button 
                variant="contained" 
                color="error" 
                onClick={stopRecording}
              >
                Stop Recording
              </Button>
            </>
          ) : (
            <Button 
              variant="contained" 
              color="primary" 
              onClick={startRecording}
            >
              Start Recording
            </Button>
          )}
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <audio src={audioURL} controls />
          
          <Box sx={{ display: 'flex', mt: 2, gap: 2 }}>
            <Button 
              variant="outlined" 
              color="error" 
              onClick={() => {
                setAudioBlob(null);
                setAudioURL('');
              }}
            >
              Discard
            </Button>
            
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Save & Continue'}
            </Button>
          </Box>
          
          {isUploading && (
            <Box sx={{ width: '100%', mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: '100%', mr: 1 }}>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                </Box>
                <Typography variant="body2">{Math.round(uploadProgress)}%</Typography>
              </Box>
            </Box>
          )}
          
          {uploadError && (
            <Typography color="error" sx={{ mt: 2 }}>
              {uploadError}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default AudioRecorder;