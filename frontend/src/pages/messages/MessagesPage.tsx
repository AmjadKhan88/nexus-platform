import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { ChatUserList } from '../../components/chat/ChatUserList';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.get('/messages/conversations')
      .then(({ data }) => setConversations(data.conversations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  // Normalize conversation shape from API to match ChatUserList expectations
  const normalizedConversations = conversations.map((c) => ({
    id: c.partner?._id,
    participants: [user._id || (user as any).id, c.partner?._id],
    lastMessage: c.lastMessage
      ? {
          id: c.lastMessage._id,
          senderId: c.lastMessage.senderId?._id || c.lastMessage.senderId,
          receiverId: c.lastMessage.receiverId?._id || c.lastMessage.receiverId,
          content: c.lastMessage.content,
          timestamp: c.lastMessage.createdAt,
          isRead: c.lastMessage.isRead,
        }
      : undefined,
    updatedAt: c.lastMessage?.createdAt || new Date().toISOString(),
    partner: c.partner,
    unreadCount: c.unreadCount,
  }));

  return (
    <div className="h-[calc(100vh-8rem)] bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
      {loading ? (
        <div className="h-full flex items-center justify-center">
          <p className="text-gray-500">Loading conversations...</p>
        </div>
      ) : normalizedConversations.length > 0 ? (
        <ChatUserList conversations={normalizedConversations} />
      ) : (
        <div className="h-full flex flex-col items-center justify-center p-8">
          <div className="bg-gray-100 p-6 rounded-full mb-4">
            <MessageCircle size={32} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-medium text-gray-900">No messages yet</h2>
          <p className="text-gray-600 text-center mt-2">
            Start connecting with entrepreneurs and investors to begin conversations
          </p>
        </div>
      )}
    </div>
  );
};
