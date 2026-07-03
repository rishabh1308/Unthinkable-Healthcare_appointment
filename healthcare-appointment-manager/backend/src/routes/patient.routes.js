const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const {
  searchDoctors,
  getAvailableSlots,
  bookAppointment,
  myAppointments,
  cancelAppointment,
} = require("../controllers/patient.controller");

const router = express.Router();

router.use(protect, authorize("PATIENT"));

router.get("/doctors", searchDoctors);
router.get("/doctors/:doctorId/slots", getAvailableSlots);
router.post("/appointments", bookAppointment);
router.get("/appointments", myAppointments);
router.delete("/appointments/:id", cancelAppointment);

module.exports = router;
