import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function SignInGovernment() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${API_BASE}/api/government/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("token", data.access_token || "");
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("role", "government");

      setSuccess("✅ Login successful! Redirecting...");
      setTimeout(() => navigate("/government"), 1500); // Smooth redirect
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-blue-100 via-white to-indigo-100">
      {/* Navbar */}
      <header className="w-full flex items-center justify-between px-6 py-4 shadow-sm bg-white/80 backdrop-blur-md">
        <button
          onClick={() => navigate("/")}
          className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition"
        >
          ← Back
        </button>
        <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-500 to-blue-600 bg-clip-text text-transparent">
          BreatheSmart
        </h1>
        <div className="w-10" /> {/* Spacer */}
      </header>

      {/* Main */}
      <main className="flex flex-1 items-center justify-center px-6 relative">
        {/* Background blobs */}
        <div className="absolute top-20 left-10 w-40 h-40 bg-indigo-300/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-56 h-56 bg-blue-300/30 rounded-full blur-3xl animate-pulse" />

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-8 z-10"
        >
          <h2 className="text-2xl font-bold text-center text-slate-700 mb-2">
            Government Sign In
          </h2>
          <p className="text-sm text-center text-gray-500 mb-6">
            Secure access for government officials
          </p>

          {/* Animated Messages */}
          <AnimatePresence>
            {error && (
              <motion.p
                key="error"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-3 text-red-500 text-sm text-center"
              >
                {error}
              </motion.p>
            )}
            {success && (
              <motion.p
                key="success"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-3 text-green-600 text-sm text-center"
              >
                {success}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder="Official Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-semibold shadow-md hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-gray-500 text-sm bg-white/70 backdrop-blur-sm">
        © {new Date().getFullYear()} BreatheSmart · Government Portal
      </footer>
    </div>
  );
}
