// Donation flow state management using Zustand
// Manages donation amount, payment state, and donation flow

import { create } from 'zustand';
import { Story } from '../../../shared/types';

interface DonationState {
  // Current donation flow
  selectedStory: Story | null;
  amount: number;
  message: string;
  isAnonymous: boolean;
  
  // Payment state
  isProcessing: boolean;
  error: string | null;
  donationId: string | null;
  
  // Actions
  setSelectedStory: (story: Story | null) => void;
  setAmount: (amount: number) => void;
  setMessage: (message: string) => void;
  setIsAnonymous: (isAnonymous: boolean) => void;
  setProcessing: (processing: boolean) => void;
  setError: (error: string | null) => void;
  setDonationId: (donationId: string | null) => void;
  reset: () => void;
}

export const useDonationStore = create<DonationState>((set) => ({
  // Initial state
  selectedStory: null,
  amount: 0,
  message: '',
  isAnonymous: false,
  isProcessing: false,
  error: null,
  donationId: null,

  // Actions
  setSelectedStory: (story) => set({ selectedStory: story }),
  
  setAmount: (amount) => set({ amount }),
  
  setMessage: (message) => set({ message }),
  
  setIsAnonymous: (isAnonymous) => set({ isAnonymous }),
  
  setProcessing: (processing) => set({ isProcessing: processing }),
  
  setError: (error) => set({ error, isProcessing: false }),
  
  setDonationId: (donationId) => set({ donationId }),
  
  reset: () => set({ 
    selectedStory: null,
    amount: 0,
    message: '',
    isAnonymous: false,
    isProcessing: false,
    error: null,
    donationId: null,
  }),
}));
