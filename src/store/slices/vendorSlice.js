import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

// ═════════════════════════════════════════════════════════════════════════════
// VENDOR THUNKS
// ═════════════════════════════════════════════════════════════════════════════

export const fetchVendors = createAsyncThunk(
  "vendors/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/vendors", { params });
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch vendors",
      );
    }
  },
);

export const fetchVendorById = createAsyncThunk(
  "vendors/fetchOne",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/vendors/${id}`);
      return data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch vendor",
      );
    }
  },
);

export const createVendor = createAsyncThunk(
  "vendors/create",
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/vendors", formData);
      return data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to create vendor",
      );
    }
  },
);

export const updateVendor = createAsyncThunk(
  "vendors/update",
  async ({ id, ...rest }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/vendors/${id}`, rest);
      return data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to update vendor",
      );
    }
  },
);

export const deleteVendor = createAsyncThunk(
  "vendors/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/vendors/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to delete vendor",
      );
    }
  },
);

// ═════════════════════════════════════════════════════════════════════════════
// SLICE
// ═════════════════════════════════════════════════════════════════════════════

const vendorSlice = createSlice({
  name: "vendors",
  initialState: {
    vendors: [],
    currentVendor: null,
    isLoading: false,
    error: null,
    filters: {
      search: "",
    },
  },

  reducers: {
    setVendorFilters: (state, { payload }) => {
      state.filters = { ...state.filters, ...payload };
    },
    clearVendorFilters: (state) => {
      state.filters = { search: "" };
    },
    clearVendorError: (state) => {
      state.error = null;
    },
    clearCurrentVendor: (state) => {
      state.currentVendor = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // ── fetchVendors ────────────────────────────────────────────────────
      .addCase(fetchVendors.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchVendors.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.vendors = payload.data;
      })
      .addCase(fetchVendors.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      })

      // ── fetchVendorById ─────────────────────────────────────────────────
      .addCase(fetchVendorById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchVendorById.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.currentVendor = payload;
      })
      .addCase(fetchVendorById.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      })

      // ── createVendor ────────────────────────────────────────────────────
      .addCase(createVendor.fulfilled, (state, { payload }) => {
        state.vendors.unshift(payload);
      })
      .addCase(createVendor.rejected, (state, { payload }) => {
        state.error = payload;
      })

      // ── updateVendor ────────────────────────────────────────────────────
      .addCase(updateVendor.fulfilled, (state, { payload }) => {
        const i = state.vendors.findIndex((v) => v.id === payload.id);
        if (i !== -1) state.vendors[i] = payload;
        if (state.currentVendor?.id === payload.id)
          state.currentVendor = payload;
      })
      .addCase(updateVendor.rejected, (state, { payload }) => {
        state.error = payload;
      })

      // ── deleteVendor ────────────────────────────────────────────────────
      .addCase(deleteVendor.fulfilled, (state, { payload }) => {
        state.vendors = state.vendors.filter((v) => v.id !== payload);
      })
      .addCase(deleteVendor.rejected, (state, { payload }) => {
        state.error = payload;
      });
  },
});

export const {
  setVendorFilters,
  clearVendorFilters,
  clearVendorError,
  clearCurrentVendor,
} = vendorSlice.actions;

export default vendorSlice.reducer;
