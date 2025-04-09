// src/pages/NotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Typography, Paper, Button, Box } from '@mui/material';

const NotFound = () => {
  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center', my: 8 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          404
        </Typography>
        
        <Typography variant="h5" component="h2" gutterBottom>
          Page Not Found
        </Typography>
        
        <Typography variant="body1" paragraph>
          The page you are looking for doesn't exist or has been moved.
        </Typography>
        
        <Box sx={{ mt: 4 }}>
          <Button 
            component={Link} 
            to="/"
            variant="contained" 
            color="primary"
          >
            Go to Home
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default NotFound;