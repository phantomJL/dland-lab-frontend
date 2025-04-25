// src/contexts/AccessmentContext/index.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  fetchQuestions, 
  getAssessmentStatus, 
  updateAssessmentStatus 
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

  // Load questions and assessment status when participantId or language changes
  useEffect(() => {
    if (participantId) {
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
            const status = await getAssessmentStatus(participantId);
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
    }
  }, [participantId, language]);

  // Set language preference
  const setLanguagePreference = (newLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem('assessmentLanguage', newLanguage);
  };

  const startAssessment = async (id, selectedLanguage = language) => {
    // Save to localStorage immediately to prevent race conditions
    localStorage.setItem('participantId', id);
    localStorage.setItem('assessmentLanguage', selectedLanguage);
    
    // Update state immediately
    setParticipantId(id);
    setLanguage(selectedLanguage);
    setAssessmentStatus('in_progress');
    setCurrentQuestionIndex(0);
    
    try {
      await updateAssessmentStatus(id, 'in_progress', 0);
    } catch (err) {
      console.error('Error starting assessment:', err);
      // Even if the API call fails, we want the UI to work with local state
    }
  };

  const goToNextQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      
      try {
        await updateAssessmentStatus(participantId, 'in_progress', nextIndex);
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
      await updateAssessmentStatus(participantId, 'completed', currentQuestionIndex);
    } catch (err) {
      console.error('Error completing assessment:', err);
    }
  };

  const addRecording = (recording) => {
    setRecordings([...recordings, recording]);
  };

  const resetAssessment = () => {
    // Clear participant ID from localStorage
    localStorage.removeItem('participantId');
    
    // Reset all state
    setParticipantId(null);
    setAssessmentStatus('not_started');
    setCurrentQuestionIndex(0);
    setRecordings([]);
    
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
        instructionQuestions,
        practiceQuestions,
        testQuestions,
        startAssessment,
        goToNextQuestion,
        completeAssessment,
        addRecording,
        getProgress,
        getPhaseProgress,
        setLanguagePreference,
        resetAssessment
      }}
    >
      {children}
    </AssessmentContext.Provider>
  );
};