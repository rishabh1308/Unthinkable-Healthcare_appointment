const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const { myAppointments, submitNotes } = require("../controllers/doctor.controller");

const router = express.Router();

router.use(protect, authorize("DOCTOR"));

router.get("/appointments", myAppointments);
router.post("/appointments/:id/notes", submitNotes);

module.exports = router;
