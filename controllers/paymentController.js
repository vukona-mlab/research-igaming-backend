const { firebaseDb } = require("../config/firebase");
const paypal = require('@paypal/checkout-server-sdk');
const { v4: uuidv4 } = require('uuid');
const { FieldValue } = require('firebase-admin/firestore');

// PayPal configuration
const environment = process.env.NODE_ENV === 'production'
  ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
  : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);
const client = new paypal.core.PayPalHttpClient(environment);

// Process payment with stored card
exports.processStoredCardPayment = async (req, res) => {
  try {
    const { amount, cardId } = req.body;
    const userId = req.user.uid;
    const currency = 'ZAR'; // Always use ZAR

    // Validate input
    if (!amount || !cardId) {
      return res.status(400).json({ error: "Amount and cardId are required" });
    }

    // Get stored card
    const cardRef = await firebaseDb
      .collection('users')
      .doc(userId)
      .collection('cards')
      .doc(cardId)
      .get();

    if (!cardRef.exists) {
      return res.status(404).json({ error: "Card not found" });
    }

    const card = cardRef.data();

    // Verify card belongs to user
    if (card.userId !== userId) {
      return res.status(403).json({ error: "Not authorized to use this card" });
    }

    // Create PayPal order with stored card
    const request = new paypal.orders.OrdersCreateRequest();
    request.headers = {
      ...request.headers,
      'PayPal-Request-Id': uuidv4(),
      'prefer': 'return=representation'
    };

    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: currency,
          value: amount.toString()
        },
        description: `Payment using card ending in ${card.maskedCardNumber.slice(-4)}`
      }],
      payment_source: {
        card: {
          last_digits: card.maskedCardNumber.slice(-4),
          name: card.cardHolderName,
          billing_address: {
            address_line_1: '123 Main St',
            admin_area_2: 'City',
            admin_area_1: 'State',
            postal_code: '12345',
            country_code: 'ZA' // South Africa country code
          }
        }
      }
    });

    const order = await client.execute(request);

    // Store transaction in Firebase
    await firebaseDb
      .collection('users')
      .doc(userId)
      .collection('transactions')
      .doc(order.result.id)
      .set({
        orderId: order.result.id,
        amount: amount,
        currency: currency,
        status: order.result.status,
        cardId: cardId,
        cardLastFour: card.maskedCardNumber.slice(-4),
        cardType: card.cardType,
        createdAt: new Date(),
        updatedAt: new Date()
      });

    res.status(200).json({
      success: true,
      orderId: order.result.id,
      status: order.result.status,
      amount: amount,
      currency: currency,
      cardLastFour: card.maskedCardNumber.slice(-4),
      links: order.result.links
    });

  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({
      error: "Payment processing failed",
      details: error.message
    });
  }
};

// Get payment history
exports.getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.uid;
    
    const transactionsSnapshot = await firebaseDb
      .collection('users')
      .doc(userId)
      .collection('transactions')
      .orderBy('createdAt', 'desc')
      .get();

    const transactions = transactionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate()
    }));

    res.status(200).json({
      success: true,
      transactions
    });

  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      error: "Failed to fetch payment history",
      details: error.message
    });
  }
};

// Capture payment
exports.capturePayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.uid;

    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.headers = {
      ...request.headers,
      'PayPal-Request-Id': uuidv4()
    };

    const capture = await client.execute(request);

    // Get transaction details
    const transactionRef = await firebaseDb
      .collection('users')
      .doc(userId)
      .collection('transactions')
      .doc(orderId)
      .get();

    const transaction = transactionRef.data();

    // Update transaction status
    await transactionRef.ref.update({
      status: capture.result.status,
      captureId: capture.result.purchase_units[0].payments.captures[0].id,
      updatedAt: new Date()
    });

    // Update project payment status
    await firebaseDb
      .collection('projects')
      .doc(transaction.projectId)
      .update({
        'payments': FieldValue.arrayUnion({
          transactionId: orderId,
          captureId: capture.result.purchase_units[0].payments.captures[0].id,
          status: capture.result.status,
          updatedAt: new Date()
        }),
        paymentStatus: 'completed',
        updatedAt: new Date()
      });

    res.status(200).json({
      success: true,
      orderId: capture.result.id,
      status: capture.result.status,
      projectId: transaction.projectId,
      captureId: capture.result.purchase_units[0].payments.captures[0].id
    });

  } catch (error) {
    console.error('Error capturing payment:', error);
    res.status(500).json({
      error: "Failed to capture payment",
      details: error.message
    });
  }
};

// Create PayPal order with card payment
exports.createOrder = async (req, res) => {
  try {
    const { amount, cardId, newCard, projectId, freelancerId } = req.body;
    const clientId = req.user.uid; // This is the client making the payment
    const localCurrency = 'ZAR';
    const paypalCurrency = 'USD';

    // Validate required fields
    if (!amount || !projectId || !freelancerId) {
      return res.status(400).json({ 
        error: "Missing required fields", 
        required: ["amount", "projectId", "freelancerId"] 
      });
    }

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // Verify project exists and belongs to the freelancer
    const projectRef = await firebaseDb
      .collection('projects')
      .doc(projectId)
      .get();

    if (!projectRef.exists) {
      return res.status(404).json({ error: "Project not found" });
    }

    const project = projectRef.data();
    if (project.freelancerId !== freelancerId) {
      return res.status(403).json({ error: "Project does not belong to specified freelancer" });
    }

    // Verify freelancer exists
    const freelancerRef = await firebaseDb
      .collection('users')
      .doc(freelancerId)
      .get();

    if (!freelancerRef.exists) {
      return res.status(404).json({ error: "Freelancer not found" });
    }

    // Convert ZAR to USD
    const exchangeRate = 0.053;
    const usdAmount = (amount * exchangeRate).toFixed(2);

    let card;
    // Handle saved card or new card
    if (cardId) {
      const cardRef = await firebaseDb
        .collection('users')
        .doc(clientId)
        .collection('cards')
        .doc(cardId)
        .get();

      if (!cardRef.exists) {
        return res.status(404).json({ error: "Card not found" });
      }

      card = cardRef.data();

      if (card.userId !== clientId) {
        return res.status(403).json({ error: "Not authorized to use this card" });
      }
    } else if (newCard) {
      if (!newCard.number || !newCard.expiryDate || !newCard.cardHolderName) {
        return res.status(400).json({ error: "Invalid card details" });
      }

      card = {
        maskedCardNumber: `****-****-****-${newCard.number.slice(-4)}`,
        cardHolderName: newCard.cardHolderName,
        expiryDate: newCard.expiryDate
      };
    } else {
      return res.status(400).json({ error: "Either cardId or newCard details are required" });
    }

    const request = new paypal.orders.OrdersCreateRequest();
    request.headers = {
      ...request.headers,
      'PayPal-Request-Id': uuidv4(),
      'prefer': 'return=representation'
    };

    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: paypalCurrency,
          value: usdAmount
        },
        description: `Payment for Project: ${project.title || projectId}`
      }],
      payment_source: {
        card: {
          last_digits: card.maskedCardNumber.slice(-4),
          name: card.cardHolderName,
          billing_address: {
            address_line_1: '123 Main St',
            admin_area_2: 'City',
            admin_area_1: 'State',
            postal_code: '12345',
            country_code: 'ZA'
          }
        }
      }
    });

    const order = await client.execute(request);

    // Store transaction with project and user details
    await firebaseDb
      .collection('users')
      .doc(clientId)
      .collection('transactions')
      .doc(order.result.id)
      .set({
        orderId: order.result.id,
        projectId: projectId,
        projectTitle: project.title,
        clientId: clientId,
        freelancerId: freelancerId,
        localAmount: amount,
        localCurrency: localCurrency,
        paypalAmount: usdAmount,
        paypalCurrency: paypalCurrency,
        exchangeRate: exchangeRate,
        status: order.result.status,
        cardLastFour: card.maskedCardNumber.slice(-4),
        cardType: card.cardType || 'Unknown',
        createdAt: new Date(),
        updatedAt: new Date()
      });

    // Also store transaction reference in project
    await firebaseDb
      .collection('projects')
      .doc(projectId)
      .update({
        payments: FieldValue.arrayUnion({
          transactionId: order.result.id,
          amount: amount,
          currency: localCurrency,
          status: order.result.status,
          createdAt: new Date()
        }),
        lastPaymentDate: new Date(),
        updatedAt: new Date()
      });

    res.status(200).json({
      success: true,
      orderId: order.result.id,
      status: order.result.status,
      projectId: projectId,
      projectTitle: project.title,
      clientId: clientId,
      freelancerId: freelancerId,
      localAmount: amount,
      localCurrency: localCurrency,
      paypalAmount: usdAmount,
      paypalCurrency: paypalCurrency,
      exchangeRate: exchangeRate,
      cardLastFour: card.maskedCardNumber.slice(-4),
      links: order.result.links
    });

  } catch (error) {
    console.error('Error creating payment order:', error);
    res.status(500).json({ 
      error: "Failed to create payment order",
      details: error.message 
    });
  }
};

// Add a new endpoint to handle PayPal return after approval
exports.handlePayPalReturn = async (req, res) => {
  try {
    const { token, PayerID } = req.query;

    if (!token) {
      return res.status(400).json({ error: "Missing PayPal token" });
    }

    // Capture the payment after approval
    const request = new paypal.orders.OrdersCaptureRequest(token);
    request.headers = {
      ...request.headers,
      'PayPal-Request-Id': uuidv4()
    };

    const capture = await client.execute(request);

    // Get transaction details
    const transactionsRef = firebaseDb.collection('users');
    const snapshot = await transactionsRef
      .collectionGroup('transactions')
      .where('orderId', '==', token)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    const transaction = snapshot.docs[0].data();
    const userId = snapshot.docs[0].ref.parent.parent.id;

    // Update transaction status
    await snapshot.docs[0].ref.update({
      status: capture.result.status,
      payerId: PayerID,
      captureId: capture.result.purchase_units[0].payments.captures[0].id,
      updatedAt: new Date()
    });

    // Update project payment status
    await firebaseDb
      .collection('projects')
      .doc(transaction.projectId)
      .update({
        'payments': FieldValue.arrayUnion({
          transactionId: token,
          captureId: capture.result.purchase_units[0].payments.captures[0].id,
          status: capture.result.status,
          updatedAt: new Date()
        }),
        paymentStatus: 'completed',
        updatedAt: new Date()
      });

    // Redirect to success page or return success response
    res.status(200).json({
      success: true,
      orderId: capture.result.id,
      status: capture.result.status,
      projectId: transaction.projectId,
      captureId: capture.result.purchase_units[0].payments.captures[0].id
    });

  } catch (error) {
    console.error('Error handling PayPal return:', error);
    res.status(500).json({
      error: "Failed to process payment",
      details: error.message
    });
  }
}; 