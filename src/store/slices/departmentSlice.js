import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

// ── ASYNC THUNKS ──────────────────────────────────────────────────────────────

export const fetchDepartments = createAsyncThunk(
  "departments/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      // params mein divisionId pass kar sakte ho filter ke liye
      const { data } = await api.get("/departments", { params });
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  },
);

export const createDepartment = createAsyncThunk(
  "departments/create",
  async (departmentData, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/departments", departmentData);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  },
);

export const updateDepartment = createAsyncThunk(
  "departments/update",
  async ({ id, ...departmentData }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/departments/${id}`, departmentData);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  },
);

export const deleteDepartment = createAsyncThunk(
  "departments/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/departments/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  },
);

// ── SLICE ─────────────────────────────────────────────────────────────────────

const departmentSlice = createSlice({
  name: "departments",
  initialState: {
    departments: [],
    isLoading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDepartments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDepartments.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.departments = payload;
      })
      .addCase(fetchDepartments.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      })
      .addCase(createDepartment.fulfilled, (state, { payload }) => {
        state.departments.unshift(payload);
      })
      .addCase(updateDepartment.fulfilled, (state, { payload }) => {
        const i = state.departments.findIndex((d) => d.id === payload.id);
        if (i !== -1) state.departments[i] = payload;
      })
      .addCase(deleteDepartment.fulfilled, (state, { payload }) => {
        state.departments = state.departments.filter((d) => d.id !== payload);
      });
  },
});

export const { clearError } = departmentSlice.actions;
export default departmentSlice.reducer;
