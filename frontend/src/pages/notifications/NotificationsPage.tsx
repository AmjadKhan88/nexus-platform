import React, { useState, useEffect } from 'react';
import { Bell, MessageCircle, UserPlus, DollarSign, Calendar, FileText } from 'lucide-react';
import { Card, CardBody } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { getSocket } from '../../lib/socket';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications || []);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Listen for real-time notifications via socket
    const socket = getSocket();
    if (socket) {
      socket.on('notification:new', (notification: any) => {
        setNotifications((prev) => [notification, ...prev]);
        toast(notification.title, { icon: '🔔' });
      });
    }

    return () => {
      const s = getSocket();
      if (s) s.off('notification:new');
    };
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to update notifications');
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (error:any){
      console.log(error.message)
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_message': return <MessageCircle size={16} className="text-primary-600" />;
      case 'collaboration_request':
      case 'collaboration_accepted':
      case 'collaboration_rejected': return <UserPlus size={16} className="text-secondary-600" />;
      case 'payment': return <DollarSign size={16} className="text-accent-600" />;
      case 'meeting_scheduled':
      case 'meeting_accepted':
      case 'meeting_rejected': return <Calendar size={16} className="text-green-600" />;
      case 'document_shared': return <FileText size={16} className="text-orange-500" />;
      default: return <Bell size={16} className="text-gray-600" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-center py-12 text-gray-500">Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <Bell size={28} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-700">No notifications yet</h3>
          <p className="text-gray-500 mt-1">Activity from your network will show up here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification._id}
              className={`transition-colors duration-200 cursor-pointer ${
                !notification.isRead ? 'bg-primary-50 border-primary-100' : ''
              }`}
              onClick={() => !notification.isRead && handleMarkRead(notification._id)}
            >
              <CardBody className="flex items-start p-4 gap-4">
                {notification.fromUser ? (
                  <Avatar
                    src={notification.fromUser.avatarUrl}
                    alt={notification.fromUser.name}
                    size="md"
                    className="flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Bell size={18} className="text-gray-500" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{notification.title}</span>
                    {!notification.isRead && (
                      <Badge variant="primary" size="sm" rounded>New</Badge>
                    )}
                  </div>
                  <p className="text-gray-600 mt-1 text-sm">{notification.message}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    {getNotificationIcon(notification.type)}
                    <span>
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(notification._id); }}
                  className="text-gray-400 hover:text-red-500 transition-colors text-xs mt-1"
                >
                  ✕
                </button>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
