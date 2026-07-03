const cron = require("node-cron");

// MVP note: this project keeps a minimal schema (see README) and does
// not persist a separate "failed email" outbox table. sendEmail() in
// email.service.js already logs failures. For a production system,
// add an EmailLog { id, to, subject, html, status, attempts } table
// and have this job re-send any rows with status="FAILED" here, e.g.:
//
//   const failed = await prisma.emailLog.findMany({ where: { status: "FAILED" } });
//   for (const e of failed) { ... retry sendEmail(...) ... }
//
// Wiring it up is a ~15 line change once that table exists.
function startEmailRetryJob() {
  cron.schedule("*/10 * * * *", async () => {
    // Placeholder tick — see note above for how to extend this into a
    // real retry loop backed by an EmailLog table.
  });
}

module.exports = { startEmailRetryJob };
