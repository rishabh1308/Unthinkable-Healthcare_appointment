# Healthcare Appointment Manager — Backend

Node.js + Express + PostgreSQL (Prisma) API for the Healthcare Appointment
& Follow-up Manager.

## 1. Setup

```bash
cd backend
npm install
cp .env.example .env   # fill in real values
npx prisma migrate dev --name init
npm run dev             # http://localhost:5000
```

Seed an initial admin manually (there's no public admin-signup route by
design — admins are provisioned directly):

```bash
npx prisma studio
# create a User row with role=ADMIN, password = bcrypt hash of your choice
```

## 2. Environment Variables

See `.env.example`. Key ones:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Signing secret for auth tokens |
| `GEMINI_API_KEY` | Google Gemini API key |
| `SMTP_*` / `EMAIL_FROM` | Nodemailer transport config |
| `GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI/REFRESH_TOKEN` | Google Calendar OAuth2 |

### Google Calendar setup
1. Create a project in Google Cloud Console, enable the **Calendar API**.
2. Create OAuth2 credentials (Web application), add your redirect URI.
3. Use the OAuth2 Playground (or a small local script) with your client
   ID/secret and the `https://www.googleapis.com/auth/calendar` scope to
   generate a **refresh token** once — store it in `GOOGLE_REFRESH_TOKEN`.
4. The backend uses this refresh token server-side to create/delete
   events on booking/cancellation (no per-user OAuth flow needed for MVP).

## 3. Database Schema (Prisma)

- **User**: id, name, email, password (hashed), role (`ADMIN` / `DOCTOR` / `PATIENT`)
- **Doctor**: 1:1 with User; specialization, working hours, slot duration
- **DoctorLeave**: doctorId + leaveDate (unique pair), reason
- **Appointment**: patientId, doctorId, startTime/endTime, status, symptoms,
  preVisitSummary, urgencyLevel, postVisitSummary, prescription, googleEventId
  — **unique constraint on `(doctorId, startTime)`** to block double-booking
- **MedicationReminder**: appointmentId, medicineName, reminderTime, sent

Full definitions: `prisma/schema.prisma`.

## 4. LLM Prompts (Gemini)

**Pre-visit summary** (`services/gemini.service.js`):
> Analyse these symptoms and return ONLY valid JSON with keys "urgencyLevel"
> (Low | Medium | High), "chiefComplaint", and "suggestedQuestions" (3 items).

**Post-visit summary**:
> Convert these clinical notes into a patient-friendly summary with a
> medication schedule and follow-up steps.

Both calls are wrapped in try/catch; on failure the API returns a
graceful fallback string instead of throwing, so the booking/notes flow
never breaks due to an LLM outage.

## 5. API Documentation

### Auth
| Method | Route | Body | Access |
|---|---|---|---|
| POST | `/api/auth/register` | name, email, password | Public (creates PATIENT) |
| POST | `/api/auth/login` | email, password | Public |

### Admin (`Bearer` token, role=ADMIN)
| Method | Route | Body | Notes |
|---|---|---|---|
| GET | `/api/admin/doctors` | — | List all doctors |
| POST | `/api/admin/doctors` | name, email, password, specialization, workingHoursStart, workingHoursEnd, slotDuration | Creates User+Doctor |
| PATCH | `/api/admin/doctors/:id` | any doctor field | Update profile |
| POST | `/api/admin/doctors/:id/leave` | leaveDate, reason | Marks leave + auto-cancels & emails affected patients |

### Patient (role=PATIENT)
| Method | Route | Body | Notes |
|---|---|---|---|
| GET | `/api/patient/doctors?specialization=` | — | Search |
| GET | `/api/patient/doctors/:doctorId/slots?date=YYYY-MM-DD` | — | Available slots for a day |
| POST | `/api/patient/appointments` | doctorId, startTime, symptoms | Books slot, runs pre-visit LLM summary, sends email + calendar invite |
| GET | `/api/patient/appointments` | — | My appointments |
| DELETE | `/api/patient/appointments/:id` | — | Cancel; sends email + deletes calendar event |

### Doctor (role=DOCTOR)
| Method | Route | Body | Notes |
|---|---|---|---|
| GET | `/api/doctor/appointments` | — | My appointments |
| POST | `/api/doctor/appointments/:id/notes` | notes, prescription, medications[] | Generates patient-friendly post-visit summary, schedules reminders |

All protected routes require `Authorization: Bearer <token>`.

## 6. Double-Booking & Concurrency

- `Appointment` has a **DB-level unique constraint** on `(doctorId, startTime)`.
- Two simultaneous booking requests for the same slot both attempt
  `prisma.appointment.create(...)`; the database itself allows only one
  to succeed. The loser's insert throws a Prisma `P2002` error, which
  the global error middleware maps to `409 Conflict` with a friendly
  message — no manual locking required.

## 7. Background Jobs

- `jobs/medicationReminder.job.js` — every 5 min, sends due, unsent reminders.
- `jobs/emailRetry.job.js` — placeholder retry loop; see file comments
  for how to extend with a persisted `EmailLog` table for production use.

## 8. Deployment

- Backend → Render/Railway (set env vars, run `npx prisma migrate deploy` as a build step)
- Frontend → Vercel (set `NEXT_PUBLIC_API_URL` to the backend URL)
