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

// Get all available doctors
router.get('/doctors', async (req, res) => {
  try {
    const [doctors] = await pool.execute(`
      SELECT 
        d.id,
        d.specialty,
        d.license_number,
        d.experience_years,
        d.consultation_fee,
        d.availability,
        d.bio,
        u.first_name,
        u.last_name,
        u.email
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      WHERE u.status = 'active'
      ORDER BY d.specialty, u.first_name
    `);

    res.json({
      success: true,
      data: doctors.map(doctor => ({
        ...doctor,
        availability: (() => {
          try {
            return JSON.parse(doctor.availability || '{}');
          } catch (e) {
            return {};
          }
        })()
      }))
    });

  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctors',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get doctor by ID
router.get('/doctors/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [doctors] = await pool.execute(`
      SELECT 
        d.id,
        d.specialty,
        d.license_number,
        d.experience_years,
        d.consultation_fee,
        d.availability,
        d.bio,
        u.first_name,
        u.last_name,
        u.email
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      WHERE d.id = ? AND u.status = 'active'
    `, [id]);

    if (doctors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const doctor = doctors[0];

    res.json({
      success: true,
      data: {
        ...doctor,
        availability: (() => {
          try {
            return JSON.parse(doctor.availability || '{}');
          } catch (e) {
            return {};
          }
        })()
      }
    });

  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Book a consultation
router.post('/book', authenticateToken, [
  body('doctorId').isInt().withMessage('Valid doctor ID is required'),
  body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
  body('appointmentTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid appointment time is required'),
  body('type').isIn(['video', 'audio', 'chat']).withMessage('Valid consultation type is required'),
  body('symptoms').optional().isString().withMessage('Symptoms must be a string')
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

    const { doctorId, appointmentDate, appointmentTime, type, symptoms } = req.body;
    const patientId = req.user.userId;

    // Check if doctor exists and is active
    const [doctors] = await pool.execute(`
      SELECT d.id, d.consultation_fee, u.status 
      FROM doctors d 
      JOIN users u ON d.user_id = u.id 
      WHERE d.id = ?
    `, [doctorId]);

    if (doctors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    if (doctors[0].status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Doctor is not available for consultations'
      });
    }

    // Check if appointment time is available
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}:00`);
    const now = new Date();

    if (appointmentDateTime <= now) {
      return res.status(400).json({
        success: false,
        message: 'Appointment time must be in the future'
      });
    }

    // Check for conflicting appointments
    const [conflictingAppointments] = await pool.execute(`
      SELECT id FROM consultations 
      WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? 
      AND status IN ('scheduled', 'confirmed')
    `, [doctorId, appointmentDate, appointmentTime]);

    if (conflictingAppointments.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'This appointment time is not available. Please choose another time.'
      });
    }

    // Create consultation
    const [result] = await pool.execute(`
      INSERT INTO consultations (patient_id, doctor_id, appointment_date, appointment_time, type, symptoms)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [patientId, doctorId, appointmentDate, appointmentTime, type, symptoms]);

    const consultationId = result.insertId;

    res.status(201).json({
      success: true,
      message: 'Consultation booked successfully',
      data: {
        consultationId,
        appointmentDate,
        appointmentTime,
        type,
        fee: doctors[0].consultation_fee
      }
    });

  } catch (error) {
    console.error('Book consultation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to book consultation',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get user's consultations
router.get('/my-consultations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, limit = 10, offset = 0 } = req.query;

    let query = `
      SELECT 
        c.id,
        c.appointment_date,
        c.appointment_time,
        c.duration,
        c.type,
        c.status,
        c.symptoms,
        c.diagnosis,
        c.prescription,
        c.notes,
        c.created_at,
        d.specialty,
        d.consultation_fee,
        u.first_name as doctor_first_name,
        u.last_name as doctor_last_name
      FROM consultations c
      JOIN doctors d ON c.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      WHERE c.patient_id = ?
    `;

    const params = [userId];

    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }

    query += ' ORDER BY c.appointment_date DESC, c.appointment_time DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [consultations] = await pool.execute(query, params);

    res.json({
      success: true,
      data: consultations
    });

  } catch (error) {
    console.error('Get consultations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch consultations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get user appointments
router.get('/appointments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [appointments] = await pool.execute(`
      SELECT 
        c.id,
        c.appointment_date,
        c.appointment_time,
        c.type,
        c.status,
        c.symptoms,
        c.created_at,
        d.consultation_fee,
        d.specialty,
        u.first_name,
        u.last_name
      FROM consultations c
      JOIN doctors d ON c.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      WHERE c.patient_id = ?
      ORDER BY c.appointment_date DESC, c.appointment_time DESC
    `, [userId]);

    res.json({
      success: true,
      data: appointments
    });

  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get consultation history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 10, offset = 0 } = req.query;

    const [consultations] = await pool.execute(`
      SELECT 
        c.id,
        c.appointment_date,
        c.appointment_time,
        c.type,
        c.status,
        c.symptoms,
        c.diagnosis,
        c.prescription,
        c.notes,
        c.created_at,
        d.specialty,
        d.consultation_fee,
        u.first_name as doctor_first_name,
        u.last_name as doctor_last_name
      FROM consultations c
      JOIN doctors d ON c.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      WHERE c.patient_id = ?
      ORDER BY c.appointment_date DESC, c.appointment_time DESC
      LIMIT ? OFFSET ?
    `, [userId, parseInt(limit), parseInt(offset)]);

    res.json({
      success: true,
      data: consultations
    });

  } catch (error) {
    console.error('Get consultation history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch consultation history',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get consultation by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const [consultations] = await pool.execute(`
      SELECT 
        c.id,
        c.appointment_date,
        c.appointment_time,
        c.duration,
        c.type,
        c.status,
        c.symptoms,
        c.diagnosis,
        c.prescription,
        c.notes,
        c.created_at,
        c.updated_at,
        d.specialty,
        d.consultation_fee,
        u.first_name as doctor_first_name,
        u.last_name as doctor_last_name,
        u.email as doctor_email
      FROM consultations c
      JOIN doctors d ON c.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      WHERE c.id = ? AND c.patient_id = ?
    `, [id, userId]);

    if (consultations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    res.json({
      success: true,
      data: consultations[0]
    });

  } catch (error) {
    console.error('Get consultation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch consultation',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Cancel consultation
router.put('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if consultation exists and belongs to user
    const [consultations] = await pool.execute(`
      SELECT id, status, appointment_date, appointment_time
      FROM consultations 
      WHERE id = ? AND patient_id = ?
    `, [id, userId]);

    if (consultations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    const consultation = consultations[0];

    if (consultation.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Consultation is already cancelled'
      });
    }

    if (consultation.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed consultation'
      });
    }

    // Check if cancellation is within allowed time (2 hours before appointment)
    const appointmentDateTime = new Date(`${consultation.appointment_date} ${consultation.appointment_time}`);
    const now = new Date();
    const timeDifference = appointmentDateTime - now;
    const hoursDifference = timeDifference / (1000 * 60 * 60);

    if (hoursDifference < 2) {
      return res.status(400).json({
        success: false,
        message: 'Consultation can only be cancelled at least 2 hours before the appointment'
      });
    }

    // Cancel consultation
    await pool.execute(`
      UPDATE consultations 
      SET status = 'cancelled' 
      WHERE id = ?
    `, [id]);

    res.json({
      success: true,
      message: 'Consultation cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel consultation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel consultation',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get consultation statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_consultations,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_consultations,
        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled_consultations,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_consultations
      FROM consultations 
      WHERE patient_id = ?
    `, [userId]);

    res.json({
      success: true,
      data: stats[0]
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get upcoming appointments for dashboard
router.get('/upcoming', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 5 } = req.query;

    const [appointments] = await pool.execute(`
      SELECT 
        c.id,
        c.appointment_date,
        c.appointment_time,
        c.type,
        c.status,
        d.specialty,
        d.consultation_fee,
        u.first_name as doctor_first_name,
        u.last_name as doctor_last_name
      FROM consultations c
      JOIN doctors d ON c.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      WHERE c.patient_id = ? 
        AND c.status IN ('scheduled', 'confirmed')
        AND CONCAT(c.appointment_date, ' ', c.appointment_time) >= NOW()
      ORDER BY c.appointment_date ASC, c.appointment_time ASC
      LIMIT ?
    `, [userId, parseInt(limit)]);

    res.json({
      success: true,
      data: appointments
    });

  } catch (error) {
    console.error('Get upcoming appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming appointments',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get recent consultations for dashboard
router.get('/recent', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 5 } = req.query;

    const [consultations] = await pool.execute(`
      SELECT 
        c.id,
        c.appointment_date,
        c.appointment_time,
        c.type,
        c.status,
        c.diagnosis,
        c.prescription,
        d.specialty,
        d.consultation_fee,
        u.first_name as doctor_first_name,
        u.last_name as doctor_last_name
      FROM consultations c
      JOIN doctors d ON c.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      WHERE c.patient_id = ? 
        AND c.status = 'completed'
      ORDER BY c.appointment_date DESC, c.appointment_time DESC
      LIMIT ?
    `, [userId, parseInt(limit)]);

    res.json({
      success: true,
      data: consultations
    });

  } catch (error) {
    console.error('Get recent consultations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent consultations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Reschedule consultation
router.put('/:id/reschedule', authenticateToken, [
  body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
  body('appointmentTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid appointment time is required')
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

    const { id } = req.params;
    const { appointmentDate, appointmentTime } = req.body;
    const userId = req.user.userId;

    // Verify consultation exists and belongs to user
    const [consultations] = await pool.execute(`
      SELECT id, status, doctor_id, appointment_date, appointment_time
      FROM consultations 
      WHERE id = ? AND patient_id = ?
    `, [id, userId]);

    if (consultations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    const consultation = consultations[0];

    if (!['scheduled', 'confirmed'].includes(consultation.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only scheduled or confirmed consultations can be rescheduled'
      });
    }

    // Check if new appointment time is in the future
    const appointmentDateTime = new Date(`${appointmentDate} ${appointmentTime}`);
    const now = new Date();

    if (appointmentDateTime <= now) {
      return res.status(400).json({
        success: false,
        message: 'New appointment time must be in the future'
      });
    }

    // Check for conflicting appointments
    const [conflictingAppointments] = await pool.execute(`
      SELECT id FROM consultations 
      WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? 
      AND status IN ('scheduled', 'confirmed') AND id != ?
    `, [consultation.doctor_id, appointmentDate, appointmentTime, id]);

    if (conflictingAppointments.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'This appointment time is not available. Please choose another time.'
      });
    }

    // Update consultation
    await pool.execute(`
      UPDATE consultations 
      SET appointment_date = ?, appointment_time = ?, status = 'scheduled'
      WHERE id = ?
    `, [appointmentDate, appointmentTime, id]);

    res.json({
      success: true,
      message: 'Consultation rescheduled successfully',
      data: {
        consultationId: id,
        appointmentDate,
        appointmentTime,
        status: 'scheduled'
      }
    });

  } catch (error) {
    console.error('Reschedule consultation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reschedule consultation',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
