// Story service for Firestore operations
// Handles fetching stories from Firestore with pagination

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  doc,
  getDoc,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { Story } from '../../../shared/types';

const STORIES_COLLECTION = 'stories';
const STORIES_PER_PAGE = 10;

/**
 * Fetch active stories with pagination
 * @param lastVisible Last document from previous page (for pagination)
 * @returns Array of stories and last visible document
 */
export const getActiveStories = async (
  lastVisible?: QueryDocumentSnapshot
): Promise<{ stories: Story[]; lastVisible: QueryDocumentSnapshot | null }> => {
  try {
    let q = query(
      collection(db, STORIES_COLLECTION),
      where('status', '==', 'active'),
      orderBy('publishedAt', 'desc'),
      limit(STORIES_PER_PAGE)
    );

    if (lastVisible) {
      q = query(
        collection(db, STORIES_COLLECTION),
        where('status', '==', 'active'),
        orderBy('publishedAt', 'desc'),
        startAfter(lastVisible),
        limit(STORIES_PER_PAGE)
      );
    }

    const querySnapshot = await getDocs(q);
    
    const stories: Story[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      stories.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        publishedAt: data.publishedAt?.toDate() || null,
      } as Story);
    });

    const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1] || null;

    return {
      stories,
      lastVisible: lastDoc,
    };
  } catch (error) {
    console.error('Error fetching stories:', error);
    throw new Error('Failed to fetch stories');
  }
};

/**
 * Fetch a single story by ID
 * @param storyId Story document ID
 * @returns Story data with denormalized NGO information
 */
export const getStoryById = async (storyId: string): Promise<Story> => {
  try {
    const storyDoc = await getDoc(doc(db, STORIES_COLLECTION, storyId));
    
    if (!storyDoc.exists()) {
      throw new Error('Story not found');
    }

    const data = storyDoc.data();
    
    return {
      id: storyDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      publishedAt: data.publishedAt?.toDate() || null,
    } as Story;
  } catch (error) {
    console.error('Error fetching story:', error);
    throw new Error('Failed to fetch story');
  }
};
