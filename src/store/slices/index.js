import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

// ─── Maintenance Slice ───────────────────────────────────────────────────────
export const fetchMaintenances = createAsyncThunk(
  "maintenance/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/maintenance", { params });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  },
);

export const createMaintenance = createAsyncThunk(
  "maintenance/create",
  async (maintenanceData, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/maintenance", maintenanceData);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  },
);

export const updateMaintenance = createAsyncThunk(
  "maintenance/update",
  async ({ id, ...maintenanceData }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/maintenance/${id}`, maintenanceData);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  },
);

export const deleteMaintenance = createAsyncThunk(
  "maintenance/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/maintenance/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  },
);

export const maintenanceSlice = createSlice({
  name: "maintenance",
  initialState: {
    maintenances: [],
    isLoading: false,
    error: null,
    pagination: { total: 0, page: 1, limit: 20, pages: 0 },
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMaintenances.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMaintenances.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.maintenances = payload.data;
        state.pagination = payload.pagination;
      })
      .addCase(fetchMaintenances.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      })
      .addCase(createMaintenance.fulfilled, (state, { payload }) => {
        state.maintenances.unshift(payload);
      })
      .addCase(updateMaintenance.fulfilled, (state, { payload }) => {
        const i = state.maintenances.findIndex((m) => m.id === payload.id);
        if (i !== -1) state.maintenances[i] = payload;
      })
      .addCase(deleteMaintenance.fulfilled, (state, { payload }) => {
        state.maintenances = state.maintenances.filter((m) => m.id !== payload);
      });
  },
});

// ─── User Slice ──────────────────────────────────────────────────────────────
export const fetchUsers = createAsyncThunk(
  "users/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/users", { params });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  },
);

export const createUser = createAsyncThunk(
  "users/create",
  async (userData, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/users", userData);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  },
);

export const updateUser = createAsyncThunk(
  "users/update",
  async ({ id, ...userData }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/users/${id}`, userData);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  },
);

export const userSlice = createSlice({
  name: "users",
  initialState: {
    users: [],
    isLoading: false,
    error: null,
    pagination: { total: 0, page: 1, limit: 20, pages: 0 },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUsers.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.users = payload.data;
        state.pagination = payload.pagination;
      })
      .addCase(fetchUsers.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      })
      .addCase(createUser.fulfilled, (state, { payload }) => {
        state.users.unshift(payload);
      })
      .addCase(updateUser.fulfilled, (state, { payload }) => {
        const i = state.users.findIndex((u) => u.id === payload.id);
        if (i !== -1) state.users[i] = payload;
      });
  },
});

// ─── UI Slice ────────────────────────────────────────────────────────────────
export const uiSlice = createSlice({
  name: "ui",
  initialState: {
    sidebarOpen: true,
    theme: "dark",
    activeModal: null,
    modalData: null,
  },
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, { payload }) => {
      state.sidebarOpen = payload;
    },
    openModal: (state, { payload }) => {
      state.activeModal = payload.modal;
      state.modalData = payload.data || null;
    },
    closeModal: (state) => {
      state.activeModal = null;
      state.modalData = null;
    },
    setTheme: (state, { payload }) => {
      state.theme = payload;
    },
  },
});

export const maintenanceReducer = maintenanceSlice.reducer;
export const userReducer = userSlice.reducer;
export const uiReducer = uiSlice.reducer;
export const { openModal, closeModal, toggleSidebar, setSidebarOpen } =
  uiSlice.actions;
export const { clearError: clearMaintenanceError } = maintenanceSlice.actions;
