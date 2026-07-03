"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getSession, clearSession } from "../../lib/api";

export default function DoctorDashboard() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [notesForm, setNotesForm] = useState({}); // { [appointmentId]: { notes, prescription } }
  const [message, setMessage] = useState("");

  useEffect(() => {
    const s = getSession();
    if (!s || s.user.role !== "DOCTOR") return router.replace("/login");
    setSession(s);
    load();
  }, [router]);

  const load = async () => {
    const data = await apiFetch("/doctor/appointments");
    setAppointments(data);
  };

  const updateForm = (id, field, value) => {
    setNotesForm((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const submitNotes = async (id) => {
    setMessage("");
    try {
      const { notes = "", prescription = "" } = notesForm[id] || {};
      await apiFetch(`/doctor/appointments/${id}/notes`, {
        method: "POST",
        body: { notes, prescription, medications: [] },
      });
      setMessage("Notes submitted and patient summary generated.");
      load();
    } catch (err) {
      setMessage(err.message);
    }
  };

  if (!session) return null;

  return (
    <main className="mx-auto max-w-4xl space-y-8 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dr. {session.user.name}</h1>
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

      <section className="space-y-4">
        {appointments.map((a) => (
          <div key={a.id} className="space-y-2 rounded-xl border border-slate-200 bg-white p-6 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {a.patient.name} — {new Date(a.startTime).toLocaleString()}
              </span>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{a.status}</span>
            </div>
            {a.urgencyLevel && (
              <p>
                <span className="font-medium">Urgency:</span> {a.urgencyLevel}
              </p>
            )}
            {a.preVisitSummary && (
              <p className="text-slate-600">
                <span className="font-medium">Pre-visit summary:</span> {a.preVisitSummary}
              </p>
            )}

            {a.status === "BOOKED" && (
              <div className="space-y-2 pt-2">
                <textarea
                  placeholder="Clinical notes"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  rows={2}
                  onChange={(e) => updateForm(a.id, "notes", e.target.value)}
                />
                <input
                  placeholder="Prescription"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  onChange={(e) => updateForm(a.id, "prescription", e.target.value)}
                />
                <button
                  onClick={() => submitNotes(a.id)}
                  className="rounded-lg bg-brand-500 px-4 py-2 text-white"
                >
                  Submit notes
                </button>
              </div>
            )}

            {a.postVisitSummary && (
              <p className="text-slate-600">
                <span className="font-medium">Post-visit summary:</span> {a.postVisitSummary}
              </p>
            )}
          </div>
        ))}
        {appointments.length === 0 && <p className="text-sm text-slate-400">No appointments yet.</p>}
      </section>
    </main>
  );
}
