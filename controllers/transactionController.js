const { firebaseDb } = require("../config/firebase");
const { FieldValue } = require("firebase-admin/firestore");

const fetch = require("node-fetch");

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_API_URL = process.env.PAYSTACK_API_URL;

const initializeTransaction = async (email, amount) => {
  try {
    console.log({ email, amount });
    const response = await fetch(`${PAYSTACK_API_URL}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amount * 100,
        email: email,
        currency: "ZAR",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to initialize Paystack transaction");
    }

    const data = await response.json();
    console.log(response, data);

    return data;
  } catch (error) {
    throw new Error(
      `Paystack Transaction Initialization Failed: ${error.message}`
    );
  }
};

const createPayout = async (recipient_code, amount) => {
  try {
    const response = await fetch(`${PAYSTACK_API_URL}/transfer`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amount * 100,
        recipient: recipient_code,
        currency: "ZAR",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create Paystack payout");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(`Paystack Payout Failed: ${error.message}`);
  }
};

const createTransaction = async (req, res) => {
  const { clientId, freelancerId, amount, clientEmail, projectId } = req.body;
  try {
    const paymentResponse = await initializeTransaction(clientEmail, amount);

    const clientRef = firebaseDb.collection("users").doc(clientId);
    const transactionRef = clientRef
      .collection("transactions")
      .doc(paymentResponse.data.reference);

    await transactionRef.set({
      projectId,
      freelancerId,
      amount,
      status: "pending",
      paystackAccessCode: paymentResponse.data.access_code,
      createdAt: new Date(),
    });

    console.log(paymentResponse);
    res.status(200).json({
      message: "Transaction initialized",
      transactionId: paymentResponse.data.reference,
      accessCode: paymentResponse.data.access_code,
      payment_url: paymentResponse.data.authorization_url,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error initializing transaction" });
  }
};

const verifyPayment = async (req, res) => {
  const { reference, clientId, projectId } = req.body;
  console.log({ reference });
  try {
    const response = await fetch(
      `${process.env.PAYSTACK_API_URL}/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );
    console.log({ response });

    const data = await response.json();
    console.log({ data }, data.status);
    if (data.data.status === "success") {
      // Update transaction status to completed
      const transactionRef = firebaseDb
        .collection("users")
        .doc(clientId)
        .collection("transactions")
        .doc(reference);
      await transactionRef.update({ status: "completed" });
      await firebaseDb
        .collection("projects")
        .doc(projectId)
        .update({
          payments: FieldValue.arrayUnion({
            transactionId: reference,
            status: "success",
            updatedAt: new Date(),
          }),
          paymentStatus: "completed",
          updatedAt: new Date(),
        });
      res.status(200).json({ message: "Payment verified successfully" });
    } else {
      res.status(400).json({ error: "Payment verification failed" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error verifying payment", error });
  }
};

const releaseFunds = async (req, res) => {
  const { clientId, freelancerId, transactionReference, clientApproval } =
    req.body;
  console.log(req.body);
  if (!clientApproval) {
    return res
      .status(400)
      .json({ error: "Client must approve the release of funds" });
  }

  try {
    const transactionSnapshot = await firebaseDb
      .collection("users")
      .doc(clientId)
      .collection("transactions")
      .doc(transactionReference)
      .get();

    const transaction = transactionSnapshot.data();
    console.log({ transaction });
    if (transaction.status !== "completed") {
      return res.status(400).json({
        error: "Funds can only be released for completed transactions",
      });
    }

    const recipientSnapshot = await firebaseDb
      .collection("users")
      .doc(freelancerId)
      .get();
    const recipientCode = recipientSnapshot.data().recipient_code;

    const payoutResponse = await createPayout(
      recipientCode,
      transaction.amount
    );

    const freelancerRef = firebaseDb.collection("users").doc(freelancerId);
    const freelancerTransactionRef = freelancerRef
      .collection("transactions")
      .doc(transactionReference);

    await freelancerTransactionRef.set({
      projectId: transaction.projectId,
      freelancerId,
      amount: transaction.amount,
      status: "released",
      createdAt: new Date(),
    });

    await firebaseDb
      .collection("users")
      .doc(clientId)
      .collection("transactions")
      .doc(transactionReference)
      .update({ status: "released" });

    res
      .status(200)
      .json({ message: "Funds released successfully", payoutResponse });
  } catch (error) {
    console.log({ error });
    res.status(500).json({ error: "Error releasing funds" });
  }
};

module.exports = {
  createTransaction,
  verifyPayment,
  releaseFunds,
};
