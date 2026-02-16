import React, { useState } from 'react';
import { Box, TextField, Button, Paper, Typography, CircularProgress, Chip } from '@mui/material';
import { generateText, queryUserStatus } from '../../services/ai.service';
import { useAuth } from '../../contexts/AuthContext';

const AIChat: React.FC = () => {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Başvuru/destek/sipariş durumu ile ilgili anahtar kelimeler
  const statusKeywords = ['başvuru', 'durum', 'destek', 'talep', 'başvurum', 'durumu', 'nerede', 'ne zaman', 'onaylandı', 'reddedildi', 'beklemede', 'sipariş', 'siparişim', 'siparişler', 'takip', 'kargo', 'teslimat', 'gönderildi', 'hazırlanıyor', 'teslim'];

  const isStatusQuery = (text: string) => {
    const lowerText = text.toLowerCase();
    return statusKeywords.some(keyword => lowerText.includes(keyword));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      let result: string;
      
      // Eğer kullanıcı giriş yapmış ve durum sorgusu yapıyorsa
      if (user && isStatusQuery(prompt)) {
        result = await queryUserStatus(user.uid, prompt);
      } else {
        result = await generateText(prompt);
      }
      
      setResponse(result);
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
      console.error('AI yanıt hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuery = (query: string) => {
    setPrompt(query);
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

        {user && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Hızlı Sorgular:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                label="Başvurularımın durumu nedir?"
                onClick={() => handleQuickQuery('Başvurularımın durumu nedir?')}
                variant="outlined"
                size="small"
                sx={{ cursor: 'pointer' }}
              />
              <Chip 
                label="Siparişlerimi takip et"
                onClick={() => handleQuickQuery('Siparişlerimi takip et')}
                variant="outlined"
                size="small"
                sx={{ cursor: 'pointer' }}
              />
              <Chip 
                label="Destek taleplerimi göster"
                onClick={() => handleQuickQuery('Destek taleplerimi göster')}
                variant="outlined"
                size="small"
                sx={{ cursor: 'pointer' }}
              />
              <Chip 
                label="Bekleyen işlemlerim var mı?"
                onClick={() => handleQuickQuery('Bekleyen işlemlerim var mı?')}
                variant="outlined"
                size="small"
                sx={{ cursor: 'pointer' }}
              />
            </Box>
          </Box>
        )}

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