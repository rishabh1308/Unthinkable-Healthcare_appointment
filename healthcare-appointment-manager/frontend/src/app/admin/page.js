"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getSession, clearSession } from "../../lib/api";

const emptyDoctor = {
  name: "",
  email: "",
  password: "",
  specialization: "",
  workingHoursStart: "09:00",
  workingHoursEnd: "17:00",
  slotDuration: 30,
};

export default function AdminDashboard() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState(emptyDoctor);
  const [leaveForm, setLeaveForm] = useState({ doctorId: "", leaveDate: "", reason: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    const s = getSession();
    if (!s || s.user.role !== "ADMIN") return router.replace("/login");
    setSession(s);
    load();
  }, [router]);

  const load = async () => {
    const data = await apiFetch("/admin/doctors");
    setDoctors(data);
  };

  const createDoctor = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await apiFetch("/admin/doctors", { method: "POST", body: form });
      setForm(emptyDoctor);
      setMessage("Doctor created.");
      load();
    } catch (err) {
      setMessage(err.message);
    }
  };

  const markLeave = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const { doctorId, ...body } = leaveForm;
      const res = await apiFetch(`/admin/doctors/${doctorId}/leave`, { method: "POST", body });
      setMessage(`Leave marked. Notified ${res.notifiedPatients} patient(s).`);
      setLeaveForm({ doctorId: "", leaveDate: "", reason: "" });
    } catch (err) {
      setMessage(err.message);
    }
  };

  if (!session) return null;

  return (
    <main className="mx-auto max-w-4xl space-y-8 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Admin</h1>
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
        <h2 className="font-medium">Create doctor</h2>
        <form onSubmit={createDoctor} className="grid grid-cols-2 gap-2 text-sm">
          <input required placeholder="Name" className="rounded-lg border border-slate-300 px-3 py-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input required type="email" placeholder="Email" className="rounded-lg border border-slate-300 px-3 py-2" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input required type="password" placeholder="Password" className="rounded-lg border border-slate-300 px-3 py-2" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <input required placeholder="Specialization" className="rounded-lg border border-slate-300 px-3 py-2" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
          <input required placeholder="Start (HH:mm)" className="rounded-lg border border-slate-300 px-3 py-2" value={form.workingHoursStart} onChange={(e) => setForm({ ...form, workingHoursStart: e.target.value })} />
          <input required placeholder="End (HH:mm)" className="rounded-lg border border-slate-300 px-3 py-2" value={form.workingHoursEnd} onChange={(e) => setForm({ ...form, workingHoursEnd: e.target.value })} />
          <input required type="number" placeholder="Slot duration (min)" className="rounded-lg border border-slate-300 px-3 py-2" value={form.slotDuration} onChange={(e) => setForm({ ...form, slotDuration: e.target.value })} />
          <button className="col-span-2 rounded-lg bg-brand-500 px-4 py-2 text-white">Create</button>
        </form>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-medium">Mark doctor on leave</h2>
        <form onSubmit={markLeave} className="grid grid-cols-2 gap-2 text-sm">
          <select required className="rounded-lg border border-slate-300 px-3 py-2" value={leaveForm.doctorId} onChange={(e) => setLeaveForm({ ...leaveForm, doctorId: e.target.value })}>
            <option value="">Select doctor</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                Dr. {d.user.name} ({d.specialization})
              </option>
            ))}
          </select>
          <input required type="date" className="rounded-lg border border-slate-300 px-3 py-2" value={leaveForm.leaveDate} onChange={(e) => setLeaveForm({ ...leaveForm, leaveDate: e.target.value })} />
          <input placeholder="Reason (optional)" className="col-span-2 rounded-lg border border-slate-300 px-3 py-2" value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} />
          <button className="col-span-2 rounded-lg bg-brand-500 px-4 py-2 text-white">Mark leave</button>
        </form>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-medium">Doctors</h2>
        <ul className="divide-y divide-slate-100 text-sm">
          {doctors.map((d) => (
            <li key={d.id} className="py-2">
              Dr. {d.user.name} — {d.specialization} ({d.workingHoursStart}–{d.workingHoursEnd}, {d.slotDuration}min slots)
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
