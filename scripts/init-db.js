const { pool, testConnection, initializeDatabase } = require('../config/database');

const initializeSampleData = async () => {
  try {
    const connection = await pool.getConnection();

    // Insert sample doctors
    const sampleDoctors = [
      {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@healthconnect.com',
        phone: '+1234567890',
        specialty: 'Family Medicine',
        licenseNumber: 'MD123456',
        experienceYears: 8,
        consultationFee: 50.00,
        bio: 'Experienced family medicine physician with expertise in preventive care and chronic disease management.'
      },
      {
        firstName: 'Michael',
        lastName: 'Chen',
        email: 'michael.chen@healthconnect.com',
        phone: '+1234567891',
        specialty: 'Cardiology',
        licenseNumber: 'MD123457',
        experienceYears: 12,
        consultationFee: 75.00,
        bio: 'Board-certified cardiologist specializing in heart disease prevention and treatment.'
      },
      {
        firstName: 'Emily',
        lastName: 'Rodriguez',
        email: 'emily.rodriguez@healthconnect.com',
        phone: '+1234567892',
        specialty: 'Dermatology',
        licenseNumber: 'MD123458',
        experienceYears: 6,
        consultationFee: 60.00,
        bio: 'Dermatologist focused on skin health, cosmetic procedures, and skin cancer prevention.'
      },
      {
        firstName: 'James',
        lastName: 'Wilson',
        email: 'james.wilson@healthconnect.com',
        phone: '+1234567893',
        specialty: 'General Medicine',
        licenseNumber: 'MD123459',
        experienceYears: 15,
        consultationFee: 45.00,
        bio: 'General practitioner with extensive experience in rural healthcare and telemedicine.'
      }
    ];

    for (const doctorData of sampleDoctors) {
      // Create user account for doctor
      const [userResult] = await connection.execute(`
        INSERT INTO users (first_name, last_name, email, phone, password_hash, role)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        doctorData.firstName,
        doctorData.lastName,
        doctorData.email,
        doctorData.phone,
        '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK2O', // password: doctor123
        'doctor'
      ]);

      // Create doctor profile
      await connection.execute(`
        INSERT INTO doctors (user_id, specialty, license_number, experience_years, consultation_fee, bio, availability)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        userResult.insertId,
        doctorData.specialty,
        doctorData.licenseNumber,
        doctorData.experienceYears,
        doctorData.consultationFee,
        doctorData.bio,
        JSON.stringify({
          monday: { start: '09:00', end: '17:00' },
          tuesday: { start: '09:00', end: '17:00' },
          wednesday: { start: '09:00', end: '17:00' },
          thursday: { start: '09:00', end: '17:00' },
          friday: { start: '09:00', end: '17:00' },
          saturday: { start: '10:00', end: '14:00' },
          sunday: { start: '10:00', end: '14:00' }
        })
      ]);
    }

    // Insert sample health resources
    const sampleResources = [
      {
        title: 'Understanding Blood Pressure',
        content: 'Blood pressure is the force of blood pushing against the walls of your arteries. Normal blood pressure is typically around 120/80 mmHg. High blood pressure (hypertension) can lead to serious health problems including heart disease and stroke. Regular monitoring and lifestyle changes can help maintain healthy blood pressure levels.',
        category: 'cardiovascular_health',
        tags: ['blood pressure', 'hypertension', 'heart health', 'prevention'],
        author: 'Dr. Michael Chen'
      },
      {
        title: 'Skin Care Basics',
        content: 'Proper skin care is essential for maintaining healthy skin. This includes daily cleansing, moisturizing, and sun protection. Understanding your skin type and using appropriate products can help prevent common skin issues and maintain a healthy complexion.',
        category: 'dermatology',
        tags: ['skin care', 'dermatology', 'prevention', 'beauty'],
        author: 'Dr. Emily Rodriguez'
      },
      {
        title: 'Nutrition for Better Health',
        content: 'A balanced diet is crucial for overall health and well-being. Focus on consuming a variety of fruits, vegetables, whole grains, lean proteins, and healthy fats. Proper nutrition can help prevent chronic diseases and maintain a healthy weight.',
        category: 'nutrition',
        tags: ['nutrition', 'diet', 'health', 'prevention'],
        author: 'Dr. Sarah Johnson'
      },
      {
        title: 'Exercise and Physical Activity',
        content: 'Regular physical activity is essential for maintaining good health. Aim for at least 150 minutes of moderate-intensity exercise per week. Exercise helps strengthen the heart, improve circulation, and boost overall well-being.',
        category: 'fitness',
        tags: ['exercise', 'fitness', 'health', 'wellness'],
        author: 'Dr. James Wilson'
      },
      {
        title: 'Mental Health Awareness',
        content: 'Mental health is as important as physical health. Stress, anxiety, and depression are common mental health concerns that can affect anyone. Seeking help and support is crucial for maintaining good mental health and overall well-being.',
        category: 'mental_health',
        tags: ['mental health', 'stress', 'anxiety', 'depression'],
        author: 'HealthConnect Team'
      }
    ];

    for (const resource of sampleResources) {
      await connection.execute(`
        INSERT INTO health_resources (title, content, category, tags, author)
        VALUES (?, ?, ?, ?, ?)
      `, [
        resource.title,
        resource.content,
        resource.category,
        JSON.stringify(resource.tags),
        resource.author
      ]);
    }

    // Insert sample health tips
    const healthTips = [
      {
        title: 'Stay Hydrated',
        content: 'Drink at least 8 glasses of water daily to maintain optimal health and support your body\'s natural functions. Proper hydration helps with digestion, circulation, and temperature regulation.',
        category: 'health_tips',
        tags: ['hydration', 'water', 'health'],
        author: 'HealthConnect Team'
      },
      {
        title: 'Get Enough Sleep',
        content: 'Aim for 7-9 hours of quality sleep each night. Good sleep is essential for physical and mental health, helping with memory, mood, and immune function.',
        category: 'health_tips',
        tags: ['sleep', 'rest', 'health'],
        author: 'HealthConnect Team'
      },
      {
        title: 'Practice Good Hand Hygiene',
        content: 'Wash your hands frequently with soap and water for at least 20 seconds. This simple practice can prevent the spread of many infectious diseases.',
        category: 'health_tips',
        tags: ['hygiene', 'prevention', 'health'],
        author: 'HealthConnect Team'
      },
      {
        title: 'Eat a Rainbow',
        content: 'Include a variety of colorful fruits and vegetables in your diet. Different colors provide different nutrients that are essential for good health.',
        category: 'health_tips',
        tags: ['nutrition', 'fruits', 'vegetables', 'health'],
        author: 'HealthConnect Team'
      },
      {
        title: 'Take Regular Breaks',
        content: 'If you work at a desk, take regular breaks to stand up, stretch, and move around. This helps prevent back pain and improves circulation.',
        category: 'health_tips',
        tags: ['ergonomics', 'workplace', 'health'],
        author: 'HealthConnect Team'
      }
    ];

    for (const tip of healthTips) {
      await connection.execute(`
        INSERT INTO health_resources (title, content, category, tags, author)
        VALUES (?, ?, ?, ?, ?)
      `, [
        tip.title,
        tip.content,
        tip.category,
        JSON.stringify(tip.tags),
        tip.author
      ]);
    }

    // Insert sample patient user for testing
    const bcrypt = require('bcryptjs');
    const patientPasswordHash = await bcrypt.hash('patient123', 12);
    
    await connection.execute(`
      INSERT IGNORE INTO users (first_name, last_name, email, phone, date_of_birth, password_hash, role)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      'John',
      'Doe',
      'patient@example.com',
      '+1234567890',
      '1990-01-01',
      patientPasswordHash,
      'patient'
    ]);

    connection.release();
    console.log('✅ Sample data initialized successfully');

  } catch (error) {
    console.error('❌ Sample data initialization failed:', error.message);
    throw error;
  }
};

const checkAndCreateDatabase = async () => {
  try {
    // Connect without specifying database to create it if needed
    const tempConnection = await require('mysql2/promise').createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306
    });

    // Create database if it doesn't exist
    await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'healthconnect'}`);
    console.log(`✅ Database '${process.env.DB_NAME || 'healthconnect'}' is ready`);
    
    await tempConnection.end();
  } catch (error) {
    console.error('❌ Failed to create database:', error.message);
    throw error;
  }
};

const main = async () => {
  try {
    console.log('🚀 Starting database initialization...');
    console.log('📋 Configuration:');
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   Database: ${process.env.DB_NAME || 'healthconnect'}`);
    console.log(`   User: ${process.env.DB_USER || 'root'}`);
    
    // Create database if needed
    await checkAndCreateDatabase();
    
    // Test database connection
    await testConnection();
    
    // Initialize database tables
    await initializeDatabase();
    
    // Initialize sample data
    await initializeSampleData();
    
    console.log('\n🎉 Database initialization completed successfully!');
    console.log('📊 Database is ready for use');
    console.log('👥 Sample doctors and health resources have been added');
    console.log('\n📝 Sample login credentials:');
    console.log('   📧 Email: patient@example.com');
    console.log('   🔑 Password: patient123');
    console.log('\n🏥 Sample doctors available:');
    console.log('   • Dr. Sarah Johnson - Family Medicine ($50)');
    console.log('   • Dr. Michael Chen - Cardiology ($75)');
    console.log('   • Dr. Emily Rodriguez - Dermatology ($60)');
    console.log('   • Dr. James Wilson - General Medicine ($45)');
    console.log('\n🚀 Start your server with: npm run dev');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    console.error('💡 Make sure MySQL is running and credentials are correct');
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { initializeSampleData };
