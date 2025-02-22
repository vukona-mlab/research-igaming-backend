require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require('path');
const authRoutes = require("./routes/authRouter");
const passport = require("passport");
const googleStrategy = require("./config/googleStrategy"); // Adjust the path as necessary

const app = express();
app.use(cors({
  origin: "http://localhost:5173" // Change this to your frontend URL
}));
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Passport
app.use(passport.initialize());

// Use the Google strategy
passport.use(googleStrategy);

// Routes
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
