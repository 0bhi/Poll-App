"use client";
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useChat } from './ChatProvider';
import Image from 'next/image';
import { FaSearch, FaTimes, FaUserPlus } from 'react-icons/fa';
import axios from 'axios';

interface User {
  id: number;
  name: string;
  username: string;
  profilePicture: string;
  bio: string;
}

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NewConversationModal: React.FC<NewConversationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const searchUsers = async (query: string) => {
    if (!query.trim() || !session?.user?.id) return;

    setLoading(true);
    try {
      const response = await axios.get('/api/users/search', {
        params: {
          q: query,
          current_user_id: session.user.id,
        },
      });
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchUsers(searchQuery);
      } else {
        setUsers([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const startConversation = async (user: User) => {
    if (!session?.user?.id) return;

    try {
      const response = await axios.post('/api/conversations', {
        participant1Id: parseInt(session.user.id),
        participant2Id: user.id,
      });

      if (response.data.conversation) {
        // Close modal and refresh conversations
        onClose();
        setSearchQuery('');
        setUsers([]);
        setSelectedUser(null);
        // You might want to trigger a refresh of conversations here
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-main">New Conversation</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <FaTimes />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-white dark:bg-gray-700 text-main"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
              <p className="mt-2">Searching...</p>
            </div>
          ) : users.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  onClick={() => startConversation(user)}
                >
                  <div className="flex items-center space-x-3">
                    <Image
                      src={user.profilePicture}
                      alt={user.name}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-main">{user.name}</h3>
                      <p className="text-sm text-gray-500">@{user.username}</p>
                      {user.bio && (
                        <p className="text-xs text-gray-400 mt-1 truncate">
                          {user.bio}
                        </p>
                      )}
                    </div>
                    <FaUserPlus className="text-accent" />
                  </div>
                </div>
              ))}
            </div>
          ) : searchQuery.trim() ? (
            <div className="p-4 text-center text-gray-500">
              <p>No users found</p>
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              <FaSearch className="mx-auto text-4xl mb-2 opacity-50" />
              <p>Search for users to start a conversation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewConversationModal;
