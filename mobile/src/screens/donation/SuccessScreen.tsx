// Success Screen shown after successful donation
// Displays donation summary with receipt information

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../../constants/colors';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Donation } from '../../../../shared/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

type MainStackParamList = {
  Feed: undefined;
  StoryDetail: { storyId: string };
  DonationFlow: { storyId: string };
  Success: { donationId: string };
};

type SuccessScreenProps = {
  navigation: NativeStackNavigationProp<MainStackParamList, 'Success'>;
  route: RouteProp<MainStackParamList, 'Success'>;
};

const SuccessScreen: React.FC<SuccessScreenProps> = ({ navigation, route }) => {
  const { donationId } = route.params;
  const [donation, setDonation] = useState<Donation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDonation();
  }, [donationId]);

  const loadDonation = async () => {
    try {
      const donationDoc = await getDoc(doc(db, 'donations', donationId));
      if (donationDoc.exists()) {
        const data = donationDoc.data();
        setDonation({
          id: donationDoc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          paidAt: data.paidAt?.toDate() || null,
        } as Donation);
      }
    } catch (error) {
      console.error('Error loading donation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const handleBackToStories = () => {
    // Navigate to Feed and refresh
    navigation.reset({
      index: 0,
      routes: [{ name: 'Feed' }],
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Success Animation/Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.successIcon}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        </View>

        {/* Success Message */}
        <View style={styles.header}>
          <Text style={styles.title}>התרומה בוצעה בהצלחה!</Text>
          <Text style={styles.subtitle}>תודה רבה על נדיבותך</Text>
        </View>

        {/* Donation Summary */}
        {donation && (
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryValue}>
                {formatCurrency(donation.amount)}
              </Text>
              <Text style={styles.summaryLabel}>סכום תרומה</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryValue}>
                {donation.storyTitle || 'סיפור'}
              </Text>
              <Text style={styles.summaryLabel}>עבור</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryValue}>
                {donation.ngoName || 'עמותה'}
              </Text>
              <Text style={styles.summaryLabel}>לטובת</Text>
            </View>

            {donation.receiptNumber && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryValue}>{donation.receiptNumber}</Text>
                <Text style={styles.summaryLabel}>מספר קבלה</Text>
              </View>
            )}
          </View>
        )}

        {/* Receipt Info */}
        <View style={styles.receiptInfo}>
          <Text style={styles.receiptText}>
            קבלה תישלח לאימייל שלך תוך 5 דקות
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleBackToStories}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>חזרה לסיפורים</Text>
          </TouchableOpacity>

          {/* View Receipt Button (placeholder for future) */}
          {donation?.receiptUrl && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => {
                // TODO: Open receipt URL or navigate to receipt viewer
                console.log('View receipt:', donation.receiptUrl);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>צפה בקבלה</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Share Button (placeholder - out of scope per spec) */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            שתף את הסיפור עם חברים וקרובים
          </Text>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => {
              // TODO: Implement sharing functionality
              console.log('Share story');
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.shareButtonText}>שתף</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 60,
    fontWeight: 'bold',
    color: colors.text.inverse,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  summary: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  receiptInfo: {
    backgroundColor: colors.info + '20',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  receiptText: {
    fontSize: 14,
    color: colors.text.primary,
    textAlign: 'center',
  },
  actions: {
    gap: 12,
    marginBottom: 24,
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
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 12,
    textAlign: 'center',
  },
  shareButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent,
  },
});

export default SuccessScreen;
