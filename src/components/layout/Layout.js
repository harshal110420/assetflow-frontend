import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { getMe } from "../../store/slices/authSlice";
import { fetchMyPermissions } from "../../store/slices/permissionSlice";
import Sidebar from "./Sidebar";
import Header from "./Header";

// Routes jinpe full-height form page hoga (no main scroll, no padding on content)
const FORM_ROUTES = [
  "/vendors/new",
  "/vendors/", // edit routes like /vendors/5/edit
  "/brands/new",
  "/brands/",
  "/menus/new",
  "/menus/",
  "/users/new",
  "/users/",
  "/roles/new",
  "/roles/",
  "/menus/new",
  "/menus/",
  "/assets/new",
  "/assets/",
  "/maintenance/new",
  "/maintenance/",
  "/amc/new",
  "/amc/",
  "/employees/new",
  "/employees/",
  // aur pages add karte jao yahan
];

function isFormRoute(pathname) {
  return FORM_ROUTES.some(
    (r) => pathname.includes(r) && pathname !== r.replace("/new", ""),
  );
}

export default function Layout() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { sidebarOpen } = useSelector((s) => s.ui);
  const { user, token } = useSelector((s) => s.auth);
  const { permissionsLoaded } = useSelector((s) => s.permissions);

  useEffect(() => {
    if (token && !user) dispatch(getMe());
    if (token && user && !permissionsLoaded) dispatch(fetchMyPermissions());
  }, [token, user, permissionsLoaded, dispatch]);

  const formPage = isFormRoute(location.pathname);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--bg-primary)",
      }}
    >
      <Sidebar />

      <div
        style={{
          flex: 1,
          marginLeft: sidebarOpen ? "var(--sidebar-width)" : "70px",
          transition: "margin-left 0.3s ease",
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          minWidth: 0,
        }}
      >
        <Header />

        <main
          style={{
            flex: 1,
            // Form pages: no padding, no scroll (FormPageLayout khud handle karta hai)
            // Normal pages: original padding + scroll
            padding: formPage ? "0" : "24px",
            overflowY: formPage ? "hidden" : "auto",
            overflowX: "auto",
            display: "flex",
            flexDirection: "column",
            width: "100%",
            minWidth: 0,
            maxWidth: "100%",
            boxSizing: "border-box",
            minHeight: 0,
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
