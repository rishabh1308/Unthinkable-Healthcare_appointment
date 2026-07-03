const prisma = require("../utils/prisma");
const asyncHandler = require("../utils/asyncHandler");
const { generatePostVisitSummary } = require("../services/gemini.service");

// GET /api/doctor/appointments
const myAppointments = asyncHandler(async (req, res) => {
  const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
  if (!doctor) return res.status(404).json({ message: "Doctor profile not found" });

  const appointments = await prisma.appointment.findMany({
    where: { doctorId: doctor.id },
    include: { patient: { select: { id: true, name: true, email: true } } },
    orderBy: { startTime: "asc" },
  });

  res.json(appointments);
});

// POST /api/doctor/appointments/:id/notes
// Doctor submits clinical notes + prescription; Gemini converts the
// notes into a patient-friendly post-visit summary and medication
// reminders are scheduled from the prescription text.
const submitNotes = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { notes, prescription, medications } = req.body;
  // medications (optional): [{ medicineName, reminderTime }]

  const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
  const appointment = await prisma.appointment.findUnique({ where: { id } });

  if (!appointment) return res.status(404).json({ message: "Appointment not found" });
  if (appointment.doctorId !== doctor.id) {
    return res.status(403).json({ message: "Not your appointment" });
  }

  const postVisitSummary = await generatePostVisitSummary(notes);

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      postVisitSummary,
      prescription,
      status: "COMPLETED",
    },
  });

  if (Array.isArray(medications) && medications.length > 0) {
    await prisma.medicationReminder.createMany({
      data: medications.map((m) => ({
        appointmentId: id,
        medicineName: m.medicineName,
        reminderTime: new Date(m.reminderTime),
      })),
    });
  }

  res.json(updated);
});

module.exports = { myAppointments, submitNotes };
