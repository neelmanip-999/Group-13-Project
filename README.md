# 🔐 Fraud Detection Login System - Complete MERN Stack

An intelligent authentication system that analyzes login attempts in real-time to calculate a **Risk Score (0-100)** and triggers appropriate security measures.

## 📋 Overview

This system detects suspicious login attempts based on multiple factors:
- **New Device Detection** (+30 points)
- **New Location/Geolocation** (+25 points)
- **Impossible Travel** (+40 points)
- **Odd Login Time** (+10 points)
- **Failed Login Attempts** (+10 points)
- **Flagged IP Address** (+20 points)

### Risk Levels
- **0-30**: Safe → Direct login
- **31-70**: Warning → OTP verification required
- **71-100**: Critical → Account locked + security alert

## 🏗️ Architecture

```
fraud-detection-login-system/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── AuthController.js       # Authentication & login logic
│   │   │   └── AdminController.js      # Admin dashboard API
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js       # JWT verification
│   │   │   ├── errorMiddleware.js      # Error handling
│   │   │   └── metadataMiddleware.js   # Request metadata capture
│   │   ├── models/
│   │   │   ├── User.js                 # User schema
│   │   │   ├── LoginAttempt.js         # Login history
│   │   │   ├── SuspiciousEvent.js      # Security events
│   │   │   └── OTP.js                  # OTP records
│   │   ├── services/
│   │   │   ├── RiskEngine.js           # Risk score calculation
│   │   │   ├── GeolocationService.js   # IP geolocation
│   │   │   ├── DeviceService.js        # Device fingerprinting
│   │   │   ├── EmailService.js         # Email notifications
│   │   │   └── RedisService.js         # Rate limiting & caching
│   │   ├── routes/
│   │   │   ├── authRoutes.js           # Auth endpoints
│   │   │   └── adminRoutes.js          # Admin endpoints
│   │   ├── utils/
│   │   │   ├── helpers.js              # Utility functions
│   │   │   └── jwt.js                  # JWT utilities
│   │   └── server.js                   # Main server file
│   ├── .env                            # Environment variables
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LoginForm.js            # Login component
│   │   │   ├── OTPForm.js              # OTP verification
│   │   │   ├── RiskIndicator.js        # Risk score display
│   │   │   ├── AdminCharts.js          # Analytics charts
│   │   │   └── WorldMap.js             # Threat map visualization
│   │   ├── pages/
│   │   │   ├── RegisterPage.js         # User registration
│   │   │   ├── DashboardPage.js        # User dashboard
│   │   │   ├── OTPVerificationPage.js  # OTP verification page
│   │   │   └── AdminDashboardPage.js   # Admin dashboard
│   │   ├── services/
│   │   │   └── api.js                  # API service
│   │   ├── context/
│   │   │   └── AuthContext.js          # Auth context provider
│   │   ├── utils/
│   │   │   └── ProtectedRoute.js       # Route protection
│   │   ├── App.js                      # Main app component
│   │   ├── index.js                    # React entry point
│   │   └── index.css                   # Global styles
│   ├── public/
│   │   └── index.html
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
└── README.md (this file)
```

## 🚀 Quick Start

### Prerequisites
- Node.js >= 14
- MongoDB running locally or remote connection
- Redis running locally or remote connection
- Gmail account (for email notifications)

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file with your configuration
# Edit .env with your settings:
# - MONGODB_URI: MongoDB connection string
# - JWT_SECRET: Your JWT secret key
# - EMAIL_USER: Gmail address
# - EMAIL_PASS: Gmail app password
# - IPINFO_API_KEY: ipinfo.io API key (free tier available)

# Start the backend server
npm run dev
# Server runs on http://localhost:5000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local (optional)
# REACT_APP_API_URL=http://localhost:5000/api

# Start the React development server
npm start
# Frontend runs on http://localhost:3000
```

## 📚 API Documentation

### Authentication Endpoints

#### Register
```
POST /api/auth/register
Body: {
  "email": "user@example.com",
  "password": "securePassword",
  "firstName": "John",
  "lastName": "Doe"
}
Response: { success, token, user }
```

#### Login (with Risk Assessment)
```
POST /api/auth/login
Body: {
  "email": "user@example.com",
  "password": "securePassword"
}
Response: {
  success,
  token (if safe),
  requiresOTP (if medium risk),
  riskScore,
  riskLevel,
  reasons
}
```

#### Verify OTP
```
POST /api/auth/verify-otp
Body: {
  "loginAttemptId": "...",
  "code": "123456"
}
Response: { success, token, user }
```

#### Get Current User
```
GET /api/auth/me
Headers: Authorization: Bearer <token>
Response: { success, user }
```

### Admin Endpoints

#### Get Login Attempts
```
GET /api/admin/login-attempts?page=1&limit=50&riskLevel=critical&country=US&email=test
Response: { success, data, pagination }
```

#### Get Suspicious Events
```
GET /api/admin/suspicious-events?page=1&limit=50&severity=high&type=brute_force
Response: { success, data, pagination }
```

#### Get Dashboard Statistics
```
GET /api/admin/dashboard-stats
Response: {
  success,
  stats: {
    loginAttempts,
    riskDistribution,
    statusDistribution,
    topCountries,
    suspiciousEvents,
    hourlyAttempts
  }
}
```

#### Get Location Data (for map)
```
GET /api/admin/location-data
Response: {
  success,
  markers: [
    { lat, lng, riskLevel, status, email, city, country }
  ]
}
```

#### Get User Details
```
GET /api/admin/user/:userId
Response: { success, user, loginHistory, suspiciousEvents }
```

#### Resolve Suspicious Event
```
PUT /api/admin/resolve-event/:eventId
Body: { "resolvedBy": "admin_name" }
Response: { success, data }
```

#### Unlock User Account
```
PUT /api/admin/unlock-user/:userId
Response: { success, user }
```

## 🎯 Risk Engine Logic

The system calculates risk based on:

```javascript
Risk Score = 0-30 (Safe) | 31-70 (Warning) | 71-100 (Critical)

Factors:
- New Device: +30
- New Location: +25
- Impossible Travel: +40
- Odd Login Time (2-4 AM): +10
- Failed Attempts: +5 per attempt (max 15)
- Flagged IP: +20
- New Device + Location: +15
```

### Impossible Travel Detection
- Calculates distance between previous and current location
- Compares with time elapsed
- Detects if travel speed > 900 km/hour (commercial flight speed)

### Velocity/Brute Force Detection
- Tracks failed attempts per IP (default: block after 5 failed attempts)
- Tracks failed attempts per user (default: lock account after 5 attempts)
- Rate limiting window: 1 hour

## 🔐 Security Features

1. **Password Security**
   - Bcrypt hashing with salt
   - Minimum 6 characters

2. **JWT Authentication**
   - Secure token generation
   - Configurable expiry (default: 7 days)

3. **Rate Limiting**
   - IP-based rate limiting via Redis
   - User-based rate limiting
   - Account locking after suspicious activity

4. **OTP Verification**
   - 6-digit OTP sent via email
   - 10-minute expiry
   - 3 attempt limit

5. **Email Notifications**
   - OTP verification emails
   - Suspicious login alerts
   - Account locked warnings

6. **Geolocation**
   - IP to location resolution
   - Impossible travel detection
   - Location history tracking

7. **Device Fingerprinting**
   - User-Agent parsing
   - Device identification
   - New device detection

## 📊 Admin Dashboard Features

1. **Real-time Threat Map**
   - Visual representation of login attempts
   - Color-coded by risk level
   - Geographic distribution

2. **Analytics & Charts**
   - 24-hour login trend
   - Risk distribution pie chart
   - Top countries by attempts
   - Account statistics

3. **Login Attempts Table**
   - Filterable by risk level, country, email
   - Real-time updates
   - Status indicators

4. **Suspicious Events Log**
   - Type, severity, and details
   - Resolvable events
   - Historical tracking

5. **User Management**
   - View user login history
   - Unlock locked accounts
   - View associated events

## 🧪 Testing the System

### Test Case 1: Safe Login
```
1. Register new user
2. Login from same device/location
3. Result: Instant login success
```

### Test Case 2: Medium Risk (OTP Required)
```
1. Use VPN to simulate new location
2. Update browser user agent
3. Result: OTP sent to email
4. Verify OTP to complete login
```

### Test Case 3: High Risk (Account Locked)
```
1. Attempt login 5 times with wrong password
2. OR trigger high-risk factors
3. Result: Account locked for 30+ minutes
4. Security email sent to user
```

### Test Case 4: Brute Force Protection
```
1. Attempt login with wrong password from same IP 5+ times
2. Result: IP blacklisted for 1 hour
3. New requests from this IP blocked immediately
```

## 🛠️ Configuration

### Environment Variables (.env)

```
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/fraud-detection

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_SERVICE=gmail

# APIs
IPINFO_API_KEY=your_api_key
MAXMIND_LICENSE_KEY=your_license_key

# Frontend
FRONTEND_URL=http://localhost:3000

# Risk Configuration
VELOCITY_LIMIT=5
VELOCITY_WINDOW=3600
IMPOSSIBLE_TRAVEL_THRESHOLD=900
UNUSUAL_TIME_THRESHOLD=10
```

## 📦 Dependencies

### Backend
- Express.js - Web framework
- Mongoose - MongoDB ODM
- Bcryptjs - Password hashing
- JWT - Authentication
- Redis - Caching & rate limiting
- Nodemailer - Email service
- ua-parser-js - Device fingerprinting
- Axios - HTTP requests
- CORS - Cross-origin resource sharing

### Frontend
- React 18 - UI library
- React Router - Navigation
- Axios - API calls
- Tailwind CSS - Styling
- Chart.js - Analytics charts
- react-toastify - Notifications

## 🚨 Error Handling

The system includes comprehensive error handling:
- Invalid credentials
- Account locked
- IP blacklisted
- OTP expired
- Database errors
- Network errors

All errors return appropriate HTTP status codes and messages.

## 📈 Performance Optimization

1. **Risk Calculation**: < 200ms
2. **Database Indexing**: On email, IP, timestamp
3. **Redis Caching**: For rate limiting & OTP storage
4. **Request Validation**: Early validation to reduce load

## 🔄 Real-time Updates

- Admin dashboard auto-refreshes every 10 seconds
- Threat map updates every 5 seconds
- Charts update automatically

## 🌍 Geolocation Services

Currently using **ipinfo.io** (free tier):
- 50,000 requests/month free
- City, country, lat/long coordinates
- Easy to switch to MaxMind if needed

## 📝 Logging

- All login attempts logged to database
- Suspicious events tracked with details
- User device and location history maintained
- No sensitive data (passwords) logged

## 🤝 Contributing

This is a hackathon project. Feel free to extend with:
- ML-based anomaly detection
- Machine Learning for behavior patterns
- Advanced geofencing
- Blockchain for transaction verification
- Mobile app integration

## 📄 License

MIT License - Feel free to use for personal/educational purposes.

## 📞 Support

For issues or questions, refer to the API documentation above or check the source code comments.

---






Team Members :-
1). Neelmani Pandey (Leader)
2). Soumya Upadhyay
3). Bhoomika Agrawal
4). Apporv Mehrotra
5). Manish Kumar
