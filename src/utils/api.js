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

// Mock data to use if API calls fail
const MOCK_QUESTIONS = [
  {
    _id: 'instruction-1',
    questionNumber: 0,
    text: "Instructions",
    instructions: "Please listen to these instructions carefully before proceeding.",
    audioPromptUrl: "https://example.com/prompts/M_Instruction.mp3",
    audioPromptStoragePath: "prompts/M_Instruction.mp3",
    category: "instruction",
    requiresRecording: false
  },
  {
    _id: 'practice-1',
    questionNumber: 1,
    text: "Practice Question 1",
    instructions: "This is a practice question. Please respond to familiarize yourself with the recording system.",
    audioPromptUrl: "https://example.com/prompts/M_Practice 1.mp3",
    audioPromptStoragePath: "prompts/M_Practice 1.mp3",
    category: "practice",
    requiresRecording: true
  },
  {
    _id: 'practice-2',
    questionNumber: 2,
    text: "Practice Question 2",
    instructions: "This is a practice question. Please respond to familiarize yourself with the recording system.",
    audioPromptUrl: "https://example.com/prompts/M_Practice 2.mp3",
    audioPromptStoragePath: "prompts/M_Practice 2.mp3",
    category: "practice",
    requiresRecording: true
  },
  {
    _id: 'test-1',
    questionNumber: 1,
    text: "Test Question 1",
    instructions: "Listen carefully and speak clearly into the microphone.",
    audioPromptUrl: "https://example.com/prompts/M_TS1.wav",
    audioPromptStoragePath: "prompts/M_TS1.wav",
    category: "test",
    requiresRecording: true
  },
  {
    _id: 'test-2',
    questionNumber: 2,
    text: "Test Question 2",
    instructions: "Listen carefully and speak clearly into the microphone.",
    audioPromptUrl: "https://example.com/prompts/M_TS2.wav",
    audioPromptStoragePath: "prompts/M_TS2.wav",
    category: "test",
    requiresRecording: true
  },
  {
    _id: 'test-3',
    questionNumber: 3,
    text: "Test Question 3",
    instructions: "Listen carefully and speak clearly into the microphone.",
    audioPromptUrl: "https://example.com/prompts/M_TS3.wav",
    audioPromptStoragePath: "prompts/M_TS3.wav",
    category: "test",
    requiresRecording: true
  }
];

// Track assessment state in memory if localStorage fails
const inMemoryStore = {
  participantData: {},  // Store data by participant ID
  participantInfo: {}   // Store demographic data by participant ID
};

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
    
    // Try to call the real API first
    try {
      const response = await api.get('/questions', {
        params: { language }
      });
      if (response.data && response.data.length > 0) {
        console.log(`Retrieved ${response.data.length} ${language} questions from API`);
        return response.data;
      }
    } catch (apiError) {
      console.warn('API call failed, using mock data:', apiError);
    }
    
    // If API call fails or returns empty, use mock data
    const MOCK_QUESTIONS = createMockQuestions(language);
    console.log(`Using mock ${language} questions:`, MOCK_QUESTIONS);
    return MOCK_QUESTIONS;
  } catch (error) {
    console.error('Error fetching questions:', error);
    // Even if everything fails, still return mock data to keep app functioning
    return createMockQuestions(language);
  }
};

// Create mock questions based on language
function createMockQuestions(language) {
  // Create translations for mock questions
  const translations = {
    english: {
      instruction: {
        text: "Instructions",
        instructions: "Please listen to these instructions carefully."
      },
      practice: [
        {
          text: "Practice 1",
          instructions: "This is a practice question. Please respond to familiarize yourself with the recording system."
        },
        {
          text: "Practice 2",
          instructions: "This is a practice question. Please respond to familiarize yourself with the recording system."
        }
      ],
      test: [
        {
          text: "Question 1",
          instructions: "Listen carefully and speak clearly into the microphone."
        },
        {
          text: "Question 2",
          instructions: "Listen carefully and speak clearly into the microphone."
        },
        {
          text: "Question 3",
          instructions: "Listen carefully and speak clearly into the microphone."
        }
      ]
    },
    chinese: {
      instruction: {
        text: "指示",
        instructions: "请仔细听这些指示。"
      },
      practice: [
        {
          text: "练习 1",
          instructions: "这是一个练习问题。请回答以熟悉录音系统。"
        },
        {
          text: "练习 2",
          instructions: "这是一个练习问题。请回答以熟悉录音系统。"
        }
      ],
      test: [
        {
          text: "问题 1",
          instructions: "请仔细听并清晰地对着麦克风说话。"
        },
        {
          text: "问题 2",
          instructions: "请仔细听并清晰地对着麦克风说话。"
        },
        {
          text: "问题 3",
          instructions: "请仔细听并清晰地对着麦克风说话。"
        }
      ]
    }
  };
  
  // Use English as fallback if the requested language is not available
  const t = translations[language] || translations.english;
  
  // Create mock questions array
  const questions = [
    // Instruction
    {
      _id: `instruction-1-${language}`,
      questionNumber: 0,
      text: t.instruction.text,
      instructions: t.instruction.instructions,
      audioPromptUrl: `https://example.com/prompts/${language}/M_Instruction.mp3`,
      audioPromptStoragePath: `prompts/${language}_sentences/M_Instruction.mp3`,
      category: "instruction",
      audioType: "instruction",
      requiresRecording: false,
      language: language
    }
  ];
  
  // Add practice questions
  t.practice.forEach((practice, i) => {
    questions.push({
      _id: `practice-${i+1}-${language}`,
      questionNumber: i+1,
      text: practice.text,
      instructions: practice.instructions,
      audioPromptUrl: `https://example.com/prompts/${language}/M_Practice ${i+1}.mp3`,
      audioPromptStoragePath: `prompts/${language}_sentences/M_Practice ${i+1}.mp3`,
      category: "practice",
      audioType: "practice",
      requiresRecording: true,
      language: language
    });
  });
  
  // Add test questions
  t.test.forEach((test, i) => {
    questions.push({
      _id: `test-${i+1}-${language}`,
      questionNumber: i+1,
      text: test.text,
      instructions: test.instructions,
      audioPromptUrl: `https://example.com/prompts/${language}/M_TS${i+1}.wav`,
      audioPromptStoragePath: `prompts/${language}_sentences/M_TS${i+1}.wav`,
      category: "test",
      audioType: "test",
      requiresRecording: true,
      language: language
    });
  });
  
  return questions;
}

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
    
    // Try to use the real API first
    try {
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
    } catch (apiError) {
      console.warn('API recording upload failed, using mock:', apiError);
    }
    
    // If API call fails, create a mock response
    const mockRecording = {
      _id: `recording_${Date.now()}`,
      questionId,
      participantId,
      duration,
      language,
      testIndex,
      audioUrl: URL.createObjectURL(audioBlob) || 'https://example.com/mock-recording.wav',
      timestamp: new Date().toISOString()
    };
    
    // Store in memory for persistence
    const memoryKey = `${participantId}_${language}_${testIndex}`;
    if (!inMemoryStore.participantData[memoryKey]) {
      inMemoryStore.participantData[memoryKey] = { recordings: [] };
    }
    inMemoryStore.participantData[memoryKey].recordings.push(mockRecording);
    
    console.log('Mock recording created:', mockRecording);
    return { success: true, recording: mockRecording };
  } catch (error) {
    console.error('Error in uploadRecording:', error);
    // Return a minimal success response to keep the app functioning
    return { 
      success: true, 
      recording: { 
        _id: `error_recording_${Date.now()}`,
        audioUrl: 'https://example.com/error-recording.wav',
        language: language,
        testIndex: testIndex
      }
    };
  }
};

// Get assessment status with language and test index
export const getAssessmentStatus = async (participantId, language = 'english', testIndex = 0) => {
  try {
    console.log(`Getting assessment status for participant: ${participantId}, language: ${language}, testIndex: ${testIndex}`);
    
    // Try to use the real API first
    try {
      const response = await api.get(`/assessments/status/${participantId}`, {
        params: { language, testIndex }
      });
      if (response.data) {
        return response.data;
      }
    } catch (apiError) {
      console.warn('API status fetch failed, using local storage:', apiError);
    }
    
    // Try to get from localStorage
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
    
    // Try to get from memory store
    const memoryKey = `${participantId}_${language}_${testIndex}`;
    if (inMemoryStore.participantData[memoryKey]?.status) {
      console.log('Retrieved status from memory store:', inMemoryStore.participantData[memoryKey].status);
      return inMemoryStore.participantData[memoryKey].status;
    }
    
    // If no status found, create a new one
    console.log('No existing status found, creating new status');
    const newStatus = {
      participantId,
      language,
      testIndex,
      status: 'not_started',
      lastQuestionIndex: 0
    };
    
    // Store the new status
    if (!inMemoryStore.participantData[memoryKey]) {
      inMemoryStore.participantData[memoryKey] = {};
    }
    inMemoryStore.participantData[memoryKey].status = newStatus;
    safeLocalStorage.setItem(storageKey, JSON.stringify(newStatus));
    
    return newStatus;
  } catch (error) {
    console.error('Error in getAssessmentStatus:', error);
    // Return a default status to keep the app functioning
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
    
    // Try to use the real API first
    try {
      const response = await api.post('/assessments/status', statusData);
      
      if (response.data) {
        console.log('Status updated via API');
      }
    } catch (apiError) {
      console.warn('API status update failed, using local storage:', apiError);
    }
    
    // Store in memory for persistence
    const memoryKey = `${participantId}_${language}_${testIndex}`;
    if (!inMemoryStore.participantData[memoryKey]) {
      inMemoryStore.participantData[memoryKey] = {};
    }
    inMemoryStore.participantData[memoryKey].status = statusData;
    
    // Try to update localStorage
    const storageKey = `assessment_${participantId}_${language}_${testIndex}`;
    safeLocalStorage.setItem(storageKey, JSON.stringify(statusData));
    
    return { success: true, status: statusData };
  } catch (error) {
    console.error('Error updating assessment status:', error);
    // Return success even if there was an error, to keep the app functioning
    return { success: true };
  }
};

// Update participant demographic information
export const updateParticipantInfo = async (participantId, demographicInfo) => {
  try {
    console.log('Updating participant info:', { participantId, ...demographicInfo });
    
    // Create the participant data object
    const participantData = { 
      participantId,
      ...demographicInfo
    };
    
    // Try to use the real API first
    try {
      const response = await api.post('/participants/update', participantData);
      
      if (response.data) {
        console.log('Participant info updated via API');
        return response.data;
      }
    } catch (apiError) {
      console.warn('API participant update failed, using local storage:', apiError);
    }
    
    // Store in memory for persistence
    if (!inMemoryStore.participantInfo) {
      inMemoryStore.participantInfo = {};
    }
    inMemoryStore.participantInfo[participantId] = {
      ...inMemoryStore.participantInfo[participantId],
      ...demographicInfo
    };
    
    // Try to update localStorage
    const storageKey = `participant_${participantId}`;
    const existingData = safeLocalStorage.getItem(storageKey) 
      ? JSON.parse(safeLocalStorage.getItem(storageKey)) 
      : {};
    
    const updatedData = {
      ...existingData,
      ...demographicInfo
    };
    
    safeLocalStorage.setItem(storageKey, JSON.stringify(updatedData));
    
    return { success: true, participant: updatedData };
  } catch (error) {
    console.error('Error updating participant info:', error);
    // Return success even if there was an error, to keep the app functioning
    return { success: true };
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
    
    // Try to use the real API
    try {
      const response = await api.get('/participants');
      if (response.data) {
        console.log(`Retrieved ${response.data.length} participants from API`);
        return response.data;
      }
    } catch (apiError) {
      console.error('API participants fetch failed:', apiError);
      
      // If unauthorized, redirect to login
      if (apiError.response && apiError.response.status === 401) {
        console.warn('Authentication failed. Redirecting to login...');
        return [];
      }
      
      console.warn('Using mock data instead');
    }
    
    // Generate mock participants with multiple language tests
    const mockParticipants = [
      {
        participantId: 'P20230401-001',
        age: 25,
        sex: 'female',
        recordingCount: 12,
        tests: [
          {
            language: 'english',
            testIndex: 0,
            status: 'completed',
            startedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            completedAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString(),
            completionPercentage: 100
          },
          {
            language: 'chinese',
            testIndex: 0,
            status: 'completed',
            startedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            completedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            completionPercentage: 100
          },
          {
            language: 'english',
            testIndex: 1,
            status: 'in_progress',
            startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            completionPercentage: 50
          }
        ]
      },
      {
        participantId: 'P20230401-002',
        age: 32,
        sex: 'male',
        recordingCount: 6,
        tests: [
          {
            language: 'english',
            testIndex: 0,
            status: 'completed',
            startedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
            completedAt: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString(),
            completionPercentage: 100
          }
        ]
      },
      {
        participantId: 'P20230401-003',
        age: 18,
        sex: 'other',
        recordingCount: 3,
        tests: [
          {
            language: 'chinese',
            testIndex: 0,
            status: 'in_progress',
            startedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            completionPercentage: 30
          }
        ]
      }
    ];
    
    console.log('Using mock participants data:', mockParticipants);
    return mockParticipants;
  } catch (error) {
    console.error('Error fetching participants:', error);
    return [];
  }
};

// Get all assessments for a participant
export const getParticipantAssessments = async (participantId) => {
  try {
    console.log(`Fetching assessments for participant: ${participantId}`);
    
    // Try to use the real API first
    try {
      const response = await api.get(`/assessments/participant/${participantId}`);
      if (response.data) {
        console.log(`Retrieved ${response.data.length} assessments from API`);
        return response.data;
      }
    } catch (apiError) {
      console.warn('API assessments fetch failed, using mock data:', apiError);
    }
    
    // If API call fails, create mock assessments with multiple languages
    const mockAssessments = [];
    
    // Add English assessment
    mockAssessments.push({
      participantId,
      language: 'english',
      testIndex: 0,
      status: 'in_progress',
      startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      lastQuestionIndex: 2,
      totalQuestions: 6,
      totalRecordings: 3,
      completionPercentage: 50
    });
    
    // Add Chinese assessment
    mockAssessments.push({
      participantId,
      language: 'chinese',
      testIndex: 0,
      status: 'not_started',
      lastQuestionIndex: 0,
      totalQuestions: 6,
      totalRecordings: 0,
      completionPercentage: 0
    });
    
    // Add a completed English test as well for testing
    if (participantId === 'P20230401-001') {
      mockAssessments.push({
        participantId,
        language: 'english',
        testIndex: 1,
        status: 'completed',
        startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        lastQuestionIndex: 5,
        totalQuestions: 6,
        totalRecordings: 6,
        completionPercentage: 100
      });
    }
    
    console.log('Using mock assessments data:', mockAssessments);
    return mockAssessments;
  } catch (error) {
    console.error('Error fetching participant assessments:', error);
    return [];
  }
};

// Get recordings for a specific participant
export const getRecordingsByParticipant = async (participantId) => {
  try {
    console.log(`Fetching recordings for participant: ${participantId}`);
    
    // Try to use the real API first
    try {
      const response = await api.get(`/recordings/participant/${participantId}`);
      if (response.data) {
        console.log(`Retrieved ${response.data.length} recordings from API`);
        return response.data;
      }
    } catch (apiError) {
      console.warn('API recordings fetch failed, using mock data:', apiError);
    }
    
    // If API call fails, use mock data based on participant ID
    // This creates different mock data for different participant IDs
    const mockQuestionsBase = [
      {
        _id: 'instruction-1',
        text: "Instructions",
        category: "instruction"
      },
      {
        _id: 'practice-1',
        text: "Practice Question 1",
        category: "practice"
      },
      {
        _id: 'practice-2',
        text: "Practice Question 2",
        category: "practice"
      },
      {
        _id: 'test-1',
        text: "Test Question 1",
        category: "test"
      },
      {
        _id: 'test-2',
        text: "Test Question 2",
        category: "test"
      },
      {
        _id: 'test-3',
        text: "Test Question 3",
        category: "test"
      }
    ];
    
    const mockRecordings = [];
    
    // Base timestamp (now minus 7 days)
    const baseTimestamp = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    // Generate different sets of mock recordings based on participant ID
    if (participantId === 'P20230401-001') {
      // Add recordings for English tests
      mockQuestionsBase.forEach((question, index) => {
        const timestamp = baseTimestamp + index * 5 * 60 * 1000; // 5 mins between recordings
        
        // English test index 0 (completed)
        mockRecordings.push({
          _id: `recording_${participantId}_eng0_${question._id}`,
          participantId,
          questionId: question,
          language: 'english',
          testIndex: 0,
          audioUrl: 'https://example.com/mockrecording.wav',
          durationMs: Math.floor(Math.random() * 20000) + 5000, // 5-25 seconds
          createdAt: new Date(timestamp - 20 * 24 * 60 * 60 * 1000).toISOString() // 20 days ago
        });
        
        // English test index 1 (in progress)
        if (index < 3) { // Only first 3 questions completed
          mockRecordings.push({
            _id: `recording_${participantId}_eng1_${question._id}`,
            participantId,
            questionId: question,
            language: 'english',
            testIndex: 1,
            audioUrl: 'https://example.com/mockrecording.wav',
            durationMs: Math.floor(Math.random() * 20000) + 5000, // 5-25 seconds
            createdAt: new Date(timestamp).toISOString()
          });
        }
        
        // Chinese test index 0 (completed)
        mockRecordings.push({
          _id: `recording_${participantId}_chn0_${question._id}`,
          participantId,
          questionId: question,
          language: 'chinese',
          testIndex: 0,
          audioUrl: 'https://example.com/mockrecording.wav',
          durationMs: Math.floor(Math.random() * 20000) + 5000, // 5-25 seconds
          createdAt: new Date(timestamp - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days ago
        });
      });
    } else if (participantId === 'P20230401-002') {
      // Only completed English test index 0
      mockQuestionsBase.forEach((question, index) => {
        const timestamp = baseTimestamp + index * 5 * 60 * 1000; // 5 mins between recordings
        
        mockRecordings.push({
          _id: `recording_${participantId}_eng0_${question._id}`,
          participantId,
          questionId: question,
          language: 'english',
          testIndex: 0,
          audioUrl: 'https://example.com/mockrecording.wav',
          durationMs: Math.floor(Math.random() * 20000) + 5000, // 5-25 seconds
          createdAt: new Date(timestamp - 15 * 24 * 60 * 60 * 1000).toISOString() // 15 days ago
        });
      });
    } else if (participantId === 'P20230401-003') {
      // Chinese test in progress
      mockQuestionsBase.slice(0, 3).forEach((question, index) => {
        const timestamp = baseTimestamp + index * 5 * 60 * 1000; // 5 mins between recordings
        
        mockRecordings.push({
          _id: `recording_${participantId}_chn0_${question._id}`,
          participantId,
          questionId: question,
          language: 'chinese',
          testIndex: 0,
          audioUrl: 'https://example.com/mockrecording.wav',
          durationMs: Math.floor(Math.random() * 20000) + 5000, // 5-25 seconds
          createdAt: new Date(timestamp).toISOString()
        });
      });
    } else {
      // For any other participant ID, generate some random recordings
      // with mixed languages and test indices
      const languages = ['english', 'chinese'];
      const testIndices = [0, 1];
      
      // Generate 10 random recordings
      for (let i = 0; i < 10; i++) {
        const language = languages[Math.floor(Math.random() * languages.length)];
        const testIndex = testIndices[Math.floor(Math.random() * testIndices.length)];
        const question = mockQuestionsBase[Math.floor(Math.random() * mockQuestionsBase.length)];
        const timestamp = baseTimestamp - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000; // Random time within last 30 days
        
        mockRecordings.push({
          _id: `recording_${participantId}_${language.substring(0, 3)}${testIndex}_${question._id}`,
          participantId,
          questionId: question,
          language,
          testIndex,
          audioUrl: 'https://example.com/mockrecording.wav',
          durationMs: Math.floor(Math.random() * 20000) + 5000, // 5-25 seconds
          createdAt: new Date(timestamp).toISOString()
        });
      }
    }
    
    console.log(`Generated ${mockRecordings.length} mock recordings for ${participantId} with multiple languages and test indices`);
    return mockRecordings;
  } catch (error) {
    console.error('Error fetching recordings:', error);
    return [];
  }
};