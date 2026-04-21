import { Snackbar, Alert } from '@mui/material';

export default function Toast({ open, message, severity, onClose }) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{ mt: 8, zIndex: 3000 }} 
    >
      <Alert 
        onClose={onClose} 
        severity={severity} 
        variant="filled"
        sx={{ 
          width: '100%', 
          borderRadius: '1rem',
          fontWeight: 'bold',
          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
          textTransform: 'uppercase',
          fontSize: '0.75rem',
          letterSpacing: '0.05em'
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
