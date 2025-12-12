"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import axios from "axios";
import Image from "next/image";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/app/components/LoadingSpinner";

const SettingsPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadProfile = async () => {
    if (!session?.user?.id) return;
    try {
      const res = await axios.get("/api/users/user", {
        params: { user_id: session.user.id },
      });
      const data = res.data.data;
      setName(data.name || "");
      setBio(data.bio || "");
      setProfilePicture(
        data.profilePicture ||
          "https://api.dicebear.com/7.x/identicon/svg"
      );
    } catch (err) {
      setMessage("Failed to load profile. Please try again.");
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      signIn();
    } else if (status === "authenticated") {
      loadProfile();
    }
  }, [status]);

  const handleSave = async () => {
    if (!session?.user?.id) return;
    setSaving(true);
    setMessage(null);
    try {
      await axios.put("/api/users/user", {
        name,
        bio,
        profilePicture,
      });
      setMessage("Settings saved");
    } catch (err) {
      setMessage("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-hide">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-6">
        <div className="bg-card border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-gray-200 dark:ring-gray-700">
              <Image
                src={
                  profilePicture ||
                  "https://api.dicebear.com/7.x/identicon/svg"
                }
                alt="Profile"
                width={64}
                height={64}
                className="object-cover w-full h-full"
              />
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                @{session?.user?.username}
              </div>
              <button
                className="text-sm text-blue-600 hover:underline"
                onClick={() =>
                  router.push(`/${session?.user?.username ?? ""}`)
                }
              >
                View profile
              </button>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Display name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={100}
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={160}
                rows={3}
                placeholder="Share a short bio"
              />
              <div className="text-xs text-gray-500 mt-1">
                {bio.length}/160
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Profile picture URL
              </label>
              <input
                value={profilePicture}
                onChange={(e) => setProfilePicture(e.target.value)}
                className="w-full rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
              {message && (
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {message}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

