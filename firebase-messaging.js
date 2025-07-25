const { messaging } = require("./config/firebase");

const sendPushNotification = async (fcmToken, title, body) => {
  const message = {
    notification: {
      title,
      body,
    },
    token: fcmToken,
  };

  try {
    const response = await messaging.send(message);
    console.log('✅ Successfully sent message:', response);
    return response;
  } catch (error) {
    console.error('❌ Error sending message:', error);
    throw error;
  }
};
module.exports = { sendPushNotification }