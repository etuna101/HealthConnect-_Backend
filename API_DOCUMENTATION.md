# HealthConnect API Documentation

## Overview

The HealthConnect API provides endpoints for a comprehensive telemedicine platform supporting user authentication, consultation booking, payment processing, health resources, and messaging.

## Base URL
```
http://localhost:5000/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## API Endpoints

### Authentication Routes (`/api/auth`)

#### POST `/register`
Register a new user account.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "dateOfBirth": "1990-01-01",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "role": "patient"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST `/login`
Authenticate user and get access token.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "securepassword123"
}
```

#### GET `/profile`
Get current user profile information.

#### GET `/verify`
Verify if the current token is valid.

#### POST `/logout`
Logout user (clears token on frontend).

#### PUT `/change-password`
Change user password.

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

### User Routes (`/api/users`)

#### GET `/profile` 🔒
Get detailed user profile.

#### PUT `/profile` 🔒
Update user profile information.

#### GET `/health-records` 🔒
Get user's health records.

#### POST `/health-records` 🔒
Add a new health record.

#### GET `/dashboard-stats` 🔒
Get dashboard statistics for the user.

### Consultation Routes (`/api/consultations`)

#### GET `/doctors`
Get list of all available doctors.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "specialty": "Family Medicine",
      "license_number": "MD123456",
      "experience_years": 8,
      "consultation_fee": 50.00,
      "availability": {
        "monday": {"start": "09:00", "end": "17:00"},
        "tuesday": {"start": "09:00", "end": "17:00"}
      },
      "bio": "Experienced family medicine physician...",
      "first_name": "Sarah",
      "last_name": "Johnson",
      "email": "sarah.johnson@healthconnect.com"
    }
  ]
}
```

#### GET `/doctors/:id`
Get specific doctor information.

#### POST `/book` 🔒
Book a new consultation.

**Request Body:**
```json
{
  "doctorId": 1,
  "appointmentDate": "2024-01-15",
  "appointmentTime": "10:00",
  "type": "video",
  "symptoms": "Feeling unwell with cold symptoms"
}
```

#### GET `/my-consultations` 🔒
Get user's consultations.

#### GET `/upcoming` 🔒
Get upcoming appointments for dashboard.

#### GET `/recent` 🔒
Get recent consultations for dashboard.

#### GET `/:id` 🔒
Get specific consultation details.

#### PUT `/:id/cancel` 🔒
Cancel a consultation.

#### PUT `/:id/reschedule` 🔒
Reschedule a consultation.

**Request Body:**
```json
{
  "appointmentDate": "2024-01-16",
  "appointmentTime": "14:00"
}
```

#### GET `/stats/overview` 🔒
Get consultation statistics.

### Payment Routes (`/api/payments`)

#### POST `/card` 🔒
Process credit card payment.

**Request Body:**
```json
{
  "consultationId": 1,
  "cardNumber": "4111111111111111",
  "expiryDate": "12/25",
  "cvv": "123",
  "cardholderName": "John Doe"
}
```

#### POST `/mpesa` 🔒
Process M-Pesa mobile money payment.

**Request Body:**
```json
{
  "consultationId": 1,
  "phoneNumber": "+254700000000"
}
```

#### POST `/intasend/initialize` 🔒
Initialize IntaSend payment.

**Request Body:**
```json
{
  "consultationId": 1,
  "paymentMethod": "mobile_money",
  "phoneNumber": "+254700000000"
}
```

#### POST `/intasend/callback`
IntaSend payment callback (webhook).

#### GET `/status/:paymentId` 🔒
Get payment status.

#### GET `/history` 🔒
Get user's payment history.

#### GET `/stats/overview` 🔒
Get payment statistics.

### Health Routes (`/api/health`)

#### GET `/resources`
Get health resources and articles.

**Query Parameters:**
- `category` - Filter by category
- `limit` - Number of items to return (default: 10)
- `offset` - Pagination offset (default: 0)

#### GET `/resources/:id`
Get specific health resource.

#### GET `/resources/categories`
Get all health resource categories.

#### GET `/resources/search`
Search health resources.

**Query Parameters:**
- `q` - Search query (required)
- `limit` - Number of items to return
- `offset` - Pagination offset

#### GET `/tips`
Get health tips.

#### GET `/emergency`
Get emergency information and contacts.

#### GET `/sdg3`
Get SDG 3 (Good Health and Well-being) information.

#### GET `/statistics`
Get platform health statistics.

### Message Routes (`/api/messages`)

#### GET `/` 🔒
Get user's message conversations.

#### GET `/:contactId` 🔒
Get messages with a specific contact.

#### POST `/send` 🔒
Send a message.

**Request Body:**
```json
{
  "receiverId": 2,
  "content": "Hello, I have a question about my prescription.",
  "messageType": "text"
}
```

#### GET `/unread/count` 🔒
Get count of unread messages.

## Error Responses

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (in development mode)",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email"
    }
  ]
}
```

## HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

API requests are rate-limited to 100 requests per 15 minutes per IP address.

## Database Schema

### Users Table
- `id` - Primary key
- `first_name` - User's first name
- `last_name` - User's last name
- `email` - Unique email address
- `phone` - Phone number
- `date_of_birth` - Date of birth
- `password_hash` - Encrypted password
- `role` - User role (patient, doctor, admin)
- `status` - Account status (active, inactive, suspended)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Doctors Table
- `id` - Primary key
- `user_id` - Foreign key to users table
- `specialty` - Medical specialty
- `license_number` - Medical license number
- `experience_years` - Years of experience
- `consultation_fee` - Fee per consultation
- `availability` - JSON object with availability schedule
- `bio` - Doctor's biography

### Consultations Table
- `id` - Primary key
- `patient_id` - Foreign key to users (patient)
- `doctor_id` - Foreign key to doctors
- `appointment_date` - Date of appointment
- `appointment_time` - Time of appointment
- `duration` - Duration in minutes
- `type` - Consultation type (video, audio, chat)
- `status` - Status (scheduled, confirmed, in_progress, completed, cancelled)
- `symptoms` - Patient's symptoms
- `diagnosis` - Doctor's diagnosis
- `prescription` - Prescribed medications
- `notes` - Additional notes

### Payments Table
- `id` - Primary key
- `consultation_id` - Foreign key to consultations
- `amount` - Payment amount
- `currency` - Currency code
- `payment_method` - Payment method (card, mobile_money, intasend)
- `transaction_id` - Unique transaction identifier
- `status` - Payment status (pending, completed, failed, refunded)
- `payment_data` - JSON object with payment details

### Health Records Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `record_type` - Type of record (vital_signs, lab_results, medications, allergies, immunizations)
- `title` - Record title
- `description` - Record description
- `data` - JSON object with record data
- `file_url` - URL to attached file
- `created_at` - Creation timestamp

### Messages Table
- `id` - Primary key
- `sender_id` - Foreign key to users (sender)
- `receiver_id` - Foreign key to users (receiver)
- `content` - Message content
- `message_type` - Type (text, image, file)
- `read_at` - When message was read
- `created_at` - Creation timestamp

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=healthconnect
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Backend URL (for callbacks)
BACKEND_URL=http://localhost:5000

# IntaSend Configuration
INTASEND_API_KEY=your_intasend_api_key
INTASEND_PUBLISHABLE_KEY=your_intasend_publishable_key

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_password
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables in `.env` file

3. Initialize the database:
   ```bash
   npm run init-db
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. The API will be available at `http://localhost:5000`

## Testing

Use tools like Postman or curl to test the API endpoints. Remember to include the Authorization header for protected routes.

Example curl request:
```bash
curl -X GET \
  http://localhost:5000/api/auth/profile \
  -H 'Authorization: Bearer your_jwt_token_here'
```

## 🔒 = Requires Authentication
