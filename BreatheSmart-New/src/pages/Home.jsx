import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import AboutImg from "../assets/image.png";
import AboutImg1 from "../assets/about.png";

export default function Home() {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="w-screen bg-gradient-to-br from-orange-50 via-white to-cyan-50 text-gray-900 font-sans overflow-x-hidden">
      {/* HERO */}
      <motion.header className="min-h-screen flex flex-col justify-center items-center text-center px-6 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-10 left-[-50px] w-96 h-96 bg-gradient-to-tr from-orange-300 to-pink-400 rounded-full blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-[-80px] right-[-80px] w-[30rem] h-[30rem] bg-gradient-to-tr from-cyan-300 to-indigo-400 rounded-full blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-tr from-yellow-200 to-orange-300 rounded-full blur-3xl opacity-20 animate-ping"></div>

        {/* Content wrapper */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center relative z-10">
          {/* Left: Text */}
          <div className="text-center md:text-left">
            <motion.h1 className="text-6xl md:text-7xl font-extrabold mb-6 bg-gradient-to-r from-orange-500 via-pink-500 to-indigo-500 bg-clip-text text-transparent">
              🌍 BreatheSmart
            </motion.h1>
            <p className="max-w-xl mx-auto md:mx-0 mb-10 text-lg md:text-xl text-gray-700 leading-relaxed">
              Citizen-powered air quality monitoring with{" "}
              <span className="text-indigo-600 font-semibold">smart insights</span>{" "}
              and{" "}
              <span className="text-cyan-600 font-semibold">government action</span>.
            </p>

            {/* Buttons */}
            <div className="flex flex-col md:flex-row gap-6 justify-center md:justify-start">
              <Link
                to="/signin-citizen"
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-orange-400 to-pink-500 text-white font-semibold shadow-lg hover:scale-105 transition"
              >
                👤 Citizen
              </Link>
              <Link
                to="/signin-government"
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-semibold shadow-lg hover:scale-105 transition"
              >
                🏛 Government
              </Link>
            </div>
          </div>


        </div>

        {/* Trusted by row */}
        <div className="mt-16 flex flex-wrap justify-center gap-10 text-gray-500 text-sm">
          <span className="font-semibold text-gray-700">Trusted by:</span>
          <span>🌆 Citizens</span>
          <span>🏢 NGOs</span>
          <span>🏛 Government</span>
          <span>📊 Researchers</span>
        </div>

        {/* Quick stats */}
        <div className="mt-10 grid md:grid-cols-3 gap-6 text-center max-w-4xl mx-auto">
          {[
            { num: "2,134+", label: "Live AQI Reports" },
            { num: "8,920+", label: "Citizens Joined" },
            { num: "500+", label: "Gov. Actions Taken" },
          ].map((s, i) => (
            <div
              key={i}
              className="p-6 bg-white/80 backdrop-blur-md rounded-xl shadow-md hover:shadow-lg"
            >
              <h3 className="text-3xl font-bold text-indigo-600">{s.num}</h3>
              <p className="text-gray-600">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <button
          onClick={() => scrollTo("about")}
          className="mt-16 flex flex-col items-center text-gray-600 hover:text-indigo-600"
        >
          <span className="animate-bounce text-2xl">↓</span>
          <span className="text-sm">Scroll Down</span>
        </button>
      </motion.header>

      {/* ABOUT */}
      <section
        id="about"
        className="py-20 px-6 bg-gradient-to-r from-pink-50 via-white to-orange-50"
      >
        <h2 className="text-4xl font-bold mb-8 text-center text-orange-600">
          About Us
        </h2>
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <p className="text-gray-700 text-lg leading-relaxed">
            <span className="text-indigo-600 font-medium">BreatheSmart</span>{" "}
            empowers communities with real-time air quality data. Citizens act
            safer, earn rewards for eco-friendly actions, and governments
            validate pollution sources effectively.
          </p>
          <img
            src={AboutImg}
            alt="About"
            className="rounded-2xl shadow-lg hover:scale-105 transition duration-300"
          />
        </div>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        className="py-20 px-6 bg-gradient-to-r from-cyan-50 via-white to-indigo-50"
      >
        <h2 className="text-4xl font-bold text-center mb-12 text-indigo-600">
          Features
        </h2>
        <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
          {[
            { title: "📊 Live AQI", desc: "Hyper-local AQI data from citizens." },
            { title: "🎁 Rewards", desc: "Points for eco-friendly initiatives." },
            { title: "🏛 Dashboards", desc: "Tools for government validation." },
          ].map((f, i) => (
            <motion.div
              key={i}
              className="p-8 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg hover:shadow-indigo-300 transition text-center"
            >
              <h3 className="text-2xl font-semibold mb-4 text-indigo-600">
                {f.title}
              </h3>
              <p className="text-gray-600">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 px-6 bg-gradient-to-r from-orange-50 via-white to-cyan-50">
        <h2 className="text-4xl font-bold text-center mb-12 text-orange-600">
          How It Works
        </h2>
        <div className="max-w-5xl mx-auto flex flex-col gap-8">
          {[
            "Citizen submits AQI data",
            "Data validated with AI",
            "Government reviews & acts",
            "Rewards distributed",
          ].map((step, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-6 bg-white rounded-xl p-6 shadow-md hover:shadow-lg"
            >
              <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-r from-pink-400 to-orange-400 text-white font-bold rounded-full">
                {i + 1}
              </div>
              <p className="text-lg text-gray-700">{step}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 px-6 bg-gradient-to-r from-indigo-50 via-white to-pink-50">
        <h2 className="text-4xl font-bold text-center mb-12 text-cyan-600">
          What People Say
        </h2>
        <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
          {[
            {
              name: "Amit, Citizen",
              text: "I can finally see my area's AQI live. It’s empowering!",
            },
            {
              name: "Priya, Activist",
              text: "Rewards motivate my community to act greener.",
            },
            {
              name: "Gov. Official",
              text: "Reliable data helps us take immediate action.",
            },
          ].map((t, i) => (
            <div
              key={i}
              className="p-8 bg-white/80 rounded-2xl shadow-lg text-center"
            >
              <p className="italic text-gray-700 mb-4">“{t.text}”</p>
              <h4 className="font-semibold text-indigo-600">{t.name}</h4>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-gradient-to-r from-cyan-50 via-white to-orange-50">
        <h2 className="text-4xl font-bold text-center mb-12 text-indigo-600">
          FAQ
        </h2>
        <div className="max-w-4xl mx-auto space-y-6">
          {[
            { q: "Is my data safe?", a: "Yes, your data is encrypted and never sold." },
            { q: "How do I earn rewards?", a: "Report AQI and complete eco-friendly challenges." },
            { q: "Can governments trust the data?", a: "Yes, AI validation ensures accuracy." },
          ].map((f, i) => (
            <div
              key={i}
              className="bg-white/90 p-6 rounded-xl shadow-md hover:shadow-lg"
            >
              <h4 className="font-semibold text-lg mb-2 text-orange-600">{f.q}</h4>
              <p className="text-gray-700">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-pink-100 via-white to-cyan-100 text-center">
        <h2 className="text-4xl font-bold mb-6 text-indigo-600">
          Ready to Breathe Smart?
        </h2>
        <p className="mb-10 text-gray-700">
          Join us today and make a difference in your community.
        </p>
        <Link
          to="/signin-citizen"
          className="px-10 py-4 rounded-xl bg-gradient-to-r from-orange-400 to-pink-500 text-white font-semibold shadow-lg hover:scale-105 transition"
        >
          Get Started →
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="py-10 bg-gradient-to-r from-orange-100 via-white to-cyan-100 text-center text-gray-700 border-t">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6 mb-6">
          <div>
            <h4 className="font-semibold text-indigo-600 mb-2">Links</h4>
            <ul className="space-y-1 text-sm">
              <li>
                <a href="#about" className="hover:text-orange-600">
                  About
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-orange-600">
                  Features
                </a>
              </li>
              <li>
                <a href="#privacy" className="hover:text-orange-600">
                  Privacy
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-indigo-600 mb-2">Follow Us</h4>
            <p>🌐 Twitter · 📘 Facebook · 📸 Instagram</p>
          </div>
          <div>
            <h4 className="font-semibold text-indigo-600 mb-2">Newsletter</h4>
            <div className="flex justify-center">
              <input
                type="email"
                placeholder="Your email"
                className="px-4 py-2 rounded-l-lg border w-full max-w-xs"
              />
              <button className="px-4 py-2 bg-orange-500 text-white rounded-r-lg">
                Join
              </button>
            </div>
          </div>
        </div>
        <p className="text-sm">
          © {new Date().getFullYear()} BreatheSmart. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}
