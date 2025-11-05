'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';

interface Story {
  id: string;
  title: string;
  status: 'draft' | 'pending_approval' | 'active' | 'paused' | 'archived';
  raisedAmount: number;
  goalAmount?: number;
  donationCount: number;
  viewCount: number;
  createdAt: any;
  publishedAt?: any;
}

export default function StoriesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchStories() {
      if (!session?.user) return;

      try {
        const storiesRef = collection(db, 'stories');
        
        // Get NGO ID from user session
        const userNgoId = (session.user as any).ngoIds?.[0];
        if (!userNgoId) {
          console.error('User has no NGO association');
          return;
        }

        // Query stories for this NGO
        let q = query(
          storiesRef,
          where('ngoId', '==', userNgoId),
          orderBy('createdAt', 'desc')
        );

        // Add status filter if not 'all'
        if (statusFilter !== 'all') {
          q = query(
            storiesRef,
            where('ngoId', '==', userNgoId),
            where('status', '==', statusFilter),
            orderBy('createdAt', 'desc')
          );
        }

        const querySnapshot = await getDocs(q);
        const storiesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Story[];

        setStories(storiesData);
      } catch (error) {
        console.error('Error fetching stories:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStories();
  }, [session, statusFilter]);

  const getProgressPercentage = (story: Story) => {
    if (!story.goalAmount || story.goalAmount === 0) return 0;
    return Math.floor((story.raisedAmount / story.goalAmount) * 100);
  };

  const formatAmount = (agorot: number) => {
    const shekels = agorot / 100;
    return `₪${shekels.toLocaleString()}`;
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: 'bg-gray-200 text-gray-700',
      pending_approval: 'bg-yellow-200 text-yellow-800',
      active: 'bg-green-200 text-green-800',
      paused: 'bg-blue-200 text-blue-800',
      archived: 'bg-red-200 text-red-800'
    };
    return badges[status as keyof typeof badges] || badges.draft;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Stories</h1>
        <button
          onClick={() => router.push('/stories/new')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Create New Story
        </button>
      </div>

      {/* Status Filter */}
      <div className="mb-6">
        <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Status
        </label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2"
        >
          <option value="all">All Stories</option>
          <option value="draft">Draft</option>
          <option value="pending_approval">Pending Approval</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Stories Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Progress
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Donations
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Views
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stories.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No stories found. Create your first story to get started!
                </td>
              </tr>
            ) : (
              stories.map((story) => (
                <tr key={story.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{story.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(story.status)}`}>
                      {story.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {story.goalAmount ? (
                      <div>
                        <div className="text-sm text-gray-900">
                          {formatAmount(story.raisedAmount)} / {formatAmount(story.goalAmount)}
                        </div>
                        <div className="text-xs text-gray-500">{getProgressPercentage(story)}%</div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">No goal set</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {story.donationCount || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {story.viewCount || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {story.publishedAt
                      ? new Date(story.publishedAt.seconds * 1000).toLocaleDateString()
                      : new Date(story.createdAt.seconds * 1000).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => router.push(`/stories/${story.id}/edit`)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
