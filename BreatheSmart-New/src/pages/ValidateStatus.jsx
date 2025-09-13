// src/pages/GovtValidateStatus.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = `${import.meta.env.VITE_API_BASE}/api/reports`;
const API_ROOT = import.meta.env.VITE_API_BASE; // ✅ root URL, not reports

export default function GovtValidateStatus() {
  const [approvedReports, setApprovedReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState({});
  const [precautionMap, setPrecautionMap] = useState({});
  const [actionMap, setActionMap] = useState({});
  const [proofFiles, setProofFiles] = useState({});

  const navigate = useNavigate();

  const fetchApproved = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/approved`);
      const data = Array.isArray(res.data) ? res.data : [];
      setApprovedReports(data);

      const prec = {};
      const act = {};
      data.forEach((r) => {
        prec[r.id] = r.precautions ?? r.details?.precautions ?? "";
        act[r.id] =
          r.govt_action ??
          r.action_taken ??
          r.details?.govt_action ??
          r.details?.action_taken ??
          "";
      });
      setPrecautionMap(prec);
      setActionMap(act);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch approved reports:", err);
      setError("Failed to fetch reports. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApproved();
  }, []);

  const handleSendPrecautions = async (reportId) => {
    setBusy((b) => ({ ...b, [reportId]: true }));
    try {
      const payload = {
        status: "approved",
        precautions: precautionMap[reportId] ?? "",
      };
      const res = await axios.put(`${API_BASE}/${reportId}/validate`, payload, {
        headers: { "Content-Type": "application/json" },
      });
      const updated = res.data?.report;
      if (updated) {
        setApprovedReports((prev) =>
          prev.map((r) => (r.id === updated.id ? updated : r))
        );
        setPrecautionMap((p) => ({
          ...p,
          [reportId]: updated.precautions ?? "",
        }));
      }
      alert("✅ Precautions saved and locked");
    } catch (err) {
      console.error("Failed to save precautions:", err);
      alert("❌ Failed to save precautions");
    } finally {
      setBusy((b) => ({ ...b, [reportId]: false }));
    }
  };

  const handleUpdateGovt = async (reportId) => {
    setBusy((b) => ({ ...b, [reportId]: true }));
    try {
      const formData = new FormData();
      formData.append("status", "approved");
      formData.append("action_taken", actionMap[reportId] ?? "");
      formData.append("precautions", precautionMap[reportId] ?? "");

      if (proofFiles[reportId]) {
        [...proofFiles[reportId]].forEach((file) => {
          formData.append("proof_images", file);
        });
      }

      const res = await axios.put(
        `${API_BASE}/${reportId}/validate`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const updated = res.data?.report;
      if (updated) {
        setApprovedReports((prev) =>
          prev.map((r) => (r.id === updated.id ? updated : r))
        );
        setProofFiles((f) => ({ ...f, [reportId]: null }));
      }
      alert("✅ Govt action & proofs updated");
    } catch (err) {
      console.error("Failed to update govt action:", err);
      alert("❌ Govt update failed");
    } finally {
      setBusy((b) => ({ ...b, [reportId]: false }));
    }
  };

  const updatePrecautionLocal = (id, value) =>
    setPrecautionMap((p) => ({ ...p, [id]: value }));
  const updateActionLocal = (id, value) =>
    setActionMap((a) => ({ ...a, [id]: value }));
  const handleProofSelect = (id, files) =>
    setProofFiles((f) => ({ ...f, [id]: files }));

  // ✅ Fixed: build proof URLs from verified folder
  const getProofUrls = (report) => {
    if (!report) return [];
    if (report.govt_proofs && report.govt_proofs.length > 0) return report.govt_proofs;
    const rels = report.details?.govt_proofs || [];
    if (!rels || rels.length === 0) return [];
    return rels.map((fn) => `${API_ROOT}/uploads/verified/${fn}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-blue-600">
        Loading approved reports...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-white to-blue-50 text-gray-800">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-blue-700">
          🏛️ Govt Portal – Approved Reports
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/validation")}
            className="px-5 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-md transition"
          >
            Validate Reports
          </button>
          <button
            onClick={fetchApproved}
            className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100"
          >
            Refresh
          </button>
        </div>
      </div>

      {approvedReports.length === 0 ? (
        <p className="text-gray-500">No approved reports available yet.</p>
      ) : (
        <div className="space-y-6">
          {approvedReports.map((report) => {
            const proofUrls = getProofUrls(report);
            return (
              <div
                key={report.id}
                className="bg-white border border-blue-100 p-4 rounded-xl shadow-sm hover:shadow-md transition"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* LEFT side */}
                  <div className="space-y-3">
                    {report.image_url ? (
                      <img
                        src={report.image_url}
                        alt="report"
                        className="w-full h-52 object-cover rounded-md border"
                      />
                    ) : (
                      <div className="w-full h-52 rounded-md bg-gray-50 border flex items-center justify-center text-gray-400">
                        No image
                      </div>
                    )}
                    <p className="font-semibold text-blue-600">
                      📍 {report.lat}, {report.lng}
                    </p>
                    <p className="text-gray-700">
                      📝 {report.description || "No description"}
                    </p>

                    {report.precautions || precautionMap[report.id] ? (
                      <div className="p-2 bg-green-50 border rounded">
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Precautions (saved)
                        </p>
                        <p className="text-gray-800">
                          {precautionMap[report.id]}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Precautions
                        </label>
                        <textarea
                          rows={3}
                          value={precautionMap[report.id] ?? ""}
                          onChange={(e) =>
                            updatePrecautionLocal(report.id, e.target.value)
                          }
                          className="w-full p-2 border rounded-md focus:ring focus:ring-blue-200"
                        />
                        <div className="mt-2">
                          <button
                            onClick={() => handleSendPrecautions(report.id)}
                            disabled={!!busy[report.id]}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-60"
                          >
                            {busy[report.id]
                              ? "Processing..."
                              : "Save Precautions"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* RIGHT side */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Govt Action Taken
                      </label>
                      <textarea
                        rows={4}
                        value={actionMap[report.id] ?? ""}
                        onChange={(e) =>
                          updateActionLocal(report.id, e.target.value)
                        }
                        className="w-full p-2 border rounded-md focus:ring focus:ring-blue-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Upload Govt Proofs
                      </label>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) =>
                          handleProofSelect(report.id, e.target.files)
                        }
                        className="block w-full text-sm text-gray-600"
                      />
                    </div>

                    {proofUrls.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">
                          Proof Images
                        </p>
                        <div className="flex gap-2 overflow-x-auto">
                          {proofUrls.map((url, i) => (
                            <div
                              key={i}
                              className="w-28 h-28 flex-none border rounded overflow-hidden"
                            >
                              <img
                                src={url}
                                alt={`proof-${i}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <button
                        onClick={() => handleUpdateGovt(report.id)}
                        disabled={!!busy[report.id]}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-60"
                      >
                        {busy[report.id] ? "Processing..." : "Update Govt Action"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
