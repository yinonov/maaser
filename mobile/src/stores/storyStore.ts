// Story feed state management using Zustand
// Manages story list, pagination, and feed operations

import { create } from 'zustand';
import { Story } from '../../../shared/types';

interface StoryState {
  stories: Story[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  lastVisible: any; // Firestore DocumentSnapshot for pagination
  
  // Actions
  setStories: (stories: Story[]) => void;
  appendStories: (stories: Story[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHasMore: (hasMore: boolean) => void;
  setLastVisible: (lastVisible: any) => void;
  reset: () => void;
}

export const useStoryStore = create<StoryState>((set) => ({
  stories: [],
  isLoading: false,
  error: null,
  hasMore: true,
  lastVisible: null,

  setStories: (stories) => set({ stories, error: null }),
  
  appendStories: (newStories) => 
    set((state) => ({ stories: [...state.stories, ...newStories] })),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error, isLoading: false }),
  
  setHasMore: (hasMore) => set({ hasMore }),
  
  setLastVisible: (lastVisible) => set({ lastVisible }),
  
  reset: () => set({ 
    stories: [], 
    isLoading: false, 
    error: null, 
    hasMore: true, 
    lastVisible: null 
  }),
}));
