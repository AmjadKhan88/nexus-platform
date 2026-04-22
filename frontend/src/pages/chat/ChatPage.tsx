import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Phone, Video, Info, Smile, MessageCircle } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ChatMessage } from '../../components/chat/ChatMessage';
import { ChatUserList } from '../../components/chat/ChatUserList';
import { useAuth } from '../../context/AuthContext';
import { getSocket } from '../../lib/socket';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export const ChatPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [chatPartner, setChatPartner] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentUserId = String((currentUser as any)?._id || (currentUser as any)?.id || '');

  const toId = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    return String(val._id || val.id || val);
  };

  const loadConversations = useCallback(() => {
    api.get('/messages/conversations')
      .then(({ data }) => setConversations(data.conversations || []))
      .catch(() => {});
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);
  useEffect(() => { if (messages.length > 0) loadConversations(); }, [messages.length]);

  useEffect(() => {
    if (!userId || !currentUser) return;
    setChatPartner(null);
    setMessages([]);
    api.get(`/users/${userId}`).then(({ data }) => setChatPartner(data.user)).catch(() => {});
    api.get(`/messages/${userId}`).then(({ data }) => setMessages(data.messages || [])).catch(() => toast.error('Failed to load messages'));
  }, [userId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (msg: any) => {
      const senderId = toId(msg.senderId);
      const receiverId = toId(msg.receiverId);
      const isRelevant =
        (senderId === currentUserId && receiverId === userId) ||
        (senderId === userId && receiverId === currentUserId);
      if (!isRelevant) return;
      setMessages((prev) => {
        if (msg._id && prev.some((m) => m._id === msg._id)) return prev;
        // Replace optimistic message if same content sent within last 5s
        const optimisticIdx = prev.findIndex(
          (m) => m._id?.startsWith('temp-') && m.content === msg.content
        );
        if (optimisticIdx !== -1) {
          const updated = [...prev];
          updated[optimisticIdx] = msg;
          return updated;
        }
        return [...prev, msg];
      });
    };

    const handleTyping = ({ senderId, isTyping }: any) => {
      if (toId(senderId) === userId) setPartnerTyping(isTyping);
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:typing', handleTyping);
    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:typing', handleTyping);
    };
  }, [userId, currentUserId]);

  useEffect(() => {
    const socket = getSocket();
    if (socket && userId) socket.emit('message:read', { senderId: userId });
  }, [userId, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, partnerTyping]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const content = newMessage.trim();
    if (!content || !currentUser || !userId) return;

    const socket = getSocket();

    // Optimistic update — show immediately
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      _id: tempId,
      senderId: { _id: currentUserId, name: currentUser.name, avatarUrl: currentUser.avatarUrl },
      receiverId: { _id: userId },
      content,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage('');
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setIsTyping(false);

    if (socket && socket.connected) {
      socket.emit('message:send', { receiverId: userId, content });
      socket.emit('message:typing', { receiverId: userId, isTyping: false });
    } else {
      api.post('/messages', { receiverId: userId, content })
        .then(({ data }) => {
          setMessages((prev) => prev.map((m) => m._id === tempId ? data.message : m));
        })
        .catch(() => {
          toast.error('Failed to send message');
          setMessages((prev) => prev.filter((m) => m._id !== tempId));
          setNewMessage(content);
        });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    const socket = getSocket();
    if (!socket || !userId) return;
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('message:typing', { receiverId: userId, isTyping: true });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('message:typing', { receiverId: userId, isTyping: false });
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as any);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white border border-gray-200 rounded-lg overflow-hidden animate-fade-in">
      <div className="hidden md:block w-1/3 lg:w-1/4 border-r border-gray-200">
        <ChatUserList conversations={conversations} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {chatPartner ? (
          <>
            <div className="border-b border-gray-200 p-4 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center">
                <Avatar src={chatPartner.avatarUrl} alt={chatPartner.name} size="md" status={chatPartner.isOnline ? 'online' : 'offline'} className="mr-3" />
                <div>
                  <h2 className="text-lg font-medium text-gray-900">{chatPartner.name}</h2>
                  <p className="text-sm text-gray-500">
                    {partnerTyping ? <span className="text-primary-600 animate-pulse">typing...</span>
                      : chatPartner.isOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
              <div className="flex space-x-1">
                <Button variant="ghost" size="sm" className="rounded-full p-2"><Phone size={18} /></Button>
                <Button variant="ghost" size="sm" className="rounded-full p-2"><Video size={18} /></Button>
                <Button variant="ghost" size="sm" className="rounded-full p-2"><Info size={18} /></Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center">
                  <div className="bg-gray-100 p-4 rounded-full mb-4"><MessageCircle size={32} className="text-gray-400" /></div>
                  <h3 className="text-lg font-medium text-gray-700">No messages yet</h3>
                  <p className="text-gray-500 mt-1">Send a message to start the conversation</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, idx) => {
                    const senderId = toId(message.senderId);
                    const isMine = senderId === currentUserId;
                    return (
                      <ChatMessage
                        key={message._id || idx}
                        message={{ ...message, id: message._id, senderId, timestamp: message.createdAt || message.timestamp }}
                        isCurrentUser={isMine}
                      />
                    );
                  })}
                  {partnerTyping && (
                    <div className="flex items-center gap-2 text-gray-500 text-sm pl-2">
                      <div className="flex gap-1 items-center">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs">{chatPartner.name} is typing...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 p-4 flex-shrink-0 bg-white">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                <Button type="button" variant="ghost" size="sm" className="rounded-full p-2 flex-shrink-0"><Smile size={20} /></Button>
                <Input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  fullWidth
                  className="flex-1"
                  autoComplete="off"
                />
                <Button type="submit" size="sm" disabled={!newMessage.trim()} className="rounded-full p-2 w-10 h-10 flex items-center justify-center flex-shrink-0">
                  <Send size={18} />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-4">
            <div className="bg-gray-100 p-6 rounded-full mb-4"><MessageCircle size={48} className="text-gray-400" /></div>
            <h2 className="text-xl font-medium text-gray-700">Select a conversation</h2>
            <p className="text-gray-500 mt-2 text-center">Choose a contact from the list to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};
