# Healthcare Appointment & Follow-up Manager

Monorepo: `backend/` (Node.js + Express + PostgreSQL/Prisma) and
`frontend/` (Next.js App Router + Tailwind).

## Quick start

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env      # fill in DB, JWT, Gemini, SMTP, Google Calendar creds
npx prisma migrate dev --name init
npm run dev                # http://localhost:5000

# 2. Frontend (new terminal)
cd frontend
npm install
cp .env.example .env.local
npm run dev                 # http://localhost:3000
```

Create your first ADMIN user via `npx prisma studio` (see backend/README.md
§1) — admins then create doctor accounts from the Admin dashboard.

## What's included

- Role-based auth (Admin / Doctor / Patient) with JWT
- Admin: create/update doctors, mark leave (auto-cancels + emails affected patients)
- Patient: search doctors, view real-time available slots, book with
  symptom form → Gemini pre-visit summary + urgency level, cancel
- Doctor: view appointments with pre-visit summary, submit notes +
  prescription → Gemini patient-friendly post-visit summary
- Double-booking prevented via a DB unique constraint on `(doctorId, startTime)`
- Email notifications (Nodemailer) for booking/cancellation
- Google Calendar event creation/deletion on booking/cancellation
- Background cron job for medication reminders

See `backend/README.md` for full API docs, schema, and Google Calendar
OAuth setup steps, and `DESIGN.md` for the system design write-up.

## Notes on scope

This is intentionally a lean MVP boilerplate (per the assignment's own
guidance to keep dependencies minimal and avoid over-engineering):
password reset, doctor self-editing profile, and pagination were left
out to stay within a one-day build. Each controller has a single,
readable responsibility so they're easy to extend.
