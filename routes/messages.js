const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');

const router = express.Router();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Get conversations for a user
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [conversations] = await pool.execute(`
      SELECT DISTINCT
        c.id as conversation_id,
        c.patient_id,
        c.doctor_id,
        c.created_at,
        c.updated_at,
        u1.first_name as patient_first_name,
        u1.last_name as patient_last_name,
        u2.first_name as doctor_first_name,
        u2.last_name as doctor_last_name,
        d.specialty,
        (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.is_read = 0 AND m.sender_id != ?) as unread_count
      FROM conversations c
      JOIN users u1 ON c.patient_id = u1.id
      JOIN users u2 ON c.doctor_id = u2.id
      JOIN doctors d ON c.doctor_id = d.id
      WHERE c.patient_id = ? OR c.doctor_id = ?
      ORDER BY c.updated_at DESC
    `, [userId, userId, userId]);

    res.json({
      success: true,
      data: conversations
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get messages for a conversation
router.get('/conversations/:conversationId', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.userId;

    // Verify user has access to this conversation
    const [conversations] = await pool.execute(`
      SELECT id FROM conversations 
      WHERE id = ? AND (patient_id = ? OR doctor_id = ?)
    `, [conversationId, userId, userId]);

    if (conversations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const [messages] = await pool.execute(`
      SELECT 
        m.id,
        m.conversation_id,
        m.sender_id,
        m.content,
        m.message_type,
        m.is_read,
        m.created_at,
        u.first_name,
        u.last_name
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = ?
      ORDER BY m.created_at ASC
    `, [conversationId]);

    // Mark messages as read
    await pool.execute(`
      UPDATE messages 
      SET is_read = 1 
      WHERE conversation_id = ? AND sender_id != ? AND is_read = 0
    `, [conversationId, userId]);

    res.json({
      success: true,
      data: messages
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Send a message
router.post('/', authenticateToken, [
  body('receiverId').isInt().withMessage('Valid receiver ID is required'),
  body('content').notEmpty().withMessage('Message content is required'),
  body('messageType').optional().isIn(['text', 'image', 'file']).withMessage('Valid message type is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { receiverId, content, messageType = 'text' } = req.body;
    const senderId = req.user.userId;

    // Find or create conversation
    let [conversations] = await pool.execute(`
      SELECT id FROM conversations 
      WHERE (patient_id = ? AND doctor_id = ?) OR (patient_id = ? AND doctor_id = ?)
    `, [senderId, receiverId, receiverId, senderId]);

    let conversationId;
    if (conversations.length === 0) {
      // Create new conversation
      const [result] = await pool.execute(`
        INSERT INTO conversations (patient_id, doctor_id) 
        VALUES (?, ?)
      `, [senderId, receiverId]);
      conversationId = result.insertId;
    } else {
      conversationId = conversations[0].id;
    }

    // Send message
    const [result] = await pool.execute(`
      INSERT INTO messages (conversation_id, sender_id, content, message_type)
      VALUES (?, ?, ?, ?)
    `, [conversationId, senderId, content, messageType]);

    // Update conversation timestamp
    await pool.execute(`
      UPDATE conversations 
      SET updated_at = NOW() 
      WHERE id = ?
    `, [conversationId]);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        messageId: result.insertId,
        conversationId
      }
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
