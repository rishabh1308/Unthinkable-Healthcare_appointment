# 🏥 Healthcare Appointment & Follow-up Manager

A full-stack healthcare platform that streamlines **doctor appointment scheduling, AI-assisted consultations, medication reminders, and follow-up management**.

Built with **Node.js, Express, PostgreSQL, Prisma, and Next.js**, the application supports **Admin, Doctor, and Patient** workflows with secure authentication, real-time slot booking, email notifications, and Google Calendar integration.

---

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control:
  - **Admin**
  - **Doctor**
  - **Patient**

---

### 👨‍💼 Admin Dashboard
- Create and manage doctor accounts
- Update doctor details and schedules
- Mark doctor leave periods
- Automatically cancel affected appointments
- Send cancellation email notifications to patients

---

### 🩺 Patient Dashboard
- Search doctors by specialization
- View real-time available appointment slots
- Book appointments with symptom descriptions
- AI-generated:
  - Pre-visit summaries
  - Urgency assessment
- View appointment history
- Cancel appointments

---

### 👨‍⚕️ Doctor Dashboard
- View upcoming appointments
- Access AI-generated patient summaries
- Add consultation notes and prescriptions
- Generate patient-friendly post-visit summaries

---

### 📅 Scheduling & Calendar
- Real-time slot management
- Prevention of double booking using a database constraint:

```text
(doctorId, startTime)
```

- Google Calendar integration:
  - Create appointment events
  - Delete events on cancellation

---

### 📧 Notifications
- Appointment confirmation emails
- Cancellation emails
- Medication reminder emails
- Automated background reminder service

---

### 🤖 AI Features
Powered by **Google Gemini**:

- Pre-visit symptom summarization
- Appointment urgency prediction
- Patient-friendly post-visit summaries

---

## 🏗️ Tech Stack

### Frontend
- Next.js (App Router)
- React
- Tailwind CSS

### Backend
- Node.js
- Express.js
- Prisma ORM
- PostgreSQL

### Integrations
- Google Gemini API
- Google Calendar API
- Nodemailer
- Cron Jobs

---

## 🛠️ System Architecture

```text
Frontend (Next.js)
        │
        ▼
Backend API (Express.js)
        │
        ├── PostgreSQL + Prisma
        ├── Google Gemini API
        ├── Google Calendar API
        ├── SMTP Email Service
        └── Cron Jobs (Medication Reminders)
```

---

# 📂 Project Structure

```text
healthcare-appointment-manager/
│
├── backend/
│   ├── prisma/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   └── README.md
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── public/
│
├── DESIGN.md
└── README.md
```

---

# 🚀 Getting Started

## 1️⃣ Clone the Repository

```bash
git clone <repository-url>
cd healthcare-appointment-manager
```

---

## 2️⃣ Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Configure the following in `.env`:

- PostgreSQL credentials
- JWT secret
- Gemini API key
- SMTP credentials
- Google Calendar OAuth credentials

Run database migrations:

```bash
npx prisma migrate dev --name init
```

Generate Prisma Client:

```bash
npx prisma generate
```

Start the backend server:

```bash
npm run dev
```

Backend URL:

```text
http://localhost:5000
```

---

## 3️⃣ Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Frontend URL:

```text
http://localhost:3000
```

---

# 👨‍💼 Create the First Admin User

Open Prisma Studio:

```bash
cd backend
npx prisma studio
```

Create the first user with:

```text
Role: ADMIN
```

After that, all doctor accounts can be managed through the Admin Dashboard.

---

# 🗄️ Database Highlights

- PostgreSQL + Prisma ORM
- UUID-based primary keys
- Optimized relational schema
- Transaction-safe appointment booking
- Prevention of double booking:

```prisma
@@unique([doctorId, startTime])
```

---

# 🔄 Appointment Workflow

```text
Patient
   │
   ▼
Search Doctor
   │
   ▼
Book Appointment
   │
   ▼
AI Pre-Visit Summary
   │
   ▼
Doctor Consultation
   │
   ▼
Prescription & Notes
   │
   ▼
AI Post-Visit Summary
   │
   ▼
Medication Reminders
```

---

# 📸 Key Functionalities

- ✅ Secure Authentication
- ✅ Role-Based Authorization
- ✅ Doctor Search & Booking
- ✅ Real-Time Slot Availability
- ✅ AI Consultation Assistance
- ✅ Email Notifications
- ✅ Google Calendar Synchronization
- ✅ Medication Reminder System
- ✅ Appointment Management
- ✅ Automated Follow-up Workflow

---

# 🔮 Future Enhancements

- Password reset and email verification
- Doctor self-profile management
- Appointment rescheduling
- Pagination and advanced search filters
- Video consultation support
- Payment integration
- Multi-language support
- Analytics dashboard
- Mobile application

---

# 📚 API Documentation

Detailed API documentation is available in:

```text
backend/README.md
```

System design and architecture details:

```text
DESIGN.md
```

---

# 📝 Design Philosophy

This project intentionally focuses on a **clean, maintainable MVP architecture**, emphasizing:

- Simplicity over over-engineering
- Clear separation of concerns
- Readable and extensible code
- Production-ready development practices
- Scalability and maintainability

---

# 🧪 Sample Test Accounts

| Role | Email | Password |
|------|--------|-----------|
| Admin | admin@example.com | password123 |
| Doctor | doctor@example.com | password123 |
| Patient | patient@example.com | password123 |

---

# 🤝 Contributing

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature/my-feature
```

3. Commit your changes

```bash
git commit -m "Add my feature"
```

4. Push to the branch

```bash
git push origin feature/my-feature
```

5. Open a Pull Request

---

# 📄 License

This project is intended for educational and demonstration purposes.

---

# 👨‍💻 Author

**Rishabh Srivastava**

- B.Tech CSE, Pranveer Singh Institute of Technology
- Full Stack Developer | Machine Learning Enthusiast | AI Developer