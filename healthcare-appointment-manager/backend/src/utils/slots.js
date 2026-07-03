// Generates candidate slot start times for a doctor on a given date,
// based on working hours + slot duration, then filters out ones that
// are already booked. Times are treated as local clock times "HH:mm".

function generateSlotsForDate({ date, workingHoursStart, workingHoursEnd, slotDuration }) {
  const [startH, startM] = workingHoursStart.split(":").map(Number);
  const [endH, endM] = workingHoursEnd.split(":").map(Number);

  const dayStart = new Date(date);
  dayStart.setHours(startH, startM, 0, 0);

  const dayEnd = new Date(date);
  dayEnd.setHours(endH, endM, 0, 0);

  const slots = [];
  let cursor = new Date(dayStart);

  while (cursor.getTime() + slotDuration * 60000 <= dayEnd.getTime()) {
    const slotStart = new Date(cursor);
    const slotEnd = new Date(cursor.getTime() + slotDuration * 60000);
    slots.push({ startTime: slotStart, endTime: slotEnd });
    cursor = slotEnd;
  }

  return slots;
}

function filterAvailableSlots(allSlots, bookedStartTimes) {
  const bookedSet = new Set(bookedStartTimes.map((d) => new Date(d).getTime()));
  return allSlots.filter((s) => !bookedSet.has(s.startTime.getTime()));
}

module.exports = { generateSlotsForDate, filterAvailableSlots };
