const axios = require('axios');
require('dotenv').config();

// Get OAuth token for Server-to-Server app
const getZoomAccessToken = async () => {
  try {
    const response = await axios.post(
      'https://zoom.us/oauth/token',
      null,
      {
        params: {
          grant_type: 'account_credentials',
          account_id: process.env.ZOOM_ACCOUNT_ID
        },
        headers: {
          'Authorization': `Basic ${Buffer.from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`).toString('base64')}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting Zoom access token:', error.response?.data || error.message);
    throw new Error('Failed to get Zoom access token');
  }
};

// Create a Zoom meeting
const createZoomMeeting = async (meetingDetails) => {
  const token = await getZoomAccessToken();
  
  try {
    const response = await axios.post(
      'https://api.zoom.us/v2/users/me/meetings',
      {
        topic: meetingDetails.topic,
        type: meetingDetails.type || 2, // 2 is for scheduled meeting
        start_time: meetingDetails.start_time,
        duration: meetingDetails.duration,
        timezone: meetingDetails.timezone || 'UTC',
        agenda: meetingDetails.agenda || '',
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: true,
          watermark: false,
          use_pmi: false,
          approval_type: 0,
          audio: 'both',
          auto_recording: 'cloud',
          alternative_hosts: meetingDetails.alternative_hosts || '',
          waiting_room: meetingDetails.waiting_room || false,
          meeting_authentication: meetingDetails.meeting_authentication || false
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      id: response.data.id,
      password: response.data.password,
      join_url: response.data.join_url,
      start_url: response.data.start_url
    };
  } catch (error) {
    console.error('Error creating Zoom meeting:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to create Zoom meeting');
  }
};

// List Zoom meetings
const listZoomMeetings = async () => {
  const token = await getZoomAccessToken();
  
  try {
    const response = await axios.get(
      'https://api.zoom.us/v2/users/me/meetings',
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          page_size: 30,
          type: 'scheduled'
        }
      }
    );
    
    return response.data.meetings;
  } catch (error) {
    console.error('Error listing Zoom meetings:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to list Zoom meetings');
  }
};

// Third party API call (placeholder for your implementation)
const thirdPartyAPICall = async () => {
  // Implement your third-party API call here
  return { message: "Third party API call successful" };
};

// Fetch meeting details
const getMeetingDetails = async (meetingId) => {
  const token = await getZoomAccessToken();
  
  try {
    const response = await axios.get(
      `https://api.zoom.us/v2/meetings/${meetingId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching meeting details:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to fetch meeting details');
  }
};

module.exports = {
  createZoomMeeting,
  listZoomMeetings,
  thirdPartyAPICall,
  getZoomAccessToken,
  getMeetingDetails
}; 