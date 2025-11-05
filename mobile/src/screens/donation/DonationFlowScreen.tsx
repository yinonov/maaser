// Donation Flow Screen with amount selection and payment
// Handles donation amount, optional message, anonymous toggle, fee breakdown, and Stripe payment

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors } from '../../constants/colors';
import { createPaymentIntent, confirmPayment } from '../../services/paymentService';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

const PRESET_AMOUNTS = [1800, 5000, 10000]; // 18₪, 50₪, 100₪ in agorot
const MIN_AMOUNT = 500; // 5₪ in agorot
const PLATFORM_FEE_PERCENTAGE = 0.02; // 2%

type MainStackParamList = {
  Feed: undefined;
  StoryDetail: { storyId: string };
  DonationFlow: { storyId: string };
  Success: { donationId: string };
};

type DonationFlowScreenProps = {
  navigation: NativeStackNavigationProp<MainStackParamList, 'DonationFlow'>;
  route: RouteProp<MainStackParamList, 'DonationFlow'>;
};

const DonationFlowScreen: React.FC<DonationFlowScreenProps> = ({ navigation, route }) => {
  const { storyId } = route.params;
  
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const getAmount = (): number => {
    if (customAmount) {
      return parseInt(customAmount) * 100; // Convert to agorot
    }
    return selectedAmount || 0;
  };

  const calculateFees = (amount: number) => {
    const platformFee = Math.floor(amount * PLATFORM_FEE_PERCENTAGE);
    const ngoAmount = amount - platformFee;
    return { platformFee, ngoAmount };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const handlePresetAmount = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (text: string) => {
    // Only allow numbers
    const numericText = text.replace(/[^0-9]/g, '');
    setCustomAmount(numericText);
    setSelectedAmount(null);
  };

  const handleDonate = async () => {
    const amount = getAmount();

    if (amount < MIN_AMOUNT) {
      Alert.alert('שגיאה', `סכום מינימלי לתרומה הוא ${formatCurrency(MIN_AMOUNT)}`);
      return;
    }

    if (message.length > 500) {
      Alert.alert('שגיאה', 'ההודעה ארוכה מדי (מקסימום 500 תווים)');
      return;
    }

    setIsProcessing(true);
    try {
      // Create payment intent
      const { clientSecret, donationId } = await createPaymentIntent(
        storyId,
        amount,
        message || undefined,
        isAnonymous
      );

      // Confirm payment (placeholder - will use Stripe SDK in production)
      const result = await confirmPayment(clientSecret);

      if (result.success) {
        // Navigate to success screen
        navigation.replace('Success', { donationId });
      } else {
        Alert.alert('שגיאת תשלום', result.error || 'התשלום נכשל, נסה שוב');
      }
    } catch (error: any) {
      console.error('Donation error:', error);
      Alert.alert('שגיאה', error.message || 'משהו השתבש, נסה שוב');
    } finally {
      setIsProcessing(false);
    }
  };

  const amount = getAmount();
  const { platformFee, ngoAmount } = calculateFees(amount);
  const isAmountValid = amount >= MIN_AMOUNT;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>בחר סכום תרומה</Text>
            <Text style={styles.subtitle}>כל תרומה עושה את ההבדל</Text>
          </View>

          {/* Preset Amounts */}
          <View style={styles.presetsContainer}>
            {PRESET_AMOUNTS.map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[
                  styles.presetButton,
                  selectedAmount === preset && styles.presetButtonActive,
                ]}
                onPress={() => handlePresetAmount(preset)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.presetText,
                    selectedAmount === preset && styles.presetTextActive,
                  ]}
                >
                  {formatCurrency(preset)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Amount */}
          <View style={styles.customAmountContainer}>
            <Text style={styles.label}>או הזן סכום אחר (₪)</Text>
            <TextInput
              style={styles.customAmountInput}
              value={customAmount}
              onChangeText={handleCustomAmountChange}
              placeholder="סכום בשקלים"
              placeholderTextColor={colors.text.disabled}
              keyboardType="numeric"
              textAlign="center"
            />
          </View>

          {/* Fee Breakdown */}
          {isAmountValid && (
            <View style={styles.feeBreakdown}>
              <View style={styles.feeRow}>
                <Text style={styles.feeValue}>{formatCurrency(ngoAmount)}</Text>
                <Text style={styles.feeLabel}>לעמותה</Text>
              </View>
              <View style={styles.feeRow}>
                <Text style={styles.feeValue}>{formatCurrency(platformFee)}</Text>
                <Text style={styles.feeLabel}>עמלת פלטפורמה (2%)</Text>
              </View>
              <View style={[styles.feeRow, styles.totalRow]}>
                <Text style={styles.totalValue}>{formatCurrency(amount)}</Text>
                <Text style={styles.totalLabel}>סך הכל</Text>
              </View>
            </View>
          )}

          {/* Optional Message */}
          <View style={styles.messageContainer}>
            <Text style={styles.label}>הודעה (אופציונלי)</Text>
            <TextInput
              style={styles.messageInput}
              value={message}
              onChangeText={setMessage}
              placeholder="כתוב הודעה לעמותה..."
              placeholderTextColor={colors.text.disabled}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlign="right"
            />
            <Text style={styles.characterCount}>{message.length}/500</Text>
          </View>

          {/* Anonymous Toggle */}
          <TouchableOpacity
            style={styles.anonymousToggle}
            onPress={() => setIsAnonymous(!isAnonymous)}
            activeOpacity={0.8}
          >
            <View style={styles.checkboxContainer}>
              <View style={[styles.checkbox, isAnonymous && styles.checkboxChecked]}>
                {isAnonymous && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.anonymousText}>תרומה אנונימית</Text>
            </View>
          </TouchableOpacity>

          {/* Donate Button */}
          <TouchableOpacity
            style={[
              styles.donateButton,
              (!isAmountValid || isProcessing) && styles.donateButtonDisabled,
            ]}
            onPress={handleDonate}
            disabled={!isAmountValid || isProcessing}
            activeOpacity={0.8}
          >
            {isProcessing ? (
              <ActivityIndicator color={colors.text.inverse} />
            ) : (
              <Text style={styles.donateButtonText}>
                המשך לתשלום {isAmountValid && `- ${formatCurrency(amount)}`}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'right',
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'right',
  },
  presetsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  presetButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  presetButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  presetText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  presetTextActive: {
    color: colors.text.inverse,
  },
  customAmountContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'right',
  },
  customAmountInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
    backgroundColor: colors.background,
  },
  feeBreakdown: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  feeLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  feeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  messageContainer: {
    marginBottom: 24,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.background,
    minHeight: 100,
  },
  characterCount: {
    fontSize: 12,
    color: colors.text.disabled,
    textAlign: 'left',
    marginTop: 4,
  },
  anonymousToggle: {
    marginBottom: 32,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 6,
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkmark: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: 'bold',
  },
  anonymousText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  donateButton: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  donateButtonDisabled: {
    backgroundColor: colors.text.disabled,
  },
  donateButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.inverse,
  },
});

export default DonationFlowScreen;
