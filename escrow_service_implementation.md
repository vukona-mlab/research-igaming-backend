# Escrow Service Implementation Documentation

## Overview
The escrow service provides a secure payment system for projects, ensuring funds are safely held until project completion. This implementation includes creating escrow accounts, funding them, and releasing payments to freelancers.

## Core Components

### 1. Escrow Account Structure

{
projectId: string, // Reference to associated project
clientId: string, // User ID of the client
freelancerId: string, // User ID of the freelancer
amount: number, // Amount to be held in escrow
status: string, // pending, funded, released, refunded
createdAt: timestamp, // Creation timestamp
updatedAt: timestamp, // Last update timestamp
transactions: array // History of transactions
}

### 2. Status Flow

## API Endpoints

### 1. Create Escrow Account
Creates a new escrow account for a project.

```http
POST /api/escrow
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "projectId": "project_id"
}
```

**Response (201)**
```json
{
  "message": "Escrow account created successfully",
  "escrowId": "escrow_id"
}
```

### 2. Fund Escrow Account
Funds an existing escrow account using a stored payment card.

```http
POST /api/escrow/{escrowId}/fund
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "cardId": "card_id"
}
```

**Response (200)**
```json
{
  "success": true,
  "orderId": "paypal_order_id",
  "status": "COMPLETED",
  "projectId": "project_id",
  "captureId": "capture_id"
}
```

### 3. Release Escrow
Releases funds to the freelancer after project completion.

```http
POST /api/escrow/{escrowId}/release
Authorization: Bearer {jwt_token}
```

**Response (200)**
```json
{
  "message": "Escrow released successfully"
}
```

### 4. Get Escrow Details
Retrieves details of an escrow account.

```http
GET /api/escrow/{escrowId}
Authorization: Bearer {jwt_token}
```

**Response (200)**
```json
{
  "escrow": {
    "id": "escrow_id",
    "projectId": "project_id",
    "clientId": "client_id",
    "freelancerId": "freelancer_id",
    "amount": 1000,
    "status": "pending",
    "createdAt": "timestamp",
    "updatedAt": "timestamp",
    "transactions": []
  }
}
```

## Security Measures

1. **Authentication**
   - All endpoints require JWT authentication
   - Token must be included in Authorization header

2. **Authorization**
   - Only project client can create and fund escrow
   - Only project client can release funds
   - Both client and freelancer can view escrow details

3. **Validation**
   - Project must exist
   - Escrow amount must match project budget
   - Card must belong to client
   - Status transitions must be valid

## Transaction Flow

1. **Creating Escrow**
   ```javascript
   // 1. Verify project exists
   const projectDoc = await firebaseDb.collection("projects").doc(projectId).get();
   
   // 2. Create escrow account
   const escrowAccount = {
     projectId,
     clientId: project.clientId,
     freelancerId: project.freelancerId,
     amount: project.budget,
     status: 'pending'
   };
   
   // 3. Update project with escrow reference
   await projectDoc.ref.update({
     escrowId: escrowRef.id
   });
   ```

2. **Funding Escrow**
   ```javascript
   // 1. Validate escrow status
   if (escrow.status !== 'pending') {
     return res.status(400).json({ error: "Escrow is not in pending state" });
   }
   
   // 2. Process payment
   const paymentData = {
     amount: escrow.amount,
     cardId,
     projectId: escrow.projectId,
     freelancerId: escrow.freelancerId,
     escrowId: escrowId
   };
   ```

3. **Releasing Funds**
   ```javascript
   // 1. Verify funded status
   if (escrow.status !== 'funded') {
     return res.status(400).json({ error: "Escrow must be funded before release" });
   }
   
   // 2. Update escrow status
   await escrowDoc.ref.update({
     status: 'released',
     transactions: FieldValue.arrayUnion({
       type: 'release',
       amount: escrow.amount,
       timestamp: new Date()
     })
   });
   ```

## Error Handling

1. **Common Error Responses**
   - 400: Invalid request (missing fields, invalid status)
   - 403: Unauthorized access
   - 404: Resource not found
   - 500: Server error

2. **Error Response Format**
   ```json
   {
     "error": "Error message description"
   }
   ```

## Testing

1. **Prerequisites**
   - Valid JWT token
   - Existing project
   - Stored payment card
   - PayPal sandbox credentials

2. **Test Flow**
   ```
   Create Project -> Create Escrow -> Fund Escrow -> Release Funds
   ```

3. **Edge Cases**
   - Invalid card details
   - Insufficient funds
   - Double funding attempts
   - Unauthorized release attempts
   - Invalid status transitions

## Database Schema

```javascript
// Escrow Collection
escrow: {
  [escrowId]: {
    projectId: string,
    clientId: string,
    freelancerId: string,
    amount: number,
    status: string,
    createdAt: timestamp,
    updatedAt: timestamp,
    transactions: [
      {
        type: string,
        amount: number,
        timestamp: timestamp
      }
    ]
  }
}
```

## Integration Points

1. **Payment Processing**
   - PayPal SDK for payment processing
   - Card storage and validation
   - Transaction history

2. **Project Management**
   - Project status updates
   - Budget validation
   - Client/Freelancer verification

3. **User Authentication**
   - JWT validation
   - Role-based access control
   - User verification

