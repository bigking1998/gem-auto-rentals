import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Calendar,
  Camera,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<UserProfile>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    createdAt: user?.createdAt || new Date().toISOString(),
  });

  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);

  // Fetch profile from API
  useEffect(() => {
    async function fetchProfile() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await api.profile.get();
        const profileData: UserProfile = {
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
          createdAt: data.createdAt || new Date().toISOString(),
        };
        setProfile(profileData);
        setEditedProfile(profileData);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    setError(null);

    try {
      await api.profile.update({
        firstName: editedProfile.firstName,
        lastName: editedProfile.lastName,
        phone: editedProfile.phone,
      });

      setProfile(editedProfile);
      setIsEditing(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const updateField = (field: keyof UserProfile, value: string) => {
    setEditedProfile((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-500 mt-1">
          Manage your personal information and account settings
        </p>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="mb-6 flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200"
        >
          <Check className="w-5 h-5" />
          Your profile has been updated successfully.
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200"
        >
          <AlertCircle className="w-5 h-5" />
          {error}
        </motion.div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : (
      <>
      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Avatar Section */}
        <div className="relative h-32 bg-gradient-to-r from-indigo-500 to-purple-600">
          <div className="absolute -bottom-12 left-6">
            <div className="relative">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                <span className="text-3xl font-bold text-indigo-600">
                  {profile.firstName[0]}{profile.lastName[0]}
                </span>
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-indigo-700 transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Edit Button */}
        <div className="flex justify-end px-6 pt-4">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={cn(
                  'px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg transition-colors',
                  isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'
                )}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        {/* Profile Form */}
        <div className="p-6 pt-8 space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
              <User className="w-5 h-5 text-indigo-600" />
              Personal Information
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  First Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                ) : (
                  <p className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900">
                    {profile.firstName}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Last Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                ) : (
                  <p className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900">
                    {profile.lastName}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
              <Mail className="w-5 h-5 text-indigo-600" />
              Contact Information
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  {isEditing ? (
                    <input
                      type="email"
                      value={editedProfile.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    <p className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900">
                      {profile.email}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editedProfile.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                ) : (
                  <p className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900">
                    {profile.phone}
                  </p>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Account Info */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            Member since {new Date(profile.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="mt-8 bg-white rounded-xl border border-red-200 overflow-hidden">
        <div className="p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-red-600 mb-2">
            <AlertCircle className="w-5 h-5" />
            Danger Zone
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
            Delete Account
          </button>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
