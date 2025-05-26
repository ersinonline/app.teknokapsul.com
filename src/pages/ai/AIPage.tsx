import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import AIChat from '../../components/ai/AIChat';

const AIPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            backgroundClip: 'text',
            textFillColor: 'transparent',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          AI Asistan
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{ maxWidth: 600, mx: 'auto' }}
        >
          Yapay zeka asistanımızla sohbet edin, sorularınızı yanıtlayalım
        </Typography>
      </Box>

      <AIChat />
    </Container>
  );
};

export default AIPage; 