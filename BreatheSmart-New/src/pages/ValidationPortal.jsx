// src/pages/ValidationPortal.jsx
import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Camera } from "lucide-react";
import axios from "axios";

const API_BASE = `${import.meta.env.VITE_API_BASE}/api/reports`;

export default function ValidationPortal() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [precaution, setPrecaution] = useState({});
  const [actionTaken, setActionTaken] = useState({});
  const [precautionSent, setPrecautionSent] = useState({});
  const [busy, setBusy] = useState({});
  const [isMobile, setIsMobile] = useState(false);
  const [proofFile, setProofFile] = useState({}); // govt proof

  const fileInputRefs = useRef({});

  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await axios.get(API_BASE);
      const visible = res.data;

      const prePrecaution = {};
      const preAction = {};
      const preSent = {};

      visible.forEach((r) => {
        if (r.precautions) {
          prePrecaution[r.id] = r.precautions;
          preSent[r.id] = true; // ✅ mark precautions already sent
        }
        if (r.action_taken) preAction[r.id] = r.action_taken;
      });

      setPrecaution(prePrecaution);
      setActionTaken(preAction);
      setPrecautionSent(preSent);
      setReports(visible);
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const broadcastUpdate = (msg) => {
    try {
      const bc = new BroadcastChannel("reports_channel");
      bc.postMessage(msg);
      bc.close();
    } catch (e) {
      console.warn("BroadcastChannel not supported", e);
    }
  };

  // STEP 1: Precautions only → disappear after send
  const handlePrecautionSend = async (id) => {
    setBusy((prev) => ({ ...prev, [id]: true }));
    try {
      const payload = {
        status: "approved",
        precautions: precaution[id] || "",
      };

      await axios.put(`${API_BASE}/${id}/validate`, payload);

      setPrecautionSent((prev) => ({ ...prev, [id]: true })); // ✅ hide UI

      broadcastUpdate({
        type: "precaution_sent",
        report: { id, precautions: precaution[id] },
      });

      alert("✅ Precautions sent successfully");
    } catch (err) {
      console.error("Error sending precautions:", err);
      alert("❌ Precaution send failed — check backend logs");
    } finally {
      setBusy((prev) => ({ ...prev, [id]: false }));
    }
  };

  // STEP 2: Govt action + proof → remove from UI when finalized
  const handleGovtUpdate = async (id) => {
    setBusy((prev) => ({ ...prev, [id]: true }));
    try {
      const formData = new FormData();
      formData.append("status", "approved");
      formData.append("action_taken", actionTaken[id] || "");
      if (proofFile[id]) {
        formData.append("proof_images", proofFile[id]);
      }

      const res = await axios.put(`${API_BASE}/${id}/validate`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.report?.status === "finalized") {
        setReports((prev) => prev.filter((r) => r.id !== id)); // ✅ full card vanishes
      }

      broadcastUpdate({ type: "govt_updated", report: res.data.report });

      alert("✅ Government update submitted successfully");
    } catch (err) {
      console.error("Error updating govt action:", err);
      alert("❌ Govt update failed — check backend logs");
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
            📥 Reports Needing Validation
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
                  {/* Report image */}
                  <img
                    src={report.image_url}
                    alt="Report"
                    className="w-full h-48 object-cover rounded mb-3 border border-gray-200"
                  />

                  {/* Report description + location */}
                  <p className="mb-2">
                    <span className="font-semibold text-blue-800">
                      Description:
                    </span>{" "}
                    {report.description || "No description"}
                  </p>
                  <p className="text-sm text-gray-600 mb-3">
                    📍 Location: Lat {report.lat}, Lng {report.lng}
                  </p>

                  {/* Precautions input + Send (disappears after sent) */}
                  {!precautionSent[report.id] && (
                    <div className="mb-3">
                      <label className="text-sm text-gray-700">
                        Precautions:
                      </label>
                      <input
                        type="text"
                        placeholder="Precautions..."
                        value={precaution[report.id] ?? ""}
                        onChange={(e) =>
                          setPrecaution((prev) => ({
                            ...prev,
                            [report.id]: e.target.value,
                          }))
                        }
                        className="w-full p-2 rounded mb-2 border border-blue-300 focus:ring focus:ring-blue-200"
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={busy[report.id]}
                        onClick={() => handlePrecautionSend(report.id)}
                        className="px-4 py-2 rounded text-white bg-green-600 hover:bg-green-500"
                      >
                        {busy[report.id]
                          ? "Processing..."
                          : "Send Precautions"}
                      </motion.button>
                    </div>
                  )}

                  {/* Govt action input */}
                  <div className="mb-3">
                    <label className="text-sm text-gray-700">
                      Government Action:
                    </label>
                    <input
                      type="text"
                      placeholder="Government action taken..."
                      value={actionTaken[report.id] ?? ""}
                      onChange={(e) =>
                        setActionTaken((prev) => ({
                          ...prev,
                          [report.id]: e.target.value,
                        }))
                      }
                      className="w-full p-2 rounded mb-2 border border-blue-300 focus:ring focus:ring-blue-200"
                    />
                  </div>

                  {/* Camera / File Upload */}
                  <div className="mb-3 flex gap-3 items-center">
                    <input
                      type="file"
                      accept="image/*"
                      capture={isMobile ? "environment" : undefined}
                      ref={(el) => (fileInputRefs.current[report.id] = el)}
                      onChange={(e) =>
                        setProofFile((prev) => ({
                          ...prev,
                          [report.id]: e.target.files[0],
                        }))
                      }
                      className="w-full p-2 border border-blue-300 rounded"
                    />
                    {!isMobile && (
                      <button
                        onClick={() =>
                          fileInputRefs.current[report.id]?.click()
                        }
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500"
                      >
                        <Camera size={18} /> Open Camera
                      </button>
                    )}
                  </div>

                  {/* Final Govt Update */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={busy[report.id]}
                    onClick={() => handleGovtUpdate(report.id)}
                    className="px-4 py-2 rounded text-white bg-blue-600 hover:bg-blue-500 mb-3"
                  >
                    {busy[report.id]
                      ? "Processing..."
                      : "Finalize & Approve"}
                  </motion.button>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
