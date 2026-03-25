import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

// ── ASYNC THUNKS ──────────────────────────────────────────────────────────────

export const fetchEmployees = createAsyncThunk(
  "employees/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/employees", { params });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  },
);

export const fetchEmployee = createAsyncThunk(
  "employees/fetchOne",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/employees/${id}`);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  },
);

export const createEmployee = createAsyncThunk(
  "employees/create",
  async (employeeData, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/employees", employeeData);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  },
);

export const updateEmployee = createAsyncThunk(
  "employees/update",
  async ({ id, ...employeeData }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/employees/${id}`, employeeData);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  },
);

export const deleteEmployee = createAsyncThunk(
  "employees/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/employees/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  },
);

// ── SLICE ─────────────────────────────────────────────────────────────────────

const employeeSlice = createSlice({
  name: "employees",
  initialState: {
    employees: [],
    currentEmployee: null,
    pagination: { total: 0, page: 1, limit: 20, pages: 0 },
    isLoading: false,
    error: null,
    filters: {
      search: "",
      departmentId: "",
      locationId: "",
      employmentType: "",
      isActive: "",
    },
  },
  reducers: {
    setFilters: (state, { payload }) => {
      state.filters = { ...state.filters, ...payload };
    },
    clearFilters: (state) => {
      state.filters = {
        search: "",
        departmentId: "",
        locationId: "",
        employmentType: "",
        isActive: "",
      };
    },
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentEmployee: (state) => {
      state.currentEmployee = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchAll
      .addCase(fetchEmployees.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.employees = payload.data;
        state.pagination = payload.pagination;
      })
      .addCase(fetchEmployees.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      })
      // fetchOne
      .addCase(fetchEmployee.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchEmployee.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.currentEmployee = payload;
      })
      .addCase(fetchEmployee.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      })
      // create
      .addCase(createEmployee.fulfilled, (state, { payload }) => {
        state.employees.unshift(payload);
        state.pagination.total += 1;
      })
      // update
      .addCase(updateEmployee.fulfilled, (state, { payload }) => {
        const i = state.employees.findIndex((e) => e.id === payload.id);
        if (i !== -1) state.employees[i] = payload;
        if (state.currentEmployee?.id === payload.id) {
          state.currentEmployee = payload;
        }
      })
      // delete
      .addCase(deleteEmployee.fulfilled, (state, { payload }) => {
        state.employees = state.employees.filter((e) => e.id !== payload);
        state.pagination.total -= 1;
      });
  },
});

export const { setFilters, clearFilters, clearError, clearCurrentEmployee } =
  employeeSlice.actions;
export default employeeSlice.reducer;
