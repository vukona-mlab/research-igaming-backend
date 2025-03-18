# Zoom API Testing with Postman (Web)

This document provides a guide to testing Zoom-related operations and endpoints for web applications using Postman. Ensure you have Postman installed and configured with the necessary environment variables.

## Environment Setup

1. **Create a New Environment** in Postman:
   - **Environment Variables**:
     - `baseUrl`: Set this to your server's base URL, e.g., `http://localhost:8000/api/zoom`.
     - `jwtToken`: Set this to a valid JWT token for authentication.
     - `meetingId`: Use this to store a meeting ID for testing specific endpoints.

## Endpoints

### 1. Get MSDK Signature

- **Method**: POST
- **URL**: `{{baseUrl}}/msdk-signature`
- **Headers**:
  - `Authorization`: `Bearer {{jwtToken}}`
  - `Content-Type`: `application/json`
- **Body** (JSON):
  ```json
  {
    "meetingNumber": "123456789",
    "role": 0
  }
  ```

### 2. Create a New Zoom Meeting

- **Method**: POST
- **URL**: `{{baseUrl}}/meetings`
- **Headers**:
  - `Authorization`: `Bearer {{jwtToken}}`
  - `Content-Type`: `application/json`
- **Body** (JSON):
  ```json
  {
    "topic": "Test Meeting",
    "start_time": "2023-10-10T10:00:00Z",
    "duration": 30,
    "type": 2,
    "agenda": "Discuss project updates",
    "auto_recording": "cloud"
  }
  ```

### 3. List All Meetings

- **Method**: GET
- **URL**: `{{baseUrl}}/meetings`
- **Headers**:
  - `Authorization`: `Bearer {{jwtToken}}`

### 4. Get Meeting Details

- **Method**: GET
- **URL**: `{{baseUrl}}/meetings/{{meetingId}}`
- **Headers**:
  - `Authorization`: `Bearer {{jwtToken}}`

### 5. Delete a Meeting

- **Method**: DELETE
- **URL**: `{{baseUrl}}/meetings/{{meetingId}}`
- **Headers**:
  - `Authorization`: `Bearer {{jwtToken}}`

### 6. Third Party API Call

- **Method**: GET
- **URL**: `{{baseUrl}}/thirdparty`
- **Headers**:
  - `Authorization`: `Bearer {{jwtToken}}`

### 7. Handle Zoom Webhook

- **Method**: POST
- **URL**: `{{baseUrl}}/webhook`
- **Headers**:
  - `Content-Type`: `application/json`
- **Body** (JSON):
  ```json
  {
    "event": "endpoint.url_validation",
    "payload": {
      "plainToken": "your_plain_token"
    }
  }
  ```

#### Webhook for Storing Zoom Recordings in Cloudinary

The webhook is used to automate the process of storing your Zoom recordings in Cloudinary. When a recording is completed, Zoom sends a notification to your webhook endpoint. You can then process this notification to upload the recording to Cloudinary.

- **Webhook Logic**: Ensure your webhook handler processes the recording completion event and uploads the recording to Cloudinary using their API.

## Testing Steps

1. **Select the Environment**: Ensure your environment is selected in the top-right corner of Postman.
2. **Run Each Request**: Click "Send" for each request to test the corresponding endpoint.
3. **Check Responses**: Verify the responses to ensure that each operation is working as expected.

## JWT Token

Ensure that the `jwtToken` is valid and has the necessary permissions to access the Zoom API endpoints. You can obtain this token by logging in through your web application and copying the token from the response.

## Debugging

- **Check Console**: Use the Postman console to view detailed request and response logs.
- **Error Messages**: Pay attention to error messages in the response to troubleshoot issues.

By following this guide, you can effectively test all Zoom operations in your web application using Postman. Adjust the request details as needed based on your specific implementation and testing requirements.
