const { firebaseDb, firebaseBucket } = require("../config/firebase");

exports.findDevices = async (id) => {
    const userData = await firebaseDb
      .collection("users")
      .doc(id)
      .get();
    const data = userData.data()
    const devices = data.devices
    return devices
} 

exports.sendNewMessageNotification = async(id) => {
    const devices = await this.findDevices(id)
    console.log({ devices });
    
}