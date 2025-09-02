# HealthConnect Backend API

A comprehensive backend API for the HealthConnect mHealth application, built with Node.js, Express, and MySQL. This application supports SDG Goal 3: Good Health and Well-being by providing accessible healthcare services through telemedicine.

## Features

- **User Authentication & Authorization**: Secure JWT-based authentication system
- **Consultation Management**: Book, manage, and track medical consultations
- **Payment Integration**: IntaSend payment gateway integration for secure transactions
- **Health Records**: Digital health record management
- **Health Resources**: Educational health content and resources
- **Emergency Information**: Emergency contacts and first aid information
- **SDG 3 Alignment**: Dedicated endpoints for SDG Goal 3 information

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Tokens)
- **Payment**: IntaSend API
- **Validation**: Express-validator
- **Security**: Helmet, CORS, Rate limiting

## Prerequisites

- Node.js (v18 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   Edit `.env` file with your configuration values.

4. **Set up MySQL database**
   - Create a MySQL database named `healthconnect`
   - Update the database credentials in `.env`

5. **Initialize the database**
   ```bash
   npm run init-db
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

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
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Backend URL (for callbacks)
BACKEND_URL=http://localhost:5000

# IntaSend Configuration
INTASEND_API_KEY=your_intasend_api_key
INTASEND_PUBLISHABLE_KEY=your_intasend_publishable_key
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/change-password` - Change password

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/health-records` - Get user health records
- `POST /api/users/health-records` - Add health record
- `GET /api/users/dashboard-stats` - Get dashboard statistics

### Consultations
- `GET /api/consultations/doctors` - Get available doctors
- `GET /api/consultations/doctors/:id` - Get doctor details
- `POST /api/consultations/book` - Book consultation
- `GET /api/consultations/my-consultations` - Get user consultations
- `GET /api/consultations/:id` - Get consultation details
- `PUT /api/consultations/:id/cancel` - Cancel consultation
- `GET /api/consultations/stats/overview` - Get consultation statistics

### Payments
- `POST /api/payments/intasend/initialize` - Initialize IntaSend payment
- `POST /api/payments/intasend/callback` - IntaSend payment callback
- `POST /api/payments/card` - Process card payment
- `GET /api/payments/status/:id` - Get payment status
- `GET /api/payments/history` - Get payment history
- `GET /api/payments/stats/overview` - Get payment statistics

### Health Resources
- `GET /api/health/resources` - Get health resources
- `GET /api/health/resources/:id` - Get specific health resource
- `GET /api/health/resources/categories` - Get resource categories
- `GET /api/health/resources/search` - Search health resources
- `GET /api/health/tips` - Get health tips
- `GET /api/health/emergency` - Get emergency information
- `GET /api/health/sdg3` - Get SDG 3 information
- `GET /api/health/statistics` - Get health statistics

## Database Schema

The application uses the following main tables:

- **users**: User accounts and profiles
- **doctors**: Doctor information and specialties
- **consultations**: Medical consultation bookings
- **payments**: Payment transactions
- **health_records**: User health records
- **health_resources**: Educational health content

## Payment Integration

The application integrates with IntaSend for payment processing:

1. **Initialize Payment**: Creates a payment session with IntaSend
2. **Payment Processing**: Handles various payment methods (mobile money, cards, bank transfers)
3. **Callback Handling**: Processes payment confirmations
4. **Status Tracking**: Monitors payment status and updates consultation status

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Protection**: Cross-origin resource sharing protection
- **Helmet Security**: Security headers middleware

## Development

### Running in Development Mode
```bash
npm run dev
```

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

## Deployment

### Prerequisites for Production
- Set `NODE_ENV=production`
- Use a strong JWT secret
- Configure proper database credentials
- Set up SSL certificates
- Configure IntaSend production keys

### Deployment Options
- **Heroku**: Easy deployment with PostgreSQL
- **AWS**: EC2 with RDS MySQL
- **DigitalOcean**: Droplet with managed MySQL
- **Railway**: Simple deployment platform

## Contributing to SDG Goal 3

This application directly contributes to UN Sustainable Development Goal 3: Good Health and Well-being by:

1. **Universal Health Coverage**: Providing accessible healthcare through telemedicine
2. **Rural Healthcare Access**: Bridging the healthcare gap in underserved areas
3. **Preventive Care**: Health education and resources
4. **Affordable Healthcare**: Digital solutions reducing costs
5. **Health Monitoring**: Remote health tracking capabilities

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## License

This project is licensed under the MIT License.


