import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchPendingApprovals = createAsyncThunk(
  "approvals/fetchPending",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/approvals/pending");
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  },
);

export const fetchAllRequests = createAsyncThunk(
  "approvals/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/approvals", { params });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  },
);

export const takeApprovalAction = createAsyncThunk(
  "approvals/takeAction",
  async ({ id, action, remarks }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/approvals/${id}/action`, {
        action,
        remarks,
      });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  },
);

const approvalSlice = createSlice({
  name: "approvals",
  initialState: {
    pending: [],
    pendingCount: 0,
    allRequests: [],
    pagination: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPendingApprovals.fulfilled, (state, action) => {
        state.pending = action.payload.data || [];
        state.pendingCount = action.payload.count || 0;
        state.loading = false;
      })
      .addCase(fetchAllRequests.fulfilled, (state, action) => {
        state.allRequests = action.payload.data || [];
        state.pagination = action.payload.pagination;
        state.loading = false;
      })
      .addMatcher(
        (a) => a.type.startsWith("approvals/") && a.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
        },
      )
      .addMatcher(
        (a) => a.type.startsWith("approvals/") && a.type.endsWith("/rejected"),
        (state, action) => {
          state.loading = false;
          state.error = action.payload?.message;
        },
      );
  },
});

export const { clearError } = approvalSlice.actions;
export default approvalSlice.reducer;
