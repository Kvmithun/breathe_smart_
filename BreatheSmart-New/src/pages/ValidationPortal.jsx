import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";

// ✅ Use .env for backend URL
const API_BASE = `${import.meta.env.VITE_API_BASE}/api/reports`;

export default function ValidationPortal() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [precaution, setPrecaution] = useState({});
  const [actionTaken, setActionTaken] = useState({});
  const [busy, setBusy] = useState({});

  const fetchReports = async () => {
    try {
      const res = await axios.get(API_BASE);
      const verified = res.data.filter((r) => r.status === "verified");
      setReports(verified);
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const broadcastUpdate = (msg) => {
    try {
      const bc = new BroadcastChannel("reports_channel");
      bc.postMessage(msg);
      bc.close();
    } catch (e) {
      console.warn("BroadcastChannel not supported", e);
    }
  };

  const handleApprove = async (id) => {
    setBusy((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await axios.put(`${API_BASE}/${id}/validate`, {
        status: "approved",
        precautions: precaution[id] || "",
        action_taken: actionTaken[id] || "",
      });

      setReports((prev) => prev.filter((r) => r.id !== id));
      broadcastUpdate({ type: "approved", report: res.data.report });
    } catch (err) {
      console.error("Error approving report:", err);
      alert("Approve failed — check backend logs");
    } finally {
      setBusy((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleReject = async (id) => {
    setBusy((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await axios.put(`${API_BASE}/${id}/validate`, {
        status: "rejected",
      });

      setReports((prev) => prev.filter((r) => r.id !== id));
      broadcastUpdate({ type: "rejected", report: res.data.report });
    } catch (err) {
      console.error("Error rejecting report:", err);
      alert("Reject failed — check backend logs");
    } finally {
      setBusy((prev) => ({ ...prev, [id]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-blue-700">
        Loading reports...
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen w-screen bg-gradient-to-br from-blue-50 to-blue-100 text-gray-900"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <div className="p-6 w-full max-w-6xl mx-auto">
        <motion.h1
          className="text-3xl font-bold mb-6 text-blue-800"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          Validator Dashboard
        </motion.h1>

        <motion.div
          className="bg-white shadow-lg p-6 rounded-lg mb-6 border border-blue-200"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <h2 className="text-xl font-semibold mb-3 text-blue-700">
            📥 Verified Reports
          </h2>

          {reports.length === 0 ? (
            <p className="text-gray-600">No reports to validate ✅</p>
          ) : (
            <ul className="space-y-4">
              {reports.map((report, idx) => (
                <motion.li
                  key={report.id}
                  className="bg-blue-50 p-4 rounded-lg shadow hover:shadow-md transition border border-blue-200"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 * idx }}
                >
                  <img
                    src={report.image_url}
                    alt="Report"
                    className="w-full h-48 object-cover rounded mb-3 border border-gray-200"
                  />

                  <p className="mb-2">
                    <span className="font-semibold text-blue-800">
                      Description:
                    </span>{" "}
                    {report.description || "No description"}
                  </p>
                  <p className="text-sm text-gray-600 mb-3">
                    📍 Location: Lat {report.lat}, Lng {report.lng}
                  </p>

                  <input
                    type="text"
                    placeholder="Precautions..."
                    value={precaution[report.id] ?? report.precautions ?? ""}
                    onChange={(e) =>
                      setPrecaution((prev) => ({
                        ...prev,
                        [report.id]: e.target.value,
                      }))
                    }
                    className="w-full p-2 rounded mb-2 border border-blue-300 focus:ring focus:ring-blue-200"
                  />
                  <input
                    type="text"
                    placeholder="Government action taken..."
                    value={actionTaken[report.id] ?? report.action_taken ?? ""}
                    onChange={(e) =>
                      setActionTaken((prev) => ({
                        ...prev,
                        [report.id]: e.target.value,
                      }))
                    }
                    className="w-full p-2 rounded mb-3 border border-blue-300 focus:ring focus:ring-blue-200"
                  />

                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={busy[report.id]}
                      onClick={() => handleApprove(report.id)}
                      className={`px-4 py-2 rounded text-white ${
                        busy[report.id]
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-500"
                      }`}
                    >
                      {busy[report.id] ? "Processing..." : "Approve"}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={busy[report.id]}
                      onClick={() => handleReject(report.id)}
                      className={`px-4 py-2 rounded text-white ${
                        busy[report.id]
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-red-600 hover:bg-red-500"
                      }`}
                    >
                      {busy[report.id] ? "Processing..." : "Reject"}
                    </motion.button>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
