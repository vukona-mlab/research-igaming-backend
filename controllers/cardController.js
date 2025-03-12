const { firebaseDb } = require("../config/firebase");

// Luhn algorithm for card number validation
const isValidCardNumber = (cardNumber) => {
  const digits = cardNumber.replace(/\D/g, "");
  let sum = 0;
  let isEven = false;

  // Loop through values starting from the rightmost digit
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

// Validate expiry date
const isValidExpiryDate = (expiryDate) => {
  // Expected format: "MM/YY"
  const regex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
  if (!regex.test(expiryDate)) return false;

  const [month, year] = expiryDate.split("/");
  const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
  const today = new Date();

  // Set to end of month for comparison
  expiry.setMonth(expiry.getMonth() + 1, 0);

  return expiry > today;
};

// Validate card holder name
const isValidCardHolderName = (name) => {
  // Allow letters, spaces, and hyphens, minimum 2 characters
  const regex = /^[A-Za-z\s-]{2,}$/;
  return regex.test(name);
};

// Get card type based on card number
const getCardType = (cardNumber) => {
  const firstDigits = cardNumber.substring(0, 2);
  if (cardNumber.startsWith("4")) {
    return { type: "VISA", paypalType: "VISA" };
  } else if (["51", "52", "53", "54", "55"].includes(firstDigits)) {
    return { type: "MasterCard", paypalType: "MASTERCARD" };
  } else if (["34", "37"].includes(firstDigits)) {
    return { type: "American Express", paypalType: "AMEX" };
  }
  return { type: "Unknown", paypalType: "UNKNOWN" };
};

exports.addCard = async (req, res) => {
  try {
    const userId = req.user.uid;
    console.log("Adding card for user:", userId); // Debug log

    const {
      cardNumber,
      expiryDate,
      cardHolderName,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      countryCode = "ZA",
    } = req.body;

    console.log("Received card data:", {
      cardNumber: "*".repeat(cardNumber.length - 4) + cardNumber.slice(-4),
      expiryDate,
      cardHolderName,
      // Log other non-sensitive fields
    });

    // Validate required fields
    if (
      !cardNumber ||
      !expiryDate ||
      !cardHolderName ||
      !addressLine1 ||
      !city ||
      !state ||
      !postalCode
    ) {
      console.log("Missing required fields"); // Debug log
      return res.status(400).json({
        error: "Missing required fields",
        required: [
          "cardNumber",
          "expiryDate",
          "cardHolderName",
          "addressLine1",
          "city",
          "state",
          "postalCode",
        ],
      });
    }

    // Validate card number using Luhn algorithm
    if (!isValidCardNumber(cardNumber)) {
      return res.status(400).json({ error: "Invalid card number" });
    }

    // Validate expiry date
    if (!isValidExpiryDate(expiryDate)) {
      return res.status(400).json({ error: "Invalid or expired card date" });
    }

    // Get card type
    const { type, paypalType } = getCardType(cardNumber);

    // Mask card number (store only last 4 digits)
    const maskedCardNumber = `****-****-****-${cardNumber.slice(-4)}`;
    const lastFourDigits = cardNumber.slice(-4);

    const newCard = {
      userId, // Important: Add userId to the card document
      maskedCardNumber,
      lastFourDigits,
      cardHolderName,
      expiryDate,
      cardType: type,
      paypalCardType: paypalType,
      billingAddress: {
        addressLine1,
        addressLine2: addressLine2 || "",
        adminArea2: city,
        adminArea1: state,
        postalCode,
        countryCode,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log("Saving card with data:", {
      ...newCard,
      maskedCardNumber: "****-****-****-" + lastFourDigits,
    });

    // Check if user already has this card stored
    const existingCards = await firebaseDb
      .collection("users")
      .doc(userId)
      .collection("cards")
      .where("lastFourDigits", "==", cardNumber.slice(-4))
      .get();

    if (!existingCards.empty) {
      return res.status(400).json({ error: "This card is already stored" });
    }

    // Store card in user's cards subcollection
    const cardRef = await firebaseDb
      .collection("users")
      .doc(userId)
      .collection("cards")
      .add(newCard);

    console.log("Card saved successfully with ID:", cardRef.id); // Debug log

    res.status(201).json({
      message: "Card added successfully",
      card: {
        id: cardRef.id,
        ...newCard,
      },
    });
  } catch (error) {
    console.error("Error adding card:", error);
    console.error("Error details:", error.message); // Additional error details
    res.status(500).json({ error: "Failed to add card" });
  }
};

exports.getCards = async (req, res) => {
  try {
    const userId = req.user.uid;

    const cardsSnapshot = await firebaseDb
      .collection("users")
      .doc(userId)
      .collection("cards")
      .get();

    const cards = cardsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({ cards });
  } catch (error) {
    console.error("Error fetching cards:", error);
    res.status(500).json({ error: "Failed to fetch cards" });
  }
};

exports.updateCard = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { cardId } = req.params;
    const { cardHolderName, expiryDate } = req.body;

    const updateData = {
      updatedAt: new Date(),
    };

    // Validate fields if provided
    if (cardHolderName) {
      if (!isValidCardHolderName(cardHolderName)) {
        return res.status(400).json({ error: "Invalid card holder name" });
      }
      updateData.cardHolderName = cardHolderName;
    }

    if (expiryDate) {
      if (!isValidExpiryDate(expiryDate)) {
        return res.status(400).json({ error: "Invalid or expired card date" });
      }
      updateData.expiryDate = expiryDate;
    }

    // Verify card exists and belongs to user
    const cardRef = firebaseDb
      .collection("users")
      .doc(userId)
      .collection("cards")
      .doc(cardId);

    const card = await cardRef.get();
    if (!card.exists) {
      return res.status(404).json({ error: "Card not found" });
    }

    // Verify card belongs to user
    const cardData = card.data();
    if (cardData.userId !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to update this card" });
    }

    await cardRef.update(updateData);

    res.status(200).json({
      message: "Card updated successfully",
      updates: updateData,
    });
  } catch (error) {
    console.error("Error updating card:", error);
    res.status(500).json({ error: "Failed to update card" });
  }
};

exports.deleteCard = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { cardId } = req.params;

    // Verify card exists and belongs to user
    const cardRef = firebaseDb
      .collection("users")
      .doc(userId)
      .collection("cards")
      .doc(cardId);

    const card = await cardRef.get();
    if (!card.exists) {
      return res.status(404).json({ error: "Card not found" });
    }

    // Verify card belongs to user
    const cardData = card.data();
    if (cardData.userId !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this card" });
    }

    await cardRef.delete();

    res.status(200).json({
      message: "Card deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting card:", error);
    res.status(500).json({ error: "Failed to delete card" });
  }
};
