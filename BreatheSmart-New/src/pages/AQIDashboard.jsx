import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";

// 🔹 Use API base from .env
const API_BASE = import.meta.env.VITE_API_BASE;

// AQI background colors (lighter blue theme)
const getAqiColor = (value) => {
  if (!value) return "bg-gray-200";
  if (value <= 50) return "bg-blue-100 text-blue-800";
  if (value <= 100) return "bg-green-100 text-green-800";
  if (value <= 150) return "bg-yellow-100 text-yellow-800";
  if (value <= 200) return "bg-orange-100 text-orange-800";
  if (value <= 300) return "bg-red-100 text-red-800";
  return "bg-purple-100 text-purple-800";
};

// AQI status messages
const getAqiStatus = (value) => {
  if (!value) return "No Data ❓";
  if (value <= 50) return "Good 😀";
  if (value <= 100) return "Moderate 🙂";
  if (value <= 150) return "Unhealthy for Sensitive 😷";
  if (value <= 200) return "Unhealthy 🚨";
  if (value <= 300) return "Very Unhealthy ☠️";
  return "Hazardous 💀";
};

const AQIDashboard = ({ validation }) => {
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [aqi, setAqi] = useState(null);
  const [city, setCity] = useState("");

  // fetch AQI from backend
  const fetchAqi = async (latitude, longitude) => {
    try {
      const res = await axios.get(
        `${API_BASE}/api/aqi?lat=${latitude}&lon=${longitude}`
      );
      setAqi(res.data.current);
      setCity(res.data.city);
    } catch (err) {
      console.error("Error fetching AQI:", err);
    }
  };

  // 👉 Get location on first load
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setLat(latitude.toFixed(4));
          setLon(longitude.toFixed(4));
          fetchAqi(latitude, longitude);
        },
        (err) => {
          console.warn("Location access denied:", err);
          // fallback: fetch for Delhi as default
          fetchAqi(28.6139, 77.209);
        }
      );
    } else {
      // fallback if no geolocation
      fetchAqi(28.6139, 77.209);
    }
  }, []);

  const handleFetch = () => {
    if (lat && lon) {
      fetchAqi(lat, lon);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 🔹 Lat/Lon Input (Govt Only) */}
      <motion.div
        className="p-6 bg-white rounded-xl shadow-md border border-blue-100 col-span-2"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <h2 className="text-xl font-bold text-blue-700 mb-4">
          🌍 Check Another Location
        </h2>
        <div className="flex gap-4 mb-4">
          <input
            type="number"
            placeholder="Latitude"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            className="px-3 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="number"
            placeholder="Longitude"
            value={lon}
            onChange={(e) => setLon(e.target.value)}
            className="px-3 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={handleFetch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Fetch AQI
          </button>
        </div>
      </motion.div>

      {/* Live AQI Card */}
      <motion.div
        className={`p-6 rounded-xl shadow-md border ${getAqiColor(aqi?.aqius)}`}
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <h2 className="text-xl font-bold mb-2 text-blue-800">
          🌍 Live Air Quality Index
        </h2>
        {aqi ? (
          <>
            {city && (
              <p className="text-lg font-semibold mb-2 text-gray-700">
                📍 {city}
              </p>
            )}
            <p className="text-3xl font-bold">AQI (US): {aqi?.aqius}</p>
            <p className="mt-2">Main Pollutant: {aqi?.mainus?.toUpperCase()}</p>
            <p>Time: {new Date(aqi?.ts).toLocaleString()}</p>
            <p className="mt-3 text-lg font-semibold">
              Status: {getAqiStatus(aqi?.aqius)}
            </p>
          </>
        ) : (
          <p>Loading AQI...</p>
        )}
      </motion.div>

      {/* Validation */}
      {validation && (
        <motion.div
          className="p-6 mt-6 bg-blue-50 border border-blue-200 rounded-xl shadow-md col-span-2"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h2 className="text-xl font-bold mb-4 text-blue-700">
            🩺 Validation Results
          </h2>
          <img
            src={validation.image}
            alt="Validation"
            className="rounded-lg shadow-md mb-4"
          />
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            {validation.precautions.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
};

export default AQIDashboard;
