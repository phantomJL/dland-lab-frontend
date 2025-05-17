// src/utils/api.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL
});

api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Create error-tolerant localStorage functions
const safeLocalStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error('Error accessing localStorage:', e);
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.error('Error writing to localStorage:', e);
      return false;
    }
  }
};

// Fetch all questions from the backend
export const fetchQuestions = async (language = 'english') => {
  try {
    console.log(`Fetching ${language} questions from API...`);
    
    const response = await api.get('/questions', {
      params: { language }
    });
    
    if (response.data && response.data.length > 0) {
      console.log(`Retrieved ${response.data.length} ${language} questions from API`);
      return response.data;
    } else {
      console.warn('API returned empty questions array');
      return [];
    }
  } catch (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }
};

// Upload recording
export const uploadRecording = async ({ questionId, participantId, audioBlob, duration, language = 'english', testIndex = 0 }) => {
  try {
    console.log('Uploading recording:', { 
      questionId, 
      participantId, 
      duration, 
      language, 
      testIndex 
    });
    
    const formData = new FormData();
    formData.append('recording', audioBlob, `recording_${Date.now()}.wav`);
    formData.append('questionId', questionId);
    formData.append('participantId', participantId);
    formData.append('duration', duration || 0);
    formData.append('language', language);
    formData.append('testIndex', testIndex);
    
    const response = await api.post('/recordings', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error in uploadRecording:', error);
    throw error;
  }
};

// Get assessment status with language and test index
export const getAssessmentStatus = async (participantId, language = 'english', testIndex = 0) => {
  try {
    console.log(`Getting assessment status for participant: ${participantId}, language: ${language}, testIndex: ${testIndex}`);
    
    const response = await api.get(`/assessments/status/${participantId}`, {
      params: { language, testIndex }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error in getAssessmentStatus:', error);
    
    // If API fails, try to get from localStorage as fallback
    const storageKey = `assessment_${participantId}_${language}_${testIndex}`;
    const storedStatus = safeLocalStorage.getItem(storageKey);
    if (storedStatus) {
      try {
        const parsedStatus = JSON.parse(storedStatus);
        console.log('Retrieved status from localStorage:', parsedStatus);
        return parsedStatus;
      } catch (parseError) {
        console.error('Error parsing stored status:', parseError);
      }
    }
    
    // If everything fails, return a default status
    return {
      participantId,
      language,
      testIndex,
      status: 'not_started',
      lastQuestionIndex: 0
    };
  }
};

// Update assessment status with language, test index, and demographic info
export const updateAssessmentStatus = async (participantId, status, lastQuestionIndex, language = 'english', testIndex = 0, participantData = null) => {
  try {
    console.log('Updating assessment status:', { 
      participantId, 
      status, 
      lastQuestionIndex, 
      language, 
      testIndex, 
      participantData
    });
    
    // Create the status object
    const statusData = { 
      participantId, 
      status, 
      lastQuestionIndex, 
      language, 
      testIndex
    };
    
    // Add demographic data if provided
    if (participantData) {
      statusData.participantData = participantData;
    }
    
    const response = await api.post('/assessments/status', statusData);
    
    // Store in localStorage as backup
    const storageKey = `assessment_${participantId}_${language}_${testIndex}`;
    safeLocalStorage.setItem(storageKey, JSON.stringify(statusData));
    
    return response.data;
  } catch (error) {
    console.error('Error updating assessment status:', error);
    throw error;
  }
};

// Update participant demographic information
export const updateParticipantInfo = async (participantId, demographicInfo) => {
  try {
    console.log('Updating participant info:', { participantId, ...demographicInfo });
    
    const response = await api.put(`/participants/${participantId}`, {
      ...demographicInfo
    });
    
    return response.data;
  } catch (error) {
    console.error('Error updating participant info:', error);
    throw error;
  }
};

// Fetch all participants
export const fetchAllParticipants = async () => {
  try {
    console.log('Fetching all participants');
    
    // Check if we have an auth token
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No authentication token found. Please log in first.');
      return [];
    }
    
    const response = await api.get('/participants');
    console.log(`Retrieved ${response.data.length} participants from API`);
    return response.data;
  } catch (error) {
    console.error('Error fetching participants:', error);
    
    // If unauthorized, this might require a redirect to login
    if (error.response && error.response.status === 401) {
      console.warn('Authentication failed. Redirecting to login...');
    }
    
    throw error;
  }
};

// Get all assessments for a participant
export const getParticipantAssessments = async (participantId) => {
  try {
    console.log(`Fetching assessments for participant: ${participantId}`);
    
    const response = await api.get(`/assessments/participant/${participantId}`);
    console.log(`Retrieved ${response.data.length} assessments from API`);
    return response.data;
  } catch (error) {
    console.error('Error fetching participant assessments:', error);
    throw error;
  }
};

// Get recordings for a specific participant
export const getRecordingsByParticipant = async (participantId) => {
  try {
    console.log(`Fetching recordings for participant: ${participantId}`);
    
    const response = await api.get(`/recordings/participant/${participantId}`);
    
    // Add detailed logging
    console.log(`API Response status: ${response.status}`);
    console.log(`Retrieved ${response.data ? response.data.length : 0} recordings`);
    if (response.data && response.data.length > 0) {
      console.log('First recording sample:', JSON.stringify(response.data[0], null, 2));
    } else {
      console.log('No recordings found in response data');
      console.log('Full response:', response);
    }
    
    return response.data || [];
  } catch (error) {
    console.error('Error fetching recordings:', error.message);
    console.error('Error details:', error.response ? error.response.data : 'No response data');
    throw error;
  }
};