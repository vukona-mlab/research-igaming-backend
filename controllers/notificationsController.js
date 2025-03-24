const { firebase, firebaseDb } = require("../config/firebase");

exports.getAdminNotifications = async (req, res) => {
  try {
    const notifsCollection = await firebaseDb
      .collection("admin-notifications")
      .get();
    if (notifsCollection.empty) {
      return res.status(404).json({ error: "No notifications found" });
    }
    const notifications = notifsCollection.docs.map((doc) => doc.data());

    res.status(200).json({
      notifications,
    });
  } catch (error) {
    console.error("Error fetching notifications", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};
exports.sendNotification = async (req, res) => {
  const { title, body, deviceToken } = req.body;

  try {
    const message = {
      notification: {
        title,
        body,
      },
      token: deviceToken,
    };
    const response = await firebase.messaging().send(message);
    console.log({ response });
    if (response) {
      await firebaseDb
        .collection("admin-notifications")
        .add({ ...message.notification, read: false });
    }
    res.status(200).json({
      message: "Notification sent succesfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error sending notification" });
  }
};
