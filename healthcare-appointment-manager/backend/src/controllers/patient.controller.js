const prisma = require("../utils/prisma");
const asyncHandler = require("../utils/asyncHandler");
const { generateSlotsForDate, filterAvailableSlots } = require("../utils/slots");
const { generatePreVisitSummary } = require("../services/gemini.service");
const { sendBookingConfirmation, sendCancellationEmail } = require("../services/email.service");
const { createCalendarEvent, deleteCalendarEvent } = require("../services/calendar.service");

// GET /api/patient/doctors?specialization=Cardiology
const searchDoctors = asyncHandler(async (req, res) => {
  const { specialization } = req.query;
  const doctors = await prisma.doctor.findMany({
    where: specialization
      ? { specialization: { contains: specialization, mode: "insensitive" } }
      : {},
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  res.json(doctors);
});

// GET /api/patient/doctors/:doctorId/slots?date=2025-01-15
const getAvailableSlots = asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const { date } = req.query;
  if (!date) return res.status(400).json({ message: "date query param is required" });

  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) return res.status(404).json({ message: "Doctor not found" });

  const requestedDate = new Date(date);

  const onLeave = await prisma.doctorLeave.findFirst({
    where: {
      doctorId,
      leaveDate: {
        gte: new Date(requestedDate.setHours(0, 0, 0, 0)),
        lte: new Date(new Date(date).setHours(23, 59, 59, 999)),
      },
    },
  });
  if (onLeave) return res.json({ slots: [], reason: "Doctor is on leave this day" });

  const allSlots = generateSlotsForDate({
    date: new Date(date),
    workingHoursStart: doctor.workingHoursStart,
    workingHoursEnd: doctor.workingHoursEnd,
    slotDuration: doctor.slotDuration,
  });

  const dayStart = new Date(new Date(date).setHours(0, 0, 0, 0));
  const dayEnd = new Date(new Date(date).setHours(23, 59, 59, 999));

  const booked = await prisma.appointment.findMany({
    where: { doctorId, status: "BOOKED", startTime: { gte: dayStart, lte: dayEnd } },
    select: { startTime: true },
  });

  const available = filterAvailableSlots(allSlots, booked.map((b) => b.startTime));
  res.json({ slots: available });
});

// POST /api/patient/appointments
// Books a slot. Relies on the DB-level unique([doctorId, startTime])
// constraint as the source of truth for concurrency safety: two
// simultaneous requests for the same slot will race at the DB, and the
// loser gets a P2002 error (mapped to 409 by the error middleware).
const bookAppointment = asyncHandler(async (req, res) => {
  const { doctorId, startTime, symptoms } = req.body;
  const patientId = req.user.id;

  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) return res.status(404).json({ message: "Doctor not found" });

  const start = new Date(startTime);
  const end = new Date(start.getTime() + doctor.slotDuration * 60000);

  const onLeave = await prisma.doctorLeave.findFirst({
    where: {
      doctorId,
      leaveDate: {
        gte: new Date(new Date(start).setHours(0, 0, 0, 0)),
        lte: new Date(new Date(start).setHours(23, 59, 59, 999)),
      },
    },
  });
  if (onLeave) return res.status(409).json({ message: "Doctor is on leave this day" });

  let preVisit = { urgencyLevel: null, summary: null };
  if (symptoms) {
    preVisit = await generatePreVisitSummary(symptoms);
  }

  // The unique constraint on (doctorId, startTime) is what actually
  // prevents double booking under concurrent requests; this create()
  // will throw P2002 if another request won the race first.
  const appointment = await prisma.appointment.create({
    data: {
      patientId,
      doctorId,
      startTime: start,
      endTime: end,
      symptoms,
      preVisitSummary: preVisit.summary,
      urgencyLevel: preVisit.urgencyLevel,
    },
    include: { patient: true, doctor: { include: { user: true } } },
  });

  // Best-effort side effects; failures here must not roll back the booking.
  await sendBookingConfirmation(appointment);
  const eventId = await createCalendarEvent({
    summary: `Appointment: ${appointment.patient.name} with Dr. ${appointment.doctor.user.name}`,
    description: symptoms || "No symptoms provided",
    startTime: start,
    endTime: end,
    attendeeEmails: [appointment.patient.email, appointment.doctor.user.email],
  });

  if (eventId) {
    await prisma.appointment.update({ where: { id: appointment.id }, data: { googleEventId: eventId } });
  }

  res.status(201).json(appointment);
});

// GET /api/patient/appointments
const myAppointments = asyncHandler(async (req, res) => {
  const appointments = await prisma.appointment.findMany({
    where: { patientId: req.user.id },
    include: { doctor: { include: { user: true } } },
    orderBy: { startTime: "desc" },
  });
  res.json(appointments);
});

// DELETE /api/patient/appointments/:id
const cancelAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { patient: true, doctor: { include: { user: true } } },
  });

  if (!appointment) return res.status(404).json({ message: "Appointment not found" });
  if (appointment.patientId !== req.user.id) {
    return res.status(403).json({ message: "Not your appointment" });
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  await sendCancellationEmail(appointment);
  await deleteCalendarEvent(appointment.googleEventId);

  res.json(updated);
});

module.exports = { searchDoctors, getAvailableSlots, bookAppointment, myAppointments, cancelAppointment };
