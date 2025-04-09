// src/components/AudioPlayer.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Box, Button, LinearProgress, CircularProgress, Typography } from '@mui/material';

const AudioPlayer = ({ audioUrl, onPlayComplete }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const audioRef = useRef(null);
  const progressIntervalRef = useRef(null);
  
  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      
      const handleLoadedMetadata = () => {
        setDuration(audio.duration);
        setIsLoading(false);
      };
      
      const handleError = () => {
        setError('Error loading audio file');
        setIsLoading(false);
      };
      
      const handleEnded = () => {
        setIsPlaying(false);
        setProgress(100);
        clearInterval(progressIntervalRef.current);
        if (onPlayComplete) onPlayComplete();
      };
      
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('error', handleError);
      audio.addEventListener('ended', handleEnded);
      
      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('error', handleError);
        audio.removeEventListener('ended', handleEnded);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      };
    }
  }, [onPlayComplete]);
  
  useEffect(() => {
    // Reset state when audio URL changes
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setError('');
    setIsLoading(true);
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  }, [audioUrl]);
  
  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      
      // Update progress
      progressIntervalRef.current = setInterval(() => {
        const audio = audioRef.current;
        if (audio) {
          const progressValue = (audio.currentTime / audio.duration) * 100;
          setProgress(progressValue);
          setCurrentTime(audio.currentTime);
        }
      }, 100);
    }
  };
  
  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      clearInterval(progressIntervalRef.current);
    }
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <Box className="audio-player" sx={{ mb: 3 }}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      <Typography variant="h6" gutterBottom>
        Listen to the question
      </Typography>
      
      {isLoading && !error ? (
        <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
          <CircularProgress size={24} sx={{ mr: 2 }} />
          <Typography>Loading audio...</Typography>
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={isPlaying ? pauseAudio : playAudio}
              startIcon={isPlaying ? <span>⏸</span> : <span>▶</span>}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            
            <Box sx={{ ml: 2 }}>
              <Typography variant="body2">
                {formatTime(currentTime)} / {formatTime(duration)}
              </Typography>
            </Box>
          </Box>
          
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 8, borderRadius: 4 }} 
          />
        </>
      )}
    </Box>
  );
};

export default AudioPlayer;