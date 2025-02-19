# Google Sign-In Testing Guide

## Prerequisites
1. Node.js installed
2. Postman installed
3. Web browser (Chrome recommended)
4. Firebase project set up with Google Sign-In enabled

## Setup and Running the Application

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

## Testing via Static HTML Page

1. Open your browser and navigate to:
```
http://localhost:8000
```

2. Click the "Sign in with Google" button
3. Select your Google account and complete the sign-in process
4. The page will display:
   - User information
   - JWT token
   - Success/error messages in the browser console

## Testing via Postman

### Step 1: Get the ID Token
1. Open `http://localhost:8000` in your browser
2. Open Developer Tools (F12)
3. Go to Console tab
4. Sign in using the Google button
5. After successful sign-in
6. Copy the returned token

### Step 2: Send Request to Backend
1. Open Postman
2. Create a new POST request:
```http
POST http://localhost:8000/api/auth/google
```

3. Set headers:
```
Content-Type: application/json
```

4. Set request body (raw JSON):
```json
{
    "idToken": "paste_your_copied_token_here"
}
```

5. Expected successful response:
```json
{
    "message": "Google sign-in successful",
    "token": "Bearer eyJhbGciOiJ...",
    "user": {
        "uid": "...",
        "email": "...",
        "displayName": "...",
        "roles": ["client"],
        "createdAt": "...",
        "updatedAt": "..."
    }
}
```



## Troubleshooting

1. Token Expired
   - ID tokens expire after 1 hour
   - Get a new token by signing in again

2. CORS Issues
   - Check browser console for CORS errors
   - Verify CORS configuration in index.js

3. Invalid Token
   - Ensure you're using the correct token format
   - Check if token is properly copied from console

4. Firebase Configuration
   - Verify Firebase config in public/index.html
   - Check .env file for correct Firebase admin credentials