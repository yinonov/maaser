// Feed Screen with infinite scroll story feed
// Displays active stories with pull-to-refresh and pagination

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Text,
  SafeAreaView,
} from 'react-native';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import { colors } from '../../constants/colors';
import { getActiveStories } from '../../services/storyService';
import { useStoryStore } from '../../stores/storyStore';
import StoryCard from '../../components/StoryCard';
import { Story } from '../../../../shared/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type MainStackParamList = {
  Feed: undefined;
  StoryDetail: { storyId: string };
  DonationFlow: { storyId: string };
};

type FeedScreenProps = {
  navigation: NativeStackNavigationProp<MainStackParamList, 'Feed'>;
};

const FeedScreen: React.FC<FeedScreenProps> = ({ navigation }) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial stories
  const loadStories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { stories: fetchedStories, lastVisible: lastDoc } = await getActiveStories();
      setStories(fetchedStories);
      setLastVisible(lastDoc);
      setHasMore(fetchedStories.length >= 10);
    } catch (err: any) {
      setError(err.message || 'Failed to load stories');
      console.error('Error loading stories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Pull to refresh
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      const { stories: fetchedStories, lastVisible: lastDoc } = await getActiveStories();
      setStories(fetchedStories);
      setLastVisible(lastDoc);
      setHasMore(fetchedStories.length >= 10);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh stories');
      console.error('Error refreshing stories:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Load more stories (pagination)
  const loadMore = async () => {
    if (isLoadingMore || !hasMore || !lastVisible) return;

    try {
      setIsLoadingMore(true);
      const { stories: fetchedStories, lastVisible: lastDoc } = await getActiveStories(lastVisible);
      
      if (fetchedStories.length === 0) {
        setHasMore(false);
      } else {
        setStories((prev) => [...prev, ...fetchedStories]);
        setLastVisible(lastDoc);
        setHasMore(fetchedStories.length >= 10);
      }
    } catch (err: any) {
      console.error('Error loading more stories:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    loadStories();
  }, []);

  const handleStoryPress = (storyId: string) => {
    navigation.navigate('StoryDetail', { storyId });
  };

  const renderStoryCard = useCallback(
    ({ item }: { item: Story }) => (
      <StoryCard
        story={item}
        onPress={() => handleStoryPress(item.id)}
      />
    ),
    []
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {error ? error : 'אין סיפורים זמינים כרגע'}
        </Text>
      </View>
    );
  };

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={stories}
        renderItem={renderStoryCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  listContent: {
    paddingVertical: 8,
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

export default FeedScreen;
