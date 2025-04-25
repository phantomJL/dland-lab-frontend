// src/utils/api.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL
});

// Fetch all questions from the backend
export const fetchQuestions = async () => {
  try {
    const response = await api.get('/questions');
    return response.data;
  } catch (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }
};

// Upload a recording to the backend
export const uploadRecording = async ({ questionId, participantId, audioBlob, duration }) => {
  try {
    const formData = new FormData();
    formData.append('recording', audioBlob, `recording_${Date.now()}.wav`);
    formData.append('questionId', questionId);
    formData.append('participantId', participantId);
    formData.append('duration', duration || 0);
    
    const response = await api.post('/recordings', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error uploading recording:', error);
    throw error;
  }
};

// Get assessment status for a participant
export const getAssessmentStatus = async (participantId) => {
  try {
    const response = await api.get(`/assessments/status/${participantId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching assessment status:', error);
    throw error;
  }
};

// Update assessment status
export const updateAssessmentStatus = async (participantId, status, lastQuestionIndex) => {
  try {
    const response = await api.post('/assessments/status', {
      participantId,
      status,
      lastQuestionIndex
    });
    return response.data;
  } catch (error) {
    console.error('Error updating assessment status:', error);
    throw error;
  }
};

// Get all recordings for a participant
export const getRecordingsByParticipant = async (participantId) => {
  try {
    const response = await api.get(`/recordings/participant/${participantId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching recordings:', error);
    throw error;
  }
};