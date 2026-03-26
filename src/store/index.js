import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import assetReducer from "./slices/assetSlice";
import maintenanceReducer from "./slices/maintenanceSlice";
import userReducer from "./slices/userSlice";
import uiReducer from "./slices/uiSlice";
import approvalReducer from "./slices/approvalSlice";
import permissionReducer from "./slices/permissionSlice";
import employeeReducer from "./slices/employeeSlice"; // ✅ naya
import divisionReducer from "./slices/divisionSlice"; // ✅ naya
import departmentReducer from "./slices/departmentSlice"; // ✅ naya
import categoriesReducer from "./slices/categroySlice";
import auditLogReducer from "./slices/auditLogSlice";
import amcReducer from "./slices/amcSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    assets: assetReducer,
    maintenance: maintenanceReducer,
    users: userReducer,
    ui: uiReducer,
    approvals: approvalReducer,
    permissions: permissionReducer,
    employees: employeeReducer, // ✅ naya
    divisions: divisionReducer, // ✅ naya
    departments: departmentReducer, // ✅ naya
    categories: categoriesReducer,
    auditLog: auditLogReducer,
    amc: amcReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: { ignoredActions: ["auth/loginSuccess"] },
    }),
});

export default store;
