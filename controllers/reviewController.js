const { firebaseDb } = require("../config/firebase");
const { firebaseAuth } = require("../config/firebase"); // Import initialized firebaseAuth

// Post a new review

exports.createReview = async (req, res) => {
  try {
    const { clientId, freelancerId, stars, message } = req.body;

    if (!clientId || !freelancerId || !stars || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Step 1: Retrieve the client profile data from Firestore
    const clientRef = firebaseDb.collection("users").doc(clientId);
    const clientSnapshot = await clientRef.get();

    if (!clientSnapshot.exists) {
      return res.status(404).json({ error: "Client not found" });
    }

    const clientData = clientSnapshot.data();
    const clientProfilePic = clientData.profilePicture || "/default-avatar.jpg"; // Default if not found

    // Step 2: Prepare the review data
    const reviewData = {
      clientProfilePic: clientProfilePic, // Profile picture from the client collection
      freelancerId,
      clientId,
      stars,
      message,
      status: "Pending",
      createdAt: new Date(),
    };

    // Step 3: Save the review to Firestore
    const reviewRef = await firebaseDb.collection("reviews").add(reviewData);

    // Step 4: Return success response with the created review data
    res.status(201).json({
      message: "Review successfully created",
      review: {
        id: reviewRef.id,
        ...reviewData,
      },
    });
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ error: "Failed to create review" });
  }
};

// cget reviews

exports.getReviews = async (req, res) => {
  try {
    const { clientId, freelancerId } = req.query;

    // Step 1: Prepare Firestore query to get reviews
    let query = firebaseDb.collection("reviews");

    if (clientId) {
      query = query.where("clientId", "==", clientId); // Filter by clientId if provided
    }

    if (freelancerId) {
      query = query.where("freelancerId", "==", freelancerId); // Filter by freelancerId if provided
    }

    const reviewsSnapshot = await query.get();

    if (reviewsSnapshot.empty) {
      return res.status(404).json({ message: "No reviews found" });
    }

    // Step 2: Map reviews data and add client profile picture
    const reviews = [];
    for (const doc of reviewsSnapshot.docs) {
      const review = doc.data();
      review.id = doc.id; // Add document ID to the review data

      // Fetch client profile picture from Firestore
      const clientRef = firebaseDb.collection("clients").doc(review.clientId);
      const clientSnapshot = await clientRef.get();
      const clientData = clientSnapshot.data();

      // Add profile picture or fallback if not found
      review.clientProfilePic = clientData
        ? clientData.profilePicture
        : "/default-avatar.jpg";

      reviews.push(review);
    }

    // Step 3: Return the reviews data
    res.status(200).json({ reviews });
  } catch (error) {
    console.error("Error getting reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
};
