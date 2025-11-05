'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getFunctions, httpsCallable } from 'firebase/functions';
import StoryForm from '@/components/StoryForm';
import getApp from '@/lib/firebase-client';

export default function NewStoryPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSubmit = async (data: any, imageUrls: string[]) => {
    try {
      const app = getApp();
      const functions = getFunctions(app);
      const createStoryFn = httpsCallable(functions, 'createStory');

      // Get NGO ID from user session
      const userNgoId = (session?.user as any)?.ngoIds?.[0];
      if (!userNgoId) {
        throw new Error('No NGO association found for this user');
      }

      // Call Cloud Function to create story
      const result = await createStoryFn({
        ngoId: userNgoId,
        ...data,
        images: imageUrls,
      });

      const response = result.data as any;

      if (response.success) {
        alert('Story submitted successfully! It will be reviewed by our team.');
        router.push('/stories');
      } else {
        throw new Error('Failed to create story');
      }
    } catch (error: any) {
      console.error('Error creating story:', error);
      throw new Error(error.message || 'Failed to create story. Please try again.');
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Create New Story</h1>
      <p className="text-gray-600 mb-8">
        Share a beneficiary story that will inspire donations. All stories must be reviewed before going live.
      </p>

      <div className="bg-white shadow-md rounded-lg p-6">
        <StoryForm onSubmit={handleSubmit} submitLabel="Submit for Approval" />
      </div>
    </div>
  );
}
