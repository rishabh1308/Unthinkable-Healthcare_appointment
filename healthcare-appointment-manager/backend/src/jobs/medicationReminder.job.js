const cron = require("node-cron");
const prisma = require("../utils/prisma");
const { sendReminderEmail } = require("../services/email.service");

// Runs every 5 minutes: finds reminders whose time has passed and
// haven't been sent yet, sends the email, and marks them sent.
function startMedicationReminderJob() {
  cron.schedule("*/5 * * * *", async () => {
    try {
      const dueReminders = await prisma.medicationReminder.findMany({
        where: { sent: false, reminderTime: { lte: new Date() } },
        include: {
          appointment: { include: { patient: true } },
        },
      });

      for (const reminder of dueReminders) {
        const ok = await sendReminderEmail(
          reminder.appointment.patient.email,
          reminder.appointment.patient.name,
          reminder.medicineName,
          reminder.reminderTime
        );
        if (ok) {
          await prisma.medicationReminder.update({
            where: { id: reminder.id },
            data: { sent: true },
          });
        }
        // If sending failed, we simply leave sent=false and it will be
        // retried on the next run (see emailRetry.job.js for the same
        // pattern applied more generally).
      }
    } catch (err) {
      console.error("medicationReminder job failed:", err.message);
    }
  });
}

module.exports = { startMedicationReminderJob };
