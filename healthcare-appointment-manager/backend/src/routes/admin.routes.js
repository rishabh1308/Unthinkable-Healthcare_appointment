const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const {
  createDoctor,
  updateDoctor,
  listDoctors,
  markLeave,
} = require("../controllers/admin.controller");

const router = express.Router();

router.use(protect, authorize("ADMIN"));

router.get("/doctors", listDoctors);
router.post("/doctors", createDoctor);
router.patch("/doctors/:id", updateDoctor);
router.post("/doctors/:id/leave", markLeave);

module.exports = router;
