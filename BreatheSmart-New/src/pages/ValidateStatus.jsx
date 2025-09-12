import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// ✅ Use .env for backend URL
const API_BASE = `${import.meta.env.VITE_API_BASE}/api/reports`;

const GovtValidateStatus = () => {
  const [approvedReports, setApprovedReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // ✅ Fetch approved reports
  const fetchApproved = async () => {
    try {
      const res = await axios.get(`${API_BASE}/approved`);
      setApprovedReports(Array.isArray(res.data) ? res.data : []);
      setError(null);
    } catch (err) {
      console.error("❌ Failed to fetch approved reports:", err);
      setError("Failed to fetch reports. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApproved();

    // ✅ Live update listener from Validator portal
    try {
      const bc = new BroadcastChannel("reports_channel");
      bc.onmessage = (event) => {
        const { type, report } = event.data || {};
        if (type === "approved" && report) {
          setApprovedReports((prev) => [report, ...prev]);
        } else if (type === "rejected" && report) {
          setApprovedReports((prev) =>
            prev.filter((r) => r.id !== report.id)
          );
        }
      };
      return () => bc.close();
    } catch (e) {
      console.warn("BroadcastChannel not supported", e);
    }
  }, []);

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

        {/* ✅ Validate button */}
        <button
          onClick={() => navigate("/validation")}
          className="px-5 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-md transition"
        >
          Validate Reports
        </button>
      </div>

      {approvedReports.length === 0 ? (
        <p className="text-gray-500">No approved reports available yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {approvedReports.map((report) => (
            <div
              key={report.id}
              className="bg-white border border-blue-100 p-4 rounded-xl shadow-sm hover:shadow-md transition"
            >
              {report.image_url && (
                <img
                  src={report.image_url}
                  alt="report"
                  className="w-full h-48 object-cover rounded-lg mb-3"
                />
              )}

              <p className="font-semibold text-blue-600">
                📍 Location: {report.lat}, {report.lng}
              </p>
              <p className="text-gray-700 mb-2">
                📝 {report.description || "No description provided"}
              </p>

              <p className="text-yellow-600">
                <b>⚠️ Precautions:</b>{" "}
                {report.precautions ||
                  (report.details && report.details.precautions) ||
                  "—"}
              </p>

              <p className="text-green-600">
                <b>✅ Govt Action:</b>{" "}
                {report.action_taken ||
                  (report.details &&
                    (report.details.govt_action ||
                      report.details.action_taken)) ||
                  "—"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GovtValidateStatus;
