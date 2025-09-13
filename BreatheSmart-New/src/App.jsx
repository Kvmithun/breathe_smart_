import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import RewardsPage from "./pages/Rewards";
import RewardsPortal from "./pages/RewardsPortal";
import Home from "./pages/Home";
import SignInCitizen from "./pages/SignInCitizen";
import SignUpCitizen from "./pages/SignUpCitizen";
import SignInGovernment from "./pages/SignInGovernment";
import CitizenPortal from "./pages/CitizenPortal";
import DataDashboard from "./pages/DataDashboard";
import ValidationPortal from "./pages/ValidationPortal";
import ProtectedRoute from "./pages/ProtectedRoute";

export default function App() {
  const location = useLocation();

  const hideNavbarOn = ["/", "/signin-citizen", "/signup", "/signin-government"];
  const shouldHideNavbar = hideNavbarOn.includes(location.pathname);

  return (
    <>
      {!shouldHideNavbar && <Navbar />}
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/signin-citizen" element={<SignInCitizen />} />
        <Route path="/signup" element={<SignUpCitizen />} />
        <Route path="/signin-government" element={<SignInGovernment />} />

        {/* Citizen-only */}
        <Route
          path="/citizen"
          element={
            <ProtectedRoute allowedRoles={["citizen"]}>
              <CitizenPortal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rewards"
          element={
            <ProtectedRoute allowedRoles={["citizen"]}>
              <RewardsPage />
            </ProtectedRoute>
          }
        />

        {/* Government-only */}
        <Route
          path="/government"
          element={
            <ProtectedRoute allowedRoles={["government"]}>
              <DataDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/validation"
          element={
            <ProtectedRoute allowedRoles={["government"]}>
              <ValidationPortal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rewards-portal"
          element={
            <ProtectedRoute allowedRoles={["government"]}>
              <RewardsPortal />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}
