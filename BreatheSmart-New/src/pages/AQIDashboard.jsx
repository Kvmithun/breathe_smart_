import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";

// 🔹 Backend API for AQI Card
const API_BASE = import.meta.env.VITE_API_BASE;

// 🔹 IQAir API Key (direct fetch for Heatmap)
const IQAIR_KEY = "99e5055b-8e56-467a-b7da-e1e0473bfa04";

// AQI background colors
const getAqiColor = (value) => {
  if (!value) return "bg-gray-600";
  if (value <= 50) return "bg-green-600";
  if (value <= 100) return "bg-yellow-500";
  if (value <= 150) return "bg-orange-500";
  if (value <= 200) return "bg-red-600";
  if (value <= 300) return "bg-purple-700";
  return "bg-gray-800";
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

export default function AQIWithHeatmap({ validation }) {
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [aqi, setAqi] = useState(null);
  const [city, setCity] = useState("");
  const mapRef = useRef(null);

  // 🔹 Fetch AQI from backend (for Card)
  const fetchAqi = async (latitude, longitude) => {
    try {
      const res = await axios.get(
        `${API_BASE}/api/aqi?lat=${latitude}&lon=${longitude}`
      );
      setAqi(res.data.current);
      setCity(res.data.city);
    } catch (err) {
      console.error("Error fetching AQI (backend):", err);
    }
  };

  // 🔹 Fetch from IQAir & Render Heatmap
  const renderHeatmap = async (latitude, longitude) => {
    try {
      const url = `https://api.airvisual.com/v2/nearest_city?lat=${latitude}&lon=${longitude}&key=${IQAIR_KEY}`;
      const response = await fetch(url);
      const result = await response.json();

      if (result.status !== "success") throw new Error("IQAir API error");

      const aqiValue = result.data.current.pollution.aqius;

      // setup map only once
      if (!mapRef.current) {
        mapRef.current = L.map("map").setView([latitude, longitude], 12);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(mapRef.current);
      }

      // remove old layers before adding
      mapRef.current.eachLayer((layer) => {
        if (layer instanceof L.HeatLayer || layer instanceof L.Marker) {
          mapRef.current.removeLayer(layer);
        }
      });

      // generate fake nearby AQI points
      const heatPoints = generateRandomPoints([latitude, longitude], 5, 200);
      const intensity = aqiValue / 500.0;
      const styledHeatPoints = heatPoints.map((p) => [p[0], p[1], intensity]);

      L.heatLayer(styledHeatPoints, {
        radius: 25,
        blur: 15,
        gradient: {
          0.1: "green",
          0.2: "yellow",
          0.3: "orange",
          0.4: "red",
          0.6: "purple",
        },
      }).addTo(mapRef.current);

      L.marker([latitude, longitude]).addTo(mapRef.current)
        .bindPopup(`<b>Your Location</b><br>Live AQI (US): ${aqiValue}`)
        .openPopup();
    } catch (error) {
      console.error("Heatmap error:", error);
    }
  };

  // 🔹 Helper: random nearby points
  const generateRandomPoints = (center, radiusKm, count) => {
    const points = [];
    const radiusInDegrees = radiusKm / 111.1;
    for (let i = 0; i < count; i++) {
      const latOffset = (Math.random() * 2 - 1) * radiusInDegrees;
      const lngOffset = (Math.random() * 2 - 1) * radiusInDegrees;
      points.push([center[0] + latOffset, center[1] + lngOffset]);
    }
    return points;
  };

  // 🔹 Get user location once
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setLat(latitude.toFixed(4));
          setLon(longitude.toFixed(4));
          fetchAqi(latitude, longitude);
          renderHeatmap(latitude, longitude);
        },
        () => {
          // fallback Delhi
          fetchAqi(28.6139, 77.209);
          renderHeatmap(28.6139, 77.209);
        }
      );
    }
  }, []);

  const handleFetch = () => {
    if (lat && lon) {
      fetchAqi(lat, lon);
      renderHeatmap(parseFloat(lat), parseFloat(lon));
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Inputs */}
      <motion.div
        className="p-6 bg-white/10 rounded-lg shadow-lg"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <h2 className="text-xl font-bold mb-4">🌍 Check Another Location</h2>
        <div className="flex gap-4 mb-4">
          <input
            type="number"
            placeholder="Latitude"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            className="px-3 py-2 rounded text-black"
          />
          <input
            type="number"
            placeholder="Longitude"
            value={lon}
            onChange={(e) => setLon(e.target.value)}
            className="px-3 py-2 rounded text-black"
          />
          <button
            onClick={handleFetch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Fetch AQI + Heatmap
          </button>
        </div>
      </motion.div>

      {/* AQI Card */}
      <motion.div
        className={`p-6 rounded-lg shadow-lg ${getAqiColor(aqi?.aqius)}`}
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <h2 className="text-xl font-bold mb-2">🌍 Live Air Quality Index</h2>
        {aqi ? (
          <>
            {city && <p className="text-lg font-semibold mb-2">📍 {city}</p>}
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

      {/* Heatmap */}
      <motion.div
        className="rounded-lg shadow-lg overflow-hidden h-[500px]"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div id="map" className="w-full h-full" />
      </motion.div>

      {/* Validation */}
      {validation && (
        <motion.div
          className="p-6 mt-6 bg-green-900/40 rounded-lg shadow-lg"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h2 className="text-xl font-bold mb-4">🩺 Validation Results</h2>
          <img
            src={validation.image}
            alt="Validation"
            className="rounded-lg shadow-md mb-4"
          />
          <ul className="list-disc pl-6 space-y-1">
            {validation.precautions.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
}
