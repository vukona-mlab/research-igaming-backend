const { firebaseDb } = require("../config/firebase");

exports.getAllDocuments = async (req, res) => {
  try {
    const usersCollection = await firebaseDb.collection("users").get();
    if (usersCollection.empty) {
      return res.status(404).json({ error: "No users found" });
    }
    const users = usersCollection.docs
      .map((doc) => {
        const document = doc.data();
        if (document.documents) {
          const userObj = {
            id: doc.id,
            name: document.name,
            surname: document.surname,
            email: document.email,
            documents: document.documents,
          };
          return userObj;
        }
      })
      .filter((obj) => typeof obj !== "undefined");
    res.status(201).json({ usersDocuments: users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { docId, status, rejectionReason } = req.body;
    const { userId } = req.params;
    console.log(userId, status, docId);

    if (!docId) {
      return res.status(403).json({ error: "Missing field required" });
    }
    const userDoc = await firebaseDb.collection("users").doc(userId).get();
    const user = userDoc.data();
    const documents = user.documents;

    if (!documents || documents.length === 0) {
      return res.status(403).json({ error: "User has no documents" });
    }

    const documentObj = documents.find((doc) => doc.id === docId);
    documentObj.status = status;
    if (rejectionReason) {
      documentObj.rejectionReason = rejectionReason;
    } else {
      documentObj.rejectionReason = "none";
    }

    const result = await firebaseDb
      .collection("users")
      .doc(userId)
      .update("documents", documents);
    res
      .status(201)
      .json({ message: "User document status has been updated succesfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};
