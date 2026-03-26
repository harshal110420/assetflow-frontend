// store/slices/amcSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

// ── Async Thunks ──────────────────────────────────────────────────────────────

export const fetchAmcContracts = createAsyncThunk(
  "amc/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await api.get("/amc", { params });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  },
);

export const fetchAmcById = createAsyncThunk(
  "amc/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`/amc/${id}`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  },
);

export const createAmcContract = createAsyncThunk(
  "amc/create",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post("/amc", payload);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  },
);

export const updateAmcContract = createAsyncThunk(
  "amc/update",
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/amc/${id}`, payload);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  },
);

export const deleteAmcContract = createAsyncThunk(
  "amc/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/amc/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  },
);

export const fetchExpiringContracts = createAsyncThunk(
  "amc/expiring",
  async (days = 30, { rejectWithValue }) => {
    try {
      const res = await api.get(`/amc/expiring?days=${days}`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  },
);

export const checkAssetCoverage = createAsyncThunk(
  "amc/checkCoverage",
  async (assetId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/amc/asset/${assetId}/coverage`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  },
);

export const addServiceVisit = createAsyncThunk(
  "amc/addVisit",
  async ({ contractId, ...payload }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/amc/${contractId}/visits`, payload);
      return { contractId, visit: res.data.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  },
);

// ── Slice ─────────────────────────────────────────────────────────────────────
const amcSlice = createSlice({
  name: "amc",
  initialState: {
    contracts: [],
    selectedContract: null,
    expiringContracts: [],
    assetCoverage: null,
    isLoading: false,
    isLoadingDetail: false,
    pagination: { total: 0, page: 1, pages: 1 },
    filters: { search: "", status: "", contractType: "" },
    error: null,
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = { search: "", status: "", contractType: "" };
    },
    clearSelectedContract: (state) => {
      state.selectedContract = null;
    },
    clearAssetCoverage: (state) => {
      state.assetCoverage = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch All
    builder
      .addCase(fetchAmcContracts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAmcContracts.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.contracts = payload.data;
        state.pagination = payload.pagination;
      })
      .addCase(fetchAmcContracts.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      });

    // Fetch By ID
    builder
      .addCase(fetchAmcById.pending, (state) => {
        state.isLoadingDetail = true;
      })
      .addCase(fetchAmcById.fulfilled, (state, { payload }) => {
        state.isLoadingDetail = false;
        state.selectedContract = payload;
      })
      .addCase(fetchAmcById.rejected, (state) => {
        state.isLoadingDetail = false;
      });

    // Create
    builder.addCase(createAmcContract.fulfilled, (state, { payload }) => {
      state.contracts.unshift(payload);
      state.pagination.total += 1;
    });

    // Update
    builder.addCase(updateAmcContract.fulfilled, (state, { payload }) => {
      const idx = state.contracts.findIndex((c) => c.id === payload.id);
      if (idx !== -1) state.contracts[idx] = payload;
      if (state.selectedContract?.id === payload.id)
        state.selectedContract = payload;
    });

    // Delete
    builder.addCase(deleteAmcContract.fulfilled, (state, { payload }) => {
      state.contracts = state.contracts.filter((c) => c.id !== payload);
      state.pagination.total -= 1;
    });

    // Expiring
    builder.addCase(fetchExpiringContracts.fulfilled, (state, { payload }) => {
      state.expiringContracts = payload;
    });

    // Asset Coverage
    builder.addCase(checkAssetCoverage.fulfilled, (state, { payload }) => {
      state.assetCoverage = payload;
    });

    // Add Visit
    builder.addCase(addServiceVisit.fulfilled, (state, { payload }) => {
      if (state.selectedContract?.id === payload.contractId) {
        state.selectedContract.serviceVisits = [
          payload.visit,
          ...(state.selectedContract.serviceVisits || []),
        ];
      }
    });
  },
});

export const {
  setFilters,
  clearFilters,
  clearSelectedContract,
  clearAssetCoverage,
} = amcSlice.actions;
export default amcSlice.reducer;
