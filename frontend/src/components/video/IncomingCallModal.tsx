import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Phone, PhoneOff } from 'lucide-react';

interface IncomingCallProps {
  socket: any;
  isOpen: boolean;
  onClose: () => void;
  callData?: {
    roomId: string;
    callerId: string;
    callerName: string;
    callerAvatar: string;
    callType: 'audio' | 'video';
  };
}

export const IncomingCallModal: React.FC<IncomingCallProps> = ({
  socket,
  isOpen,
  onClose,
  callData,
}) => {
  const navigate = useNavigate();
  const [isRinging, setIsRinging] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Play ringing sound
      setIsRinging(true);
      const audio = new Audio(
        'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA=='
      );
      const ringtone = new Audio(
        'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'
      );
      // ringtone.loop = true;
      // ringtone.play().catch(() => console.log('Cannot play ringtone'));
    }
  }, [isOpen]);

  const handleAccept = async () => {
    try {
      if (callData) {
        navigate(`/call/${callData.roomId}`);
        // Emit acceptance via socket
        socket?.emit('call:answer', {
          callerId: callData.callerId,
          answer: true,
        });
        setIsRinging(false);
        onClose();
      }
    } catch (err) {
      console.error('Failed to accept call:', err);
    }
  };

  const handleReject = async () => {
    try {
      // Emit rejection via socket
      socket?.emit('call:reject', {
        callerId: callData?.callerId,
      });

      // Update call status to declined
      if (callData?.roomId) {
        const token = localStorage.getItem('token');
        await axios.put(
          `${import.meta.env.VITE_API_URL}/api/calls/${callData.roomId}/status`,
          { status: 'declined' },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      setIsRinging(false);
      onClose();
    } catch (err) {
      console.error('Failed to reject call:', err);
    }
  };

  if (!isOpen || !callData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-2xl p-8 max-w-sm w-full">
        {/* Caller Avatar */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-500 shadow-lg">
            {callData.callerAvatar ? (
              <img
                src={callData.callerAvatar}
                alt={callData.callerName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl">
                👤
              </div>
            )}
          </div>
        </div>

        {/* Caller Name and Call Type */}
        <h2 className="text-white text-2xl font-bold text-center mb-2">
          {callData.callerName}
        </h2>
        <p className="text-gray-400 text-center mb-6">
          {callData.callType === 'video' ? '📹 Incoming video call' : '🎤 Incoming audio call'}
        </p>

        {/* Ringing indicator */}
        {isRinging && (
          <div className="flex justify-center mb-6">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200" />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          {/* Reject */}
          <button
            onClick={handleReject}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full transition-colors flex items-center gap-2"
          >
            <PhoneOff size={20} />
            Decline
          </button>

          {/* Accept */}
          <button
            onClick={handleAccept}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full transition-colors flex items-center gap-2"
          >
            <Phone size={20} />
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};
