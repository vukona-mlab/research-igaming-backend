require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const authRoutes = require("./routes/authRouter");
const freelancerRoutes = require("./routes/freelancerRoutes");
const testimonialRoutes = require("./routes/testimonialRoutes");
const chatsRoutes = require("./routes/chatsRoutes");
const escrowRoutes = require("./routes/escrowRoutes");
const passport = require("passport");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "public")));

// Passport middleware
app.use(passport.initialize());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api", freelancerRoutes);
app.use("/api", testimonialRoutes);
app.use("/api", chatsRoutes);
app.use("/api", escrowRoutes);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
