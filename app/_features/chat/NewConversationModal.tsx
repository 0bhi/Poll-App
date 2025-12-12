"use client";
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useChat } from './ChatProvider';
import Image from 'next/image';
import { FaSearch, FaTimes, FaUserPlus } from 'react-icons/fa';
import { apiClient, ApiError } from '../../_lib/apiClient';
import { toast } from 'sonner';
import { logger } from '../../_lib/logger';

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
  const { setCurrentConversation, refreshConversations } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const searchUsers = async (query: string) => {
    if (!query.trim() || !session?.user?.id) return;

    setLoading(true);
    try {
      const response = await apiClient.get<User[]>('/api/users/search', {
        params: {
          q: query,
          current_user_id: session.user.id,
        },
      });
      // API returns { data: users[] }
      setUsers(response.data || []);
    } catch (error) {
      logger.error('Error searching users', error);
      setUsers([]);
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

    setLoading(true);
    try {
      const response = await apiClient.post<{
        id: number;
        participant1Id: number;
        participant2Id: number;
        participant1?: User;
        participant2?: User;
        updatedAt?: string;
        createdAt?: string;
      }>('/api/conversations', {
        participant1Id: parseInt(session.user.id),
        participant2Id: user.id,
      });

      // API returns { data: conversation }
      const conversation = response.data;
      
      if (!conversation) {
        throw new Error('No conversation data received');
      }

      // Get the other user from the conversation
      const otherUser = conversation.participant1Id === parseInt(session.user.id)
        ? conversation.participant2
        : conversation.participant1;

      if (!otherUser) {
        throw new Error('Could not determine other user in conversation');
      }
      
      const transformedConversation = {
        id: conversation.id,
        otherUser: {
          id: otherUser.id,
          name: otherUser.name,
          username: otherUser.username,
          profilePicture: otherUser.profilePicture,
        },
        lastMessage: null,
        unreadCount: 0,
        updatedAt: conversation.updatedAt || conversation.createdAt || new Date().toISOString(),
      };

        // Set the new conversation as current and close modal
        setCurrentConversation(transformedConversation);
        onClose();
        setSearchQuery('');
        setUsers([]);
        setSelectedUser(null);
        
        // Refresh conversations list
        if (refreshConversations) {
          await refreshConversations();
        }
        toast.success('Conversation started successfully!');
    } catch (error: unknown) {
      logger.error('Error starting conversation', error);
      
      // Show error message to user
      let errorMessage = 'Failed to start conversation. Please try again.';
      
      if (error instanceof ApiError) {
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">New Conversation</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
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
              className="w-full pl-10 pr-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800 text-white placeholder-gray-400"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="max-h-96 overflow-y-auto scrollbar-hide">
          {loading ? (
            <div className="p-4 text-center text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-300">Searching...</p>
            </div>
          ) : users.length > 0 ? (
            <div className="divide-y divide-gray-700">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="p-4 hover:bg-gray-800 cursor-pointer transition-colors"
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
                      <h3 className="font-medium text-white">{user.name}</h3>
                      <p className="text-sm text-gray-400">@{user.username}</p>
                      {user.bio && (
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {user.bio}
                        </p>
                      )}
                    </div>
                    <FaUserPlus className="text-blue-500" />
                  </div>
                </div>
              ))}
            </div>
          ) : searchQuery.trim() ? (
            <div className="p-4 text-center text-gray-400">
              <p>No users found</p>
            </div>
          ) : (
            <div className="p-4 text-center text-gray-400">
              <FaSearch className="mx-auto text-4xl mb-2 opacity-50" />
              <p className="text-gray-300">Search for users to start a conversation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewConversationModal;
