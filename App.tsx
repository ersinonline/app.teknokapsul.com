import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from './src/contexts/AuthContext';
import { theme } from './src/theme';

// Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import PaymentsScreen from './src/screens/PaymentsScreen';
import ServicesScreen from './src/screens/ServicesScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.secondary,
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color }) => <Icon name="home" size={24} color={color} />
        }}
      />
      <Tab.Screen 
        name="Services" 
        component={ServicesScreen}
        options={{
          title: 'Hizmetler',
          tabBarIcon: ({ color }) => <Icon name="grid" size={24} color={color} />
        }}
      />
      <Tab.Screen 
        name="Payments" 
        component={PaymentsScreen}
        options={{
          title: 'Borçlar',
          tabBarIcon: ({ color }) => <Icon name="credit-card" size={24} color={color} />
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          title: 'Ayarlar',
          tabBarIcon: ({ color }) => <Icon name="settings" size={24} color={color} />
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Main" component={TabNavigator} />
          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </PaperProvider>
  );
}