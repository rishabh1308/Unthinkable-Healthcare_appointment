// Centralized error handler. Prisma unique constraint violations (P2002)
// are mapped to a 409 so double-booking attempts surface a clean message.
function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.code === "P2002") {
    return res.status(409).json({
      message: "This slot was just booked by someone else. Please pick another slot.",
    });
  }

  const status = err.statusCode || 500;
  res.status(status).json({ message: err.message || "Internal server error" });
}

module.exports = errorHandler;
