// src/contexts/AccessmentContext/index.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  fetchQuestions, 
  getAssessmentStatus, 
  updateAssessmentStatus,
  getParticipantAssessments
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
        } else {
          // No assessment exists yet for this language/testIndex
          setAssessmentStatus('not_started');
          setCurrentQuestionIndex(0);
        }
      } catch (err) {
        console.error('Error loading participant assessments:', err);
        setError('Failed to load assessment data');
      }
    };
    
    loadParticipantAssessments();
  }, [participantId]);

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
  const startAssessment = async (id, selectedLanguage = language, selectedTestIndex = testIndex) => {
    // Save to localStorage immediately to prevent race conditions
    localStorage.setItem('participantId', id);
    localStorage.setItem('assessmentLanguage', selectedLanguage);
    localStorage.setItem('assessmentTestIndex', selectedTestIndex.toString());
    
    // Update state immediately
    setParticipantId(id);
    setLanguage(selectedLanguage);
    setTestIndex(selectedTestIndex);
    setAssessmentStatus('in_progress');
    
    try {
      // Get the existing assessment if there is one
      const status = await getAssessmentStatus(id, selectedLanguage, selectedTestIndex);
      
      if (status.status === 'completed') {
        // If assessment was already completed, start a new test with incremented testIndex
        const newTestIndex = selectedTestIndex + 1;
        localStorage.setItem('assessmentTestIndex', newTestIndex.toString());
        setTestIndex(newTestIndex);
        setCurrentQuestionIndex(0);
        await updateAssessmentStatus(id, 'in_progress', 0, selectedLanguage, newTestIndex);
      } else if (status.status === 'in_progress') {
        // If assessment was in progress, continue from last question
        setCurrentQuestionIndex(status.lastQuestionIndex || 0);
      } else {
        // Start fresh
        setCurrentQuestionIndex(0);
        await updateAssessmentStatus(id, 'in_progress', 0, selectedLanguage, selectedTestIndex);
      }
    } catch (err) {
      console.error('Error starting assessment:', err);
      // Even if the API call fails, we want the UI to work with local state
      setCurrentQuestionIndex(0);
    }
  };

  const goToNextQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      
      try {
        await updateAssessmentStatus(participantId, 'in_progress', nextIndex, language, testIndex);
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
      await updateAssessmentStatus(participantId, 'completed', currentQuestionIndex, language, testIndex);
      
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
        startAssessment,
        goToNextQuestion,
        completeAssessment,
        addRecording,
        getProgress,
        getPhaseProgress,
        setLanguagePreference,
        setTestIndexPreference,
        lookupParticipant,
        resetAssessment
      }}
    >
      {children}
    </AssessmentContext.Provider>
  );
};