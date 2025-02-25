const { firebaseDb } = require("../config/firebase");

// Get all testimonials
exports.getTestimonials = async (req, res) => {
  try {
    const testimonialsSnapshot = await firebaseDb
      .collection("testimonials")
      .get();

    if (testimonialsSnapshot.empty) {
      return res.status(404).json({ message: "No testimonials found" });
    }

    const testimonials = testimonialsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({ testimonials });
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching testimonials" });
  }
};

// Add a new testimonial
exports.addTestimonial = async (req, res) => {
  try {
    const {
      name,
      surname,
      country,
      dateWritten,
      clientName,
      clientProfile,
      message,
    } = req.body;

    if (
      !name ||
      !surname ||
      !country ||
      !dateWritten ||
      !clientName ||
      !message
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const newTestimonial = {
      name,
      surname,
      country,
      dateWritten: new Date(dateWritten),
      clientName,
      clientProfile: clientProfile || "",
      message,
    };

    await firebaseDb.collection("testimonials").add(newTestimonial);

    res.status(201).json({ message: "Testimonial added successfully" });
  } catch (error) {
    console.error("Error adding testimonial:", error);
    res
      .status(500)
      .json({ error: "An error occurred while adding the testimonial" });
  }
};
