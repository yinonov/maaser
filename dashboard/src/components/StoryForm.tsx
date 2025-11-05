'use client';

import { useState, FormEvent } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase-client';

interface StoryFormData {
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
}

interface StoryFormProps {
  initialData?: Partial<StoryFormData>;
  onSubmit: (data: StoryFormData, images: string[]) => Promise<void>;
  submitLabel?: string;
}

const CATEGORIES = [
  { value: 'health', label: 'Health / Medical' },
  { value: 'education', label: 'Education' },
  { value: 'housing', label: 'Housing' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'food', label: 'Food Security' },
  { value: 'other', label: 'Other' },
];

const COMMON_TAGS = [
  'medical', 'urgent', 'family', 'children', 'elderly',
  'education', 'housing', 'emergency', 'special_needs', 'veterans'
];

export default function StoryForm({ initialData, onSubmit, submitLabel = 'Submit Story' }: StoryFormProps) {
  const [formData, setFormData] = useState<StoryFormData>({
    title: initialData?.title || '',
    titleHe: initialData?.titleHe || '',
    shortDescription: initialData?.shortDescription || '',
    shortDescriptionHe: initialData?.shortDescriptionHe || '',
    description: initialData?.description || '',
    descriptionHe: initialData?.descriptionHe || '',
    goalAmount: initialData?.goalAmount,
    tags: initialData?.tags || [],
    category: initialData?.category || '',
    videoUrl: initialData?.videoUrl || '',
  });

  const [images, setImages] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof StoryFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length + images.length > 5) {
      setErrors(prev => ({ ...prev, images: 'Maximum 5 images allowed' }));
      return;
    }

    // Validate file sizes (max 5MB each)
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, images: 'Each image must be less than 5MB' }));
        return false;
      }
      return true;
    });

    setImages(prev => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreview(prev => prev.filter((_, i) => i !== index));
  };

  const toggleTag = (tag: string) => {
    const currentTags = formData.tags;
    if (currentTags.includes(tag)) {
      handleChange('tags', currentTags.filter(t => t !== tag));
    } else if (currentTags.length < 5) {
      handleChange('tags', [...currentTags, tag]);
    } else {
      setErrors(prev => ({ ...prev, tags: 'Maximum 5 tags allowed' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'English title is required';
    if (!formData.titleHe.trim()) newErrors.titleHe = 'Hebrew title is required';
    if (!formData.shortDescription.trim()) newErrors.shortDescription = 'Short description is required';
    if (!formData.shortDescriptionHe.trim()) newErrors.shortDescriptionHe = 'Hebrew short description is required';
    
    if (formData.description.length < 300) {
      newErrors.description = 'Description must be at least 300 characters';
    }
    if (formData.description.length > 5000) {
      newErrors.description = 'Description must be less than 5000 characters';
    }

    if (images.length === 0 && !initialData) {
      newErrors.images = 'At least 1 image is required';
    }

    if (formData.tags.length === 0) {
      newErrors.tags = 'At least 1 tag is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadImages = async (): Promise<string[]> => {
    const uploadPromises = images.map(async (image) => {
      const storageRef = ref(storage, `stories/${Date.now()}_${image.name}`);
      await uploadBytes(storageRef, image);
      return getDownloadURL(storageRef);
    });

    return Promise.all(uploadPromises);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setUploading(true);
      
      // Upload images if any new ones
      const imageUrls = images.length > 0 ? await uploadImages() : [];

      await onSubmit(formData, imageUrls);
    } catch (error) {
      console.error('Error submitting story:', error);
      setErrors(prev => ({ ...prev, submit: 'Failed to submit story. Please try again.' }));
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {errors.submit}
        </div>
      )}

      {/* Title Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title (English) *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={100}
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title (Hebrew) *
          </label>
          <input
            type="text"
            value={formData.titleHe}
            onChange={(e) => handleChange('titleHe', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={100}
            dir="rtl"
          />
          {errors.titleHe && <p className="text-red-500 text-sm mt-1">{errors.titleHe}</p>}
        </div>
      </div>

      {/* Short Description Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Short Description (English) * <span className="text-gray-500 text-xs">(2-3 sentences for feed)</span>
          </label>
          <textarea
            value={formData.shortDescription}
            onChange={(e) => handleChange('shortDescription', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            maxLength={300}
          />
          <p className="text-gray-500 text-xs mt-1">{formData.shortDescription.length}/300</p>
          {errors.shortDescription && <p className="text-red-500 text-sm mt-1">{errors.shortDescription}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Short Description (Hebrew) *
          </label>
          <textarea
            value={formData.shortDescriptionHe}
            onChange={(e) => handleChange('shortDescriptionHe', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            maxLength={300}
            dir="rtl"
          />
          <p className="text-gray-500 text-xs mt-1">{formData.shortDescriptionHe.length}/300</p>
          {errors.shortDescriptionHe && <p className="text-red-500 text-sm mt-1">{errors.shortDescriptionHe}</p>}
        </div>
      </div>

      {/* Full Description Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Description (English) * <span className="text-gray-500 text-xs">(300-5000 chars)</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={8}
            maxLength={5000}
          />
          <p className="text-gray-500 text-xs mt-1">{formData.description.length}/5000</p>
          {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Description (Hebrew) *
          </label>
          <textarea
            value={formData.descriptionHe}
            onChange={(e) => handleChange('descriptionHe', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={8}
            maxLength={5000}
            dir="rtl"
          />
          <p className="text-gray-500 text-xs mt-1">{formData.descriptionHe.length}/5000</p>
        </div>
      </div>

      {/* Images Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Images * <span className="text-gray-500 text-xs">(1-5 images, max 5MB each)</span>
        </label>
        <input
          type="file"
          accept="image/jpeg,image/png"
          multiple
          onChange={handleImageChange}
          className="w-full border border-gray-300 rounded-lg px-4 py-2"
        />
        {errors.images && <p className="text-red-500 text-sm mt-1">{errors.images}</p>}
        
        {imagePreview.length > 0 && (
          <div className="grid grid-cols-5 gap-4 mt-4">
            {imagePreview.map((preview, index) => (
              <div key={index} className="relative">
                <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-32 object-cover rounded" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category *
        </label>
        <select
          value={formData.category}
          onChange={(e) => handleChange('category', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select a category</option>
          {CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
        {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags * <span className="text-gray-500 text-xs">(Select 1-5 tags)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {COMMON_TAGS.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1 rounded-full text-sm ${
                formData.tags.includes(tag)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
        {errors.tags && <p className="text-red-500 text-sm mt-1">{errors.tags}</p>}
      </div>

      {/* Goal Amount */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fundraising Goal (Optional) <span className="text-gray-500 text-xs">(in ₪)</span>
        </label>
        <input
          type="number"
          value={formData.goalAmount ? formData.goalAmount / 100 : ''}
          onChange={(e) => handleChange('goalAmount', e.target.value ? parseInt(e.target.value) * 100 : undefined)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          min="500"
          placeholder="e.g., 50000"
        />
        <p className="text-gray-500 text-xs mt-1">Leave blank if no specific goal</p>
      </div>

      {/* Video URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Video URL (Optional) <span className="text-gray-500 text-xs">(YouTube or Vimeo)</span>
        </label>
        <input
          type="url"
          value={formData.videoUrl}
          onChange={(e) => handleChange('videoUrl', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="https://youtube.com/embed/..."
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          disabled={uploading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          disabled={uploading}
        >
          {uploading ? 'Submitting...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
