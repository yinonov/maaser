// Story Card component for displaying story preview in feed
// Shows thumbnail, title, description, progress bar, and donate button

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { colors } from '../constants/colors';
import { Story } from '../../../shared/types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32; // 16px padding on each side

interface StoryCardProps {
  story: Story;
  onPress: () => void;
}

const StoryCard: React.FC<StoryCardProps> = ({ story, onPress }) => {
  // Calculate progress percentage
  const progress = story.goalAmount
    ? Math.min((story.raisedAmount / story.goalAmount) * 100, 100)
    : 0;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Thumbnail Image */}
      {story.images && story.images.length > 0 ? (
        <Image
          source={{ uri: story.images[0] }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.thumbnail, styles.placeholderThumbnail]}>
          <Text style={styles.placeholderText}>אין תמונה</Text>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {story.titleHe || story.title}
        </Text>

        {/* Short Description */}
        <Text style={styles.description} numberOfLines={3}>
          {story.descriptionHe || story.description}
        </Text>

        {/* NGO Info */}
        <View style={styles.ngoInfo}>
          <Text style={styles.ngoName}>
            {story.ngoNameHe || story.ngoName}
          </Text>
          {story.ngoVerified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓</Text>
            </View>
          )}
        </View>

        {/* Progress Section */}
        {story.goalAmount && (
          <View style={styles.progressSection}>
            {/* Progress Bar */}
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${progress}%` },
                ]}
              />
            </View>

            {/* Progress Text */}
            <View style={styles.progressInfo}>
              <Text style={styles.raisedText}>
                {formatCurrency(story.raisedAmount)} נגבו
              </Text>
              <Text style={styles.goalText}>
                מתוך {formatCurrency(story.goalAmount)}
              </Text>
            </View>
          </View>
        )}

        {/* Donate Button */}
        <TouchableOpacity
          style={styles.donateButton}
          onPress={onPress}
          activeOpacity={0.8}
        >
          <Text style={styles.donateButtonText}>תרום עכשיו</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  thumbnail: {
    width: '100%',
    height: 200,
    backgroundColor: colors.surface,
  },
  placeholderThumbnail: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: colors.text.disabled,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'right',
  },
  description: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 12,
    textAlign: 'right',
  },
  ngoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    justifyContent: 'flex-end',
  },
  ngoName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: 6,
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.info,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 12,
    color: colors.background,
    fontWeight: 'bold',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  raisedText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  goalText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  donateButton: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  donateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.inverse,
  },
});

export default StoryCard;
