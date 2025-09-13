import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const role = localStorage.getItem("role"); // "citizen" or "government"

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  let navLinks = [];

  if (role === "citizen") {
    navLinks = [
      { to: "/citizen", label: "Citizen Portal" },
      { to: "/rewards", label: "Rewards" }, // citizen version
    ];
  } else if (role === "government") {
    navLinks = [
      { to: "/government", label: "Government Portal" },
      { to: "/validation", label: "Validator" },
      { to: "/rewards-portal", label: "Rewards" }, // government version
    ];
  }

  return (
    <nav className="bg-white text-slate-800 px-6 py-4 flex justify-between items-center shadow-md border-b border-slate-200">
      {/* Logo */}
      <Link
        to="/"
        className="text-2xl font-bold tracking-wide text-blue-600 hover:text-blue-700 transition-colors"
      >
        🌍 BreatheSmart
      </Link>

      {/* Dynamic Links */}
      <div className="hidden md:flex gap-6 items-center">
        {navLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`hover:text-blue-600 transition-colors ${
              location.pathname === link.to
                ? "text-blue-600 font-semibold border-b-2 border-blue-600"
                : ""
            }`}
          >
            {link.label}
          </Link>
        ))}

        {role && (
          <button
            onClick={handleLogout}
            className="ml-4 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-colors text-sm font-semibold"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
