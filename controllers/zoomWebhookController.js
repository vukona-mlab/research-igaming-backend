const asyncHandler = require('express-async-handler');
const crypto = require('crypto');

// Verify Zoom webhook signature
const verifyZoomWebhookSignature = (req) => {
  const signature = req.headers['x-zm-signature'];
  const timestamp = req.headers['x-zm-request-timestamp'];
  const token = process.env.ZOOM_WEBHOOK_SECRET_TOKEN;
  
  if (!signature || !timestamp || !token) {
    return false;
  }
  
  const message = `v0:${timestamp}:${JSON.stringify(req.body)}`;
  const hashForVerify = crypto.createHmac('sha256', token).update(message).digest('hex');
  const expectedSignature = `v0=${hashForVerify}`;
  
  return signature === expectedSignature;
};

// Handle Zoom webhook events
const handleZoomWebhook = asyncHandler(async (req, res) => {
  // Verify the webhook signature
  if (!verifyZoomWebhookSignature(req)) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }
  
  const { event, payload } = req.body;
  
  // Handle different event types
  switch (event) {
    case 'endpoint.url_validation':
      // Handle Zoom webhook URL validation
      const plainToken = req.body.payload.plainToken;
      const hashToken = crypto.createHmac('sha256', process.env.ZOOM_WEBHOOK_SECRET_TOKEN)
        .update(plainToken)
        .digest('hex');
      
      return res.status(200).json({
        plainToken,
        encryptedToken: hashToken
      });
      
    default:
      console.log(`Unhandled Zoom webhook event: ${event}`);
  }
  
  res.status(200).json({ received: true });
});

module.exports = {
  handleZoomWebhook
}; 