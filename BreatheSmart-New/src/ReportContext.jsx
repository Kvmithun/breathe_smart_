// src/context/ReportsContext.js
import React, { createContext, useState } from "react";

export const ReportsContext = createContext();

export const ReportsProvider = ({ children }) => {
  const [reports, setReports] = useState([]);

  const addReport = (report) => {
    setReports((prev) => [report, ...prev]);
  };

  const updateReportStatus = (id, status) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
  };

  return (
    <ReportsContext.Provider value={{ reports, addReport, updateReportStatus }}>
      {children}
    </ReportsContext.Provider>
  );
};
