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
const transactionRoutes = require("./routes/transactionRoutes");
const bankRoutes = require("./routes/bankRoutes");

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

// Make io accessible to routes
app.set("io", io);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join a chat room
  socket.on("join-chat", (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.id} joined chat ${chatId}`);
  });

  // Leave a chat room
  socket.on("leave-chat", (chatId) => {
    socket.leave(chatId);
    console.log(`User ${socket.id} left chat ${chatId}`);
  });

  socket.on("active-status-update", async (data) => {
    try {
      await firebaseDb.collection("users").doc(data.uid).update({
        activeStatus: data.activeStatus,
        updatedAt: new Date(),
      });

      io.emit("get-active-status", {
        uid: data.uid,
        activeStatus: data.activeStatus,
      });
    } catch (error) {
      console.error("Error updating active status:", error);
    }
  });

  // Add new event for project creation
  socket.on("project-created", (data) => {
    const { chatId, projectData } = data;
    // Emit to all users in the chat room
    io.to(chatId).emit("new-project", {
      chatId,
      projectData,
    });
  });

  // Add new events for project status updates
  socket.on("project-status-updated", (data) => {
    const { chatId, projectId, status, message } = data;
    // Emit to all users in the chat room
    io.to(chatId).emit("project-update", {
      chatId,
      projectId,
      status,
      message,
      timestamp: new Date(),
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "public")));

// Initialize Passport and restore authentication state from session
app.use(passport.initialize());
passport.initialize(); // Make sure passport is configured

// Routes
app.use("/api/auth", authRoutes);
app.use("/api", freelancerRoutes);
app.use("/api", testimonialRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api", chatsRoutes);
app.use("/api", projectRoutes);
app.use("/api", cardRoutes);
app.use("/api", bankRoutes);
app.use("/api", transactionRoutes);

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
