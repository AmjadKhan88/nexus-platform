const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Get all conversations for current user
// @route   GET /api/messages/conversations
exports.getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get distinct users this user has chatted with
    const sent = await Message.distinct('receiverId', { senderId: userId });
    const received = await Message.distinct('senderId', { receiverId: userId });

    const partnerIds = [...new Set([...sent.map(String), ...received.map(String)])].filter(
      (id) => id !== String(userId)
    );

    // Build conversation list with last message + unread count
    const conversations = await Promise.all(
      partnerIds.map(async (partnerId) => {
        const partner = await User.findById(partnerId).select('name avatarUrl isOnline role');
        const lastMessage = await Message.findOne({
          $or: [
            { senderId: userId, receiverId: partnerId },
            { senderId: partnerId, receiverId: userId },
          ],
        }).sort({ createdAt: -1 });

        const unreadCount = await Message.countDocuments({
          senderId: partnerId,
          receiverId: userId,
          isRead: false,
        });

        return { partner, lastMessage, unreadCount };
      })
    );

    // Sort by most recent message
    conversations.sort((a, b) => {
      const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt) : 0;
      const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt) : 0;
      return bTime - aTime;
    });

    res.status(200).json({ success: true, conversations });
  } catch (err) {
    next(err);
  }
};

// @desc    Get messages between current user and another user
// @route   GET /api/messages/:userId
exports.getMessages = async (req, res, next) => {
  try {
    const currentUser = req.user._id;
    const otherId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { senderId: currentUser, receiverId: otherId },
        { senderId: otherId, receiverId: currentUser },
      ],
    })
      .sort({ createdAt: 1 })
      .populate('senderId', 'name avatarUrl')
      .populate('receiverId', 'name avatarUrl');

    // Mark all unread messages from the other user as read
    await Message.updateMany(
      { senderId: otherId, receiverId: currentUser, isRead: false },
      { isRead: true }
    );

    res.status(200).json({ success: true, messages });
  } catch (err) {
    next(err);
  }
};

// @desc    Send a message (REST fallback – main path is Socket.IO)
// @route   POST /api/messages
exports.sendMessage = async (req, res, next) => {
  try {
    const { receiverId, content } = req.body;

    const receiver = await User.findById(receiverId);
    if (!receiver) return res.status(404).json({ success: false, message: 'Recipient not found' });

    const message = await Message.create({
      senderId: req.user._id,
      receiverId,
      content,
    });

    await message.populate('senderId', 'name avatarUrl');
    await message.populate('receiverId', 'name avatarUrl');

    // Create notification for receiver
    await Notification.create({
      userId: receiverId,
      type: 'new_message',
      title: 'New Message',
      message: `${req.user.name} sent you a message`,
      link: `/chat/${req.user._id}`,
      fromUser: req.user._id,
    });

    res.status(201).json({ success: true, message });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a message
// @route   DELETE /api/messages/:id
exports.deleteMessage = async (req, res, next) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });
    if (String(msg.senderId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorised' });
    }
    await msg.deleteOne();
    res.status(200).json({ success: true, message: 'Message deleted' });
  } catch (err) {
    next(err);
  }
};
