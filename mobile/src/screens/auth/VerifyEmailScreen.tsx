// Email verification screen with resend button
// Displayed after signup until user verifies email

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors } from '../../constants/colors';
import { resendVerificationEmail, logout } from '../../services/auth';
import { useAuthStore } from '../../stores/authStore';
import { auth } from '../../services/firebase';

const VerifyEmailScreen: React.FC = () => {
  const [isResending, setIsResending] = useState(false);
  const { user, logout: logoutStore } = useAuthStore();

  const handleResend = async () => {
    setIsResending(true);
    try {
      await resendVerificationEmail();
      Alert.alert('נשלח בהצלחה', 'אימייל אימות נשלח לכתובת שלך');
    } catch (error: any) {
      Alert.alert('שגיאה', error.message);
    } finally {
      setIsResending(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      logoutStore();
    } catch (error: any) {
      Alert.alert('שגיאה', error.message);
    }
  };

  const handleRefresh = async () => {
    // Reload the user to check if email is verified
    await auth.currentUser?.reload();
    const isVerified = auth.currentUser?.emailVerified;
    
    if (isVerified) {
      Alert.alert('מאומת!', 'האימייל שלך אומת בהצלחה. תוכל להמשיך.');
      // The auth listener will update the user state automatically
    } else {
      Alert.alert('טרם אומת', 'נא לאמת את האימייל ולנסות שוב');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Icon placeholder */}
        <View style={styles.iconContainer}>
          <View style={styles.icon}>
            <Text style={styles.iconText}>✉️</Text>
          </View>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>אמת את כתובת האימייל</Text>
          <Text style={styles.subtitle}>
            שלחנו אימייל אימות לכתובת
          </Text>
          <Text style={styles.email}>{user?.email}</Text>
          <Text style={styles.description}>
            נא ללחוץ על הקישור באימייל כדי לאמת את החשבון שלך
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleRefresh}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>אימתתי, המשך</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleResend}
            disabled={isResending}
            activeOpacity={0.8}
          >
            {isResending ? (
              <ActivityIndicator color={colors.text.primary} />
            ) : (
              <Text style={styles.secondaryButtonText}>שלח שוב</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>כתובת אימייל שגויה? </Text>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.link}>חזור</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  icon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  actions: {
    gap: 16,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: colors.accent,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  link: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
});

export default VerifyEmailScreen;
