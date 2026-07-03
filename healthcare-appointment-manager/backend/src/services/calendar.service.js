const { google } = require("googleapis");

function getOAuthClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return oauth2Client;
}

/**
 * Creates a Google Calendar event for an appointment and invites both
 * the patient and the doctor. Returns the event ID (or null on failure,
 * so booking never breaks because of a Calendar outage).
 */
async function createCalendarEvent({ summary, description, startTime, endTime, attendeeEmails }) {
  try {
    const auth = getOAuthClient();
    const calendar = google.calendar({ version: "v3", auth });

    const event = await calendar.events.insert({
      calendarId: "primary",
      sendUpdates: "all",
      requestBody: {
        summary,
        description,
        start: { dateTime: new Date(startTime).toISOString() },
        end: { dateTime: new Date(endTime).toISOString() },
        attendees: attendeeEmails.map((email) => ({ email })),
      },
    });

    return event.data.id;
  } catch (err) {
    console.error("Google Calendar event creation failed:", err.message);
    return null;
  }
}

async function deleteCalendarEvent(eventId) {
  if (!eventId) return;
  try {
    const auth = getOAuthClient();
    const calendar = google.calendar({ version: "v3", auth });
    await calendar.events.delete({ calendarId: "primary", eventId, sendUpdates: "all" });
  } catch (err) {
    console.error("Google Calendar event deletion failed:", err.message);
  }
}

module.exports = { createCalendarEvent, deleteCalendarEvent };
