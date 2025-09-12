import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRole }) {
  const role = localStorage.getItem("role"); // "citizen" or "government"

  if (!role) {
    // not logged in
    return <Navigate to="/" replace />;
  }

  if (role !== allowedRole) {
    // logged in, but wrong role
    return <Navigate to="/" replace />;
  }

  return children;
}
