// src/contexts/AccessmentContext/index.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  fetchQuestions, 
  getAssessmentStatus, 
  updateAssessmentStatus,
  getParticipantAssessments,
  updateParticipantInfo
} from '../../utils/api';

const AssessmentContext = createContext();

export const useAssessment = () => useContext(AssessmentContext);

export const AssessmentProvider = ({ children }) => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [participantId, setParticipantId] = useState(localStorage.getItem('participantId') || null);
  const [assessmentStatus, setAssessmentStatus] = useState('not_started');
  const [recordings, setRecordings] = useState([]);
  const [language, setLanguage] = useState(localStorage.getItem('assessmentLanguage') || 'english');
  const [testIndex, setTestIndex] = useState(parseInt(localStorage.getItem('assessmentTestIndex') || '0'));
  const [participantAssessments, setParticipantAssessments] = useState([]);
  const [lookupMode, setLookupMode] = useState(false);
  // Add demographic state
  const [participantData, setParticipantData] = useState({
    age: null,
    sex: null
  });

  // Load participant's assessments when participantId changes
  useEffect(() => {
    if (!participantId) {
      setLoading(false);
      return; // Exit early
    }

    const loadParticipantAssessments = async () => {
      try {
        setLoading(true);
        const assessments = await getParticipantAssessments(participantId);
        setParticipantAssessments(assessments);
        
        // Check if there's an assessment for the current language and testIndex
        const currentAssessment = assessments.find(
          a => a.language === language && a.testIndex === testIndex
        );
        
        if (currentAssessment) {
          setAssessmentStatus(currentAssessment.status || 'not_started');
          
          if (currentAssessment.lastQuestionIndex !== undefined) {
            setCurrentQuestionIndex(currentAssessment.lastQuestionIndex);
          }
          
          // Set demographic data if available
          if (currentAssessment.participantData) {
            setParticipantData({
              age: currentAssessment.participantData.age || null,
              sex: currentAssessment.participantData.sex || null
            });
          }
        } else {
          // No assessment exists yet for this language/testIndex
          setAssessmentStatus('not_started');
          setCurrentQuestionIndex(0);
        }
      } catch (err) {
        console.error('Error loading participant assessments:', err);
        setError('Failed to load assessment data');
      } finally {
        setLoading(false);
      }
    };
    
    loadParticipantAssessments();
  }, [participantId, language, testIndex]);

  // Load questions when language changes or when starting a test
  useEffect(() => {
    // Set loading to false if there's no participantId
    if (!participantId || !assessmentStatus || assessmentStatus === 'not_started') {
      setLoading(false);
      return; // Exit early
    }
    
    localStorage.setItem('participantId', participantId);
    
    const loadAssessmentData = async () => {
      setLoading(true);
      try {
        // Load questions filtered by language
        let questionData = await fetchQuestions(language);
        
        // Sort questions by sequenceId if available, otherwise fallback to index
        if (questionData && questionData.length > 0) {
          if (questionData[0].sequenceId !== undefined) {
            questionData = questionData.sort((a, b) => a.sequenceId - b.sequenceId);
          }
          
          setQuestions(questionData);
        } else {
          setQuestions([]);
        }
        
        // Load assessment status
        if (participantId) {
          const status = await getAssessmentStatus(participantId, language, testIndex);
          setAssessmentStatus(status.status || 'not_started');
          
          if (status.lastQuestionIndex !== undefined) {
            // Validate that index is within bounds
            if (status.lastQuestionIndex >= 0 && status.lastQuestionIndex < questionData.length) {
              setCurrentQuestionIndex(status.lastQuestionIndex);
            } else {
              // If index is out of bounds, reset to beginning
              console.warn('Last question index out of bounds, resetting to 0');
              setCurrentQuestionIndex(0);
            }
          } else {
            // If no last question index, start from beginning
            setCurrentQuestionIndex(0);
          }
          
          // Get participant demographic data if available
          if (status.participantData) {
            setParticipantData({
              age: status.participantData.age || null,
              sex: status.participantData.sex || null
            });
          }
        }
        
        setError(null);
      } catch (err) {
        console.error('Error loading assessment data:', err);
        setError('Failed to load assessment data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadAssessmentData();
  }, [participantId, language, testIndex, assessmentStatus]);

  // Set language preference
  const setLanguagePreference = (newLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem('assessmentLanguage', newLanguage);
  };
  
  // Set test index
  const setTestIndexPreference = (newTestIndex) => {
    setTestIndex(newTestIndex);
    localStorage.setItem('assessmentTestIndex', newTestIndex.toString());
  };

  // Lookup participant by ID
  const lookupParticipant = async (id) => {
    setLookupMode(true);
    setLoading(true);
    
    try {
      // Save to localStorage immediately
      localStorage.setItem('participantId', id);
      
      // Update state
      setParticipantId(id);
      
      // Load participant's assessments
      const assessments = await getParticipantAssessments(id);
      setParticipantAssessments(assessments);
      
      return assessments;
    } catch (err) {
      console.error('Error looking up participant:', err);
      setError('Failed to find participant. Please check the ID.');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Start a new assessment or continue existing one
  // Updated to include demographic information
  const startAssessment = async (id, selectedLanguage = language, selectedTestIndex = testIndex, demographicInfo = {}) => {
    // Get the participant's existing assessments first
    try {
      const existingAssessments = await getParticipantAssessments(id);
      
      // If we're in lookup mode (returning participant), always start a new test
      if (lookupMode) {
        // Find the highest test index for the selected language
        const sameLanguageTests = existingAssessments.filter(
          a => a.language === selectedLanguage
        );
        
        // Determine the next test index (highest + 1, or 0 if none exist)
        const nextTestIndex = sameLanguageTests.length > 0
          ? Math.max(...sameLanguageTests.map(a => a.testIndex)) + 1
          : 0;
        
        // Use the new test index
        selectedTestIndex = nextTestIndex;
        console.log(`Starting a new test with language: ${selectedLanguage}, index: ${selectedTestIndex}`);
      }
    } catch (err) {
      console.error('Error getting participant assessments:', err);
      // If there's an error, we'll still continue with the provided test index
    }
    
    // Save to localStorage immediately to prevent race conditions
    localStorage.setItem('participantId', id);
    localStorage.setItem('assessmentLanguage', selectedLanguage);
    localStorage.setItem('assessmentTestIndex', selectedTestIndex.toString());
    
    // Update state immediately
    setParticipantId(id);
    setLanguage(selectedLanguage);
    setTestIndex(selectedTestIndex);
    setAssessmentStatus('in_progress');
    setCurrentQuestionIndex(0); // Always start from the first question
    
    // Set demographic data if provided
    if (demographicInfo && (demographicInfo.age || demographicInfo.sex)) {
      setParticipantData({
        age: demographicInfo.age || null,
        sex: demographicInfo.sex || null
      });
    }
    
    try {
      // Start a new assessment with demographic info
      await updateAssessmentStatus(
        id, 
        'in_progress', 
        0, 
        selectedLanguage, 
        selectedTestIndex, 
        demographicInfo
      );
      
      // Update participant info separately
      if (demographicInfo && (demographicInfo.age || demographicInfo.sex)) {
        await updateParticipantInfo(id, demographicInfo);
      }
    } catch (err) {
      console.error('Error starting assessment:', err);
      // Even if the API call fails, we want the UI to work with local state
    }
  };

  // Update participant demographic information
  const updateParticipantDemographics = async (demographicInfo) => {
    if (!participantId) return;
    
    try {
      setParticipantData({
        ...participantData,
        ...demographicInfo
      });
      
      await updateParticipantInfo(participantId, demographicInfo);
      return true;
    } catch (err) {
      console.error('Error updating participant info:', err);
      return false;
    }
  };

  const goToNextQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      
      try {
        await updateAssessmentStatus(
          participantId, 
          'in_progress', 
          nextIndex, 
          language, 
          testIndex, 
          participantData
        );
      } catch (err) {
        console.error('Error updating question index:', err);
      }
      
      return true;
    }
    return false;
  };

  const completeAssessment = async () => {
    setAssessmentStatus('completed');
    
    try {
      await updateAssessmentStatus(
        participantId, 
        'completed', 
        currentQuestionIndex, 
        language, 
        testIndex, 
        participantData
      );
      
      // Refresh the list of participant assessments
      const assessments = await getParticipantAssessments(participantId);
      setParticipantAssessments(assessments);
    } catch (err) {
      console.error('Error completing assessment:', err);
    }
  };

  const addRecording = (recording) => {
    // Add language and testIndex to recording
    const recordingWithMeta = {
      ...recording,
      language,
      testIndex
    };
    setRecordings([...recordings, recordingWithMeta]);
  };

  const resetAssessment = () => {
    // Clear participant ID from localStorage
    localStorage.removeItem('participantId');
    localStorage.removeItem('assessmentTestIndex');
    
    // Reset all state
    setParticipantId(null);
    setAssessmentStatus('not_started');
    setCurrentQuestionIndex(0);
    setRecordings([]);
    setParticipantAssessments([]);
    setLookupMode(false);
    setTestIndex(0);
    setParticipantData({
      age: null,
      sex: null
    });
    
    console.log('Assessment state has been reset');
  };

  // Filter questions by audio type
  const getQuestionsByType = (type) => {
    return questions.filter(q => q.audioType === type);
  };

  const instructionQuestions = getQuestionsByType('instruction');
  const practiceQuestions = getQuestionsByType('practice');
  const testQuestions = getQuestionsByType('test');

  // Get the overall progress
  const getProgress = () => {
    if (questions.length === 0) return 0;
    return ((currentQuestionIndex + 1) / questions.length) * 100;
  };

  // Get the current phase progress
  const getPhaseProgress = () => {
    if (!questions[currentQuestionIndex]) return 0;
    
    const currentType = questions[currentQuestionIndex].audioType;
    const phaseQuestions = getQuestionsByType(currentType);
    
    if (phaseQuestions.length === 0) return 0;
    
    // Find how many questions of this phase we've completed
    const phaseIndices = questions
      .map((q, index) => ({ index, audioType: q.audioType }))
      .filter(q => q.audioType === currentType)
      .map(q => q.index);
    
    const currentPhaseQuestionIndex = phaseIndices.indexOf(currentQuestionIndex);
    
    return ((currentPhaseQuestionIndex + 1) / phaseQuestions.length) * 100;
  };

  return (
    <AssessmentContext.Provider
      value={{
        questions,
        currentQuestionIndex,
        currentQuestion: questions[currentQuestionIndex],
        totalQuestions: questions.length,
        loading,
        error,
        participantId,
        assessmentStatus,
        recordings,
        language,
        testIndex,
        instructionQuestions,
        practiceQuestions,
        testQuestions,
        participantAssessments,
        lookupMode,
        participantData, // Add demographic data
        startAssessment,
        goToNextQuestion,
        completeAssessment,
        addRecording,
        getProgress,
        getPhaseProgress,
        setLanguagePreference,
        setTestIndexPreference,
        lookupParticipant,
        resetAssessment,
        updateParticipantDemographics,
        updateParticipantInfo
      }}
    >
      {children}
    </AssessmentContext.Provider>
  );
};