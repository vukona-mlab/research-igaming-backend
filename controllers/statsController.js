const { firebaseDb } = require("../config/firebase");

// Function to record daily active users
exports.recordDailyActiveUsers = async () => {
  try {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    
    // Get all active users
    const usersSnapshot = await firebaseDb
      .collection("users")
      .where("activeStatus", "==", true)
      .get();

    let stats = {
      date: dateStr,
      freelancers: 0,
      clients: 0,
      total: 0,
      timestamp: new Date()
    };

    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      const roles = userData.roles || [];
      
      if (roles.includes('freelancer')) stats.freelancers++;
      if (roles.includes('client')) stats.clients++;
      stats.total++;
    });

    // Store the daily stats
    await firebaseDb
      .collection("dailyStats")
      .doc(dateStr)
      .set(stats);

    return stats;
  } catch (error) {
    console.error("Error recording daily active users:", error);
    throw error;
  }
};

exports.getUserStats = async (req, res) => {
  try {
    // Get all users
    const usersSnapshot = await firebaseDb.collection("users").get();
    
    let stats = {
      activeUsers: 0,
      activeClients: 0,
      activeFreelancers: 0,
      blockedUsers: 0,
      blockedClients: 0,
      blockedFreelancers: 0
    };

    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      const isActive = userData.activeStatus === true;
      const isBlocked = userData.activeStatus === false;
      const roles = userData.roles || [];

      if (isActive) {
        stats.activeUsers++;
        if (roles.includes('client')) stats.activeClients++;
        if (roles.includes('freelancer')) stats.activeFreelancers++;
      }

      if (isBlocked) {
        stats.blockedUsers++;
        if (roles.includes('client')) stats.blockedClients++;
        if (roles.includes('freelancer')) stats.blockedFreelancers++;
      }
    });

    res.status(200).json(stats);
  } catch (error) {
    console.error("Error fetching user statistics:", error);
    res.status(500).json({ error: "An error occurred while fetching user statistics" });
  }
};

exports.getDailyActiveUsers = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7; // Default to last 7 days
    const today = new Date();
    const stats = [];

    // Get recorded daily stats
    const dailyStatsSnapshot = await firebaseDb
      .collection("dailyStats")
      .orderBy("date", "desc")
      .limit(days)
      .get();

    if (!dailyStatsSnapshot.empty) {
      dailyStatsSnapshot.forEach(doc => {
        const data = doc.data();
        stats.push({
          name: new Date(data.date).toLocaleDateString('en-US', { weekday: 'short' }),
          freelancers: data.freelancers,
          clients: data.clients,
          total: data.total
        });
      });
    } else {
      // If no recorded stats, fallback to current active users
      const usersSnapshot = await firebaseDb
        .collection("users")
        .where("activeStatus", "==", true)
        .get();

      let currentStats = {
        freelancers: 0,
        clients: 0
      };

      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        const roles = userData.roles || [];
        
        if (roles.includes('freelancer')) currentStats.freelancers++;
        if (roles.includes('client')) currentStats.clients++;
      });

      // Generate dates for the last N days with current stats
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        stats.push({
          name: date.toLocaleDateString('en-US', { weekday: 'short' }),
          freelancers: currentStats.freelancers,
          clients: currentStats.clients,
          total: currentStats.freelancers + currentStats.clients
        });
      }
    }

    res.status(200).json(stats);
  } catch (error) {
    console.error("Error fetching daily active users:", error);
    res.status(500).json({ error: "An error occurred while fetching daily active users" });
  }
};

exports.getProjectStats = async (req, res) => {
  try {
    const projectsSnapshot = await firebaseDb.collection("projects").get();

    let stats = {
      pending: 0,
      rejected: 0,
      completed: 0,
    };

    projectsSnapshot.forEach((doc) => {
      const projectData = doc.data();
      if (projectData.status === "pending") stats.pending++;
      if (projectData.status === "rejected") stats.rejected++;
      if (projectData.status === "completed") stats.completed++;
    });

    res.status(200).json(stats);
  } catch (error) {
    console.error("Error fetching project statistics:", error);
    res.status(500).json({ error: "An error occurred while fetching project statistics" });
  }
}; 