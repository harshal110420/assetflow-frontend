import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { getMe } from "../../store/slices/authSlice";
import { fetchMyPermissions } from "../../store/slices/permissionSlice";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function Layout() {
  const dispatch = useDispatch();
  const { sidebarOpen } = useSelector((s) => s.ui);
  const { user, token } = useSelector((s) => s.auth);
  const { permissionsLoaded } = useSelector((s) => s.permissions);

  useEffect(() => {
    if (token && !user) {
      dispatch(getMe());
    }
    if (token && user && !permissionsLoaded) {
      dispatch(fetchMyPermissions());
    }
  }, [token, user, permissionsLoaded, dispatch]);

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
          overflow: "hidden",
        }}
      >
        <Header />

        <main
          style={{
            flex: 1,
            padding: "24px",
            overflowY: "auto",
            overflowX: "auto",
            width: "100%",
            minWidth: 0,
            maxWidth: "100%",
            boxSizing: "border-box",
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
