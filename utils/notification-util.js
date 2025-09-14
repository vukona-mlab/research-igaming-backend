const { firebaseDb, firebaseBucket } = require("../config/firebase");
const { sendPushNotification } = require("../firebase-messaging");

const findDevices = async (id) => {
  try {
    const userData = await firebaseDb
      .collection("users")
      .doc(id)
      .get();
    const data = userData.data()
    const devices = data.devices || []
    return devices
  } catch (error) {
    console.log(error);
    throw error
  }
}

const triggerNotification = async (id, title, message) => {
  try {
    const devices = await findDevices(id)
    console.log({ devices });
    devices.forEach(device => {
      if (device !== null) {
        sendPushNotification(device, title, message)
          .then(res => {
            console.log('message sent to ', device);
          })
          .catch(error => {
            if (error.code === 'messaging/registration-token-not-registered') {
              console.log('couldnt send');
              console.log(error);
              
              updateDevices(id, device)
            }
          })
      }
    })
  } catch (error) {
    console.log(error);
  }
}

const updateDevices = async (id, nonExistentDevice) => {
  try {
    const devices = await findDevices(id);
    const newDeviceList = devices.filter(device => device !== nonExistentDevice)
    const result = await firebaseDb
      .collection("users")
      .doc(id)
      .update({ devices: newDeviceList })
    console.log(`Device ${nonExistentDevice} deleted`);
    return result
  } catch (error) {
    return error
  }
}

exports.sendNewMessageNotification = async (id) => {
  try {
    const title = 'New Message'
    const message = "You have recieved a new message, check your inbox on the messages tab"
    await triggerNotification(id, title, message)
  } catch (error) {
    console.log(`an error occured while getting devices: `, error);
  }
}

exports.sendReleaseFundsNotification = async (id, project, client) => {
  try {
    const title = 'Funds have been released'
    const message = `Project ${project} has been accepted and your account has been credited`
    await triggerNotification(id, title, message)
  } catch (error) {
    console.log(error);
  }
}

exports.sendSlaAcceptedNotification = async (id, project, client) => {
  try {
    const title = 'Project SLA Accepted'
    const message = `SLA for project ${project} has been accepted, waiting for the client to fund the project`
    await triggerNotification(id, title, message)
  } catch (error) {
    console.log(error);
  }
}
exports.sendProjectFundedNotification = async (id, project, client) => {
  try {
    const title = 'Client Has Deposited'
    const message = `Funds for project ${project} have been deposited, you can start working on it`
    await triggerNotification(id, title, message)
  } catch (error) {
    console.log(error);
  }
}

exports.sendSlaDeclinedNotification = async (id, project, client) => {
  try {
    const title = 'Project SLA Declined'
    const message = `SLA for project ${project} has been declined, you can revisit your conversation with your client`
    await triggerNotification(id, title, message)
  } catch (error) {
    console.log(error);
  }
}

exports.sendAccountBlockedNotification = async (id) => {
  try {
    console.log('sending blocked noti');
    const title = 'Account Blocked'
    const message = `Your account has been blocked, most features will not be accessible. You can talk to admin using the contact us form on the landing page for more details`
    await triggerNotification(id, title, message)
  } catch (error) {
    console.log(error);
  }
}

exports.sendAccountUnblockedNotification = async (id) => {
  console.log('sending');
  
  try {
    const title = 'Account Unblocked'
    const message = `Your account has been unblocked, you now have full access to the platform`
    await triggerNotification(id, title, message)
  } catch (error) {
    console.log(error);
  }
}