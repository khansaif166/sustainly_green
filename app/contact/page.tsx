"use client";

import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/layouts/Footer";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [status, setStatus] = useState<"idle" | "sending" | "success">("idle");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");

    // simulate submit
    setTimeout(() => {
      setStatus("success");
      setForm({ name: "", email: "", message: "" });
    }, 1200);
  }

  return (
    <>
      <Header />
      <main className="max-w-full mx-auto px-6 py-20 space-y-14">
        {/* ================= HERO ================= */}

        <section
          className="relative text-center max-w-full mx-auto space-y-4 py-16 px-4 rounded-3xl overflow-hidden"
          style={{
            backgroundImage: "url('/abt.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Overlay */}
          <div className="absolute inset-0"></div>

          {/* Content */}
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-semibold text-white">
              Contact Sustainly Green
            </h1>
            <p className="text-sm md:text-base text-white">
              Have questions, feedback, or want to collaborate with us? Reach
              out and our team will get back to you shortly.
            </p>
          </div>
        </section>

        {/* ================= GRID ================= */}
        <section className="grid md:grid-cols-2 gap-10">
          {/* INFO CARD */}
          <div className="rounded-3xl p-8 bg-[var(--color-bg-white)] shadow-[0_20px_60px_rgba(0,0,0,0.08)] space-y-6">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
              Get in Touch
            </h2>

            <p className="text-sm text-[var(--color-text-secondary)]">
              We are building a sustainable marketplace connecting verified
              vendors and conscious buyers across the globe.
            </p>

            <div className="space-y-3 text-sm">
              <p className="text-[var(--color-text-primary)]">
                <span className="font-medium">Email:</span>{" "}
                <a
                  href="mailto:contact@sustainlygreen.com"
                  className="text-[var(--color-primary-green)] underline"
                >
                  contact@sustainlygreen.com
                </a>
              </p>

              <p className="text-[var(--color-text-primary)]">
                <span className="font-medium">Website:</span>{" "}
                <a
                  href="https://www.sustainlygreen.com"
                  target="_blank"
                  className="text-[var(--color-primary-green)] underline"
                >
                  sustainlygreen.com
                </a>
              </p>
            </div>
          </div>

          {/* FORM CARD */}
          <div className="rounded-3xl p-8 bg-[var(--color-bg-white)] shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-6">
              Send us a message
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* NAME */}
              <div>
                <label className="label">Full Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="input"
                  placeholder="Your name"
                />
              </div>

              {/* EMAIL */}
              <div>
                <label className="label">Email Address</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="input"
                  placeholder="you@email.com"
                />
              </div>

              {/* MESSAGE */}
              <div>
                <label className="label">Message</label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="input resize-none"
                  placeholder="Write your message here..."
                />
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={status === "sending"}
                className="w-full rounded-full bg-gradient-to-r from-[var(--color-primary-green)] to-[var(--color-ocean-blue)] text-white py-2.5 text-sm font-semibold hover:brightness-95 transition disabled:opacity-60"
              >
                {status === "sending" ? "Sending..." : "Send Message"}
              </button>

              {status === "success" && (
                <p className="text-sm text-[var(--color-primary-green)] text-center">
                  Thanks! We’ll get back to you soon.
                </p>
              )}
            </form>
          </div>
        </section>

        {/* ================= GLOBAL STYLES ================= */}
        <style jsx global>{`
          .input {
            width: 100%;
            border: 1px solid var(--color-border);
            border-radius: 0.75rem;
            padding: 0.7rem 0.9rem;
            font-size: 0.875rem;
            color: var(--color-text-primary);
            background: white;
          }

          .input:focus {
            outline: none;
            border-color: var(--color-primary-green);
            box-shadow: 0 0 0 3px rgba(11, 110, 79, 0.15);
          }

          .label {
            display: block;
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--color-text-secondary);
            margin-bottom: 0.3rem;
          }
        `}</style>
      </main>
      <Footer />
    </>
  );
}
