import React from 'react';
import { Mic, MicOff, Video, VideoOff, Phone, PhoneOff } from 'lucide-react';

interface VideoCallControlsProps {
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onEndCall: () => void;
  callStatus: string;
}

export const VideoCallControls: React.FC<VideoCallControlsProps> = ({
  isAudioMuted,
  isVideoMuted,
  onToggleAudio,
  onToggleVideo,
  onEndCall,
  callStatus,
}) => {
  return (
    <div className="flex justify-center items-center gap-4 p-4 bg-gray-900 rounded-lg">
      {/* Mic Toggle */}
      <button
        onClick={onToggleAudio}
        className={`p-3 rounded-full transition-colors ${
          isAudioMuted
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
        title={isAudioMuted ? 'Unmute' : 'Mute'}
      >
        {isAudioMuted ? (
          <MicOff size={24} className="text-white" />
        ) : (
          <Mic size={24} className="text-white" />
        )}
      </button>

      {/* Video Toggle */}
      <button
        onClick={onToggleVideo}
        className={`p-3 rounded-full transition-colors ${
          isVideoMuted
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
        title={isVideoMuted ? 'Start video' : 'Stop video'}
      >
        {isVideoMuted ? (
          <VideoOff size={24} className="text-white" />
        ) : (
          <Video size={24} className="text-white" />
        )}
      </button>

      {/* End Call */}
      <button
        onClick={onEndCall}
        className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
        title="End call"
      >
        <PhoneOff size={24} className="text-white" />
      </button>

      {/* Call Status */}
      {callStatus && (
        <span className="text-white text-sm ml-4 px-3 py-1 bg-gray-700 rounded-full">
          {callStatus === 'connected' && '🟢 Connected'}
          {callStatus === 'connecting' && '🟡 Connecting...'}
          {callStatus === 'disconnected' && '🔴 Disconnected'}
        </span>
      )}
    </div>
  );
};
