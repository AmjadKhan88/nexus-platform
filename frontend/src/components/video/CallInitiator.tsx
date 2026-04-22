import React, { useState } from 'react';
import axios from 'axios';
import { Phone, Video, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CallInitiatorProps {
  userId: string;
  userName: string;
  onCallStart?: () => void;
}

export const CallInitiator: React.FC<CallInitiatorProps> = ({
  userId,
  userName,
  onCallStart,
}) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiateCall = async (callType: 'audio' | 'video') => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/calls/initiate`,
        {
          participantId: userId,
          callType,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success && response.data.roomId) {
        onCallStart?.();
        navigate(`/call/${response.data.roomId}`);
      }
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        'Failed to initiate call';
      setError(errorMsg);
      console.error('Call initiation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {error && (
        <span className="text-red-500 text-sm">{error}</span>
      )}

      {/* Audio Call Button */}
      <button
        onClick={() => initiateCall('audio')}
        disabled={isLoading}
        className="p-2 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50"
        title="Start audio call"
      >
        {isLoading ? (
          <Loader size={20} className="animate-spin text-blue-500" />
        ) : (
          <Phone size={20} className="text-blue-500" />
        )}
      </button>

      {/* Video Call Button */}
      <button
        onClick={() => initiateCall('video')}
        disabled={isLoading}
        className="p-2 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50"
        title="Start video call"
      >
        {isLoading ? (
          <Loader size={20} className="animate-spin text-green-500" />
        ) : (
          <Video size={20} className="text-green-500" />
        )}
      </button>
    </div>
  );
};
