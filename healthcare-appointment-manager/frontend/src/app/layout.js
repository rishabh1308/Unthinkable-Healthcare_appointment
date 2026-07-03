import "./globals.css";

export const metadata = {
  title: "Healthcare Appointment Manager",
  description: "Book appointments, get AI symptom summaries, stay on top of follow-ups.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
