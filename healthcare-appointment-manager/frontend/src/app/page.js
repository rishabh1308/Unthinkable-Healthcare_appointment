"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "../lib/api";

const dashboardByRole = {
  ADMIN: "/admin",
  DOCTOR: "/doctor",
  PATIENT: "/patient",
};

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    if (session) {
      router.replace(dashboardByRole[session.user.role] || "/login");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-slate-500">Loading…</p>
    </main>
  );
}
