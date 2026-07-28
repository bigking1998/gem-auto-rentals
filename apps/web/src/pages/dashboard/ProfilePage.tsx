import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Calendar, Camera, Check, AlertCircle, Loader2 } from 'lucide-react';
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
    <div className="mx-auto max-w-3xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="mt-1 text-gray-500">Manage your personal information and account settings</p>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="mb-6 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700"
        >
          <Check className="h-5 w-5" />
          Your profile has been updated successfully.
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
        >
          <AlertCircle className="h-5 w-5" />
          {error}
        </motion.div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="text-primary-ink h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          {/* Profile Card */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            {/* Avatar Section */}
            <div className="from-primary-light to-primary-dark relative h-32 bg-gradient-to-r">
              <div className="absolute -bottom-12 left-6">
                <div className="relative">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-white shadow-lg">
                    <span className="text-primary-ink text-3xl font-bold">
                      {profile.firstName[0]}
                      {profile.lastName[0]}
                    </span>
                  </div>
                  <button className="bg-primary text-primary-foreground hover:bg-primary-dark absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full shadow-md transition-colors">
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Edit Button */}
            <div className="flex justify-end px-6 pt-4">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-primary-ink hover:bg-accent rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={cn(
                      'text-primary-foreground bg-primary rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                      isSaving ? 'cursor-not-allowed opacity-50' : 'hover:bg-primary-dark'
                    )}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>

            {/* Profile Form */}
            <div className="space-y-6 p-6 pt-8">
              {/* Personal Information */}
              <div>
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <User className="text-primary-ink h-5 w-5" />
                  Personal Information
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedProfile.firstName}
                        onChange={(e) => updateField('firstName', e.target.value)}
                        className="focus:ring-primary focus:border-primary w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:ring-2"
                      />
                    ) : (
                      <p className="rounded-lg bg-gray-50 px-4 py-2.5 text-gray-900">
                        {profile.firstName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedProfile.lastName}
                        onChange={(e) => updateField('lastName', e.target.value)}
                        className="focus:ring-primary focus:border-primary w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:ring-2"
                      />
                    ) : (
                      <p className="rounded-lg bg-gray-50 px-4 py-2.5 text-gray-900">
                        {profile.lastName}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="border-t border-gray-100 pt-4">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <Mail className="text-primary-ink h-5 w-5" />
                  Contact Information
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <div className="relative">
                      {isEditing ? (
                        <input
                          type="email"
                          value={editedProfile.email}
                          onChange={(e) => updateField('email', e.target.value)}
                          className="focus:ring-primary focus:border-primary w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:ring-2"
                        />
                      ) : (
                        <p className="rounded-lg bg-gray-50 px-4 py-2.5 text-gray-900">
                          {profile.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editedProfile.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        className="focus:ring-primary focus:border-primary w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:ring-2"
                      />
                    ) : (
                      <p className="rounded-lg bg-gray-50 px-4 py-2.5 text-gray-900">
                        {profile.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                Member since{' '}
                {new Date(profile.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="mt-8 overflow-hidden rounded-xl border border-red-200 bg-white">
            <div className="p-6">
              <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-red-600">
                <AlertCircle className="h-5 w-5" />
                Danger Zone
              </h3>
              <p className="mb-4 text-sm text-gray-600">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50">
                Delete Account
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
