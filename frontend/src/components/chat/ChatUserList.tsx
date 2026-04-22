import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';

interface ChatUserListProps {
  conversations: any[];
}

export const ChatUserList: React.FC<ChatUserListProps> = ({ conversations }) => {
  const navigate = useNavigate();
  const { userId: activeUserId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();

  if (!currentUser) return null;

  const currentId = (currentUser as any)._id || (currentUser as any).id;

  return (
    <div className="bg-white border-r border-gray-200 w-full overflow-y-auto h-full">
      <div className="py-4">
        <h2 className="px-4 text-lg font-semibold text-gray-800 mb-4">Messages</h2>

        <div className="space-y-1">
          {conversations.length > 0 ? (
            conversations.map((conversation) => {
              // Support both API shape (partner object) and legacy shape (participants array)
              let partner = conversation.partner;
              let partnerId = partner?._id || partner?.id;

              // Fallback: derive from participants array
              if (!partner && conversation.participants) {
                partnerId = conversation.participants.find(
                  (id: string) => id !== currentId
                );
                partner = { _id: partnerId, name: partnerId, avatarUrl: '', isOnline: false };
              }

              if (!partnerId) return null;

              const lastMessage = conversation.lastMessage;
              const isActive = activeUserId === partnerId;
              const unread = conversation.unreadCount > 0;

              const lastMsgSenderId =
                lastMessage?.senderId?._id ||
                lastMessage?.senderId ||
                lastMessage?.sender;

              return (
                <div
                  key={conversation.id || partnerId}
                  className={`px-4 py-3 flex cursor-pointer transition-colors duration-200 ${
                    isActive
                      ? 'bg-primary-50 border-l-4 border-primary-600'
                      : 'hover:bg-gray-50 border-l-4 border-transparent'
                  }`}
                  onClick={() => navigate(`/chat/${partnerId}`)}
                >
                  <Avatar
                    src={partner?.avatarUrl || ''}
                    alt={partner?.name || 'User'}
                    size="md"
                    status={partner?.isOnline ? 'online' : 'offline'}
                    className="mr-3 flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {partner?.name || 'Unknown User'}
                      </h3>
                      {lastMessage && (
                        <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                          {formatDistanceToNow(
                            new Date(lastMessage.createdAt || lastMessage.timestamp || Date.now()),
                            { addSuffix: false }
                          )}
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-0.5">
                      {lastMessage ? (
                        <p className={`text-xs truncate ${unread ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                          {lastMsgSenderId === currentId ? 'You: ' : ''}
                          {lastMessage.content}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No messages yet</p>
                      )}

                      {unread && (
                        <Badge variant="primary" size="sm" rounded>
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-500">No conversations yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
