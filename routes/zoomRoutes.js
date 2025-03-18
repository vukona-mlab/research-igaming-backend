const express = require('express');
const router = express.Router();
const passport = require('passport');
const {
    getMsdkSignature,
    CreateAppointment,
    ListMeeting,
    GetMeetingDetails,
    DeleteMeeting,
    ThirdPartyAPICall
} = require("../controllers/zoomController.js");
const { handleZoomWebhook } = require('../controllers/zoomWebhookController');

// Authentication middleware
const authenticate = passport.authenticate('jwt', { session: false });

// Webhook route (no authentication required as it's called by Zoom)
router.post('/webhook', handleZoomWebhook);

// Get MSDK Signature Route (for client-side SDK)
router.route("/msdk-signature").post(authenticate, getMsdkSignature);

// Create a new Zoom meeting
router.route("/meetings").post(authenticate, CreateAppointment);

// List all meetings
router.route("/meetings").get(authenticate, ListMeeting);

// Get meeting details by ID
router.route("/meetings/:meetingId").get(authenticate, GetMeetingDetails);

// Delete a meeting
router.route("/meetings/:meetingId").delete(authenticate, DeleteMeeting);

// Third party API call
router.route("/thirdparty").get(authenticate, ThirdPartyAPICall);

module.exports = router; // Export the router so it can be used in server.js
