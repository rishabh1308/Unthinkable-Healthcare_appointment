const nodemailer = require("nodemailer");
const prisma = require("../utils/prisma");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Sends an email. On failure, logs a FailedEmail-style record is skipped
 * here for brevity (see README) — in this MVP we simply log the error;
 * the emailRetry cron job re-derives "pending" notifications from
 * Appointment status rather than a separate outbox table, keeping the
 * schema minimal. Swap in a proper outbox table for production use.
 */
async function sendEmail({ to, subject, html }) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error(`Email send failed to ${to}:`, err.message);
    return false;
  }
}

async function sendBookingConfirmation(appointment) {
  const { patient, doctor, startTime } = appointment;
  const doctorUser = doctor.user;

  await sendEmail({
    to: patient.email,
    subject: "Appointment Confirmed",
    html: `<p>Hi ${patient.name},</p><p>Your appointment with Dr. ${doctorUser.name}
      (${doctor.specialization}) is confirmed for ${new Date(startTime).toLocaleString()}.</p>`,
  });

  await sendEmail({
    to: doctorUser.email,
    subject: "New Appointment Booked",
    html: `<p>Hi Dr. ${doctorUser.name},</p><p>You have a new appointment with
      ${patient.name} on ${new Date(startTime).toLocaleString()}.</p>`,
  });
}

async function sendCancellationEmail(appointment) {
  const { patient, doctor, startTime } = appointment;
  const doctorUser = doctor.user;

  await sendEmail({
    to: patient.email,
    subject: "Appointment Cancelled",
    html: `<p>Hi ${patient.name},</p><p>Your appointment with Dr. ${doctorUser.name}
      on ${new Date(startTime).toLocaleString()} has been cancelled.</p>`,
  });

  await sendEmail({
    to: doctorUser.email,
    subject: "Appointment Cancelled",
    html: `<p>Hi Dr. ${doctorUser.name},</p><p>Your appointment with ${patient.name}
      on ${new Date(startTime).toLocaleString()} has been cancelled.</p>`,
  });
}

async function sendReminderEmail(patientEmail, patientName, medicineName, reminderTime) {
  return sendEmail({
    to: patientEmail,
    subject: "Medication Reminder",
    html: `<p>Hi ${patientName},</p><p>Reminder to take <strong>${medicineName}</strong>
      around ${new Date(reminderTime).toLocaleString()}.</p>`,
  });
}

module.exports = {
  sendEmail,
  sendBookingConfirmation,
  sendCancellationEmail,
  sendReminderEmail,
};
