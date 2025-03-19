# Admin API Testing Guide

This guide provides detailed instructions for testing the admin functionality using Postman.

## Setup

1. Create a Postman Environment with these variables:
   - `baseUrl`: Your API base URL (e.g., `http://localhost:8000`)
   - `adminToken`: Will store the authentication token

2. Import the provided collection
3. Set the environment as active

## Test Scenarios

### 1. Initialize Super Admin (One-time Setup)
```http
POST {{baseUrl}}/api/auth/admin/initialize
Content-Type: application/json

{
    "email": "superadmin@yourdomain.com",
    "password": "strong_password_here",
    "name": "Super",
    "surname": "Admin",
    "secretKey": "your_very_long_and_secure_random_string"
}
```
Expected Response (201):
```json
{
    "message": "Super admin initialized successfully",
    "user": {
        "uid": "created_uid",
        "email": "superadmin@yourdomain.com",
        "displayName": "Super Admin"
    }
}
```

### You can use the following Super Admin

```http
POST {{baseUrl}}/api/auth/admin/login
Content-Type: application/json

{
    "email": "superadmin@yourdomain.com",
    "password": "superadmin123"
}
```

### 2. Admin Login (Both Admin and Super Admin)
```http
POST {{baseUrl}}/api/auth/admin/login
Content-Type: application/json

{
    "email": "admin@yourdomain.com",
    "password": "admin_password"
}
```
Expected Response (200):
```json
{
    "message": "Admin login successful",
    "token": "Bearer eyJhbG...",
    "user": {
        "uid": "user_uid",
        "email": "admin@yourdomain.com",
        "name": "Admin",
        "surname": "User",
        "displayName": "Admin User",
        "roles": ["admin"],
        "isSuper": false
    }
}
```

For Super Admin:
```json
{
    "message": "Admin login successful",
    "token": "Bearer eyJhbG...",
    "user": {
        "uid": "user_uid",
        "email": "superadmin@yourdomain.com",
        "name": "Super",
        "surname": "Admin",
        "displayName": "Super Admin",
        "roles": ["super_admin"],
        "isSuper": true
    }
}
```

Error Responses:
- 401: Invalid credentials
- 403: Non-admin user attempting to login
- 404: User profile not found

### 3. Create New Admin
```http
POST {{baseUrl}}/api/auth/admin/create
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
    "email": "newadmin@yourdomain.com",
    "password": "admin_password",
    "name": "John",
    "surname": "Doe"
}
```
Expected Response (201):
```json
{
    "message": "Admin account created successfully",
    "user": {
        "uid": "created_admin_uid",
        "email": "newadmin@yourdomain.com"
    }
}
```

### 4. Get All Admins
```http
GET {{baseUrl}}/api/auth/admin/all
Authorization: Bearer {{adminToken}}
```
Expected Response (200):
```json
{
    "admins": [
        {
            "id": "admin1_uid",
            "name": "Super",
            "surname": "Admin",
            "email": "superadmin@yourdomain.com",
            "roles": ["super_admin"]
        },
        {
            "id": "admin2_uid",
            "name": "John",
            "surname": "Doe",
            "email": "newadmin@yourdomain.com",
            "roles": ["admin"]
        }
    ]
}
```

### 5. Update Admin
```http
PUT {{baseUrl}}/api/auth/admin/:adminId
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
    "name": "John Updated",
    "surname": "Doe Updated",
    "phoneNumber": "+1234567890",
    "displayName": "John D."
}
```
Expected Response (200):
```json
{
    "message": "Admin updated successfully"
}
```

### 6. Delete Admin
```http
DELETE {{baseUrl}}/api/auth/admin/:adminId
Authorization: Bearer {{adminToken}}
```
Expected Response (200):
```json
{
    "message": "Admin deleted successfully"
}
```

## Error Scenarios to Test

### 1. Initialize Super Admin When One Already Exists
```http
POST {{baseUrl}}/api/auth/admin/initialize
```
Expected Response (403):
```json
{
    "error": "Super admin already exists"
}
```

### 2. Invalid Login Credentials
```http
POST {{baseUrl}}/api/auth/admin/login
```
Expected Response (401):
```json
{
    "error": "Invalid email or password"
}
```

### 3. Non-Admin Trying to Access Admin Routes
```http
GET {{baseUrl}}/api/auth/admin/all
```
Expected Response (403):
```json
{
    "error": "Only super admins can view all admins"
}
```

### 4. Invalid Token
```http
GET {{baseUrl}}/api/auth/admin/all
Authorization: Bearer invalid_token
```
Expected Response (401):
```json
{
    "error": "Unauthorized"
}
```

## Postman Collection

```json
{
  "info": {
    "name": "Admin Management API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "1. Initialize Super Admin",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n    \"email\": \"superadmin@yourdomain.com\",\n    \"password\": \"strong_password_here\",\n    \"name\": \"Super\",\n    \"surname\": \"Admin\",\n    \"secretKey\": \"your_very_long_and_secure_random_string\"\n}"
        },
        "url": "{{baseUrl}}/api/auth/admin/initialize"
      }
    },
    {
      "name": "2. Admin Login",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n    \"email\": \"admin@yourdomain.com\",\n    \"password\": \"admin_password\"\n}"
        },
        "url": "{{baseUrl}}/api/auth/admin/login"
      }
    },
    {
      "name": "3. Create Admin",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{adminToken}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n    \"email\": \"newadmin@yourdomain.com\",\n    \"password\": \"admin_password\",\n    \"name\": \"John\",\n    \"surname\": \"Doe\"\n}"
        },
        "url": "{{baseUrl}}/api/auth/admin/create"
      }
    },
    {
      "name": "4. Get All Admins",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{adminToken}}"
          }
        ],
        "url": "{{baseUrl}}/api/auth/admin/all"
      }
    },
    {
      "name": "5. Update Admin",
      "request": {
        "method": "PUT",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{adminToken}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n    \"name\": \"John Updated\",\n    \"surname\": \"Doe Updated\",\n    \"phoneNumber\": \"+1234567890\",\n    \"displayName\": \"John D.\"\n}"
        },
        "url": "{{baseUrl}}/api/auth/admin/:adminId"
      }
    },
    {
      "name": "6. Delete Admin",
      "request": {
        "method": "DELETE",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{adminToken}}"
          }
        ],
        "url": "{{baseUrl}}/api/auth/admin/:adminId"
      }
    }
  ]
}
```

## Testing Workflow

1. Start with a fresh database
2. Initialize super admin (should only work once)
3. Login as super admin
4. Create a new admin
5. View all admins to verify creation
6. Update the new admin's details
7. Delete the admin
8. Verify deletion by viewing all admins again

## Environment Variables Required

Make sure these environment variables are set in your `.env` file: 