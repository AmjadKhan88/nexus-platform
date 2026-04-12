const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Map: userId (string) → socket.id
const onlineUsers = new Map();

const socketHandler = (io) => {
  // ── Auth middleware for Socket.IO ─────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Authentication error: no token'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error('Authentication error: invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    console.log(`🟢 Socket connected: ${userId}`);

    // ── Mark user online ────────────────────────────────────────────────────
    onlineUsers.set(userId, socket.id);
    await User.findByIdAndUpdate(userId, { isOnline: true });
    io.emit('user:online', { userId });

    // ── Join personal room for direct notifications ─────────────────────────
    socket.join(userId);

    // ═══════════════════════════════════════════════════════════════════════
    //  CHAT
    // ═══════════════════════════════════════════════════════════════════════

    // Send a message
    socket.on('message:send', async (data) => {
      try {
        const { receiverId, content } = data;
        if (!content || !receiverId) return;

        const message = await Message.create({
          senderId: userId,
          receiverId,
          content,
        });

        await message.populate('senderId', 'name avatarUrl');
        await message.populate('receiverId', 'name avatarUrl');

        // Emit to sender
        socket.emit('message:new', message);

        // Emit to receiver if online
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('message:new', message);
        } else {
          // Create notification for offline user
          await Notification.create({
            userId: receiverId,
            type: 'new_message',
            title: 'New Message',
            message: `${message.senderId.name} sent you a message`,
            link: `/chat/${userId}`,
            fromUser: userId,
          });
        }
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Typing indicator
    socket.on('message:typing', ({ receiverId, isTyping }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('message:typing', { senderId: userId, isTyping });
      }
    });

    // Mark messages as read
    socket.on('message:read', async ({ senderId }) => {
      try {
        await Message.updateMany(
          { senderId, receiverId: userId, isRead: false },
          { isRead: true }
        );
        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit('message:read', { by: userId });
        }
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ═══════════════════════════════════════════════════════════════════════
    //  WEBRTC VIDEO/AUDIO SIGNALING
    // ═══════════════════════════════════════════════════════════════════════

    // Initiate a call
    socket.on('call:initiate', ({ targetUserId, offer, callType }) => {
      const targetSocketId = onlineUsers.get(targetUserId);
      if (!targetSocketId) {
        socket.emit('call:user-unavailable', { targetUserId });
        return;
      }
      io.to(targetSocketId).emit('call:incoming', {
        callerId: userId,
        offer,
        callType, // 'video' | 'audio'
      });
    });

    // Answer the call
    socket.on('call:answer', ({ callerId, answer }) => {
      const callerSocketId = onlineUsers.get(callerId);
      if (callerSocketId) {
        io.to(callerSocketId).emit('call:answered', { answer, answeredBy: userId });
      }
    });

    // ICE candidate exchange
    socket.on('call:ice-candidate', ({ targetUserId, candidate }) => {
      const targetSocketId = onlineUsers.get(targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('call:ice-candidate', { candidate, from: userId });
      }
    });

    // Reject a call
    socket.on('call:reject', ({ callerId }) => {
      const callerSocketId = onlineUsers.get(callerId);
      if (callerSocketId) {
        io.to(callerSocketId).emit('call:rejected', { by: userId });
      }
    });

    // End a call
    socket.on('call:end', ({ targetUserId }) => {
      const targetSocketId = onlineUsers.get(targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('call:ended', { by: userId });
      }
    });

    // Toggle audio/video mute
    socket.on('call:toggle-media', ({ targetUserId, audio, video }) => {
      const targetSocketId = onlineUsers.get(targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('call:media-toggled', { by: userId, audio, video });
      }
    });

    // ═══════════════════════════════════════════════════════════════════════
    //  NOTIFICATIONS (push to specific user room)
    // ═══════════════════════════════════════════════════════════════════════

    socket.on('notification:send', async ({ targetUserId, notification }) => {
      io.to(targetUserId).emit('notification:new', notification);
    });

    // ═══════════════════════════════════════════════════════════════════════
    //  DISCONNECT
    // ═══════════════════════════════════════════════════════════════════════

    socket.on('disconnect', async () => {
      console.log(`🔴 Socket disconnected: ${userId}`);
      onlineUsers.delete(userId);
      await User.findByIdAndUpdate(userId, { isOnline: false });
      io.emit('user:offline', { userId });
    });
  });
};

module.exports = socketHandler;
