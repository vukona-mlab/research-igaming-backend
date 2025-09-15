const { messaging } = require("./config/firebase");

const sendPushNotification = async (fcmToken, title, body) => {
  // console.log({ fcmToken, title, body });

  const message = {
    notification: {
      title,
      body,
    },
    token: fcmToken,
    data: { title, body }
  };

  try {
    const response = await messaging.send(message);
    return response;
  } catch (error) {
    throw error
  }
};
module.exports = { sendPushNotification }