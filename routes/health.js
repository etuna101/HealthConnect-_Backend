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

// Get health resources
router.get('/resources', async (req, res) => {
  try {
    const { category, limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT 
        id,
        title,
        content,
        category,
        tags,
        author,
        published_at,
        status
      FROM health_resources 
      WHERE status = 'published'
    `;
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY published_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [resources] = await pool.execute(query, params);

    res.json({
      success: true,
      data: resources.map(resource => ({
        ...resource,
        tags: JSON.parse(resource.tags || '[]')
      }))
    });

  } catch (error) {
    console.error('Get health resources error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch health resources',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get health resource by ID
router.get('/resources/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [resources] = await pool.execute(`
      SELECT 
        id,
        title,
        content,
        category,
        tags,
        author,
        published_at,
        status
      FROM health_resources 
      WHERE id = ? AND status = 'published'
    `, [id]);

    if (resources.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Health resource not found'
      });
    }

    const resource = resources[0];

    res.json({
      success: true,
      data: {
        ...resource,
        tags: JSON.parse(resource.tags || '[]')
      }
    });

  } catch (error) {
    console.error('Get health resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch health resource',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Search health resources
router.get('/resources/search', async (req, res) => {
  try {
    const { q, limit = 20, offset = 0 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const [resources] = await pool.execute(`
      SELECT 
        id,
        title,
        content,
        category,
        tags,
        author,
        published_at,
        status
      FROM health_resources 
      WHERE status = 'published' 
        AND (title LIKE ? OR content LIKE ? OR JSON_SEARCH(tags, 'one', ?) IS NOT NULL)
      ORDER BY published_at DESC 
      LIMIT ? OFFSET ?
    `, [`%${q}%`, `%${q}%`, q, parseInt(limit), parseInt(offset)]);

    res.json({
      success: true,
      data: resources.map(resource => ({
        ...resource,
        tags: JSON.parse(resource.tags || '[]')
      }))
    });

  } catch (error) {
    console.error('Search health resources error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search health resources',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get health categories
router.get('/categories', async (req, res) => {
  try {
    const [categories] = await pool.execute(`
      SELECT DISTINCT category, COUNT(*) as count
      FROM health_resources 
      WHERE status = 'published'
      GROUP BY category
      ORDER BY count DESC
    `);

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Get health categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch health categories',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
