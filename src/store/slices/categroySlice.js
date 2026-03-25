import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

// ═════════════════════════════════════════════════════════════════════════════
// CATEGORY THUNKS
// ═════════════════════════════════════════════════════════════════════════════

export const fetchCategories = createAsyncThunk(
  "categories/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/categories", { params });
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch categories",
      );
    }
  },
);

export const fetchCategory = createAsyncThunk(
  "categories/fetchOne",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/categories/${id}`);
      return data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch category",
      );
    }
  },
);

export const createCategory = createAsyncThunk(
  "categories/create",
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/categories", formData);
      return data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to create category",
      );
    }
  },
);

export const updateCategory = createAsyncThunk(
  "categories/update",
  async ({ id, ...rest }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/categories/${id}`, rest);
      return data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to update category",
      );
    }
  },
);

export const deleteCategory = createAsyncThunk(
  "categories/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/categories/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to delete category",
      );
    }
  },
);

// ═════════════════════════════════════════════════════════════════════════════
// SUBCATEGORY THUNKS
// ═════════════════════════════════════════════════════════════════════════════

export const fetchSubCategories = createAsyncThunk(
  "categories/fetchAllSub",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/sub-categories", { params });
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch sub-categories",
      );
    }
  },
);

export const fetchSubCategory = createAsyncThunk(
  "categories/fetchOneSub",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/sub-categories/${id}`);
      return data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch sub-category",
      );
    }
  },
);

export const createSubCategory = createAsyncThunk(
  "categories/createSub",
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/sub-categories", formData);
      return data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to create sub-category",
      );
    }
  },
);

export const updateSubCategory = createAsyncThunk(
  "categories/updateSub",
  async ({ id, ...rest }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/sub-categories/${id}`, rest);
      return data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to update sub-category",
      );
    }
  },
);

export const deleteSubCategory = createAsyncThunk(
  "categories/deleteSub",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/sub-categories/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to delete sub-category",
      );
    }
  },
);

// ═════════════════════════════════════════════════════════════════════════════
// SLICE
// ═════════════════════════════════════════════════════════════════════════════

const categorySlice = createSlice({
  name: "categories",
  initialState: {
    // ── Category State ──────────────────────────────────────────────────────
    categories: [],
    currentCategory: null,

    // ── SubCategory State ───────────────────────────────────────────────────
    subCategories: [],
    currentSubCategory: null,

    // ── Loading & Error ─────────────────────────────────────────────────────
    isLoading: false,
    isSubLoading: false,
    error: null,
    subError: null,

    // ── Filters ─────────────────────────────────────────────────────────────
    filters: {
      search: "",
      isActive: "",
    },
    subFilters: {
      search: "",
      categoryId: "",
      isActive: "",
    },
  },

  reducers: {
    // Category filters
    setCategoryFilters: (state, { payload }) => {
      state.filters = { ...state.filters, ...payload };
    },
    clearCategoryFilters: (state) => {
      state.filters = { search: "", isActive: "" };
    },

    // SubCategory filters
    setSubCategoryFilters: (state, { payload }) => {
      state.subFilters = { ...state.subFilters, ...payload };
    },
    clearSubCategoryFilters: (state) => {
      state.subFilters = { search: "", categoryId: "", isActive: "" };
    },

    // Error clear
    clearCategoryError: (state) => {
      state.error = null;
    },
    clearSubCategoryError: (state) => {
      state.subError = null;
    },

    // Current item clear (form close hone pe call karo)
    clearCurrentCategory: (state) => {
      state.currentCategory = null;
    },
    clearCurrentSubCategory: (state) => {
      state.currentSubCategory = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // ── fetchCategories ─────────────────────────────────────────────────
      .addCase(fetchCategories.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.categories = payload.data;
      })
      .addCase(fetchCategories.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      })

      // ── fetchCategory ───────────────────────────────────────────────────
      .addCase(fetchCategory.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCategory.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.currentCategory = payload;
      })
      .addCase(fetchCategory.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      })

      // ── createCategory ──────────────────────────────────────────────────
      .addCase(createCategory.fulfilled, (state, { payload }) => {
        state.categories.unshift(payload);
      })
      .addCase(createCategory.rejected, (state, { payload }) => {
        state.error = payload;
      })

      // ── updateCategory ──────────────────────────────────────────────────
      .addCase(updateCategory.fulfilled, (state, { payload }) => {
        const i = state.categories.findIndex((c) => c.id === payload.id);
        if (i !== -1) state.categories[i] = payload;
        if (state.currentCategory?.id === payload.id)
          state.currentCategory = payload;
      })
      .addCase(updateCategory.rejected, (state, { payload }) => {
        state.error = payload;
      })

      // ── deleteCategory ──────────────────────────────────────────────────
      .addCase(deleteCategory.fulfilled, (state, { payload }) => {
        state.categories = state.categories.filter((c) => c.id !== payload);
      })
      .addCase(deleteCategory.rejected, (state, { payload }) => {
        state.error = payload;
      })

      // ── fetchSubCategories ──────────────────────────────────────────────
      .addCase(fetchSubCategories.pending, (state) => {
        state.isSubLoading = true;
        state.subError = null;
      })
      .addCase(fetchSubCategories.fulfilled, (state, { payload }) => {
        state.isSubLoading = false;
        state.subCategories = payload.data;
      })
      .addCase(fetchSubCategories.rejected, (state, { payload }) => {
        state.isSubLoading = false;
        state.subError = payload;
      })

      // ── fetchSubCategory ────────────────────────────────────────────────
      .addCase(fetchSubCategory.pending, (state) => {
        state.isSubLoading = true;
      })
      .addCase(fetchSubCategory.fulfilled, (state, { payload }) => {
        state.isSubLoading = false;
        state.currentSubCategory = payload;
      })
      .addCase(fetchSubCategory.rejected, (state, { payload }) => {
        state.isSubLoading = false;
        state.subError = payload;
      })

      // ── createSubCategory ───────────────────────────────────────────────
      .addCase(createSubCategory.fulfilled, (state, { payload }) => {
        state.subCategories.unshift(payload);
      })
      .addCase(createSubCategory.rejected, (state, { payload }) => {
        state.subError = payload;
      })

      // ── updateSubCategory ───────────────────────────────────────────────
      .addCase(updateSubCategory.fulfilled, (state, { payload }) => {
        const i = state.subCategories.findIndex((s) => s.id === payload.id);
        if (i !== -1) state.subCategories[i] = payload;
        if (state.currentSubCategory?.id === payload.id)
          state.currentSubCategory = payload;
      })
      .addCase(updateSubCategory.rejected, (state, { payload }) => {
        state.subError = payload;
      })

      // ── deleteSubCategory ───────────────────────────────────────────────
      .addCase(deleteSubCategory.fulfilled, (state, { payload }) => {
        state.subCategories = state.subCategories.filter(
          (s) => s.id !== payload,
        );
      })
      .addCase(deleteSubCategory.rejected, (state, { payload }) => {
        state.subError = payload;
      });
  },
});

export const {
  setCategoryFilters,
  clearCategoryFilters,
  setSubCategoryFilters,
  clearSubCategoryFilters,
  clearCategoryError,
  clearSubCategoryError,
  clearCurrentCategory,
  clearCurrentSubCategory,
} = categorySlice.actions;

export default categorySlice.reducer;
