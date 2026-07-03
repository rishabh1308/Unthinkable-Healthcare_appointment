const bcrypt = require("bcryptjs");
const prisma = require("../utils/prisma");
const asyncHandler = require("../utils/asyncHandler");
const { sendEmail } = require("../services/email.service");

// POST /api/admin/doctors
// Creates a User(role=DOCTOR) + linked Doctor profile in one step.
const createDoctor = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    specialization,
    workingHoursStart,
    workingHoursEnd,
    slotDuration,
  } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ message: "Email already in use" });

  const hashed = await bcrypt.hash(password, 10);

  const doctor = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name, email, password: hashed, role: "DOCTOR" },
    });
    return tx.doctor.create({
      data: {
        userId: user.id,
        specialization,
        workingHoursStart,
        workingHoursEnd,
        slotDuration: Number(slotDuration),
      },
      include: { user: true },
    });
  });

  res.status(201).json(doctor);
});

// PATCH /api/admin/doctors/:id
const updateDoctor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { specialization, workingHoursStart, workingHoursEnd, slotDuration } = req.body;

  const doctor = await prisma.doctor.update({
    where: { id },
    data: {
      ...(specialization && { specialization }),
      ...(workingHoursStart && { workingHoursStart }),
      ...(workingHoursEnd && { workingHoursEnd }),
      ...(slotDuration && { slotDuration: Number(slotDuration) }),
    },
    include: { user: true },
  });

  res.json(doctor);
});

// GET /api/admin/doctors
const listDoctors = asyncHandler(async (req, res) => {
  const doctors = await prisma.doctor.findMany({ include: { user: true } });
  res.json(doctors);
});

// POST /api/admin/doctors/:id/leave
// Marks a doctor on leave for a date and notifies any patients who
// already had a booking on that date.
const markLeave = asyncHandler(async (req, res) => {
  const { id } = req.params; // doctorId
  const { leaveDate, reason } = req.body;

  const leave = await prisma.doctorLeave.create({
    data: { doctorId: id, leaveDate: new Date(leaveDate), reason },
  });

  const dayStart = new Date(leaveDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(leaveDate);
  dayEnd.setHours(23, 59, 59, 999);

  const affected = await prisma.appointment.findMany({
    where: {
      doctorId: id,
      status: "BOOKED",
      startTime: { gte: dayStart, lte: dayEnd },
    },
    include: { patient: true, doctor: { include: { user: true } } },
  });

  await Promise.all(
    affected.map(async (appt) => {
      await prisma.appointment.update({
        where: { id: appt.id },
        data: { status: "CANCELLED" },
      });
      await sendEmail({
        to: appt.patient.email,
        subject: "Appointment Cancelled - Doctor Unavailable",
        html: `<p>Hi ${appt.patient.name},</p><p>Unfortunately Dr. ${appt.doctor.user.name}
          is on leave on ${new Date(appt.startTime).toDateString()}. Please rebook another slot.
          We're sorry for the inconvenience.</p>`,
      });
    })
  );

  res.status(201).json({ leave, notifiedPatients: affected.length });
});

module.exports = { createDoctor, updateDoctor, listDoctors, markLeave };
