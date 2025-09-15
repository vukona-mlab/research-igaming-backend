# PayPal Payment Integration Documentation

## Overview
This documentation covers the PayPal payment integration for the iGaming platform, handling both card payments and project-based transactions.

## Table of Contents
- [Setup](#setup)
- [Payment Flow](#payment-flow)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Error Handling](#error-handling)
- [Sandbox Credentials](#sandbox-credentials)

## Setup

### Environment Variables

### Dependencies

## Payment Flow

1. **Create Payment Order**
   - Client initiates payment for a project
   - System creates PayPal order
   - Returns approval URL

2. **Payment Approval**
   - User redirected to PayPal
   - Approves payment
   - PayPal redirects back with token

3. **Payment Capture**
   - System captures approved payment
   - Updates project status
   - Records transaction

## API Endpoints

### 1. Create Payment Order
```http
POST /api/process-payment
Authorization: Bearer <jwt_token>
Content-Type: application/json
```
```json
{
    "amount": 1000.00,
    "projectId": "project-123",
    "freelancerId": "freelancer-456",
    "cardId": "card-789"  // Optional: Use saved card
    // OR
    "newCard": {
        "number": "4111111111111111",
        "expiryDate": "12/25",
        "cardHolderName": "John Doe"
    }
}
```

**Response:**
```json
{
    "success": true,
    "orderId": "5O190127TN364715T",
    "status": "CREATED",
    "projectId": "project-123",
    "projectTitle": "Project Title",
    "approvalUrl": "https://www.sandbox.paypal.com/checkoutnow?token=5O190127TN364715T",
    "localAmount": 1000.00,
    "localCurrency": "ZAR",
    "paypalAmount": 53.00,
    "paypalCurrency": "USD"
}
```

### 2. Handle PayPal Return
```http
GET /api/paypal-return?token=5O190127TN364715T&PayerID=ABCDEF123456
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
    "success": true,
    "orderId": "5O190127TN364715T",
    "status": "COMPLETED",
    "projectId": "project-123",
    "captureId": "9XX12345AB123456C"
}
```

### 3. View Payment History
```http
GET /api/payment-history
Authorization: Bearer <jwt_token>
```

## Testing

### Test Cards
- Visa: 4111111111111111
- Mastercard: 5555555555554444
- Expiry Date: Any future date
- CVV: Any 3 digits

### Sandbox Accounts
```
Buyer Account:
Email: sb-rkrx038521814@personal.example.com
Password: zE|_0MA_

Business Account:
Email: sb-qvpn638527616@business.example.com
Password: XL=n$&36
```

### Test Flow
1. Create payment order
```bash
curl -X POST http://localhost:8000/api/process-payment \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000.00,
    "projectId": "project-123",
    "freelancerId": "freelancer-456",
    "cardId": "card-789"
  }'
```

2. Open approval URL in browser
3. Log in with sandbox account
4. Complete approval
5. Wait for redirect and capture

## Error Handling

### Common Errors

1. **Order Not Approved**
```json
{
    "error": "Failed to capture payment",
    "details": "ORDER_NOT_APPROVED"
}
```
Solution: Complete PayPal approval process

2. **Currency Not Supported**
```json
{
    "error": "Failed to create payment order",
    "details": "CURRENCY_NOT_SUPPORTED"
}
```
Solution: System automatically converts ZAR to USD

3. **Invalid Card**
```json:research-igaming-backend/paypal.md
{
    "error": "Invalid card details"
}
```
Solution: Verify card information

### Best Practices
1. Always validate amounts before processing
2. Store transaction IDs for reference
3. Implement proper error logging
4. Handle currency conversion edge cases
5. Verify project status before payment

## Currency Handling
- Platform accepts ZAR (South African Rand)
- Automatically converts to USD for PayPal
- Current exchange rate: 1 ZAR = 0.053 USD
- Stores both original and converted amounts

## Security Considerations
1. JWT authentication required
2. Card data never stored directly
3. PayPal handles sensitive payment data
4. Transaction logging for audit trail
5. Project verification before payment

## Webhook Integration (Future)
- Payment status updates
- Dispute handling
- Refund processing
- Transaction reconciliation

## Support
For technical support:
- Email: support@igaming.com
- Documentation: /docs/api
- Error Logs: /logs/payment

## Version
- Current Version: 1.0.0
- Last Updated: March 2024

