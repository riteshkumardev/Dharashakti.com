import React from 'react';
import { Snackbar, Alert } from '@mui/material';

const CustomSnackbar = ({ open, message, severity, onClose }) => {
  return (
    <Snackbar 
      open={open} 
      autoHideDuration={3000} 
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }} // Top center mein dikhega
    >
      <Alert 
        onClose={onClose} 
        severity={severity} // success, error, warning, info
        variant="filled" 
        sx={{ width: '100%', borderRadius: '8px', fontWeight: '500' }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default CustomSnackbar;