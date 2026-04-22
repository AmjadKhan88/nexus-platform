import { useEffect, useRef, useState } from 'react';

interface UseWebRTCOptions {
  socket: any;
  userId: string;
  roomId: string;
  callType: 'audio' | 'video';
}

const ICE_SERVERS = [
  'stun:stun.l.google.com:19302',
  'stun:stun1.l.google.com:19302',
  'stun:stun2.l.google.com:19302',
  'stun:stun3.l.google.com:19302',
  'stun:stun4.l.google.com:19302',
];

export const useWebRTC = ({
  socket,
  userId,
  roomId,
  callType,
}: UseWebRTCOptions) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [callStatus, setCallStatus] = useState<
    'idle' | 'connecting' | 'connected' | 'disconnected'
  >('idle');
  const [error, setError] = useState<string | null>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Initialize local media stream
  const initializeMediaStream = async () => {
    try {
      setCallStatus('connecting');
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: callType === 'video' ? { width: 1280, height: 720 } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);

      if (localVideoRef.current && callType === 'video') {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to access media devices';
      setError(errorMsg);
      console.error('Media stream error:', err);
      throw err;
    }
  };

  // Initialize WebRTC peer connection
  const initializePeerConnection = async (stream: MediaStream) => {
    try {
      const peerConfig: RTCConfiguration = {
        iceServers: ICE_SERVERS.map((server) => ({
          urls: server,
        })),
      };

      const peerConnection = new RTCPeerConnection(peerConfig);

      // Add local stream tracks
      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        console.log('Remote track received:', event.track.kind);
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket?.emit('call:ice-candidate', {
            roomId,
            candidate: event.candidate,
          });
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'connected') {
          setCallStatus('connected');
        } else if (
          peerConnection.connectionState === 'disconnected' ||
          peerConnection.connectionState === 'failed' ||
          peerConnection.connectionState === 'closed'
        ) {
          setCallStatus('disconnected');
        }
      };

      peerConnection.onicegatheringstatechange = () => {
        console.log('ICE gathering state:', peerConnection.iceGatheringState);
      };

      peerConnection.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', peerConnection.iceConnectionState);
      };

      peerConnectionRef.current = peerConnection;
      return peerConnection;
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to initialize peer';
      setError(errorMsg);
      console.error('Peer connection error:', err);
      throw err;
    }
  };

  // Create and send offer
  const createAndSendOffer = async () => {
    try {
      if (!peerConnectionRef.current) return;

      const offer = await peerConnectionRef.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === 'video',
      });

      await peerConnectionRef.current.setLocalDescription(offer);
      socket?.emit('call:offer', { roomId, offer });
    } catch (err) {
      console.error('Failed to create offer:', err);
      setError(err instanceof Error ? err.message : 'Failed to create offer');
    }
  };

  // Handle incoming offer from remote peer
  const handleIncomingOffer = async (offer: RTCSessionDescription) => {
    try {
      if (!peerConnectionRef.current) return;

      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      socket?.emit('call:answer', { roomId, answer });
    } catch (err) {
      console.error('Failed to handle offer:', err);
      setError(err instanceof Error ? err.message : 'Failed to handle offer');
    }
  };

  // Handle incoming answer
  const handleIncomingAnswer = async (answer: RTCSessionDescription) => {
    try {
      if (!peerConnectionRef.current) return;
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    } catch (err) {
      console.error('Failed to handle answer:', err);
      setError(err instanceof Error ? err.message : 'Failed to handle answer');
    }
  };

  // Handle ICE candidates
  const handleICECandidate = async (candidate: RTCIceCandidate) => {
    try {
      if (!peerConnectionRef.current) return;
      if (candidate) {
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      }
    } catch (err) {
      console.error('ICE candidate error:', err);
    }
  };

  // Toggle audio mute
  const toggleAudioMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsAudioMuted(!isAudioMuted);
      socket?.emit('call:toggle-media', {
        roomId,
        audio: !isAudioMuted,
        video: !isVideoMuted,
      });
    }
  };

  // Toggle video
  const toggleVideoMute = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoMuted(!isVideoMuted);
      socket?.emit('call:toggle-media', {
        roomId,
        audio: !isAudioMuted,
        video: !isVideoMuted,
      });
    }
  };

  // End call and cleanup
  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.stop();
      });
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setCallStatus('disconnected');
  };

  // Set up socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('call:offer', handleIncomingOffer);
    socket.on('call:answer', handleIncomingAnswer);
    socket.on('call:ice-candidate', (data: any) =>
      handleICECandidate(data.candidate)
    );

    return () => {
      socket.off('call:offer', handleIncomingOffer);
      socket.off('call:answer', handleIncomingAnswer);
      socket.off('call:ice-candidate');
    };
  }, [socket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, []);

  return {
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
    handleIncomingOffer,
    handleIncomingAnswer,
    handleICECandidate,
    toggleAudioMute,
    toggleVideoMute,
    endCall,
  };
};
