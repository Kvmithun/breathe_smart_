import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;
const WAQI_BASE = `${API_BASE}/api/aqi`;

const categoryColors = {
  Good: "bg-green-600 text-white",
  Moderate: "bg-yellow-500 text-black",
  "Unhealthy for Sensitive Groups": "bg-orange-500 text-white",
  Unhealthy: "bg-red-600 text-white",
  "Very Unhealthy": "bg-purple-700 text-white",
  Hazardous: "bg-rose-900 text-white",
};

const getAQISuggestion = (aqi) => {
  if (aqi == null) return "No AQI data available.";
  if (aqi <= 50) return "✅ Air quality is good. Enjoy your day outside!";
  if (aqi <= 100) return "🙂 Moderate. Sensitive groups should take care.";
  if (aqi <= 150) return "⚠️ Unhealthy for sensitive groups. Limit exertion.";
  if (aqi <= 200) return "🚨 Unhealthy. Wear a mask outdoors.";
  if (aqi <= 300) return "☠️ Very unhealthy. Stay indoors.";
  return "💀 Hazardous. Strictly avoid going outside.";
};

export default function CitizenAQI() {
  const [aqiData, setAqiData] = useState(null);
  const [clinicalData, setClinicalData] = useState(null);
  const [showMedical, setShowMedical] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationDenied, setLocationDenied] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        () => setLocationDenied(true)
      );
    } else {
      setLocationDenied(true);
    }
  }, []);

  const fetchAQI = async () => {
    try {
      if (!userLocation) return;
      const [lat, lon] = userLocation;
      const res = await axios.get(`${WAQI_BASE}/`, { params: { lat, lon } });

      setAqiData({
        city: res.data.city,
        aqi: res.data.current?.aqius ?? null,
        dominant_pollutant: res.data.current?.dominant_pollutant ?? "N/A",
      });

      setClinicalData(res.data.clinical);
    } catch (e) {
      console.error("Error fetching AQI", e);
    }
  };

  useEffect(() => {
    if (userLocation) fetchAQI();
  }, [userLocation]);

  const downloadPDF = async () => {
    if (!clinicalData) return;
    try {
      const res = await axios.post(`${WAQI_BASE}/pdf`, clinicalData, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "aqi_fact_sheet.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error("PDF download failed", e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-sky-200 via-white to-emerald-200 px-6 py-10 flex justify-center">
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl p-8">
        {/* Title */}
        <h1 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent">
          🌍 Citizen Air Quality Dashboard
        </h1>

        {locationDenied && (
          <div className="flex justify-center mb-6">
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-md hover:opacity-90 transition"
            >
              🚨 Location Off – Click to Enable
            </button>
          </div>
        )}

        {aqiData && (
          <div className="bg-gradient-to-r from-emerald-50 to-sky-50 p-6 rounded-xl shadow mb-6 text-slate-800">
            <h2 className="text-xl font-bold mb-2">Current AQI</h2>
            <p>
              <strong>City:</strong> {aqiData.city}
            </p>
            <p>
              <strong>AQI:</strong> {aqiData.aqi}
            </p>
            <p>
              <strong>Dominant Pollutant:</strong> {aqiData.dominant_pollutant}
            </p>
            <p className="mt-3 italic text-slate-700">
              {getAQISuggestion(aqiData.aqi)}
            </p>
          </div>
        )}

        {clinicalData && (
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-4 text-slate-800">
              🩺 Clinical Guidance
            </h2>
            <div className="mb-4 p-4 rounded-lg bg-slate-100 shadow text-slate-800">
              <h3 className="text-lg font-semibold">
                Overall:{" "}
                <span
                  className={`px-2 py-1 rounded ${categoryColors[clinicalData.summary?.overall_category] || "bg-gray-700 text-white"}`}
                >
                  {clinicalData.summary?.overall_category || "Unknown"}
                </span>
              </h3>
              <p className="mt-1 text-sm">
                Highest risk pollutant:{" "}
                <strong>
                  {clinicalData.summary?.highest_risk_pollutant || "N/A"}
                </strong>
              </p>
            </div>

            <button
              onClick={() => setShowMedical(!showMedical)}
              className="mt-2 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:opacity-90 transition"
            >
              {showMedical ? "Hide Summary" : "Show Summary"}
            </button>

            {showMedical && (
              <div className="mt-4 bg-slate-900 p-6 rounded-xl shadow text-white text-sm">
                <h3 className="font-semibold text-lg mb-2 text-emerald-300">
                  🚑 Who Should Seek Medical Care
                </h3>
                <ul className="list-disc list-inside text-red-300">
                  {clinicalData.summary?.who_should_seek_care?.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>

                <h3 className="font-semibold text-lg mt-4 mb-2 text-emerald-300">
                  🏡 Household Measures
                </h3>
                <ul className="list-disc list-inside text-emerald-200">
                  {clinicalData.summary?.household_measures?.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>

                <h3 className="font-semibold text-lg mt-4 mb-2 text-emerald-300">
                  👥 Vulnerable Groups
                </h3>
                <ul className="list-disc list-inside text-yellow-200">
                  {clinicalData.summary?.vulnerable_groups?.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={downloadPDF}
              className="mt-6 bg-green-600 px-4 py-2 rounded-lg shadow text-white hover:opacity-90 transition"
            >
              📄 Download PDF Fact Sheet
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
3