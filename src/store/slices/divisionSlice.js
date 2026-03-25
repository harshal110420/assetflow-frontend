import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

// ── ASYNC THUNKS ──────────────────────────────────────────────────────────────

export const fetchDivisions = createAsyncThunk(
  "divisions/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/divisions");
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  },
);

export const createDivision = createAsyncThunk(
  "divisions/create",
  async (divisionData, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/divisions", divisionData);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  },
);

export const updateDivision = createAsyncThunk(
  "divisions/update",
  async ({ id, ...divisionData }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/divisions/${id}`, divisionData);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  },
);

export const deleteDivision = createAsyncThunk(
  "divisions/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/divisions/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  },
);

// ── SLICE ─────────────────────────────────────────────────────────────────────

const divisionSlice = createSlice({
  name: "divisions",
  initialState: {
    divisions: [],
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
      .addCase(fetchDivisions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDivisions.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.divisions = payload;
      })
      .addCase(fetchDivisions.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      })
      .addCase(createDivision.fulfilled, (state, { payload }) => {
        state.divisions.unshift(payload);
      })
      .addCase(updateDivision.fulfilled, (state, { payload }) => {
        const i = state.divisions.findIndex((d) => d.id === payload.id);
        if (i !== -1) state.divisions[i] = payload;
      })
      .addCase(deleteDivision.fulfilled, (state, { payload }) => {
        state.divisions = state.divisions.filter((d) => d.id !== payload);
      });
  },
});

export const { clearError } = divisionSlice.actions;
export default divisionSlice.reducer;
