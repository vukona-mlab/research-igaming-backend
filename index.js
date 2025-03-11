require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const authRoutes = require("./routes/authRouter");
const serviceRoutes = require("./routes/servicesRouter");
const freelancerRoutes = require("./routes/freelancerRoutes");
const testimonialRoutes = require("./routes/testimonialRoutes");
const chatsRoutes = require("./routes/chatsRoutes");

const { firebaseDb } = require("./config/firebase");

const passport = require("passport");
const projectRoutes = require("./routes/projectRoutes");
const cardRoutes = require("./routes/cardRoutes");
const socketIo = require("socket.io");
const http = require("http");
const paymentRoutes = require("./routes/paymentRoutes");
const escrowRoutes = require("./routes/escrowRoutes");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});
io.on("connect_error", (err) => {
  console.log(`connect_error due to ${err.message}`);
});
io.on("connection", function (socket) {
  console.log("a user connected");
  socket.on("active-status-update", async (data) => {
    try {
      await firebaseDb.collection("users").doc(data.uid).update({
        activeStatus: data.activeStatus,
        updatedAt: new Date(),
      });

      //get all chats

      io.emit("get-active-status", {
        uid: data.uid,
        activeStatus: data.activeStatus,
      });
    } catch (error) {}
  });
});
// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "public")));

// Passport middleware
app.use(passport.initialize());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api", freelancerRoutes);
app.use("/api", testimonialRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api", chatsRoutes);
app.use("/api", projectRoutes);
app.use("/api", cardRoutes);
app.use("/api", paymentRoutes);
app.use("/api", escrowRoutes);

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
