import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';

import Login from './pages/Login';
import Assessment from './pages/Assessment';
import Dashboard from './pages/Dashboard';
import Results from './pages/Results';
import Completion from './pages/Completion';
import NotFound from './pages/NotFound';
import PrivateRoute from './components/PrivateRoute';
import { AssessmentProvider } from './contexts/AccessmentContext';

// Create a custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#9BBDB1', // Your requested mint/sage green
    },
    secondary: {
      main: '#5783A9', // Blue from your background design
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.05)',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AssessmentProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route path="/" element={<Layout />}>
                {/* Public routes */}
                <Route index element={<Navigate to="/assessment" replace />} />
                <Route path="assessment" element={<Assessment />} />
                <Route path="completion" element={<Completion />} />
                
                {/* Protected routes */}
                <Route 
                  path="dashboard" 
                  element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="results" 
                  element={
                    <PrivateRoute>
                      <Results />
                    </PrivateRoute>
                  } 
                />
              </Route>
              
              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AssessmentProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;