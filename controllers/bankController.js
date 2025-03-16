const { firebaseDb } = require("../config/firebase");

const fetch = require("node-fetch");

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_API_URL = process.env.PAYSTACK_API_URL;

const createRecipient = async (type, bank_code, account_number, name) => {
  try {
    console.log(type, bank_code, account_number, name);
    const response = await fetch(`${PAYSTACK_API_URL}/transferrecipient`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "basa",
        name: name,
        account_number: account_number,
        bank_code: bank_code,
        currency: "ZAR",
      }),
    });
    const data = await response.json();

    console.log(data);
    if (!response.ok) {
      throw new Error("Failed to create Paystack recipient");
    }

    // const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(`Paystack Recipient Creation Failed: ${error.message}`);
  }
};
const addBankAccount = async (req, res) => {
  const { userId, type, bank_code, account_number, name } = req.body;

  try {
    const recipientResponse = await createRecipient(
      type,
      bank_code,
      account_number,
      name
    );
    console.log(recipientResponse.data.id);
    const userRef = firebaseDb.collection("users").doc(userId);
    await userRef.update({
      recipient_code: recipientResponse.data.recipient_code,
    });
    const usersDoc = firebaseDb.collection("users").doc(userId);
    console.log({ usersDoc });
    const bankRef = usersDoc
      .collection("bank-accounts")
      .doc(recipientResponse.data.id.toString());

    await bankRef.set({
      id: recipientResponse.data.id.toString(),
      name: recipientResponse.data.name,
      account_number:
        "*".repeat(recipientResponse.data.details.account_number.length - 4) +
        recipientResponse.data.details.account_number.slice(-4),
      bank_name: recipientResponse.data.details.bank_name,
      bank_code: recipientResponse.data.details.bank_code,
      createdAt: recipientResponse.data.createdAt,
      updatedAt: recipientResponse.data.updatedAt,
    });
    res.status(200).json({
      message: "Bank account added succesfully",
      recipient_code: recipientResponse.data.recipient_code,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error saving bank details" });
  }
};
const getBankAccounts = async (req, res) => {
  try {
    const userId = req.user.uid;

    if (!userId) {
      res.status(400).json({ error: "User not found" });
    }
    const userDoc = firebaseDb.collection("users").doc(userId);
    const bankAccountsRef = userDoc.collection("bank-accounts");
    const snapshot = await bankAccountsRef.get();

    if (snapshot.empty) {
      return res.status(200).json({ bankAccounts: [] });
    }

    const bankAccounts = snapshot.docs.map((doc) => doc.data());

    res.status(200).json({ bankAccounts });
  } catch (error) {
    res.status(500).json({ error: "Error retrieving bank accounts" });
  }
};
const deleteBankAccount = async (req, res) => {
  try {
    const { accId } = req.params;
    const userId = req.user.uid;

    if (!userId) {
      res.status(400).json({ error: "User not found" });
    }
    const userDoc = firebaseDb.collection("users").doc(userId);
    const bankAccountRef = userDoc.collection("bank-accounts").doc(accId);

    await bankAccountRef.delete();

    res.status(200).json({ message: "Bank account deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting bank account" });
  }
};
const updateBankAccount = async (req, res) => {
  try {
    const { accId } = req.params;
    const userId = req.user.uid;

    if (!userId) {
      res.status(400).json({ error: "User not found" });
    }
    const { type, bank_code, account_number, name } = req.body;

    const userDoc = firebaseDb.collection("users").doc(userId);
    const bankAccountRef = userDoc.collection("bank-accounts").doc(accId);
    const bankAccountDoc = await bankAccountRef.get();

    if (!bankAccountDoc.exists) {
      return res.status(404).json({ message: "Bank account not found" });
    }

    const recipientResponse = await createRecipient(
      type,
      bank_code,
      account_number,
      name
    );

    await bankAccountRef.update({
      name: recipientResponse.data.name,
      account_number:
        "*".repeat(recipientResponse.data.details.account_number.length - 4) +
        recipientResponse.data.details.account_number.slice(-4),
      bank_name: recipientResponse.data.details.bank_name,
      bank_code: recipientResponse.data.details.bank_code,
      updatedAt: recipientResponse.data.updatedAt,
    });

    res.status(200).json({ message: "Bank account updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error updating bank account" });
  }
};

const getBanks = async (req, res) => {
  const currency = req.query.currency || "ZAR";

  try {
    const response = await fetch(
      `${PAYSTACK_API_URL}/bank?currency=${currency}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      res.json(data);
    } else {
      res.status(response.status).json({ error: data });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  addBankAccount,
  getBankAccounts,
  deleteBankAccount,
  updateBankAccount,
  getBanks,
};
