import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

// ── Thunks ───────────────────────────────────────────────────────────────────

export const fetchAuditLogs = createAsyncThunk(
  "auditLog/fetch",
  async (filters, { rejectWithValue }) => {
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== "" && v !== null),
      );
      const { data } = await api.get("/audit-logs", { params });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Fetch failed");
    }
  },
);

export const loadMoreAuditLogs = createAsyncThunk(
  "auditLog/loadMore",
  async ({ filters, cursor }, { rejectWithValue }) => {
    try {
      const params = Object.fromEntries(
        Object.entries({ ...filters, cursor }).filter(
          ([, v]) => v !== "" && v !== null,
        ),
      );
      const { data } = await api.get("/audit-logs", { params });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Load more failed");
    }
  },
);

export const fetchLogDetail = createAsyncThunk(
  "auditLog/fetchDetail",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/audit-logs/${id}/detail`);
      return data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Detail fetch failed",
      );
    }
  },
);

// ── Initial State ─────────────────────────────────────────────────────────────

const initialFilters = {
  entityType: "",
  action: "",
  userId: "",
  search: "",
  dateFrom: "",
  dateTo: "",
};

const initialState = {
  logs: [],
  filters: initialFilters,
  pagination: { hasMore: false, nextCursor: null },
  selectedLog: null, // drawer mein jo log open hai
  selectedLogDetail: null, // oldValues/newValues — lazy loaded
  loading: false,
  loadingMore: false,
  loadingDetail: false,
  error: null,
  hasFetched: false, // pehli baar fetch hua ya nahi — blank state ke liye
};

// ── Slice ─────────────────────────────────────────────────────────────────────

const auditLogSlice = createSlice({
  name: "auditLog",
  initialState,
  reducers: {
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters(state) {
      state.filters = initialFilters;
      state.logs = [];
      state.pagination = { hasMore: false, nextCursor: null };
      state.hasFetched = false;
    },
    setSelectedLog(state, action) {
      state.selectedLog = action.payload;
      state.selectedLogDetail = null; // drawer open hone par reset
    },
    clearSelectedLog(state) {
      state.selectedLog = null;
      state.selectedLogDetail = null;
    },
  },
  extraReducers: (builder) => {
    // fetchAuditLogs
    builder
      .addCase(fetchAuditLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.logs = []; // fresh fetch — old data clear
      })
      .addCase(fetchAuditLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.logs = action.payload.data;
        state.pagination = action.payload.pagination;
        state.hasFetched = true;
      })
      .addCase(fetchAuditLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.hasFetched = true;
      });

    // loadMoreAuditLogs
    builder
      .addCase(loadMoreAuditLogs.pending, (state) => {
        state.loadingMore = true;
      })
      .addCase(loadMoreAuditLogs.fulfilled, (state, action) => {
        state.loadingMore = false;
        state.logs = [...state.logs, ...action.payload.data]; // append
        state.pagination = action.payload.pagination;
      })
      .addCase(loadMoreAuditLogs.rejected, (state, action) => {
        state.loadingMore = false;
        state.error = action.payload;
      });

    // fetchLogDetail
    builder
      .addCase(fetchLogDetail.pending, (state) => {
        state.loadingDetail = true;
      })
      .addCase(fetchLogDetail.fulfilled, (state, action) => {
        state.loadingDetail = false;
        state.selectedLogDetail = action.payload;
      })
      .addCase(fetchLogDetail.rejected, (state, action) => {
        state.loadingDetail = false;
        state.error = action.payload;
      });
  },
});

export const { setFilters, resetFilters, setSelectedLog, clearSelectedLog } =
  auditLogSlice.actions;

export default auditLogSlice.reducer;
