import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// ✅ Use .env for backend URL
const API_BASE = import.meta.env.VITE_API_BASE;

export default function SignUpCitizen() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Signup failed");
      }

      alert("Signup successful! Please log in.");
      navigate("/signin-citizen"); // ✅ Redirect to login
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-pink-100 via-white to-orange-100">
      {/* Navbar */}
      <header className="w-full flex items-center justify-between px-6 py-4 shadow-sm bg-white/80 backdrop-blur-md">
        <button
          onClick={() => navigate("/")}
          className="text-sm font-medium text-gray-600 hover:text-orange-600 transition"
        >
          ← Back
        </button>
        <h1 className="text-lg font-bold bg-gradient-to-r from-orange-500 to-pink-600 bg-clip-text text-transparent">
          BreatheSmart
        </h1>
        <div className="w-10" /> {/* Spacer */}
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center px-6 relative">
        {/* Background blobs */}
        <div className="absolute top-20 left-10 w-40 h-40 bg-pink-300/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-56 h-56 bg-orange-300/30 rounded-full blur-3xl animate-pulse" />

        {/* SignUp Card */}
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-8 z-10">
          <h2 className="text-2xl font-bold text-center text-slate-700 mb-2">
            Citizen Sign Up
          </h2>
          <p className="text-sm text-center text-gray-500 mb-6">
            Create an account to get started
          </p>

          {error && (
            <p className="mb-3 text-red-500 text-sm text-center">{error}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-400 focus:outline-none"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-400 focus:outline-none"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-400 focus:outline-none"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-orange-500 to-pink-600 text-white font-semibold shadow-md hover:opacity-90 transition"
            >
              {loading ? "Signing up..." : "Sign Up"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <span
              onClick={() => navigate("/signin-citizen")}
              className="text-indigo-600 cursor-pointer hover:underline"
            >
              Login
            </span>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-gray-500 text-sm bg-white/70 backdrop-blur-sm">
        © {new Date().getFullYear()} BreatheSmart · All Rights Reserved
      </footer>
    </div>
  );
}
