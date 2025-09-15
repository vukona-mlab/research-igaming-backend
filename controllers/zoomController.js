const asyncHandler = require("express-async-handler");
require("dotenv").config();
const KJUR = require("jsrsasign");
const axios = require("axios");
const { firebaseDb } = require('../config/firebase');

const {
  createZoomMeeting,
  listZoomMeetings,
  thirdPartyAPICall,
  getZoomAccessToken,
  getMeetingDetails
} = require("../api/zoomAPI.js");

// Get MSDK signature for client-side authentication
const getMsdkSignature = asyncHandler(async (req, res) => {
  const iat = Math.round(new Date().getTime() / 1000) - 30;
  const exp = iat + 60 * 60 * 2;

  const oHeader = { alg: "HS256", typ: "JWT" };

  const oPayload = {
    sdkKey: process.env.ZOOM_MSDK_KEY,
    mn: req.body.meetingNumber,
    role: req.body.role,
    iat: iat,
    exp: exp,
    tokenExp: iat + 60 * 60 * 2,
  };

  const sHeader = JSON.stringify(oHeader);
  const sPayload = JSON.stringify(oPayload);
  const signature = KJUR.jws.JWS.sign(
    "HS256",
    sHeader,
    sPayload,
    process.env.ZOOM_MSDK_SECRET
  );

  res.json({
    signature: signature,
  });
});

// Create a new Zoom meeting
const CreateAppointment = asyncHandler(async (req, res) => {
  const { 
    topic, 
    start_time, 
    duration, 
    type, 
    agenda, 
    user_id, 
    auto_recording,
    alternative_hosts,
    waiting_room,
    meeting_authentication
  } = req.body;

  if (!topic || !start_time || !duration) {
    res.status(400);
    throw new Error("Please provide topic, start time, and duration");
  } else {
    try {
      const { id, password, join_url, start_url } = await createZoomMeeting({
        topic,
        start_time,
        duration,
        type: type || 2, 
        agenda: agenda || `Meeting about ${topic}`,
        user_id: user_id || 'me', // 
        auto_recording: auto_recording || 'cloud', 
        alternative_hosts,
        waiting_room,
        meeting_authentication
      });

      res.status(201).json({ 
        meeting_id: id, 
        password, 
        join_url, 
        start_url,
        message: "Meeting created successfully" 
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to create meeting", 
        error: error.message 
      });
    }
  }
});

// List all meetings for the authenticated user
const ListMeeting = asyncHandler(async (req, res) => {
  try {
    const meetings = await listZoomMeetings();
    if (!meetings || meetings.length === 0) {
      return res.status(200).json({ message: "No meetings found", meetings: [] });
    }
    res.status(200).json({ meetings });
  } catch (error) {
    res.status(500).json({ 
      message: "Failed to fetch meetings", 
      error: error.message 
    });
  }
});

// Fetch meeting details
const GetMeetingDetails = asyncHandler(async (req, res) => {
  const { meetingId } = req.params;
  
  if (!meetingId) {
    res.status(400);
    throw new Error("Meeting ID is required");
  }

  try {
    const meetingDetails = await getMeetingDetails(meetingId);
    res.status(200).json(meetingDetails);
  } catch (error) {
    res.status(500).json({ 
      message: "Failed to fetch meeting details", 
      error: error.message 
    });
  }
});

// Delete a meeting
const DeleteMeeting = asyncHandler(async (req, res) => {
  const { meetingId } = req.params;
  
  if (!meetingId) {
    res.status(400);
    throw new Error("Meeting ID is required");
  }

  try {
    const token = await getZoomAccessToken();
    await axios.delete(
      `https://api.zoom.us/v2/meetings/${meetingId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    res.status(200).json({ message: "Meeting deleted successfully" });
  } catch (error) {
    res.status(500).json({ 
      message: "Failed to delete meeting", 
      error: error.response?.data || error.message 
    });
  }
});

// Third party API call (placeholder for your implementation)
const ThirdPartyAPICall = asyncHandler(async (req, res) => {
  try {
    const result = await thirdPartyAPICall();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ 
      message: "Failed to make third party API call", 
      error: error.message 
    });
  }
});

module.exports = {
  getMsdkSignature,
  CreateAppointment,
  ListMeeting,
  GetMeetingDetails,
  DeleteMeeting,
  ThirdPartyAPICall
};