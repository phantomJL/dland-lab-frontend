// src/components/Layout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container, AppBar, Toolbar, Typography } from '@mui/material';

const Layout = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar component='nav' position="static" sx={{ backgroundColor: '#9BBDB1' }}>
        <Toolbar>
          <Typography variant="h6" color='white'>
            DLanD Lab Assessment
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Container component="main" sx={{ flex: 1, py: 4 }}>
        <Outlet />
      </Container>
      
      <Box component="footer" sx={{ py: 3, backgroundColor: '#f5f5f5', textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} DLanD Lab - Towson University
        </Typography>
      </Box>
    </Box>
  );
};

export default Layout;