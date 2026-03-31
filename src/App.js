import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";
import store from "./store";
import { useSelector } from "react-redux";
import Layout from "./components/layout/Layout";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import AssetsPage from "./pages/AssetsPage";
import AssetDetailPage from "./pages/AssetDetailPage";
import MaintenancePage from "./pages/MaintenancePage";
import UsersPage from "./pages/UsersPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import ApprovalsPage from "./pages/ApprovalsPage";
import RolesPage from "./pages/RolesPage";
import LocationsPage from "./pages/LocationsPage";
import MenusPage from "./pages/MenusPage";
import ApprovalTemplatesPage from "./pages/ApprovalTemplatesPage";
import ScanPage from "./pages/Scanpage";
import EmployeesPage from "./pages/EmployeesPage";
import DivisionsPage from "./pages/DivisionsPage";
import DepartmentsPage from "./pages/DepartmentsPage";
import EmployeeDetailPage from "./pages/EmployeeDetailsPage";
import CategoryPage from "./pages/CategoryPage";
import AuditLogs from "./pages/AuditLogs";
import BulkImport from "./pages/BulkImport";
import AmcPage from "./pages/AmcPage";
import AmcDetailPage from "./pages/AmcDetailPage";
import VendorPage from "./pages/VendorPage";
import BrandPage from "./pages/BrandPage";
import VendorFormPage from "./pages/VendorFormPage";
import UserFormPage from "./pages/UserFormPage";
import RoleFormPage from "./pages/RoleFormPage";
import MenuFormPage from "./pages/Menuformpage";
import AssetFormPage from "./pages/AssetFormPage";
import MaintenanceFormPage from "./pages/MaintenanceFormPage";
import AmcFormPage from "./pages/AmcFormPage";

// Route guard
const PrivateRoute = ({ children, roles }) => {
  const { token, user } = useSelector((s) => s.auth);

  if (!token) {
    // Current URL save karo before redirecting to login
    sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
    return <Navigate to="/login" replace />;
  }

  if (roles && user && !roles.includes(user.role))
    return <Navigate to="/dashboard" replace />;

  return children;
};

// Admin only route
const AdminRoute = ({ children }) => (
  <PrivateRoute roles={["admin"]}>{children}</PrivateRoute>
);

function AppRoutes() {
  const { token } = useSelector((s) => s.auth);
  return (
    <Routes>
      <Route
        path="/login"
        element={!token ? <LoginPage /> : <Navigate to="/dashboard" replace />}
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="assets" element={<AssetsPage />} />
        <Route path="/assets/new" element={<AssetFormPage />} />
        <Route path="/assets/:id/edit" element={<AssetFormPage />} />
        <Route path="assets/:id" element={<AssetDetailPage />} />
        <Route path="maintenance" element={<MaintenancePage />} />
        <Route path="/maintenance/new" element={<MaintenanceFormPage />} />
        <Route path="/maintenance/:id/edit" element={<MaintenanceFormPage />} />
        <Route path="approvals" element={<ApprovalsPage />} />
        <Route path="roles" element={<RolesPage />} />
        <Route path="/roles/new" element={<RoleFormPage />} />
        <Route path="/roles/:id/edit" element={<RoleFormPage />} />
        <Route path="locations" element={<LocationsPage />} />
        <Route path="menus" element={<MenusPage />} />
        <Route path="/menus/new" element={<MenuFormPage />} />
        <Route path="/menus/:id/edit" element={<MenuFormPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="employees/:id" element={<EmployeeDetailPage />} />
        <Route path="divisions" element={<DivisionsPage />} />
        <Route path="departments" element={<DepartmentsPage />} />
        <Route path="category" element={<CategoryPage />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="bulk-import" element={<BulkImport />} />
        <Route path="amc" element={<AmcPage />} />
        <Route path="amc/:id" element={<AmcDetailPage />} />
        <Route path="amc/new" element={<AmcFormPage />} />
        <Route path="amc/:id/edit" element={<AmcFormPage />} />
        <Route path="vendors" element={<VendorPage />} />
        <Route path="/vendors/new" element={<VendorFormPage />} />
        <Route path="/vendors/:id/edit" element={<VendorFormPage />} />
        <Route path="brands" element={<BrandPage />} />
        <Route
          path="approval-templates"
          element={
            <AdminRoute>
              <ApprovalTemplatesPage />
            </AdminRoute>
          }
        />
        <Route
          path="users"
          element={
            <PrivateRoute roles={["admin", "manager"]}>
              <UsersPage />
            </PrivateRoute>
          }
        />
        <Route path="/users/new" element={<UserFormPage />} />
        <Route path="/users/:id/edit" element={<UserFormPage />} />

        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route
        path="/scan/:assetTag"
        element={
          <PrivateRoute>
            <ScanPage />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#0f2744",
              color: "#e2e8f0",
              border: "1px solid #1e3a5f",
              borderRadius: "10px",
              fontSize: "14px",
            },
            success: {
              iconTheme: { primary: "#00d68f", secondary: "#0f2744" },
            },
            error: { iconTheme: { primary: "#ff4757", secondary: "#0f2744" } },
          }}
        />
      </BrowserRouter>
    </Provider>
  );
}
