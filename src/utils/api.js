// src/utils/api.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests if available
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Questions API
export const fetchQuestions = async () => {
  try {
    const response = await api.get('/questions');
    return response.data;
  } catch (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }
};

// Recordings API
export const uploadRecording = async ({ questionId, participantId, audioBlob, duration }) => {
  try {
    const formData = new FormData();
    formData.append('recording', audioBlob, `recording_${Date.now()}.wav`);
    formData.append('questionId', questionId);
    formData.append('participantId', participantId);
    formData.append('duration', duration);
    
    const response = await api.post('/recordings', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: progressEvent => {
        // You can track upload progress here if needed
        console.log('Upload progress:', Math.round((progressEvent.loaded * 100) / progressEvent.total));
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error uploading recording:', error);
    throw error;
  }
};

export const getRecordings = async (participantId) => {
  try {
    const response = await api.get('/recordings', { 
      params: { participantId } 
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching recordings:', error);
    throw error;
  }
};

// Assessment status API
export const getAssessmentStatus = async (participantId) => {
  try {
    const response = await api.get(`/assessments/status/${participantId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching assessment status:', error);
    throw error;
  }
};

export const updateAssessmentStatus = async (participantId, status, lastQuestionIndex) => {
  try {
    const response = await api.post(`/assessments/status`, {
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

// Auth API
export const login = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    localStorage.setItem('token', response.data.token);
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem('token');
};