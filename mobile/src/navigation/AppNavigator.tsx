// Main navigation structure for HaMaaser mobile app
// Handles Auth flow and Main tab navigation

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from '../stores/authStore';

// Auth screens
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import VerifyEmailScreen from '../screens/auth/VerifyEmailScreen';

// Placeholder screens - will be implemented in Phase 3
const FeedScreen = () => null;
const StoryDetailScreen = () => null;
const DonationFlowScreen = () => null;
const SuccessScreen = () => null;
const DonationsListScreen = () => null;
const ProfileScreen = () => null;

// Auth Stack - before user logs in
const AuthStack = createStackNavigator();
const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
    <AuthStack.Screen name="SignUp" component={SignUpScreen} />
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
  </AuthStack.Navigator>
);

// Main Stack - after user logs in
const MainStack = createStackNavigator();
const MainNavigator = () => (
  <MainStack.Navigator>
    <MainStack.Screen 
      name="Feed" 
      component={FeedScreen}
      options={{ title: 'Stories' }}
    />
    <MainStack.Screen 
      name="StoryDetail" 
      component={StoryDetailScreen}
      options={{ title: 'Story Details' }}
    />
    <MainStack.Screen 
      name="DonationFlow" 
      component={DonationFlowScreen}
      options={{ title: 'Make a Donation' }}
    />
    <MainStack.Screen 
      name="Success" 
      component={SuccessScreen}
      options={{ headerShown: false }}
    />
    <MainStack.Screen 
      name="MyDonations" 
      component={DonationsListScreen}
      options={{ title: 'My Donations' }}
    />
    <MainStack.Screen 
      name="Profile" 
      component={ProfileScreen}
      options={{ title: 'Profile' }}
    />
  </MainStack.Navigator>
);

// Root Navigator - switches between Auth and Main based on auth state
const AppNavigator: React.FC = () => {
  const { user, isLoading, initAuthListener } = useAuthStore();

  // Setup auth state listener on mount
  useEffect(() => {
    const unsubscribe = initAuthListener();
    return () => unsubscribe();
  }, [initAuthListener]);

  if (isLoading) {
    // Show loading screen while checking auth state
    return null;
  }

  return (
    <NavigationContainer>
      {user ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default AppNavigator;
