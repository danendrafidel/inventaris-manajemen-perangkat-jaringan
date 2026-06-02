import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import InventoryDashboard from "./pages/InventoryDashboard";
import UserManagement from "./pages/UserManagement";
import Profile from "./pages/Profile";
import MappingArea from "./pages/MappingArea";
import MappingSto from "./pages/MappingSto";
import MappingOffice from "./pages/MappingOffice";
import FormPMR from "./pages/FormPMR";
import LaporanPMR from "./pages/LaporanPMR";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DeviceScanPage from "./pages/DeviceScanPage";
import PrintBarcode from "./pages/PrintBarcode";
import FuelSettings from "./pages/FuelSettings";
import FuelRecap from "./pages/FuelRecap";
import { getStoredUser } from "./services/authService";

function ProtectedRoute({ children, allowedRoles = [] }) {
  const user = getStoredUser();
  if (!user) {
    return <Navigate to="/" replace />;
  }
  const userRole = user.role?.toLowerCase();
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/scan/:serialNumber" element={<DeviceScanPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pmr"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <FormPMR />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pmr/laporan"
          element={
            <ProtectedRoute>
              <LaporanPMR />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <InventoryDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/print"
          element={
            <ProtectedRoute
              allowedRoles={["admin", "super officer", "officer", "root"]}
            >
              <PrintBarcode />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute
              allowedRoles={["admin", "super officer", "officer", "root"]}
            >
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mapping/area"
          element={
            <ProtectedRoute
              allowedRoles={["admin", "super officer", "officer", "root"]}
            >
              <MappingArea />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mapping/sto"
          element={
            <ProtectedRoute
              allowedRoles={["admin", "super officer", "officer", "root"]}
            >
              <MappingSto />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mapping/office"
          element={
            <ProtectedRoute
              allowedRoles={["admin", "super officer", "officer", "root"]}
            >
              <MappingOffice />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/fuel"
          element={
            <ProtectedRoute allowedRoles={["super officer", "root"]}>
              <FuelSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fuel/recap"
          element={
            <ProtectedRoute
              allowedRoles={["super officer", "officer", "admin", "root"]}
            >
              <FuelRecap />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
