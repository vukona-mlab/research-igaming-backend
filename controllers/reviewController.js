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
      query = query.where("clientId", "==", clientId);
    }

    if (freelancerId) {
      query = query.where("freelancerId", "==", freelancerId);
    }

    // First try to get reviews without ordering
    console.log("Executing Firestore query for reviews...");
    const reviewsSnapshot = await query.get();
    console.log(`Found ${reviewsSnapshot.size} reviews`);

    if (reviewsSnapshot.empty) {
      return res.status(200).json({ reviews: [] }); // Return empty array instead of 404
    }

    // Step 2: Map reviews data and add client profile picture
    const reviews = [];
    for (const doc of reviewsSnapshot.docs) {
      try {
        const review = doc.data();
        review.id = doc.id; // Add document ID to the review data

        // Fetch client data from Firestore
        const clientRef = firebaseDb.collection("users").doc(review.clientId);
        console.log(`Fetching client data for ID: ${review.clientId}`);
        const clientSnapshot = await clientRef.get();
        
        if (!clientSnapshot.exists) {
          console.log(`Client not found for ID: ${review.clientId}`);
          review.clientProfilePic = "https://ui-avatars.com/api/?name=U&background=random";
          review.clientDisplayName = "Anonymous User";
        } else {
          const clientData = clientSnapshot.data();
          review.clientProfilePic = clientData.profilePicture || "https://ui-avatars.com/api/?name=U&background=random";
          review.clientDisplayName = clientData.displayName || "Anonymous User";
        }

        reviews.push(review);
      } catch (docError) {
        console.error(`Error processing review document ${doc.id}:`, docError);
        // Continue with next review even if one fails
        continue;
      }
    }

    // Sort reviews by createdAt in memory using the _seconds property
    reviews.sort((a, b) => {
      const aSeconds = a.createdAt?._seconds || 0;
      const bSeconds = b.createdAt?._seconds || 0;
      return bSeconds - aSeconds; // Sort in descending order (newest first)
    });

    // Step 3: Return the reviews data
    res.status(200).json({ reviews });
  } catch (error) {
    console.error("Error getting reviews:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({ 
      error: "Failed to fetch reviews",
      details: error.message 
    });
  }
};

// update review status

exports.updateReviewStatus = async (req, res) => {
  try {
    const { reviewId, status } = req.body;

    if (!reviewId || !status) {
      return res.status(400).json({ error: "Review ID and status are required" });
    }

    if (!["Approved", "Declined"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const reviewRef = firebaseDb.collection("reviews").doc(reviewId);
    const reviewSnapshot = await reviewRef.get();

    if (!reviewSnapshot.exists) {
      return res.status(404).json({ error: "Review not found" });
    }

    await reviewRef.update({ status });

    res.status(200).json({ message: `Review status updated to ${status}` });
  } catch (error) {
    console.error("Error updating review status:", error);
    res.status(500).json({ error: "Failed to update review status" });
  }
};

