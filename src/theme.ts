import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#EAB308',
    secondary: '#64748B',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    error: '#EF4444',
    text: '#1E293B',
    placeholder: '#94A3B8',
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },
  roundness: 8,
};