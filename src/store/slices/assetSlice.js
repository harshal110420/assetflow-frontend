import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchAssets = createAsyncThunk(
  "assets/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/assets", { params });
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch assets",
      );
    }
  },
);

export const fetchAsset = createAsyncThunk(
  "assets/fetchOne",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/assets/${id}`);
      return data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch asset",
      );
    }
  },
);

export const createAsset = createAsyncThunk(
  "assets/create",
  async (assetData, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/assets", assetData);
      return data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to create asset",
      );
    }
  },
);

export const updateAsset = createAsyncThunk(
  "assets/update",
  async ({ id, ...assetData }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/assets/${id}`, assetData);
      return data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to update asset",
      );
    }
  },
);

export const deleteAsset = createAsyncThunk(
  "assets/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/assets/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to delete asset",
      );
    }
  },
);

export const fetchDashboardStats = createAsyncThunk(
  "assets/dashboard",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/assets/dashboard");
      return data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch stats",
      );
    }
  },
);

export const assignAsset = createAsyncThunk(
  "assets/assign",
  async ({ id, ...assignData }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/assets/${id}/assign`, assignData);
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to assign asset",
      );
    }
  },
);

export const returnAsset = createAsyncThunk(
  "assets/return",
  async ({ id, ...returnData }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/assets/${id}/return`, returnData);
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to return asset",
      );
    }
  },
);

const assetSlice = createSlice({
  name: "assets",
  initialState: {
    assets: [],
    currentAsset: null,
    dashboardStats: null,
    pagination: { total: 0, page: 1, limit: 20, pages: 0 },
    isLoading: false,
    error: null,
    filters: {
      search: "",
      category: "",
      status: "",
      departmentId: "",
      condition: "",
      assignmentType: "",
    },
  },
  reducers: {
    setFilters: (state, { payload }) => {
      state.filters = { ...state.filters, ...payload };
    },
    clearFilters: (state) => {
      state.filters = {
        search: "",
        category: "",
        status: "",
        department: "",
        condition: "",
      };
    },
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentAsset: (state) => {
      state.currentAsset = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssets.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAssets.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.assets = payload.data;
        state.pagination = payload.pagination;
      })
      .addCase(fetchAssets.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      })
      .addCase(fetchAsset.fulfilled, (state, { payload }) => {
        state.currentAsset = payload;
      })
      .addCase(createAsset.fulfilled, (state, { payload }) => {
        state.assets.unshift(payload);
        state.pagination.total += 1;
      })
      .addCase(updateAsset.fulfilled, (state, { payload }) => {
        const idx = state.assets.findIndex((a) => a.id === payload.id);
        if (idx !== -1) state.assets[idx] = payload;
        if (state.currentAsset?.id === payload.id) state.currentAsset = payload;
      })
      .addCase(deleteAsset.fulfilled, (state, { payload }) => {
        state.assets = state.assets.filter((a) => a.id !== payload);
        state.pagination.total -= 1;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, { payload }) => {
        state.dashboardStats = payload;
      });
  },
});

export const { setFilters, clearFilters, clearError, clearCurrentAsset } =
  assetSlice.actions;
export default assetSlice.reducer;
