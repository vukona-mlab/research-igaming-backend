const cron = require('node-cron');
const { recordDailyActiveUsers } = require('./controllers/statsController');

// Schedule daily stats recording at midnight (00:00)
cron.schedule('0 0 * * *', async () => {
  try {
    console.log('Running daily stats recording...');
    await recordDailyActiveUsers();
    console.log('Daily stats recorded successfully');
  } catch (error) {
    console.error('Error in daily stats recording:', error);
  }
});

// Export the cron jobs for testing purposes
module.exports = {
  recordDailyStats: recordDailyActiveUsers
}; 