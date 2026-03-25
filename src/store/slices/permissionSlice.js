import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

// ── ASYNC THUNKS ──────────────────────────────────────────────────────────────

// Login ke baad — my permissions fetch karo
export const fetchMyPermissions = createAsyncThunk(
  "permissions/fetchMy",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/permissions/my");
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  },
);

// 🔑 icon — user ki permissions fetch karo (pre-fill ke liye)
export const fetchUserPermissions = createAsyncThunk(
  "permissions/fetchUser",
  async (userId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/permissions/user/${userId}`);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  },
);

// Save user permissions
export const saveUserPermissions = createAsyncThunk(
  "permissions/saveUser",
  async ({ userId, permissions }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/permissions/user/${userId}`, {
        permissions,
      });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  },
);

// Reset user permissions (role pe wapas)
export const resetUserPermissions = createAsyncThunk(
  "permissions/resetUser",
  async (userId, { rejectWithValue }) => {
    try {
      const { data } = await api.delete(`/permissions/user/${userId}/reset`);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  },
);

// Roles fetch
export const fetchRoles = createAsyncThunk(
  "permissions/fetchRoles",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/roles");
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  },
);

// Locations fetch
export const fetchLocations = createAsyncThunk(
  "permissions/fetchLocations",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/locations");
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  },
);

// ── SLICE ─────────────────────────────────────────────────────────────────────
const permissionSlice = createSlice({
  name: "permissions",
  initialState: {
    // My permissions — sidebar/buttons ke liye
    myPermissions: {},
    isAdmin: false,
    permissionsLoaded: false,

    // User permission modal ke liye
    editingUser: null,
    editingPermissions: [],
    permissionSource: "role",

    // Masters
    roles: [],
    locations: [],

    isLoading: false,
    error: null,
  },
  reducers: {
    clearEditingUser: (state) => {
      state.editingUser = null;
      state.editingPermissions = [];
    },
    // Local permission toggle (save se pehle)
    togglePermission: (state, { payload }) => {
      const { menuId, action, value } = payload;
      const perm = state.editingPermissions.find((p) => p.menuId === menuId);
      if (perm) {
        perm.actions = { ...perm.actions, [action]: value };
        // Agar view off kiya to sab off kar do
        if (action === "view" && !value) {
          Object.keys(perm.actions).forEach((a) => {
            perm.actions[a] = false;
          });
        }
        // Agar koi bhi action on kiya to view on karo
        if (action !== "view" && value) {
          perm.actions.view = true;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyPermissions.fulfilled, (state, { payload }) => {
        state.myPermissions = payload.data;
        state.isAdmin = payload.isAdmin;
        state.permissionsLoaded = true;
      })
      .addCase(fetchUserPermissions.fulfilled, (state, { payload }) => {
        state.editingUser = payload.user;
        state.editingPermissions = payload.permissions;
        state.permissionSource = payload.source;
        state.isLoading = false;
      })
      .addCase(fetchUserPermissions.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchRoles.fulfilled, (state, { payload }) => {
        state.roles = payload;
      })
      .addCase(fetchLocations.fulfilled, (state, { payload }) => {
        state.locations = payload;
      });
  },
});

// ── HELPER HOOKS ──────────────────────────────────────────────────────────────
// Component mein use karo: const canCreate = useHasPermission('asset_master', 'new')
export const selectHasPermission = (state, menuSlug, action) => {
  if (state.permissions.isAdmin) return true;
  const menu = state.permissions.myPermissions[menuSlug];
  if (!menu) return false;
  return menu.actions[action] === true;
};

export const selectCanView = (menuSlug) => (state) =>
  selectHasPermission(state, menuSlug, "view");

export const { clearEditingUser, togglePermission } = permissionSlice.actions;
export default permissionSlice.reducer;
