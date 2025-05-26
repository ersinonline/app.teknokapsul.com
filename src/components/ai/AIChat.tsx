import React, { useState } from 'react';
import { Box, TextField, Button, Paper, Typography, CircularProgress } from '@mui/material';
import { generateText } from '../../services/ai.service';

const AIChat: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await generateText(prompt);
      setResponse(result);
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
      console.error('AI yanıt hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3,
          borderRadius: 2,
          bgcolor: 'background.paper'
        }}
      >
        <Typography 
          variant="h5" 
          gutterBottom 
          sx={{ 
            fontWeight: 600,
            color: 'primary.main',
            mb: 3
          }}
        >
          AI Asistan
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Sorunuzu buraya yazın..."
            variant="outlined"
            disabled={loading}
            sx={{ mb: 2 }}
          />

          <Button
            type="submit"
            variant="contained"
            disabled={loading || !prompt.trim()}
            sx={{ 
              minWidth: 120,
              height: 48,
              borderRadius: 2
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Gönder'
            )}
          </Button>
        </form>

        {error && (
          <Typography 
            color="error" 
            sx={{ mt: 2 }}
          >
            {error}
          </Typography>
        )}

        {response && (
          <Paper 
            elevation={0}
            sx={{ 
              mt: 3,
              p: 2,
              bgcolor: 'grey.50',
              borderRadius: 2
            }}
          >
            <Typography 
              variant="body1"
              sx={{ 
                whiteSpace: 'pre-wrap',
                color: 'text.primary'
              }}
            >
              {response}
            </Typography>
          </Paper>
        )}
      </Paper>
    </Box>
  );
};

export default AIChat; 