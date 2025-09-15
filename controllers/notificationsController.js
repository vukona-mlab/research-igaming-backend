const { firebase, firebaseDb } = require("../config/firebase");

exports.getAdminNotifications = async (req, res) => {
  try {
    const notifsCollection = await firebaseDb
      .collection("admin-notifications")
      .get();

    const notifications = notifsCollection.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    console.log({ notifications });
    res.status(200).json({
      notifications,
    });
  } catch (error) {
    console.error("Error fetching notifications", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};
exports.sendNotification = async (req, res) => {
  const { title, body, deviceToken, type } = req.body;

  try {
    const message = {
      notification: {
        title,
        body,
      },

      token: deviceToken,
    };

    const ref = await firebaseDb.collection("admin-notifications").add({
      ...message.notification,
      read: false,
      type: type || "alert",
      date: new Date(),
    });
    console.log(ref.id);
    const updatedMessage = {
      ...message,
      data: { id: ref.id, type: type || "alert" },
    };
    const response = await firebase.messaging().send(updatedMessage);

    res.status(200).json({
      message: "Notification sent succesfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error sending notification" });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notifDoc = await firebaseDb
      .collection("admin-notifications")
      .doc(id)
      .get();
    if (!notifDoc.exists) {
      return res.status(404).json({ error: "Notifs not found" });
    }

    //const notif = notifDoc.data();

    await firebaseDb.collection("admin-notifications").doc(id).delete();
    res.status(200).json({
      message: "Notification deleted succesfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error deleting notification" });
  }
};

exports.updateReadStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const notifDoc = await firebaseDb
      .collection("admin-notifications")
      .doc(id)
      .get();
    if (!notifDoc.exists) {
      return res.status(404).json({ error: "Notifs not found" });
    }

    await firebaseDb
      .collection("admin-notifications")
      .doc(id)
      .update("read", true);
    res
      .status(201)
      .json({ message: "Notification status has been updated succesfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};
