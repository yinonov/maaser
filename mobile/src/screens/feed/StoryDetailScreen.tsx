// Story Detail Screen with full story information
// Displays hero image, description, photo gallery, progress, NGO info, and donate button

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { colors } from '../../constants/colors';
import { getStoryById } from '../../services/storyService';
import { Story } from '../../../../shared/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

const { width } = Dimensions.get('window');

type MainStackParamList = {
  Feed: undefined;
  StoryDetail: { storyId: string };
  DonationFlow: { storyId: string };
};

type StoryDetailScreenProps = {
  navigation: NativeStackNavigationProp<MainStackParamList, 'StoryDetail'>;
  route: RouteProp<MainStackParamList, 'StoryDetail'>;
};

const StoryDetailScreen: React.FC<StoryDetailScreenProps> = ({ navigation, route }) => {
  const { storyId } = route.params;
  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStory();
  }, [storyId]);

  const loadStory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedStory = await getStoryById(storyId);
      setStory(fetchedStory);
    } catch (err: any) {
      setError(err.message || 'Failed to load story');
      console.error('Error loading story:', err);
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

  const handleDonate = () => {
    if (story) {
      navigation.navigate('DonationFlow', { storyId: story.id });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !story) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {error || 'Story not found'}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={loadStory}
        >
          <Text style={styles.retryButtonText}>נסה שוב</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const progress = story.goalAmount
    ? Math.min((story.raisedAmount / story.goalAmount) * 100, 100)
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Hero Image */}
        {story.images && story.images.length > 0 ? (
          <Image
            source={{ uri: story.images[0] }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.heroImage, styles.placeholderHero]}>
            <Text style={styles.placeholderText}>אין תמונה</Text>
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title}>
            {story.titleHe || story.title}
          </Text>

          {/* NGO Information */}
          <View style={styles.ngoSection}>
            <View style={styles.ngoHeader}>
              {story.ngoLogo ? (
                <Image
                  source={{ uri: story.ngoLogo }}
                  style={styles.ngoLogo}
                />
              ) : (
                <View style={[styles.ngoLogo, styles.ngoLogoPlaceholder]}>
                  <Text style={styles.ngoLogoText}>
                    {(story.ngoNameHe || story.ngoName).charAt(0)}
                  </Text>
                </View>
              )}
              <View style={styles.ngoInfo}>
                <View style={styles.ngoNameRow}>
                  <Text style={styles.ngoName}>
                    {story.ngoNameHe || story.ngoName}
                  </Text>
                  {story.ngoVerified && (
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>✓</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.ngoCategory}>ארגון מאומת</Text>
              </View>
            </View>
          </View>

          {/* Progress Section */}
          {story.goalAmount && (
            <View style={styles.progressSection}>
              <View style={styles.progressStats}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>
                    {formatCurrency(story.raisedAmount)}
                  </Text>
                  <Text style={styles.statLabel}>נגבו</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{Math.round(progress)}%</Text>
                  <Text style={styles.statLabel}>מהיעד</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{story.donationCount || 0}</Text>
                  <Text style={styles.statLabel}>תורמים</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${progress}%` },
                  ]}
                />
              </View>

              <Text style={styles.goalText}>
                יעד: {formatCurrency(story.goalAmount)}
              </Text>
            </View>
          )}

          {/* Full Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>על הסיפור</Text>
            <Text style={styles.description}>
              {story.descriptionHe || story.description}
            </Text>
          </View>

          {/* Photo Gallery */}
          {story.images && story.images.length > 1 && (
            <View style={styles.gallerySection}>
              <Text style={styles.sectionTitle}>תמונות</Text>
              <FlatList
                data={story.images.slice(1)}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, index) => `${item}-${index}`}
                renderItem={({ item }) => (
                  <Image
                    source={{ uri: item }}
                    style={styles.galleryImage}
                    resizeMode="cover"
                  />
                )}
                contentContainerStyle={styles.galleryContent}
              />
            </View>
          )}

          {/* Tags */}
          {story.tags && story.tags.length > 0 && (
            <View style={styles.tagsSection}>
              {story.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Fixed Donate Button */}
      <View style={styles.donateButtonContainer}>
        <TouchableOpacity
          style={styles.donateButton}
          onPress={handleDonate}
          activeOpacity={0.8}
        >
          <Text style={styles.donateButtonText}>תרום עכשיו</Text>
        </TouchableOpacity>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  scrollView: {
    flex: 1,
  },
  heroImage: {
    width: '100%',
    height: 300,
    backgroundColor: colors.surface,
  },
  placeholderHero: {
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
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 16,
    textAlign: 'right',
  },
  ngoSection: {
    marginBottom: 24,
  },
  ngoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ngoLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginLeft: 12,
  },
  ngoLogoPlaceholder: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ngoLogoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.inverse,
  },
  ngoInfo: {
    flex: 1,
  },
  ngoNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ngoName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
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
  ngoCategory: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 2,
  },
  progressSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: colors.background,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 5,
  },
  goalText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  descriptionSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 12,
    textAlign: 'right',
  },
  description: {
    fontSize: 16,
    color: colors.text.primary,
    lineHeight: 24,
    textAlign: 'right',
  },
  gallerySection: {
    marginBottom: 24,
  },
  galleryContent: {
    paddingRight: 0,
  },
  galleryImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginLeft: 12,
  },
  tagsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 80, // Space for fixed button
  },
  tag: {
    backgroundColor: colors.surface,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  donateButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  donateButton: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  donateButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.inverse,
  },
});

export default StoryDetailScreen;
