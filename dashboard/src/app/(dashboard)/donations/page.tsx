'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';

interface Donation {
  id: string;
  donorName: string;
  amount: number;
  ngoAmount: number;
  storyTitle: string;
  paidAt: any;
  anonymous: boolean;
  receiptUrl?: string;
  receiptNumber: string;
}

export default function DonationsPage() {
  const { data: session } = useSession();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRaised: 0,
    donorCount: 0,
    averageDonation: 0,
  });

  useEffect(() => {
    async function fetchDonations() {
      if (!session?.user) return;

      try {
        // Get NGO ID from user session
        const userNgoId = (session.user as any).ngoIds?.[0];
        if (!userNgoId) {
          console.error('User has no NGO association');
          return;
        }

        // Query donations for this NGO
        const donationsRef = collection(db, 'donations');
        const q = query(
          donationsRef,
          where('ngoId', '==', userNgoId),
          where('stripePaymentStatus', '==', 'succeeded'),
          orderBy('paidAt', 'desc'),
          limit(100) // Limit to last 100 donations for performance
        );

        const querySnapshot = await getDocs(q);
        const donationsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Donation[];

        setDonations(donationsData);

        // Calculate stats
        const totalRaised = donationsData.reduce((sum, d) => sum + (d.ngoAmount || 0), 0);
        const uniqueDonors = new Set(donationsData.filter(d => !d.anonymous).map(d => d.donorName));
        const averageDonation = donationsData.length > 0 ? totalRaised / donationsData.length : 0;

        setStats({
          totalRaised,
          donorCount: uniqueDonors.size,
          averageDonation,
        });
      } catch (error) {
        console.error('Error fetching donations:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDonations();
  }, [session]);

  const formatAmount = (agorot: number) => {
    const shekels = agorot / 100;
    return `₪${shekels.toLocaleString()}`;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const exportCSV = () => {
    // Create CSV content
    const headers = ['Date', 'Donor Name', 'Story Title', 'Amount', 'NGO Amount', 'Receipt Number'];
    const rows = donations.map(d => [
      formatDate(d.paidAt),
      d.anonymous ? 'Anonymous' : d.donorName,
      d.storyTitle,
      formatAmount(d.amount),
      formatAmount(d.ngoAmount),
      d.receiptNumber,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `donations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Donations</h1>
        <button
          onClick={exportCSV}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
        >
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="text-gray-500 text-sm font-medium">Total Raised</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">
            {formatAmount(stats.totalRaised)}
          </div>
          <div className="text-gray-400 text-xs mt-1">Net after platform fees</div>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="text-gray-500 text-sm font-medium">Unique Donors</div>
          <div className="text-3xl font-bold text-green-600 mt-2">
            {stats.donorCount}
          </div>
          <div className="text-gray-400 text-xs mt-1">Unique contributors</div>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="text-gray-500 text-sm font-medium">Average Donation</div>
          <div className="text-3xl font-bold text-purple-600 mt-2">
            {formatAmount(Math.floor(stats.averageDonation))}
          </div>
          <div className="text-gray-400 text-xs mt-1">Per donation</div>
        </div>
      </div>

      {/* Donations Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Donor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Story
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                NGO Receives
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Receipt
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {donations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No donations yet.
                </td>
              </tr>
            ) : (
              donations.map((donation) => (
                <tr key={donation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(donation.paidAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {donation.anonymous ? (
                      <span className="italic text-gray-500">Anonymous</span>
                    ) : (
                      donation.donorName
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {donation.storyTitle}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatAmount(donation.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                    {formatAmount(donation.ngoAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {donation.receiptUrl ? (
                      <a
                        href={donation.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
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
