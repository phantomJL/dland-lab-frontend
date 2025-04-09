// // src/contexts/AssessmentContext.jsx
// import React, { createContext, useState, useContext, useEffect } from 'react';
// import { fetchQuestions, getAssessmentStatus } from '../../utils/api';

// const AssessmentContext = createContext();

// export const useAssessment = () => useContext(AssessmentContext);

// export const AssessmentProvider = ({ children }) => {
//   const [questions, setQuestions] = useState([]);
//   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [participantId, setParticipantId] = useState(localStorage.getItem('participantId') || null);
//   const [assessmentStatus, setAssessmentStatus] = useState('not_started'); // not_started, in_progress, completed
//   const [recordings, setRecordings] = useState([]);

//   useEffect(() => {
//     if (participantId) {
//       localStorage.setItem('participantId', participantId);
      
//       // Load assessment status
//       const loadStatus = async () => {
//         try {
//           const status = await getAssessmentStatus(participantId);
//           setAssessmentStatus(status.status);
          
//           if (status.lastQuestionIndex !== undefined) {
//             setCurrentQuestionIndex(status.lastQuestionIndex);
//           }
//         } catch (err) {
//           console.error("Error loading assessment status:", err);
//         }
//       };
      
//       loadStatus();
      
//       // Load questions
//       const loadQuestions = async () => {
//         setLoading(true);
//         try {
//           const data = await fetchQuestions();
//           setQuestions(data);
//           setError(null);
//         } catch (err) {
//           setError('Failed to load questions. Please try again.');
//           console.error(err);
//         } finally {
//           setLoading(false);
//         }
//       };
      
//       loadQuestions();
//     }
//   }, [participantId]);

//   const startAssessment = (id) => {
//     setParticipantId(id);
//     setAssessmentStatus('in_progress');
//     setCurrentQuestionIndex(0);
//   };

//   const goToNextQuestion = () => {
//     if (currentQuestionIndex < questions.length - 1) {
//       setCurrentQuestionIndex(currentQuestionIndex + 1);
//       return true;
//     }
//     return false;
//   };

//   const completeAssessment = () => {
//     setAssessmentStatus('completed');
//   };

//   const addRecording = (recording) => {
//     setRecordings([...recordings, recording]);
//   };

//   return (
//     <AssessmentContext.Provider
//       value={{
//         questions,
//         currentQuestionIndex,
//         currentQuestion: questions[currentQuestionIndex],
//         totalQuestions: questions.length,
//         loading,
//         error,
//         participantId,
//         assessmentStatus,
//         recordings,
//         startAssessment,
//         goToNextQuestion,
//         completeAssessment,
//         addRecording
//       }}
//     >
//       {children}
//     </AssessmentContext.Provider>
//   );
// };
// src/contexts/AssessmentContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const AssessmentContext = createContext();

export const useAssessment = () => useContext(AssessmentContext);

export const AssessmentProvider = ({ children }) => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [participantId, setParticipantId] = useState(localStorage.getItem('participantId') || null);
  const [assessmentStatus, setAssessmentStatus] = useState('not_started'); // not_started, in_progress, completed
  const [recordings, setRecordings] = useState([]);

  useEffect(() => {
    // Load fake data immediately
    const loadFakeData = () => {
      // Create 32 fake questions
      const fakeQuestions = Array.from({ length: 32 }, (_, i) => ({
        id: i + 1,
        text: `Question ${i + 1}: Please describe what you hear in this audio clip.`,
        audioPromptUrl: 'https://file-examples.com/storage/fe8c7eef0c6364f6c9504cc/2017/11/file_example_MP3_700KB.mp3', // Using a sample MP3 file
        instructions: 'Listen carefully and speak clearly into the microphone.'
      }));
      
      setQuestions(fakeQuestions);
      setLoading(false);
    };
    
    // Call the function with a small delay to simulate API call
    setTimeout(loadFakeData, 500);
  }, []);

  const startAssessment = (id) => {
    setParticipantId(id);
    setAssessmentStatus('in_progress');
    setCurrentQuestionIndex(0);
    localStorage.setItem('participantId', id);
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      return true;
    }
    return false;
  };

  const completeAssessment = () => {
    setAssessmentStatus('completed');
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