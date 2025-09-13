import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function CitizenImageReport() {
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [serverReports, setServerReports] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userCredits, setUserCredits] = useState(0);

  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);

  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const storedUser = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");
  const userName = storedUser?.name || null;

  // 🌍 Location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
        },
        (err) => {
          console.warn("⚠️ Geolocation blocked or failed:", err.message);
        }
      );
    }
  }, []);

  // 📥 Fetch reports + leaderboard
  const fetchReports = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/reports/`);
      setServerReports(res.data);
    } catch (e) {
      console.error("Error fetching reports", e);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/reports/leaderboard`);
      setLeaderboard(res.data);
      if (userName) {
        const me = res.data.find((u) => u.username === userName);
        if (me) setUserCredits(me.green_credits);
      }
    } catch (e) {
      console.error("Error fetching leaderboard", e);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchLeaderboard();
    const interval = setInterval(() => {
      fetchReports();
      fetchLeaderboard();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // 📂 File picker
  const onFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setFilePreview(URL.createObjectURL(f));
  };

  // 📷 Camera handling
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setShowCamera(true);
    } catch (err) {
      alert("🚨 Camera access denied or not available.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);

      canvasRef.current.toBlob((blob) => {
        const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
        setFile(file);
        setFilePreview(URL.createObjectURL(file));
      }, "image/jpeg");
    }
    setShowCamera(false);
    const tracks = videoRef.current?.srcObject?.getTracks();
    tracks?.forEach((t) => t.stop());
  };

  // 🚀 Upload
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("⚠️ Please choose an image.");
    if (!userName || !token)
      return alert("⚠️ Please log in before submitting a report.");
    if (!lat || !lng)
      return alert("⚠️ Location not available. Please enable location access.");

    const fd = new FormData();
    fd.append("image", file);
    fd.append("description", description);
    fd.append("lat", lat);
    fd.append("lng", lng);

    try {
      const res = await axios.post(`${API_BASE}/api/reports/upload`, fd, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
        validateStatus: () => true,
      });

      if (res.status === 201 || res.status === 200) {
        alert(
          `✅ Report submitted.\nStatus: ${res.data.status}\nAQI: ${
            res.data.aqi ?? "N/A"
          }`
        );
      } else {
        alert(`❌ Upload failed: ${res.data?.error || res.status}`);
      }

      await fetchReports();
      await fetchLeaderboard();
      setDescription("");
      setFile(null);
      setFilePreview(null);
    } catch (err) {
      console.error("Upload failed", err);
      alert(`🚨 Upload failed: ${err.message}`);
    }
  };

  return (
    <div className="bg-gradient-to-r from-sky-50 to-emerald-50 p-6 rounded-2xl shadow-xl border border-emerald-100 text-slate-800">
      {/* 🌱 Credits */}
      {userName && (
        <p className="mb-4 font-semibold text-emerald-700">
          🌱 Your Credits:{" "}
          <span className="text-amber-600 font-bold">{userCredits}</span>
        </p>
      )}

      {/* 📝 Report Upload Form */}
      <form
        onSubmit={handleUpload}
        className="mb-6 bg-white p-4 rounded-lg shadow-md"
      >
        <textarea
          placeholder="📝 Describe pollution issue..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-3 mb-3 rounded border border-gray-300 text-slate-800 placeholder-gray-400"
        />

        {/* File picker */}
        <input
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="mb-3 text-sm"
        />

        {/* Camera button */}
        <button
          type="button"
          onClick={openCamera}
          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-semibold mb-3 ml-2"
        >
          📷 Use Camera
        </button>

        {showCamera && (
          <div className="mb-3">
            <video ref={videoRef} className="w-64 rounded border mb-2" />
            <button
              type="button"
              onClick={capturePhoto}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold"
            >
              📸 Capture
            </button>
            <canvas ref={canvasRef} className="hidden"></canvas>
          </div>
        )}

        {filePreview && (
          <img
            src={filePreview}
            alt="preview"
            className="w-48 mb-3 rounded-lg border border-gray-300"
          />
        )}

        <button
          type="submit"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold"
        >
          🚀 Submit Report
        </button>
      </form>

      {/* 📋 Reports */}
      <h2 className="text-2xl font-bold mb-3 text-emerald-800">
        📋 Recent Verified Reports
      </h2>
      {serverReports.length === 0 ? (
        <p className="text-gray-600">No verified reports yet.</p>
      ) : (
        <ul className="space-y-4">
          {serverReports
            .slice()
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 3)
            .map((r) => (
              <li
                key={r.id}
                className="bg-white p-4 rounded-lg shadow-md border border-gray-200"
              >
                <p className="text-slate-700">{r.description}</p>
                {r.image_url && (
                  <img
                    src={r.image_url}
                    alt="report"
                    className="mt-2 rounded-lg w-48 border border-gray-200"
                  />
                )}
                <p className="text-sm text-gray-700 mt-2">
                  ✅ Status:{" "}
                  <span className="text-emerald-700 font-semibold">
                    {r.status}
                  </span>{" "}
                  • AQI:{" "}
                  <span className="text-amber-600 font-bold">{r.aqi}</span> • By:{" "}
                  <span className="text-indigo-600 font-medium">
                    {r.username || "Anonymous"}
                  </span>
                </p>
              </li>
            ))}
        </ul>
      )}

      {/* 🏆 Leaderboard */}
      <h2 className="text-2xl font-bold mt-8 mb-3 text-emerald-800">
        🏆 Green Credits Leaderboard
      </h2>
      {leaderboard.length === 0 ? (
        <p className="text-gray-600">No leaderboard data yet.</p>
      ) : (
        <ol className="bg-white p-4 rounded-lg shadow-md border border-gray-200 space-y-2">
          {leaderboard.slice(0, 3).map((u, idx) => (
            <li
              key={idx}
              className="flex items-center justify-between text-lg"
            >
              <span>
                {idx + 1 === 1 && "🥇 "}
                {idx + 1 === 2 && "🥈 "}
                {idx + 1 === 3 && "🥉 "}
                <span className="text-slate-800 font-semibold">
                  {u.username}
                </span>
              </span>
              <span className="text-emerald-700 font-bold">
                {u.green_credits} pts
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
