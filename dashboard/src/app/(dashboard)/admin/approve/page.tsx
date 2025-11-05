'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '@/lib/firebase-client';
import getApp from '@/lib/firebase-client';

interface Story {
  id: string;
  title: string;
  titleHe: string;
  shortDescription: string;
  ngoName: string;
  thumbnailImage: string;
  createdAt: any;
  category: string;
  tags: string[];
  images: string[];
}

export default function ApproveStoriesPage() {
  const { data: session } = useSession();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    // Verify platform admin role
    const userData = session?.user as any;
    if (userData?.profileType !== 'platform_admin') {
      alert('Access denied. Platform admin role required.');
      window.location.href = '/';
      return;
    }

    fetchPendingStories();
  }, [session]);

  const fetchPendingStories = async () => {
    try {
      const storiesRef = collection(db, 'stories');
      const q = query(
        storiesRef,
        where('status', '==', 'pending_approval'),
        orderBy('createdAt', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const storiesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Story[];

      setStories(storiesData);
    } catch (error) {
      console.error('Error fetching pending stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (storyId: string, notes?: string) => {
    if (!confirm('Are you sure you want to approve this story?')) {
      return;
    }

    try {
      setActionLoading(true);
      const app = getApp();
      const functions = getFunctions(app);
      const approveStoryFn = httpsCallable(functions, 'approveStory');

      const result = await approveStoryFn({
        storyId: storyId,
        approved: true,
        notes: notes || 'Story approved',
      });

      const response = result.data as any;

      if (response.success) {
        alert('Story approved successfully!');
        // Refresh the list
        setStories(prev => prev.filter(s => s.id !== storyId));
        setSelectedStory(null);
      } else {
        throw new Error('Failed to approve story');
      }
    } catch (error: any) {
      console.error('Error approving story:', error);
      alert(error.message || 'Failed to approve story. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (storyId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }

    if (!confirm('Are you sure you want to reject this story?')) {
      return;
    }

    try {
      setActionLoading(true);
      const app = getApp();
      const functions = getFunctions(app);
      const approveStoryFn = httpsCallable(functions, 'approveStory');

      const result = await approveStoryFn({
        storyId: storyId,
        approved: false,
        reason: rejectionReason,
      });

      const response = result.data as any;

      if (response.success) {
        alert('Story rejected and NGO has been notified.');
        // Refresh the list
        setStories(prev => prev.filter(s => s.id !== storyId));
        setSelectedStory(null);
        setRejectionReason('');
      } else {
        throw new Error('Failed to reject story');
      }
    } catch (error: any) {
      console.error('Error rejecting story:', error);
      alert(error.message || 'Failed to reject story. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Approve Stories</h1>

      {stories.length === 0 ? (
        <div className="bg-white shadow-md rounded-lg p-8 text-center">
          <p className="text-gray-500 text-lg">No stories pending approval.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stories List */}
          <div className="space-y-4">
            {stories.map((story) => (
              <div
                key={story.id}
                onClick={() => setSelectedStory(story)}
                className={`bg-white shadow-md rounded-lg p-4 cursor-pointer hover:shadow-lg transition ${
                  selectedStory?.id === story.id ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex gap-4">
                  {story.thumbnailImage && (
                    <img
                      src={story.thumbnailImage}
                      alt={story.title}
                      className="w-24 h-24 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{story.title}</h3>
                    <p className="text-gray-600 text-sm">{story.ngoName}</p>
                    <p className="text-gray-500 text-sm mt-2 line-clamp-2">
                      {story.shortDescription}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded">{story.category}</span>
                      {story.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Story Details & Actions */}
          {selectedStory ? (
            <div className="bg-white shadow-md rounded-lg p-6 sticky top-8 h-fit">
              <h2 className="text-2xl font-bold mb-4">{selectedStory.title}</h2>
              <p className="text-gray-600 mb-2">{selectedStory.titleHe}</p>
              <p className="text-sm text-gray-500 mb-4">NGO: {selectedStory.ngoName}</p>

              {/* Images Gallery */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {selectedStory.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Image ${idx + 1}`}
                    className="w-full h-32 object-cover rounded"
                  />
                ))}
              </div>

              <div className="mb-4">
                <h3 className="font-semibold mb-2">Description:</h3>
                <p className="text-gray-700 text-sm">{selectedStory.shortDescription}</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason (if rejecting):
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Provide feedback for the NGO..."
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => handleApprove(selectedStory.id)}
                  disabled={actionLoading}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold"
                >
                  {actionLoading ? 'Processing...' : 'Approve'}
                </button>
                <button
                  onClick={() => handleReject(selectedStory.id)}
                  disabled={actionLoading || !rejectionReason.trim()}
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 font-semibold"
                >
                  Reject
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow-md rounded-lg p-8 flex items-center justify-center">
              <p className="text-gray-500">Select a story to review</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
