import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

// ═════════════════════════════════════════════════════════════════════════════
// BRAND THUNKS
// ═════════════════════════════════════════════════════════════════════════════

export const fetchBrands = createAsyncThunk(
  "brands/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/brands", { params });
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch brands",
      );
    }
  },
);

export const fetchBrandById = createAsyncThunk(
  "brands/fetchOne",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/brands/${id}`);
      return data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch brand",
      );
    }
  },
);

export const createBrand = createAsyncThunk(
  "brands/create",
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/brands", formData);
      return data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to create brand",
      );
    }
  },
);

export const updateBrand = createAsyncThunk(
  "brands/update",
  async ({ id, ...rest }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/brands/${id}`, rest);
      return data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to update brand",
      );
    }
  },
);

export const deleteBrand = createAsyncThunk(
  "brands/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/brands/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to delete brand",
      );
    }
  },
);

// ═════════════════════════════════════════════════════════════════════════════
// SLICE
// ═════════════════════════════════════════════════════════════════════════════

const brandSlice = createSlice({
  name: "brands",
  initialState: {
    brands: [],
    currentBrand: null,
    isLoading: false,
    error: null,
    filters: {
      search: "",
    },
  },

  reducers: {
    setBrandFilters: (state, { payload }) => {
      state.filters = { ...state.filters, ...payload };
    },
    clearBrandFilters: (state) => {
      state.filters = { search: "" };
    },
    clearBrandError: (state) => {
      state.error = null;
    },
    clearCurrentBrand: (state) => {
      state.currentBrand = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // ── fetchBrands ─────────────────────────────────────────────────────
      .addCase(fetchBrands.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBrands.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.brands = payload.data;
      })
      .addCase(fetchBrands.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      })

      // ── fetchBrandById ──────────────────────────────────────────────────
      .addCase(fetchBrandById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchBrandById.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.currentBrand = payload;
      })
      .addCase(fetchBrandById.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      })

      // ── createBrand ─────────────────────────────────────────────────────
      .addCase(createBrand.fulfilled, (state, { payload }) => {
        state.brands.unshift(payload);
      })
      .addCase(createBrand.rejected, (state, { payload }) => {
        state.error = payload;
      })

      // ── updateBrand ─────────────────────────────────────────────────────
      .addCase(updateBrand.fulfilled, (state, { payload }) => {
        const i = state.brands.findIndex((b) => b.id === payload.id);
        if (i !== -1) state.brands[i] = payload;
        if (state.currentBrand?.id === payload.id) state.currentBrand = payload;
      })
      .addCase(updateBrand.rejected, (state, { payload }) => {
        state.error = payload;
      })

      // ── deleteBrand ─────────────────────────────────────────────────────
      .addCase(deleteBrand.fulfilled, (state, { payload }) => {
        state.brands = state.brands.filter((b) => b.id !== payload);
      })
      .addCase(deleteBrand.rejected, (state, { payload }) => {
        state.error = payload;
      });
  },
});

export const {
  setBrandFilters,
  clearBrandFilters,
  clearBrandError,
  clearCurrentBrand,
} = brandSlice.actions;

export default brandSlice.reducer;
