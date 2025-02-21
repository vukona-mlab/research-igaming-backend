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
- `PUT /api/auth/users/:userId/update` - Update user profile
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
        "password":"password123",
        "roles": ["Freelancer"]
      }'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
        "email":"test@example.com",
        "password":"password123"
      }'

# Google Sign In
curl -X POST http://localhost:8000/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{
        "idToken":"firebase idToken",
      }'

# Update Roles
curl -X POST http://localhost:8000/api/auth/users/123/roles\
  -H "Content-Type: application/json" \
  -d '{
        "roles":"["Client"]",
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

### Models

#### User Model

- DisplayName (unique)
- Name
- Surname
- Email (unique)
- JobTitle
- PhoneNumber
- ProfilePicture
- DateOfBirth
- Specialities
- Categories
- Bio
- Roles
- Files
- CreatedAt
- UpdatedAt

#### Project Model

- User reference
- Title
- Description
- Category
- Price
- Images
- Features
- Sales count
- Star rating
- Timestamps enabled

#### Message Model

- Conversation ID
- User ID
- Message content
- No timestamps

#### Conversation Model

- Unique conversation ID (UUID)
- Seller ID
- Buyer ID
- Read status
- Timestamps enabled

#### Transaction Model

- Project reference
- Buyer/Seller references
- Price
- Payment intent
- Completion status

#### Review Model

- Project reference
- User reference
- Star rating
- Description

### Controllers

#### Auth Controller

- Register: User registration with password hashing
- Login: Authentication with JWT
- Logout: Cookie clearing
- Status check: Current user verification

#### Project Controller

- Create: New project creation (client only)
- Delete: Project removal
- Get: Single project retrieval
- List: Filtered project listing

#### Message Controller

- Create: New message creation
- List: Conversation messages retrieval

#### Transaction Controller

- List: Transaction history
- Payment: Paypal/Stripe integration
- Status update: Payment confirmation

#### Review Controller

- Create: New review submission
- Get: Project reviews retrieval
- Delete: Review removal

### Middlewares

#### Authentication Middleware

- JWT verification

#### User Middleware

- Token validation
- User role verification
- Request augmentation with user data

### Routes

#### Project Routes

POST /projects
DELETE /projects/:id
GET /projects/single/:id
GET /projects

#### Message Routes

Split into:

```javascript
{
  freelancer / messages;
  client / messages;
}
```

POST /messages
GET /messages/:conversationId

#### Transaction Routes

GET /transactions
POST /transactions/create-payment-intent/:id
PATCH /transactions

#### Review Routes

POST /reviews
GET /reviews/:projectId
DELETE /reviews/:id

## API Endpoints Details

### Auth Endpoints

#### POST /auth/register

Creates a new user account
Request body:

```javascript
{
    email: string,
    password: string,
    roles: array,
}
```

#### POST /auth/login

Authenticates a user
Request body:

```javascript
{
    email: string,
    password: string
}
```

### Project Endpoints

Split into:

```javascript
{
  freelancer / projects;
  client / projects;
}
```

#### POST /projects

Creates a new project
Requires client authentication
Request body:

```javascript
{
    title: string,
    description: string,
    category: string,
    price: number,
    cover: string,
    images: string[],
    shortTitle: string,
    shortDesc: string,
    deliveryTime: string,
    revisionNumber: number,
    features: string[]
}
```

#### DELETE /projects/:id

Deletes a project
Requires project owner authentication

#### GET /projects/single/:id

Gets detailed project information

#### GET /projects

Lists projects with optional filters
Query parameters:

```javascript
{
    category: string,
    search: string,
    max: number,
    min: number,
    sort: string,
    userId: string
}
```

## Database Schema Details

### User Schema

```javascript
{
    displayName: { type: String, unique: true },
    name: { type: String},
    surname: { type: String },
    email: { type: String, required: true, unique: true },
    jobTitle: { type: String },
    phoneNumber: { type: String},
    profilePicture: { type: String },
    dateOfBirth: { type: String },
    specialities: { type: Array },
    categories: { type: Array },
    bio: { type: String },
    roles: { type: Array },
    files: {type: Object },
    createdAt: { type: Date },
    updatedAt: { type: Date },
}
```

### Project Schema

```javascript
{
    userId: { type: ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    totalStars: { type: Number, default: 0 },
    starNumber: { type: Number, default: 0 },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    cover: { type: String, required: true },
    images: { type: [String], required: false },
    shortTitle: { type: String, required: true },
    shortDesc: { type: String, required: true },
    deliveryTime: { type: String, required: true },
    revisionNumber: { type: Number, required: true },
    features: { type: [String], required: false },
    sales: { type: Number, default: 0 }
}
```

### Message Schema

```javascript
{
    conversationId: { type: String, required: true },
    userId: { type: ObjectId, ref: 'User', required: true },
    description: { type: String, required: true }
}
```

### Conversation Schema

```javascript
{
    conversationId: { type: String, default: uuid },
    clientId: { type: ObjectId, ref: 'User', required: true },
    freelancerId: { type: ObjectId, ref: 'User', required: true },
    readByClient: { type: Boolean, required: true },
    readByFreelancer: { type: Boolean, required: true },
    lastMessage: { type: String, required: false }
}
```

### Transaction Schema

```javascript
{
    projectId: { type: ObjectId, ref: 'Project', required: true },
    image: { type: String, required: false },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    clientId: { type: ObjectId, ref: 'User', required: true },
    freelancerId: { type: ObjectId, ref: 'User', required: true },
    isCompleted: { type: Boolean, default: false },
    payment_intent: { type: String, required: true }
}
```

### Review Schema

```javascript
{
    projectId: { type: ObjectId, ref: 'Project', required: true },
    userId: { type: ObjectId, ref: 'User', required: true },
    star: { type: Number, required: true, max: 5 },
    description: { type: String, required: true }
}
```
