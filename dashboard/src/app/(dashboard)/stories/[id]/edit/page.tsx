'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '@/lib/firebase-client';
import getApp from '@/lib/firebase-client';
import StoryForm from '@/components/StoryForm';

interface Story {
  id: string;
  title: string;
  titleHe: string;
  shortDescription: string;
  shortDescriptionHe: string;
  description: string;
  descriptionHe: string;
  goalAmount?: number;
  tags: string[];
  category: string;
  videoUrl?: string;
  status: string;
  images: string[];
}

export default function EditStoryPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;

  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function fetchStory() {
      try {
        const storyRef = doc(db, 'stories', storyId);
        const storyDoc = await getDoc(storyRef);

        if (storyDoc.exists()) {
          setStory({ id: storyDoc.id, ...storyDoc.data() } as Story);
        } else {
          alert('Story not found');
          router.push('/stories');
        }
      } catch (error) {
        console.error('Error fetching story:', error);
        alert('Failed to load story');
      } finally {
        setLoading(false);
      }
    }

    fetchStory();
  }, [storyId, router]);

  const handleSubmit = async (data: any, imageUrls: string[]) => {
    try {
      const app = getApp();
      const functions = getFunctions(app);
      const updateStoryFn = httpsCallable(functions, 'updateStory');

      // Merge new images with existing ones if no new images uploaded
      const finalImages = imageUrls.length > 0 ? imageUrls : story?.images || [];

      const result = await updateStoryFn({
        storyId: storyId,
        ...data,
        ...(imageUrls.length > 0 && { images: finalImages }),
      });

      const response = result.data as any;

      if (response.success) {
        alert('Story updated successfully!');
        router.push('/stories');
      } else {
        throw new Error('Failed to update story');
      }
    } catch (error: any) {
      console.error('Error updating story:', error);
      throw new Error(error.message || 'Failed to update story. Please try again.');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!confirm(`Are you sure you want to ${newStatus === 'paused' ? 'pause' : 'activate'} this story?`)) {
      return;
    }

    try {
      setActionLoading(true);
      const app = getApp();
      const functions = getFunctions(app);
      const updateStoryFn = httpsCallable(functions, 'updateStory');

      const result = await updateStoryFn({
        storyId: storyId,
        status: newStatus,
      });

      const response = result.data as any;

      if (response.success) {
        alert(`Story ${newStatus === 'paused' ? 'paused' : 'activated'} successfully!`);
        router.push('/stories');
      } else {
        throw new Error('Failed to change story status');
      }
    } catch (error: any) {
      console.error('Error changing status:', error);
      alert(error.message || 'Failed to change story status. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">Story not found</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Edit Story</h1>
          <p className="text-gray-600 mt-2">
            Status: <span className="font-semibold capitalize">{story.status.replace('_', ' ')}</span>
          </p>
        </div>

        {/* Status Actions */}
        {(story.status === 'active' || story.status === 'paused') && (
          <div className="flex gap-2">
            {story.status === 'active' && (
              <button
                onClick={() => handleStatusChange('paused')}
                disabled={actionLoading}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
              >
                Pause Story
              </button>
            )}
            {story.status === 'paused' && (
              <button
                onClick={() => handleStatusChange('active')}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Reactivate Story
              </button>
            )}
          </div>
        )}
      </div>

      {story.status === 'pending_approval' && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-6">
          This story is waiting for admin approval. You can still make edits, but major changes may require re-approval.
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg p-6">
        <StoryForm
          initialData={story}
          onSubmit={handleSubmit}
          submitLabel="Update Story"
        />
      </div>
    </div>
  );
}
