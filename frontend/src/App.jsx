import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import InventoryDashboard from './pages/InventoryDashboard'
import UserManagement from './pages/UserManagement'
import Profile from './pages/Profile'
import MappingDivision from './pages/MappingDivision'
import MappingArea from './pages/MappingArea'
import MappingSto from './pages/MappingSto'
import FormPMR from './pages/FormPMR'
import LogPMR from './pages/LogPMR'
import { getStoredUser } from './services/authService'

function ProtectedRoute({ children, allowedRoles = [] }) {
  const user = getStoredUser();
  if (!user) {
    return <Navigate to="/" replace />
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
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
            <ProtectedRoute>
              <FormPMR />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pmr/log"
          element={
            <ProtectedRoute>
              <LogPMR />
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
          path="/users"
          element={
            <ProtectedRoute allowedRoles={['admin', 'officer']}>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mapping/division"
          element={
            <ProtectedRoute allowedRoles={['admin', 'officer']}>
              <MappingDivision />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mapping/area"
          element={
            <ProtectedRoute allowedRoles={['admin', 'officer']}>
              <MappingArea />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mapping/sto"
          element={
            <ProtectedRoute allowedRoles={['admin', 'officer']}>
              <MappingSto />
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
  )
}

export default App
