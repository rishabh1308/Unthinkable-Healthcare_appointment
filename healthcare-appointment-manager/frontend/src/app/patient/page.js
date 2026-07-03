"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getSession, clearSession } from "../../lib/api";

export default function PatientDashboard() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [specialization, setSpecialization] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [symptoms, setSymptoms] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const s = getSession();
    if (!s || s.user.role !== "PATIENT") return router.replace("/login");
    setSession(s);
    loadAppointments();
  }, [router]);

  const loadAppointments = async () => {
    try {
      const data = await apiFetch("/patient/appointments");
      setAppointments(data);
    } catch (err) {
      setMessage(err.message);
    }
  };

  const searchDoctors = async (e) => {
    e.preventDefault();
    const data = await apiFetch(`/patient/doctors?specialization=${encodeURIComponent(specialization)}`);
    setDoctors(data);
  };

  const loadSlots = async (doctor) => {
    setSelectedDoctor(doctor);
    setSlots([]);
    if (date) {
      const data = await apiFetch(`/patient/doctors/${doctor.id}/slots?date=${date}`);
      setSlots(data.slots || []);
    }
  };

  const book = async (startTime) => {
    setMessage("");
    try {
      await apiFetch("/patient/appointments", {
        method: "POST",
        body: { doctorId: selectedDoctor.id, startTime, symptoms },
      });
      setMessage("Appointment booked!");
      setSlots((prev) => prev.filter((s) => s.startTime !== startTime));
      loadAppointments();
    } catch (err) {
      setMessage(err.message);
    }
  };

  const cancel = async (id) => {
    await apiFetch(`/patient/appointments/${id}`, { method: "DELETE" });
    loadAppointments();
  };

  if (!session) return null;

  return (
    <main className="mx-auto max-w-4xl space-y-8 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Hi, {session.user.name}</h1>
        <button
          onClick={() => {
            clearSession();
            router.push("/login");
          }}
          className="text-sm text-slate-500 underline"
        >
          Sign out
        </button>
      </header>

      {message && <p className="rounded bg-brand-50 px-3 py-2 text-sm text-brand-700">{message}</p>}

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-medium">Find a doctor</h2>
        <form onSubmit={searchDoctors} className="flex gap-2">
          <input
            placeholder="Specialization (e.g. Cardiology)"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
          />
          <button className="rounded-lg bg-brand-500 px-4 py-2 text-sm text-white">Search</button>
        </form>

        <ul className="divide-y divide-slate-100">
          {doctors.map((d) => (
            <li key={d.id} className="flex items-center justify-between py-2 text-sm">
              <span>
                Dr. {d.user.name} — {d.specialization}
              </span>
              <button onClick={() => loadSlots(d)} className="text-brand-600 underline">
                View slots
              </button>
            </li>
          ))}
        </ul>
      </section>

      {selectedDoctor && (
        <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-medium">Book with Dr. {selectedDoctor.user.name}</h2>
          <div className="flex gap-2">
            <input
              type="date"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <button
              onClick={() => loadSlots(selectedDoctor)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
            >
              Load slots
            </button>
          </div>
          <textarea
            placeholder="Describe your symptoms (optional, used for the AI pre-visit summary)"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            rows={3}
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {slots.map((s) => (
              <button
                key={s.startTime}
                onClick={() => book(s.startTime)}
                className="rounded-lg border border-brand-500 px-3 py-1 text-sm text-brand-700 hover:bg-brand-50"
              >
                {new Date(s.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </button>
            ))}
            {slots.length === 0 && <p className="text-sm text-slate-400">No slots loaded yet.</p>}
          </div>
        </section>
      )}

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-medium">My appointments</h2>
        <ul className="divide-y divide-slate-100">
          {appointments.map((a) => (
            <li key={a.id} className="space-y-1 py-3 text-sm">
              <div className="flex items-center justify-between">
                <span>
                  Dr. {a.doctor.user.name} — {new Date(a.startTime).toLocaleString()} ({a.status})
                </span>
                {a.status === "BOOKED" && (
                  <button onClick={() => cancel(a.id)} className="text-red-600 underline">
                    Cancel
                  </button>
                )}
              </div>
              {a.urgencyLevel && <p className="text-slate-500">Urgency: {a.urgencyLevel}</p>}
              {a.postVisitSummary && <p className="text-slate-500">Summary: {a.postVisitSummary}</p>}
            </li>
          ))}
          {appointments.length === 0 && <p className="text-sm text-slate-400">No appointments yet.</p>}
        </ul>
      </section>
    </main>
  );
}
