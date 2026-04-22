import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useWebRTC } from '../../hooks/useWebRTC';
import { VideoCallControls } from '../../components/video/VideoCallControls';
import { Loader } from 'lucide-react';

interface CallData {
  _id: string;
  roomId: string;
  initiatorId: { name: string; avatarUrl: string };
  participantId: { name: string; avatarUrl: string };
  callType: 'audio' | 'video';
  status: string;
}

export const VideoCall: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [socket, setSocket] = useState<any>(null);
  const [userId, setUserId] = useState<string>('');
  const [callData, setCallData] = useState<CallData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [remoteName, setRemoteName] = useState('');

  const {
    localStream,
    remoteStream,
    isAudioMuted,
    isVideoMuted,
    callStatus,
    error,
    localVideoRef,
    remoteVideoRef,
    initializeMediaStream,
    initializePeerConnection,
    createAndSendOffer,
    toggleAudioMute,
    toggleVideoMute,
    endCall,
  } = useWebRTC({
    socket,
    userId,
    roomId: roomId || '',
    callType: 'video',
  });

  // Initialize socket and fetch call data
  useEffect(() => {
    const initializeCall = async () => {
      try {
        // Get auth token
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        if (user) {
          setUserId(JSON.parse(user)._id);
        }

        // Fetch call data
        if (roomId) {
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/calls/${roomId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setCallData(response.data.call);

          // Determine remote user name
          const currentUserId = JSON.parse(user || '{}')._id;
          if (
            response.data.call.initiatorId._id === currentUserId
          ) {
            setRemoteName(response.data.call.participantId.name);
          } else {
            setRemoteName(response.data.call.initiatorId.name);
          }
        }

        // Initialize socket
        const { io } = await import('socket.io-client');
        const socketInstance = io(import.meta.env.VITE_API_URL, {
          auth: { token },
        });
        setSocket(socketInstance);
      } catch (err) {
        console.error('Failed to initialize call:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeCall();
  }, [roomId]);

  // Initialize media stream when component mounts
  useEffect(() => {
    if (socket && !isLoading) {
      const setupMedia = async () => {
        try {
          const stream = await initializeMediaStream();
          await initializePeerConnection(stream);

          // Emit that we're ready to join the call
          socket.emit('call:join', { roomId });

          // Create and send offer to remote peer
          setTimeout(() => {
            createAndSendOffer();
          }, 500);
        } catch (err) {
          console.error('Failed to setup media:', err);
        }
      };
      setupMedia();
    }
  }, [socket, isLoading, createAndSendOffer, roomId, initializeMediaStream, initializePeerConnection]);

  // Handle end call
  const handleEndCall = async () => {
    try {
      endCall();
      const token = localStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/calls/${roomId}/leave`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      navigate('/chat');
    } catch (err) {
      console.error('Failed to end call:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4" size={48} />
          <p className="text-white">Initializing video call...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <h1 className="text-white text-xl font-semibold">
          Video Call with {remoteName}
        </h1>
        {callData && (
          <p className="text-gray-400 text-sm">
            Call Type: {callData.callType === 'video' ? '📹 Video' : '🎤 Audio'}
          </p>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-500 text-white p-4 text-center">
          {error}
        </div>
      )}

      {/* Video containers */}
      <div className="flex-1 flex gap-4 p-4 bg-black overflow-hidden">
        {/* Remote video (larger) */}
        <div className="flex-1 bg-gray-900 rounded-lg overflow-hidden relative">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              muted={false}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">🎥</span>
                </div>
                <p className="text-gray-400">Waiting for remote stream...</p>
              </div>
            </div>
          )}
        </div>

        {/* Local video (smaller, bottom-right) */}
        <div className="w-32 h-32 bg-gray-800 rounded-lg overflow-hidden relative shadow-lg">
          {localStream ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted={true}
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-2xl">📹</span>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4 border-t border-gray-700">
        <VideoCallControls
          isAudioMuted={isAudioMuted}
          isVideoMuted={isVideoMuted}
          onToggleAudio={toggleAudioMute}
          onToggleVideo={toggleVideoMute}
          onEndCall={handleEndCall}
          callStatus={callStatus}
        />
      </div>
    </div>
  );
};
