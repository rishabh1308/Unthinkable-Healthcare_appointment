require("dotenv").config();
const app = require("./app");
const { startMedicationReminderJob } = require("./jobs/medicationReminder.job");
const { startEmailRetryJob } = require("./jobs/emailRetry.job");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startMedicationReminderJob();
  startEmailRetryJob();
});
