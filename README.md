# Research iGaming Backend

A Node.js backend service with Firebase authentication and user management.

## Prerequisites

- Node.js (v18 or higher)
- npm
- Firebase project with:
  - Google Authentication enabled
  - Admin SDK credentials
  - Web App configuration


1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your Firebase credentials:
```env
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="your-private-key"
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=your-cert-url
FIREBASE_UNIVERSE_DOMAIN=googleapis.com
BUCKET_URL=your-storage-bucket-url
JWT_SECRET=your-jwt-secret
```

## Running the Server

Start the development server:
```bash
npm start
```

The server will run on `http://localhost:8000` by default.

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/google` - Google Sign-In

### User Management

- `GET /api/auth/users/:userId` - Get user profile
- `PUT /api/auth/users/:userId/roles` - Update user roles
- `PUT /api/auth/:id/update` - Update user profile
- `GET /api/auth/google/profile` - Get Google user profile (Protected)
  - Requires JWT token in Authorization header
  - Returns detailed user profile including Google provider data

## Testing

### Authentication Flow Testing

1. Basic Authentication:
```bash
# Register
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
        "email":"test@example.com",
        "password":"password123"
      }'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
        "email":"test@example.com",
        "password":"password123"
      }'
```

2. Google Sign-In Testing:
- Follow the instructions in [GoogleSignIn.md](GoogleSignIn.md)

### Protected Routes Testing

Use the JWT token from authentication in the Authorization header:
```bash
# Get user profile
curl -X GET http://localhost:8000/api/auth/users/123 \
  -H "Authorization: Bearer your_jwt_token"

# Update user role
curl -X PUT http://localhost:8000/api/auth/users/123/roles \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
        "roles":["admin"]
      }'
```

## File Structure

```
research-igaming-backend/
├── config/
│   └── firebase.js
├── controllers/
│   └── authController.js
├── middleware/
│   └── multerUpload.js
├── public/
│   └── index.html
├── routes/
│   └── authRouter.js
├── .env
├── .gitignore
├── index.js
├── package.json
├── passport.js
└── README.md
```

## Security Notes

1. Keep your `.env` file secure and never commit it to version control
2. Use HTTPS in production
3. Implement rate limiting for production use
4. Regularly rotate JWT secrets
5. Keep Firebase Admin SDK credentials secure

## Error Handling

Common error responses:
```json
{
  "error": "Invalid credentials"
}
```
```json
{
  "error": "User not found"
}
```
```json
{
  "error": "Unauthorized access"
}
```

