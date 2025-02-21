# Google Sign-In Implementation Guide (React)

This document outlines the implementation of Google Sign-In using Firebase Authentication in a React application.

## Prerequisites

1. Firebase Project Setup

   - Firebase project created in Firebase Console
   - Web app registered in Firebase project
   - Google Sign-In method enabled in Authentication section

2. Required Dependencies

```bash
npm install firebase @firebase/auth
```

## Configuration

### 1. Firebase Configuration (src/config/firebase.js)

```javascript
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
```

### 2. Environment Variables (.env)

```plaintext
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

## Implementation

### 1. Google Sign-In Component (src/components/GoogleSignIn.js)

```javascript
import React, { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../config/firebase";

const GoogleSignIn = () => {
  const [userInfo, setUserInfo] = useState(null);

  const handleGoogleSignIn = async () => {
    try {
      // Sign in with Google
      const result = await signInWithPopup(auth, googleProvider);

      // Get ID token
      const idToken = await result.user.getIdToken();

      // Send token to backend
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();
      setUserInfo(data);
    } catch (error) {
      console.error("Error:", error);
      alert("Error signing in: " + error.message);
    }
  };

  return (
    <div>
      <button onClick={handleGoogleSignIn}>Sign in with Google</button>

      {userInfo && (
        <div>
          <h3>User Info:</h3>
          <pre>{JSON.stringify(userInfo, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default GoogleSignIn;
```

### 2. Auth Context (src/context/AuthContext.js)

```javascript
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

### 3. App Integration (src/App.js)

```javascript
import { AuthProvider } from "./context/AuthContext";
import GoogleSignIn from "./components/GoogleSignIn";

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <h1>Google Sign-In Demo</h1>
        <GoogleSignIn />
      </div>
    </AuthProvider>
  );
}

export default App;
```

## Backend Integration

### 1. API Endpoint (Express)

```javascript
router.post("/google", googleSignIn);
```

### 2. Token Verification

The backend verifies the ID token and creates/updates user profile in the database.

## Required Setup in Google Cloud Console

1. OAuth Consent Screen Configuration

   - Configure OAuth consent screen
   - Add authorized domains
   - Add test users (for development)

2. Credentials Configuration
   - Configure OAuth 2.0 Client ID
   - Add authorized JavaScript origins:
     ```
     http://localhost:3000
     ```
   - Add authorized redirect URIs:
     ```
     http://localhost:3000
     https://your-project.firebaseapp.com/__/auth/handler
     ```

## Firebase Console Setup

1. Authentication > Sign-in methods
   - Enable Google provider
   - Add authorized domains:
     ```
     localhost
     127.0.0.1
     your-domain.com
     ```

## Error Handling

Common errors and solutions:

1. `redirect_uri_mismatch`: Check authorized domains and redirect URIs
2. `popup_closed_by_user`: User closed the sign-in popup
3. `unauthorized_domain`: Add domain to authorized domains list

## Security Considerations

1. Always verify ID tokens on the backend
2. Use environment variables for Firebase config
3. Implement proper CORS policies
4. Use proper authentication state management
5. Secure routes with protected components

## Testing

1. Local Development:

   ```bash
   # Start React development server
   npm start

   # Access app
   open http://localhost:3000
   ```

2. Test with different Google accounts
3. Verify user data in Firebase Console
4. Check token verification in backend logs

## Troubleshooting

1. Check browser console for errors
2. Verify environment variables
3. Confirm OAuth configuration
4. Check network requests
5. Verify Firebase initialization

## Additional Resources

- [Firebase React Documentation](https://firebase.google.com/docs/web/setup?hl=en&authuser=0#add-sdks-initialize)
- [React Context API](https://reactjs.org/docs/context.html)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
