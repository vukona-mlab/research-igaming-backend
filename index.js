require("dotenv").config();
require("./scheduledTasks");
const express = require("express");
const cors = require("cors");
const path = require("path");
const authRoutes = require("./routes/authRouter");
const serviceRoutes = require("./routes/servicesRouter");
const freelancerRoutes = require("./routes/freelancerRoutes");
const testimonialRoutes = require("./routes/testimonialRoutes");
const chatsRoutes = require("./routes/chatsRoutes");
const statsRoutes = require("./routes/statsRoutes");

const reviewRoutes = require("./routes/reviewRoutes");

const { firebaseDb } = require("./config/firebase");

const passport = require("passport");
const projectRoutes = require("./routes/projectRoutes");
const cardRoutes = require("./routes/cardRoutes");
const socketIo = require("socket.io");
const http = require("http");
const transactionRoutes = require("./routes/transactionRoutes");
const bankRoutes = require("./routes/bankRoutes");
const zoomRoutes = require("./routes/zoomRoutes");
const clientRoutes = require("./routes/clientRoutes");
const documentsRoutes = require("./routes/documentsRoutes");
const adminChatRoutes = require("./routes/adminChatRoutes");
const notificationsRoutes = require("./routes/notificationsRoutes");
const bankAccountRoutes = require("./routes/bankAccountRoutes");
const bioRoutes = require("./routes/bioRoutes");
const { sendPushNotification } = require("./firebase-messaging"); 
const chatBotRoutes = require("./routes/chatBotRoutes");

const app = express();
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:3000",
      "http://localhost:3001",
      "https://research-igaming.web.app",
      "https://admin-research-igaming.web.app"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Access-Control-Allow-Origin", "Access-Control-Allow-Methods", "Access-Control-Allow-Headers", "Access-Control-Allow-Credentials"],
  })
);
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
  //console.log("User connected:", socket.id);

  // Join a chat room
  socket.on("join-chat", (chatId) => {
    socket.join(chatId);
    //console.log(`User ${socket.id} joined chat ${chatId}`);
  });

  // Join an admin chat room
  socket.on("join-admin-chat", (chatId) => {
    socket.join(`admin-chat-${chatId}`);
    //console.log(`User ${socket.id} joined admin chat ${chatId}`);
  });

  // Leave a chat room
  socket.on("leave-chat", (chatId) => {
    socket.leave(chatId);
    // console.log(`User ${socket.id} left chat ${chatId}`);
  });

  // Leave an admin chat room
  socket.on("leave-admin-chat", (chatId) => {
    socket.leave(`admin-chat-${chatId}`);
    //console.log(`User ${socket.id} left admin chat ${chatId}`);
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
require("./passport"); // Make sure passport is configured

// Routes
app.use("/api/auth", authRoutes);
app.use("/api", freelancerRoutes); //
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/chats", chatsRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/cards", cardRoutes);
app.use("/api/banks", bankRoutes);
app.use("/api/bank-accounts", bankAccountRoutes);
app.use("/api", transactionRoutes); //
app.use("/api/zoom", zoomRoutes);
app.use("/api/chatbot", chatBotRoutes);
app.use("/api", clientRoutes); //
app.use("/api/documents", documentsRoutes);
app.use("/api/admin-chats", adminChatRoutes);
app.use("/api/admin-notifications", notificationsRoutes);
app.use("/api", bioRoutes);
app.use("/api", statsRoutes); //
app.use("/api/reviews", reviewRoutes);
app.use("/api/ba/sec", (req, res) => {
  res.end({ data: null });
});
// app.use("/api/support", supportRoutes)

const PORT = process.env.PORT || 8000;
// sendPushNotification("eYTA6_1yWeCxqOgyH-Ej8j:APA91bGtxkQgBN29EA_epQEs9js_WY4GaTwGF-lIhiT7tOxkZZPU-hFOdJP7t8HzveEp3dC6LbTqaKv7q_RzHDkLjoLSVkjJDTG5qHqCpgjLCOpn4Vnm8GI", "Hi there", "I just wanted to say hi")
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
