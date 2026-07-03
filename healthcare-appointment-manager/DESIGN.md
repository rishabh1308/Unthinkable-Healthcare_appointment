# System Design Write-up

## Double-booking prevention

The core guarantee is a Postgres **unique constraint on `(doctorId, startTime)`**
on the `Appointment` table. Rather than trying to prevent the race in
application code (checking availability, then writing — which is
inherently racy under concurrency), every booking request goes straight
to `INSERT`. Postgres itself is the arbiter: if two requests for the
same doctor/slot land concurrently, exactly one `INSERT` succeeds and
the other fails with a unique-violation (Prisma error `P2002`). The
global error middleware maps that to `409 Conflict` with a
user-friendly "this slot was just taken" message, and the frontend can
immediately re-fetch fresh availability.

This is preferable to `SELECT ... then INSERT` with an application-level
mutex because it works correctly across multiple backend instances
(horizontally scaled Render/Railway dynos) with no shared lock service,
and it fails closed — there's no window where both requests believe
they succeeded.

## Slot hold mechanism

The current MVP does **not** implement a soft "hold" (e.g., reserving a
slot for 5 minutes while a patient fills out the symptom form before
confirming). Slots are shown as available based on a live query and
only actually claimed at the final `INSERT`. This is a deliberate
simplification for a one-day build: it keeps the schema minimal (no
extra `SlotHold` table, no expiry sweeper), and the failure mode is
graceful — worst case, a patient fills out the form and then sees a
409 asking them to pick another time, which is an acceptable UX
trade-off for an MVP with low concurrent-booking volume.

For a production version, the recommended extension is a short-lived
`SlotHold(doctorId, startTime, patientId, expiresAt)` row, also unique
on `(doctorId, startTime)`, created optimistically when a patient opens
a slot's booking form and cleaned up by a cron sweep (or a Postgres
`expiresAt < now()` filter at read time) if the patient abandons the
flow. Confirming the booking would convert the hold into a real
`Appointment` in the same transaction that deletes the hold. This adds
real concurrency protection *earlier* in the flow (before symptom entry)
at the cost of a bit more schema and job complexity — a reasonable
next step once the assignment's one-day constraint is lifted.

## Doctor leave conflict handling

When an admin marks a doctor on leave for a given date
(`POST /admin/doctors/:id/leave`), the handler does three things inside
a single request: (1) writes the `DoctorLeave` row, (2) queries all
`Appointment`s for that doctor on that date with `status = BOOKED`, and
(3) for each affected appointment, flips its status to `CANCELLED` and
sends the patient a cancellation email explaining the doctor is
unavailable and asking them to rebook. The response includes a count of
notified patients so the admin gets immediate confirmation the
cancellation cascade ran.

Slot availability generation (`GET /patient/doctors/:id/slots`) also
checks `DoctorLeave` up front and returns an empty slot list with a
`reason` field if the requested date falls on a leave day, so patients
can never book into a leave day in the first place — the cascade-cancel
path above only matters for *pre-existing* bookings made before the
leave was declared.

One edge case worth flagging: leave and booking cancellation are not
wrapped in a single DB transaction with the email sends (email/calendar
calls are deliberately kept *outside* the transaction, since a
third-party API being slow or down should never roll back a valid DB
state change). If the process crashes mid-loop between cancelling
appointment 3 of 10 and appointment 4, the leave row and the first three
cancellations persist correctly; a retry-safe design would iterate
idempotently (re-running only picks up appointments still `BOOKED`),
which is exactly what happens since the query re-runs from DB state
each time.

## Notification failure handling

Email sends (`email.service.js`) and Calendar calls
(`calendar.service.js`) are both wrapped in try/catch and treated as
**best-effort side effects** — a failure is logged but never throws
back into the booking/cancellation flow, so a down SMTP server or a
Calendar API outage can never block a patient from getting a valid
appointment. `createCalendarEvent` returns `null` on failure instead of
throwing, and the appointment simply ends up with `googleEventId = null`.

For retries, the codebase includes a `jobs/emailRetry.job.js` cron
scaffold with a documented extension path: adding a minimal `EmailLog`
table (`to`, `subject`, `html`, `status`, `attempts`) that `sendEmail()`
writes to, which the cron job then re-sends on a schedule with backoff.
This was left as a documented stub rather than fully built to keep the
schema in the spec's minimal footprint, since the assignment's own
guidelines call for using only what's strictly required.
