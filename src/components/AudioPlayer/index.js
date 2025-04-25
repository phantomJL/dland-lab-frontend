// src/components/AudioPlayer/index.js
import React, { useState, useRef, useEffect } from 'react';
import { Box, Button, LinearProgress, CircularProgress, Typography } from '@mui/material';

const AudioPlayer = ({ audioUrl, onPlayComplete, autoPlay = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasPlayed, setHasPlayed] = useState(false);
  
  const audioRef = useRef(null);
  const progressIntervalRef = useRef(null);
  
  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      
      const handleLoadedMetadata = () => {
        setDuration(audio.duration);
        setIsLoading(false);
        
        // Auto-play if enabled
        if (autoPlay && !hasPlayed) {
          playAudio();
        }
      };
      
      const handleError = (e) => {
        console.error('Audio error:', e);
        setError('Error loading audio file. Please try refreshing the page.');
        setIsLoading(false);
      };
      
      const handleEnded = () => {
        setIsPlaying(false);
        setProgress(100);
        clearInterval(progressIntervalRef.current);
        setHasPlayed(true);
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
  }, [autoPlay, hasPlayed, onPlayComplete]);
  
  useEffect(() => {
    // Reset state when audio URL changes
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setError('');
    setIsLoading(true);
    setHasPlayed(false);
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  }, [audioUrl]);
  
  const playAudio = () => {
    if (audioRef.current) {
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
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
          })
          .catch(error => {
            console.error('Error playing audio:', error);
            setError('Could not play audio. Please check your browser permissions.');
          });
      }
    }
  };
  
  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      clearInterval(progressIntervalRef.current);
    }
  };
  
  const restartAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      setProgress(0);
      playAudio();
    }
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle seeking in the progress bar
  const handleProgressClick = (e) => {
    if (audioRef.current && !isLoading) {
      const progressBar = e.currentTarget;
      const rect = progressBar.getBoundingClientRect();
      const clickPosition = (e.clientX - rect.left) / rect.width;
      
      // Set new time
      const newTime = clickPosition * audioRef.current.duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      setProgress(clickPosition * 100);
    }
  };
  
  return (
    <Box className="audio-player" sx={{ mb: 3 }}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {isLoading && !error ? (
        <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
          <CircularProgress size={24} sx={{ mr: 2 }} />
          <Typography>Loading audio...</Typography>
        </Box>
      ) : error ? (
        <Box>
          <Typography color="error" sx={{ mb: 1 }}>{error}</Typography>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={() => {
              setError('');
              setIsLoading(true);
              // Try to reload the audio
              if (audioRef.current) {
                audioRef.current.load();
              }
            }}
          >
            Try Again
          </Button>
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={isPlaying ? pauseAudio : playAudio}
              startIcon={isPlaying ? <span>⏸</span> : <span>▶</span>}
              sx={{ mr: 1 }}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            
            {/* Only show restart button if we're not at the beginning */}
            {currentTime > 1 && (
              <Button 
                variant="outlined"
                onClick={restartAudio}
                startIcon={<span>↺</span>}
                sx={{ mr: 1 }}
              >
                Restart
              </Button>
            )}
            
            <Box sx={{ ml: 2 }}>
              <Typography variant="body2">
                {formatTime(currentTime)} / {formatTime(duration)}
              </Typography>
            </Box>
          </Box>
          
          <Box 
            sx={{ 
              width: '100%', 
              height: 16, 
              cursor: 'pointer', 
              bgcolor: '#e0e0e0', 
              borderRadius: 4,
              overflow: 'hidden'
            }}
            onClick={handleProgressClick}
          >
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ height: '100%', borderRadius: 4 }} 
            />
          </Box>
        </>
      )}
    </Box>
  );
};

export default AudioPlayer;