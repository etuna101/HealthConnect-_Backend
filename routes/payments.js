const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');

const router = express.Router();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// IntaSend configuration
const INTASEND_API_KEY = process.env.INTASEND_API_KEY;
const INTASEND_PUBLISHABLE_KEY = process.env.INTASEND_PUBLISHABLE_KEY;
const INTASEND_BASE_URL = 'https://api.intasend.com';

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

// Initialize IntaSend payment
router.post('/intasend/initialize', authenticateToken, [
  body('consultationId').isInt().withMessage('Valid consultation ID is required'),
  body('paymentMethod').isIn(['mobile_money', 'card', 'bank']).withMessage('Valid payment method is required'),
  body('phoneNumber').optional().isMobilePhone().withMessage('Valid phone number is required for mobile money')
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

    const { consultationId, paymentMethod, phoneNumber } = req.body;
    const userId = req.user.userId;

    // Verify consultation exists and belongs to user
    const [consultations] = await pool.execute(`
      SELECT 
        c.id,
        c.status,
        c.appointment_date,
        c.appointment_time,
        d.consultation_fee,
        d.specialty,
        u.first_name as doctor_first_name,
        u.last_name as doctor_last_name
      FROM consultations c
      JOIN doctors d ON c.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      WHERE c.id = ? AND c.patient_id = ?
    `, [consultationId, userId]);

    if (consultations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    const consultation = consultations[0];

    if (consultation.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Payment can only be made for scheduled consultations'
      });
    }

    // Check if payment already exists
    const [existingPayments] = await pool.execute(`
      SELECT id, status FROM payments WHERE consultation_id = ?
    `, [consultationId]);

    if (existingPayments.length > 0 && existingPayments[0].status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed for this consultation'
      });
    }

    // Initialize IntaSend payment
    const paymentData = {
      amount: consultation.consultation_fee,
      currency: 'USD',
      payment_method: paymentMethod,
      payment_reference: `HC_${consultationId}_${Date.now()}`,
      callback_url: `${process.env.BACKEND_URL}/api/payments/intasend/callback`,
      success_url: `${process.env.FRONTEND_URL}/payment/success`,
      fail_url: `${process.env.FRONTEND_URL}/payment/failed`,
      metadata: {
        consultation_id: consultationId,
        user_id: userId,
        doctor_name: `${consultation.doctor_first_name} ${consultation.doctor_last_name}`,
        specialty: consultation.specialty
      }
    };

    if (paymentMethod === 'mobile_money' && phoneNumber) {
      paymentData.phone_number = phoneNumber;
    }

    try {
      const intasendResponse = await axios.post(
        `${INTASEND_BASE_URL}/payment/initiate/`,
        paymentData,
        {
          headers: {
            'Authorization': `Bearer ${INTASEND_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const { checkout_url, payment_id } = intasendResponse.data;

      // Create payment record
      const [paymentResult] = await pool.execute(`
        INSERT INTO payments (consultation_id, amount, currency, payment_method, transaction_id, status, payment_data)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        consultationId,
        consultation.consultation_fee,
        'USD',
        paymentMethod,
        payment_id,
        'pending',
        JSON.stringify(intasendResponse.data)
      ]);

      res.json({
        success: true,
        message: 'Payment initialized successfully',
        data: {
          paymentId: paymentResult.insertId,
          checkoutUrl: checkout_url,
          paymentId: payment_id,
          amount: consultation.consultation_fee
        }
      });

    } catch (intasendError) {
      console.error('IntaSend API error:', intasendError.response?.data || intasendError.message);
      res.status(500).json({
        success: false,
        message: 'Failed to initialize payment',
        error: 'Payment service temporarily unavailable'
      });
    }

  } catch (error) {
    console.error('Initialize payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize payment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// IntaSend payment callback
router.post('/intasend/callback', async (req, res) => {
  try {
    const { payment_id, state, invoice_id } = req.body;

    // Verify payment with IntaSend
    try {
      const intasendResponse = await axios.get(
        `${INTASEND_BASE_URL}/payment/status/${payment_id}/`,
        {
          headers: {
            'Authorization': `Bearer ${INTASEND_API_KEY}`
          }
        }
      );

      const paymentStatus = intasendResponse.data.state;
      const metadata = intasendResponse.data.metadata;

      // Update payment record
      await pool.execute(`
        UPDATE payments 
        SET status = ?, payment_data = ?
        WHERE transaction_id = ?
      `, [
        paymentStatus === 'COMPLETE' ? 'completed' : 
        paymentStatus === 'FAILED' ? 'failed' : 'pending',
        JSON.stringify(intasendResponse.data),
        payment_id
      ]);

      // If payment is completed, update consultation status
      if (paymentStatus === 'COMPLETE') {
        await pool.execute(`
          UPDATE consultations 
          SET status = 'confirmed' 
          WHERE id = ?
        `, [metadata.consultation_id]);
      }

      res.json({ success: true, message: 'Callback processed successfully' });

    } catch (intasendError) {
      console.error('IntaSend verification error:', intasendError);
      res.status(500).json({ success: false, message: 'Payment verification failed' });
    }

  } catch (error) {
    console.error('Payment callback error:', error);
    res.status(500).json({ success: false, message: 'Callback processing failed' });
  }
});

// Get payment status
router.get('/status/:paymentId', authenticateToken, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user.userId;

    const [payments] = await pool.execute(`
      SELECT 
        p.id,
        p.amount,
        p.currency,
        p.payment_method,
        p.transaction_id,
        p.status,
        p.created_at,
        c.id as consultation_id,
        c.appointment_date,
        c.appointment_time,
        d.specialty,
        u.first_name as doctor_first_name,
        u.last_name as doctor_last_name
      FROM payments p
      JOIN consultations c ON p.consultation_id = c.id
      JOIN doctors d ON c.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      WHERE p.id = ? AND c.patient_id = ?
    `, [paymentId, userId]);

    if (payments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: payments[0]
    });

  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get user's payment history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 10, offset = 0 } = req.query;

    const [payments] = await pool.execute(`
      SELECT 
        p.id,
        p.amount,
        p.currency,
        p.payment_method,
        p.transaction_id,
        p.status,
        p.created_at,
        c.appointment_date,
        c.appointment_time,
        d.specialty,
        u.first_name as doctor_first_name,
        u.last_name as doctor_last_name
      FROM payments p
      JOIN consultations c ON p.consultation_id = c.id
      JOIN doctors d ON c.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      WHERE c.patient_id = ?
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, parseInt(limit), parseInt(offset)]);

    res.json({
      success: true,
      data: payments
    });

  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Process card payment (simplified for demo)
router.post('/card', authenticateToken, [
  body('consultationId').isInt().withMessage('Valid consultation ID is required'),
  body('cardNumber').isCreditCard().withMessage('Valid card number is required'),
  body('expiryDate').matches(/^(0[1-9]|1[0-2])\/([0-9]{2})$/).withMessage('Valid expiry date is required (MM/YY)'),
  body('cvv').isLength({ min: 3, max: 4 }).withMessage('Valid CVV is required'),
  body('cardholderName').notEmpty().withMessage('Cardholder name is required')
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

    const { consultationId, cardNumber, expiryDate, cvv, cardholderName } = req.body;
    const userId = req.user.userId;

    // Verify consultation exists and belongs to user
    const [consultations] = await pool.execute(`
      SELECT 
        c.id,
        c.status,
        d.consultation_fee
      FROM consultations c
      JOIN doctors d ON c.doctor_id = d.id
      WHERE c.id = ? AND c.patient_id = ?
    `, [consultationId, userId]);

    if (consultations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    const consultation = consultations[0];

    if (consultation.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Payment can only be made for scheduled consultations'
      });
    }

    // Simulate payment processing (in real app, integrate with payment gateway)
    const transactionId = `CARD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create payment record
    const [paymentResult] = await pool.execute(`
      INSERT INTO payments (consultation_id, amount, currency, payment_method, transaction_id, status, payment_data)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      consultationId,
      consultation.consultation_fee,
      'USD',
      'card',
      transactionId,
      'completed',
      JSON.stringify({
        cardholderName,
        last4: cardNumber.slice(-4),
        paymentMethod: 'card'
      })
    ]);

    // Update consultation status
    await pool.execute(`
      UPDATE consultations 
      SET status = 'confirmed' 
      WHERE id = ?
    `, [consultationId]);

    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        paymentId: paymentResult.insertId,
        transactionId,
        amount: consultation.consultation_fee,
        status: 'completed'
      }
    });

  } catch (error) {
    console.error('Card payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment processing failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Process M-Pesa payment
router.post('/mpesa', authenticateToken, [
  body('consultationId').isInt().withMessage('Valid consultation ID is required'),
  body('phoneNumber').isMobilePhone().withMessage('Valid phone number is required')
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

    const { consultationId, phoneNumber } = req.body;
    const userId = req.user.userId;

    // Verify consultation exists and belongs to user
    const [consultations] = await pool.execute(`
      SELECT 
        c.id,
        c.status,
        d.consultation_fee
      FROM consultations c
      JOIN doctors d ON c.doctor_id = d.id
      WHERE c.id = ? AND c.patient_id = ?
    `, [consultationId, userId]);

    if (consultations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    const consultation = consultations[0];

    if (consultation.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Payment can only be made for scheduled consultations'
      });
    }

    // Simulate M-Pesa STK Push (in real app, integrate with M-Pesa API)
    const transactionId = `MPESA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create payment record
    const [paymentResult] = await pool.execute(`
      INSERT INTO payments (consultation_id, amount, currency, payment_method, transaction_id, status, payment_data)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      consultationId,
      consultation.consultation_fee,
      'USD',
      'mobile_money',
      transactionId,
      'pending',
      JSON.stringify({
        phoneNumber,
        paymentMethod: 'mpesa',
        provider: 'safaricom'
      })
    ]);

    // Simulate successful payment after 5 seconds (in real app, this would be a callback)
    setTimeout(async () => {
      try {
        await pool.execute(`
          UPDATE payments 
          SET status = 'completed' 
          WHERE id = ?
        `, [paymentResult.insertId]);

        await pool.execute(`
          UPDATE consultations 
          SET status = 'confirmed' 
          WHERE id = ?
        `, [consultationId]);
      } catch (error) {
        console.error('M-Pesa callback simulation error:', error);
      }
    }, 5000);

    res.json({
      success: true,
      message: 'M-Pesa payment initiated. Please check your phone for the payment prompt.',
      data: {
        paymentId: paymentResult.insertId,
        transactionId,
        amount: consultation.consultation_fee,
        status: 'pending',
        phoneNumber
      }
    });

  } catch (error) {
    console.error('M-Pesa payment error:', error);
    res.status(500).json({
      success: false,
      message: 'M-Pesa payment processing failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get payment statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_payments,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful_payments,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_payments,
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_amount
      FROM payments p
      JOIN consultations c ON p.consultation_id = c.id
      WHERE c.patient_id = ?
    `, [userId]);

    res.json({
      success: true,
      data: stats[0]
    });

  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
