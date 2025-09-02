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

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [users] = await pool.execute(`
      SELECT 
        id,
        first_name,
        last_name,
        email,
        phone,
        date_of_birth,
        role,
        status,
        created_at,
        updated_at
      FROM users 
      WHERE id = ?
    `, [userId]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: users[0]
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, [
  body('firstName').optional().trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName').optional().trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number'),
  body('dateOfBirth').optional().isISO8601().withMessage('Please provide a valid date of birth')
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

    const userId = req.user.userId;
    const { firstName, lastName, phone, dateOfBirth } = req.body;

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    if (firstName) {
      updateFields.push('first_name = ?');
      updateValues.push(firstName);
    }

    if (lastName) {
      updateFields.push('last_name = ?');
      updateValues.push(lastName);
    }

    if (phone) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }

    if (dateOfBirth) {
      updateFields.push('date_of_birth = ?');
      updateValues.push(dateOfBirth);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updateValues.push(userId);

    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    await pool.execute(query, updateValues);

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get user health records
router.get('/health-records', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { recordType, limit = 10, offset = 0 } = req.query;

    let query = `
      SELECT 
        id,
        record_type,
        title,
        description,
        data,
        file_url,
        created_at
      FROM health_records 
      WHERE user_id = ?
    `;

    const params = [userId];

    if (recordType) {
      query += ' AND record_type = ?';
      params.push(recordType);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [records] = await pool.execute(query, params);

    res.json({
      success: true,
      data: records.map(record => ({
        ...record,
        data: JSON.parse(record.data || '{}')
      }))
    });

  } catch (error) {
    console.error('Get health records error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch health records',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Add health record
router.post('/health-records', authenticateToken, [
  body('recordType').isIn(['vital_signs', 'lab_results', 'medications', 'allergies', 'immunizations']).withMessage('Valid record type is required'),
  body('title').notEmpty().withMessage('Title is required'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('data').optional().isObject().withMessage('Data must be an object')
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

    const userId = req.user.userId;
    const { recordType, title, description, data, fileUrl } = req.body;

    const [result] = await pool.execute(`
      INSERT INTO health_records (user_id, record_type, title, description, data, file_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [userId, recordType, title, description, JSON.stringify(data || {}), fileUrl]);

    res.status(201).json({
      success: true,
      message: 'Health record added successfully',
      data: {
        id: result.insertId,
        recordType,
        title,
        description,
        data: data || {},
        fileUrl
      }
    });

  } catch (error) {
    console.error('Add health record error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add health record',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get user dashboard statistics
router.get('/dashboard-stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get consultation statistics
    const [consultationStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_consultations,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_consultations,
        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled_consultations,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_consultations
      FROM consultations 
      WHERE patient_id = ?
    `, [userId]);

    // Get payment statistics
    const [paymentStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_payments,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful_payments,
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_spent
      FROM payments p
      JOIN consultations c ON p.consultation_id = c.id
      WHERE c.patient_id = ?
    `, [userId]);

    // Get health records count
    const [healthRecordStats] = await pool.execute(`
      SELECT COUNT(*) as total_records
      FROM health_records 
      WHERE user_id = ?
    `, [userId]);

    // Get next appointment
    const [nextAppointment] = await pool.execute(`
      SELECT 
        c.appointment_date,
        c.appointment_time,
        c.type,
        d.specialty,
        u.first_name as doctor_first_name,
        u.last_name as doctor_last_name
      FROM consultations c
      JOIN doctors d ON c.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      WHERE c.patient_id = ? AND c.status = 'confirmed'
      AND CONCAT(c.appointment_date, ' ', c.appointment_time) > NOW()
      ORDER BY c.appointment_date ASC, c.appointment_time ASC
      LIMIT 1
    `, [userId]);

    res.json({
      success: true,
      data: {
        consultations: consultationStats[0],
        payments: paymentStats[0],
        healthRecords: healthRecordStats[0],
        nextAppointment: nextAppointment[0] || null
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
