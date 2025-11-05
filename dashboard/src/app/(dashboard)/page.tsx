'use client';

export const dynamic = 'force-dynamic';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase-client';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

interface NGOStats {
  totalDonationsReceived: number;
  totalDonors: number;
  activeStories: number;
  allTimeRaised: number;
}

interface NGO {
  id: string;
  name: string;
  nameHe: string;
  stats: NGOStats;
}

interface StoryStats {
  active: number;
  pending: number;
  total: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [ngo, setNGO] = useState<NGO | null>(null);
  const [storyStats, setStoryStats] = useState<StoryStats>({ active: 0, pending: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchDashboardData();
    }
  }, [status, session]);

  const fetchDashboardData = async () => {
    try {
      if (!session?.user?.id) return;

      // Fetch user document to get NGO IDs
      const userDoc = await getDoc(doc(db, 'users', session.user.id));
      if (!userDoc.exists()) {
        console.error('User document not found');
        return;
      }

      const userData = userDoc.data();
      const ngoIds = userData.ngoIds || [];

      if (ngoIds.length === 0) {
        console.error('User is not associated with any NGO');
        return;
      }

      // Fetch NGO data (use first NGO if user manages multiple)
      const ngoId = ngoIds[0];
      const ngoDoc = await getDoc(doc(db, 'ngos', ngoId));
      
      if (ngoDoc.exists()) {
        const ngoData = ngoDoc.data();
        setNGO({
          id: ngoDoc.id,
          name: ngoData.name,
          nameHe: ngoData.nameHe,
          stats: ngoData.stats || {
            totalDonationsReceived: 0,
            totalDonors: 0,
            activeStories: 0,
            allTimeRaised: 0,
          },
        });

        // Fetch story statistics
        const storiesQuery = query(
          collection(db, 'stories'),
          where('ngoId', '==', ngoId)
        );
        const storiesSnapshot = await getDocs(storiesQuery);
        
        let activeCount = 0;
        let pendingCount = 0;
        storiesSnapshot.forEach((doc) => {
          const story = doc.data();
          if (story.status === 'active') activeCount++;
          if (story.status === 'pending_approval') pendingCount++;
        });

        setStoryStats({
          active: activeCount,
          pending: pendingCount,
          total: storiesSnapshot.size,
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
    }).format(amount / 100); // Convert agorot to shekels
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!ngo) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-xl text-gray-600">No NGO data found</p>
          <p className="mt-2 text-sm text-gray-500">Please contact support if this issue persists.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome to {ngo.name}
        </h1>
        <p className="mt-2 text-gray-600">
          {ngo.nameHe}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Raised</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(ngo.stats.totalDonationsReceived)}
              </p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            All-time: {formatCurrency(ngo.stats.allTimeRaised)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Donors</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {ngo.stats.totalDonors}
              </p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Unique supporters
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Stories</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {storyStats.active}
              </p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {storyStats.total} total stories
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Approval</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {storyStats.pending}
              </p>
            </div>
            <div className="bg-yellow-100 rounded-full p-3">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Awaiting review
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/stories/new"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <div className="bg-primary rounded-full p-3 mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">Create New Story</p>
              <p className="text-sm text-gray-500">Add a beneficiary story</p>
            </div>
          </a>

          <a
            href="/stories"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <div className="bg-blue-500 rounded-full p-3 mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">Manage Stories</p>
              <p className="text-sm text-gray-500">View and edit stories</p>
            </div>
          </a>

          <a
            href="/donations"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <div className="bg-green-500 rounded-full p-3 mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">View Donations</p>
              <p className="text-sm text-gray-500">Track donation history</p>
            </div>
          </a>
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <p className="text-gray-500 text-center py-8">
          Recent donations and story updates will appear here
        </p>
      </div>
    </div>
  );
}
