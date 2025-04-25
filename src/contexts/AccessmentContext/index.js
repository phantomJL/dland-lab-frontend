// src/contexts/AssessmentContext.jsx
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

  // Load questions and assessment status when participantId changes
  useEffect(() => {
    if (participantId) {
      localStorage.setItem('participantId', participantId);
      
      const loadAssessmentData = async () => {
        setLoading(true);
        try {
          // Load questions
          const questionData = await fetchQuestions();
          setQuestions(questionData);
          
          // Load assessment status
          if (participantId) {
            const status = await getAssessmentStatus(participantId);
            setAssessmentStatus(status.status || 'not_started');
            
            if (status.lastQuestionIndex !== undefined) {
              setCurrentQuestionIndex(status.lastQuestionIndex);
            }
          }
          
          setError(null);
        } catch (err) {
          setError('Failed to load assessment data. Please try again.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      
      loadAssessmentData();
    }
  }, [participantId]);

  const startAssessment = async (id) => {
    setParticipantId(id);
    setAssessmentStatus('in_progress');
    setCurrentQuestionIndex(0);
    
    try {
      await updateAssessmentStatus(id, 'in_progress', 0);
    } catch (err) {
      console.error('Error starting assessment:', err);
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
        startAssessment,
        goToNextQuestion,
        completeAssessment,
        addRecording
      }}
    >
      {children}
    </AssessmentContext.Provider>
  );
};