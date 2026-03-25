import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, Layers, Tag } from "lucide-react";
import {
    fetchCategories,
    fetchSubCategories,
    deleteCategory,
    deleteSubCategory,
    setCategoryFilters,
    setSubCategoryFilters,
} from "../store/slices/categroySlice";
import CategoryForm from "./CategoryForm";
import SubCategoryForm from "./SubCategoryForm";
import toast from "react-hot-toast";

// ─── PERMISSION HOOK — swap with your real hook ───────────────────────────────
const usePermission = (module, action) => {
    const { user } = useSelector((s) => s.auth);
    return user?.role === "admin";
};

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
function StatusBadge({ isActive }) {
    return (
        <span
            style={{
                padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                background: isActive ? "rgba(0,214,143,0.12)" : "var(--bg-hover)",
                color: isActive ? "var(--success)" : "var(--text-muted)",
                border: `1px solid ${isActive ? "rgba(0,214,143,0.3)" : "var(--border)"}`,
            }}
        >
            {isActive ? "Active" : "Inactive"}
        </span>
    );
}

// ─── DELETE CONFIRM MODAL ─────────────────────────────────────────────────────
function DeleteModal({ item, type, onConfirm, onCancel, loading }) {
    return (
        <div
            style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: 1100, padding: 20,
            }}
        >
            <div
                className="card"
                style={{ width: "100%", maxWidth: 420, padding: 32, borderRadius: 16, textAlign: "center" }}
            >
                <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 10px" }}>
                    Deactivate {type === "category" ? "Category" : "Sub-Category"}?
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.6, margin: "0 0 24px" }}>
                    Are you sure you want to deactivate{" "}
                    <strong style={{ color: "var(--text-primary)" }}>"{item?.name}"</strong>?
                    It will be hidden from non-admins. Existing assets won't be affected.
                </p>
                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                    <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
                    <button
                        className="btn btn-danger"
                        onClick={onConfirm}
                        disabled={loading}
                        style={{ opacity: loading ? 0.6 : 1 }}
                    >
                        {loading ? "Deactivating..." : "Yes, Deactivate"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function CategoriesPage() {
    const dispatch = useDispatch();

    const {
        categories, subCategories,
        isLoading, isSubLoading,
        error, subError,
        filters, subFilters,
    } = useSelector((s) => s.categories);

    const canCreate = usePermission("categories", "new");
    const canEdit = usePermission("categories", "edit");
    const canDelete = usePermission("categories", "delete");

    // ── UI State ──────────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState("categories");
    const [showCatForm, setShowCatForm] = useState(false);
    const [editingCat, setEditingCat] = useState(null);
    const [showSubForm, setShowSubForm] = useState(false);
    const [editingSub, setEditingSub] = useState(null);
    const [defaultCatId, setDefaultCatId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null); // { item, type }
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [expandedCatId, setExpandedCatId] = useState(null);

    // ── Fetch ─────────────────────────────────────────────────────────────────
    const loadCategories = useCallback(() => {
        dispatch(fetchCategories(filters));
    }, [dispatch, filters]);

    const loadSubCategories = useCallback(() => {
        dispatch(fetchSubCategories(subFilters));
    }, [dispatch, subFilters]);

    useEffect(() => { loadCategories(); }, [loadCategories]);
    useEffect(() => { loadSubCategories(); }, [loadSubCategories]);

    // ── Error toasts ──────────────────────────────────────────────────────────
    useEffect(() => { if (error) toast.error(error); }, [error]);
    useEffect(() => { if (subError) toast.error(subError); }, [subError]);

    // ── Handlers: Category ────────────────────────────────────────────────────
    const handleAddCategory = () => { setEditingCat(null); setShowCatForm(true); };
    const handleEditCategory = (cat) => { setEditingCat(cat); setShowCatForm(true); };

    // ── Handlers: SubCategory ─────────────────────────────────────────────────
    const handleAddSubCategory = (catId = null) => {
        setEditingSub(null); setDefaultCatId(catId); setShowSubForm(true);
    };
    const handleEditSubCategory = (sub) => { setEditingSub(sub); setShowSubForm(true); };

    // ── Delete Confirm ────────────────────────────────────────────────────────
    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            const action =
                deleteTarget.type === "category"
                    ? dispatch(deleteCategory(deleteTarget.item.id))
                    : dispatch(deleteSubCategory(deleteTarget.item.id));
            const result = await action;
            if (result.error) {
                toast.error(result.payload || "Failed to deactivate.");
            } else {
                toast.success(`${deleteTarget.type === "category" ? "Category" : "Sub-category"} deactivated.`);
                setDeleteTarget(null);
                loadCategories();
                loadSubCategories();
            }
        } finally {
            setDeleteLoading(false);
        }
    };

    // ── Client-side filtered lists ────────────────────────────────────────────
    const filteredCategories = categories.filter((c) =>
        c.name.toLowerCase().includes((filters.search || "").toLowerCase())
    );

    const filteredSubCategories = subCategories.filter((s) => {
        const matchSearch = s.name.toLowerCase().includes((subFilters.search || "").toLowerCase());
        const matchCat = subFilters.categoryId ? s.categoryId === Number(subFilters.categoryId) : true;
        return matchSearch && matchCat;
    });

    // ── Stats ─────────────────────────────────────────────────────────────────
    const stats = [
        { label: "Total Categories", value: categories.length, color: "var(--accent)", bg: "var(--accent-glow)" },
        { label: "Active Categories", value: categories.filter((c) => c.isActive).length, color: "var(--success)", bg: "rgba(0,214,143,0.1)" },
        { label: "Sub-Categories", value: subCategories.length, color: "var(--info)", bg: "rgba(51,154,240,0.1)" },
        { label: "Active Sub", value: subCategories.filter((s) => s.isActive).length, color: "var(--warning)", bg: "rgba(255,183,3,0.1)" },
    ];

    // ─── Skeleton rows ────────────────────────────────────────────────────────
    const SkeletonRows = ({ cols = 6, rows = 4 }) =>
        [...Array(rows)].map((_, i) => (
            <tr key={i}>
                {[...Array(cols)].map((_, j) => (
                    <td key={j} style={{ padding: 16 }}>
                        <div className="skeleton" style={{ height: 14, borderRadius: 4 }} />
                    </td>
                ))}
            </tr>
        ));

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeIn 0.4s ease" }}>

            {/* ── Page Header ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                    <h2
                        style={{
                            fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em",
                            color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 10, margin: 0,
                        }}
                    >
                        <Layers size={22} color="var(--accent)" />
                        Category Management
                    </h2>
                    <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4, marginBottom: 0 }}>
                        Manage asset categories and sub-categories with depreciation defaults
                    </p>
                </div>
                {canCreate && (
                    activeTab === "categories" ? (
                        <button className="btn btn-primary" onClick={handleAddCategory}>
                            <Plus size={17} /> New Category
                        </button>
                    ) : (
                        <button className="btn btn-primary" onClick={() => handleAddSubCategory()}>
                            <Plus size={17} /> New Sub-Category
                        </button>
                    )
                )}
            </div>

            {/* ── Stats ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
                {stats.map((s) => (
                    <div key={s.label} className="card" style={{ padding: "16px 20px" }}>
                        <p style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>
                            {s.label}
                        </p>
                        <p style={{ color: s.color, fontSize: 30, fontWeight: 700, marginTop: 4, marginBottom: 0 }}>
                            {s.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* ── Tabs ── */}
            <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border)", paddingBottom: 0 }}>
                {[
                    { key: "categories", label: "Categories", count: categories.length, icon: "📁" },
                    { key: "subcategories", label: "Sub-Categories", count: subCategories.length, icon: "🗂️" },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            padding: "9px 18px", border: "none", borderRadius: "8px 8px 0 0",
                            background: activeTab === tab.key ? "var(--bg-card)" : "transparent",
                            color: activeTab === tab.key ? "var(--accent)" : "var(--text-muted)",
                            fontWeight: activeTab === tab.key ? 700 : 500,
                            fontSize: 14, cursor: "pointer",
                            borderBottom: activeTab === tab.key ? "2px solid var(--accent)" : "2px solid transparent",
                            display: "flex", alignItems: "center", gap: 8,
                            transition: "all 0.15s",
                        }}
                    >
                        {tab.icon} {tab.label}
                        <span
                            style={{
                                background: activeTab === tab.key ? "var(--accent-glow)" : "var(--bg-hover)",
                                color: activeTab === tab.key ? "var(--accent)" : "var(--text-muted)",
                                fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 20,
                            }}
                        >
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* ══════════════════════════════════════════════════════════════════════
          CATEGORIES TAB
      ══════════════════════════════════════════════════════════════════════ */}
            {activeTab === "categories" && (
                <>
                    {/* Search toolbar */}
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <input
                            className="form-input"
                            placeholder="🔍  Search categories..."
                            value={filters.search}
                            onChange={(e) => dispatch(setCategoryFilters({ search: e.target.value }))}
                            style={{ maxWidth: 320 }}
                        />
                    </div>

                    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                        <div style={{ overflowX: "auto" }}>
                            <table className="table" style={{ width: "100%" }}>
                                <thead>
                                    <tr>
                                        <th style={{ paddingLeft: 20 }}>Category</th>
                                        <th>Depreciation</th>
                                        <th>Useful Life</th>
                                        <th>Sub-Categories</th>
                                        <th>Status</th>
                                        <th style={{ paddingRight: 20 }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <SkeletonRows cols={6} rows={4} />
                                    ) : filteredCategories.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} style={{ padding: "48px 20px", textAlign: "center", color: "var(--text-muted)" }}>
                                                <Tag size={36} style={{ opacity: 0.3, display: "block", margin: "0 auto 12px" }} />
                                                No categories found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredCategories.map((cat) => (
                                            <>
                                                {/* ── Category Row ── */}
                                                <tr key={cat.id}>
                                                    <td style={{ paddingLeft: 20 }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                            <div
                                                                style={{
                                                                    width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                                                                    background: (cat.color || "#6366f1") + "22",
                                                                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
                                                                }}
                                                            >
                                                                {cat.icon || "📁"}
                                                            </div>
                                                            <div>
                                                                <p style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)", margin: 0 }}>
                                                                    {cat.name}
                                                                </p>
                                                                {cat.description && (
                                                                    <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                                        {cat.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td>
                                                        <code
                                                            style={{
                                                                background: "var(--bg-hover)", color: "var(--accent)",
                                                                padding: "3px 8px", borderRadius: 5, fontSize: 12,
                                                                border: "1px solid var(--border)",
                                                            }}
                                                        >
                                                            {cat.depreciationRate}%
                                                        </code>
                                                    </td>

                                                    <td style={{ color: "var(--text-muted)", fontSize: 13 }}>
                                                        {cat.usefulLife ? `${cat.usefulLife} yrs` : "—"}
                                                    </td>

                                                    {/* Sub-categories expand toggle */}
                                                    <td>
                                                        {cat.subCategories?.length > 0 ? (
                                                            <button
                                                                onClick={() =>
                                                                    setExpandedCatId(expandedCatId === cat.id ? null : cat.id)
                                                                }
                                                                className="btn btn-secondary btn-sm"
                                                                style={{ gap: 5, fontSize: 12 }}
                                                            >
                                                                {expandedCatId === cat.id
                                                                    ? <ChevronDown size={13} />
                                                                    : <ChevronRight size={13} />}
                                                                {cat.subCategories.length} sub
                                                            </button>
                                                        ) : (
                                                            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>None</span>
                                                        )}
                                                    </td>

                                                    <td><StatusBadge isActive={cat.isActive} /></td>

                                                    <td style={{ paddingRight: 20 }}>
                                                        <div style={{ display: "flex", gap: 6 }}>
                                                            {canCreate && (
                                                                <button
                                                                    className="btn btn-secondary btn-sm"
                                                                    onClick={() => handleAddSubCategory(cat.id)}
                                                                    title="Add Sub-Category"
                                                                >
                                                                    <Plus size={13} />🗂️
                                                                </button>
                                                            )}
                                                            {canEdit && (
                                                                <button
                                                                    className="btn btn-secondary btn-sm"
                                                                    onClick={() => handleEditCategory(cat)}
                                                                    title="Edit"
                                                                >
                                                                    <Edit2 size={14} />
                                                                </button>
                                                            )}
                                                            {canDelete && (
                                                                <button
                                                                    className="btn btn-danger btn-sm"
                                                                    onClick={() => setDeleteTarget({ item: cat, type: "category" })}
                                                                    title="Deactivate"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* ── Expanded Sub-Categories ── */}
                                                {expandedCatId === cat.id &&
                                                    cat.subCategories.map((sub) => (
                                                        <tr
                                                            key={`sub-${sub.id}`}
                                                            style={{ background: "var(--bg-secondary)" }}
                                                        >
                                                            <td style={{ paddingLeft: 40 }}>
                                                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                    <span style={{ color: "var(--border)", fontSize: 16 }}>└</span>
                                                                    <div
                                                                        style={{
                                                                            width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                                                                            background: (sub.color || "#6366f1") + "22",
                                                                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
                                                                        }}
                                                                    >
                                                                        {sub.icon || "🗂️"}
                                                                    </div>
                                                                    <span style={{ fontWeight: 500, fontSize: 13, color: "var(--text-primary)" }}>
                                                                        {sub.name}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                {sub.depreciationRate != null ? (
                                                                    <code
                                                                        style={{
                                                                            background: "var(--bg-hover)", color: "var(--accent)",
                                                                            padding: "3px 8px", borderRadius: 5, fontSize: 12,
                                                                            border: "1px solid var(--border)",
                                                                        }}
                                                                    >
                                                                        {sub.depreciationRate}%
                                                                    </code>
                                                                ) : (
                                                                    <span style={{ color: "var(--text-muted)", fontSize: 12, fontStyle: "italic" }}>
                                                                        {cat.depreciationRate}% (inherited)
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td style={{ color: "var(--text-muted)", fontSize: 13 }}>
                                                                {sub.usefulLife ? `${sub.usefulLife} yrs` : "—"}
                                                            </td>
                                                            <td />
                                                            <td><StatusBadge isActive={sub.isActive} /></td>
                                                            <td style={{ paddingRight: 20 }}>
                                                                <div style={{ display: "flex", gap: 6 }}>
                                                                    {canEdit && (
                                                                        <button
                                                                            className="btn btn-secondary btn-sm"
                                                                            onClick={() => handleEditSubCategory(sub)}
                                                                            title="Edit"
                                                                        >
                                                                            <Edit2 size={14} />
                                                                        </button>
                                                                    )}
                                                                    {canDelete && (
                                                                        <button
                                                                            className="btn btn-danger btn-sm"
                                                                            onClick={() => setDeleteTarget({ item: sub, type: "subcategory" })}
                                                                            title="Deactivate"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* ══════════════════════════════════════════════════════════════════════
          SUB-CATEGORIES TAB
      ══════════════════════════════════════════════════════════════════════ */}
            {activeTab === "subcategories" && (
                <>
                    {/* Toolbar */}
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                        <input
                            className="form-input"
                            placeholder="🔍  Search sub-categories..."
                            value={subFilters.search}
                            onChange={(e) => dispatch(setSubCategoryFilters({ search: e.target.value }))}
                            style={{ maxWidth: 320 }}
                        />
                        <select
                            className="form-input"
                            value={subFilters.categoryId}
                            onChange={(e) => dispatch(setSubCategoryFilters({ categoryId: e.target.value }))}
                            style={{ maxWidth: 220, cursor: "pointer" }}
                        >
                            <option value="">All Categories</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.icon ? `${c.icon} ` : ""}{c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                        <div style={{ overflowX: "auto" }}>
                            <table className="table" style={{ width: "100%" }}>
                                <thead>
                                    <tr>
                                        <th style={{ paddingLeft: 20 }}>Sub-Category</th>
                                        <th>Parent Category</th>
                                        <th>Depreciation</th>
                                        <th>Useful Life</th>
                                        <th>Status</th>
                                        <th style={{ paddingRight: 20 }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isSubLoading ? (
                                        <SkeletonRows cols={6} rows={4} />
                                    ) : filteredSubCategories.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} style={{ padding: "48px 20px", textAlign: "center", color: "var(--text-muted)" }}>
                                                <Layers size={36} style={{ opacity: 0.3, display: "block", margin: "0 auto 12px" }} />
                                                No sub-categories found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredSubCategories.map((sub) => {
                                            const parentCat = categories.find((c) => c.id === sub.categoryId);
                                            return (
                                                <tr key={sub.id}>
                                                    <td style={{ paddingLeft: 20 }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                            <div
                                                                style={{
                                                                    width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                                                                    background: (sub.color || "#6366f1") + "22",
                                                                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
                                                                }}
                                                            >
                                                                {sub.icon || "🗂️"}
                                                            </div>
                                                            <div>
                                                                <p style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)", margin: 0 }}>
                                                                    {sub.name}
                                                                </p>
                                                                {sub.description && (
                                                                    <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
                                                                        {sub.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td>
                                                        {parentCat ? (
                                                            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)" }}>
                                                                <span style={{ color: parentCat.color || "var(--accent)" }}>
                                                                    {parentCat.icon || "📁"}
                                                                </span>
                                                                {parentCat.name}
                                                            </div>
                                                        ) : (
                                                            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>—</span>
                                                        )}
                                                    </td>

                                                    <td>
                                                        {sub.depreciationRate != null ? (
                                                            <code
                                                                style={{
                                                                    background: "var(--bg-hover)", color: "var(--accent)",
                                                                    padding: "3px 8px", borderRadius: 5, fontSize: 12,
                                                                    border: "1px solid var(--border)",
                                                                }}
                                                            >
                                                                {sub.depreciationRate}%
                                                            </code>
                                                        ) : (
                                                            <span style={{ color: "var(--text-muted)", fontSize: 12, fontStyle: "italic" }}>
                                                                {parentCat?.depreciationRate}% ↑ inherited
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td style={{ color: "var(--text-muted)", fontSize: 13 }}>
                                                        {sub.usefulLife ? `${sub.usefulLife} yrs` : "—"}
                                                    </td>

                                                    <td><StatusBadge isActive={sub.isActive} /></td>

                                                    <td style={{ paddingRight: 20 }}>
                                                        <div style={{ display: "flex", gap: 6 }}>
                                                            {canEdit && (
                                                                <button
                                                                    className="btn btn-secondary btn-sm"
                                                                    onClick={() => handleEditSubCategory(sub)}
                                                                    title="Edit"
                                                                >
                                                                    <Edit2 size={14} />
                                                                </button>
                                                            )}
                                                            {canDelete && (
                                                                <button
                                                                    className="btn btn-danger btn-sm"
                                                                    onClick={() => setDeleteTarget({ item: sub, type: "subcategory" })}
                                                                    title="Deactivate"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* ── Modals ── */}
            {showCatForm && (
                <CategoryForm
                    initialData={editingCat}
                    onClose={() => { setShowCatForm(false); setEditingCat(null); }}
                    onSuccess={() => { loadCategories(); }}
                />
            )}

            {showSubForm && (
                <SubCategoryForm
                    initialData={editingSub}
                    defaultCategoryId={defaultCatId}
                    onClose={() => { setShowSubForm(false); setEditingSub(null); setDefaultCatId(null); }}
                    onSuccess={() => { loadSubCategories(); loadCategories(); }}
                />
            )}

            {deleteTarget && (
                <DeleteModal
                    item={deleteTarget.item}
                    type={deleteTarget.type}
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setDeleteTarget(null)}
                    loading={deleteLoading}
                />
            )}
        </div>
    );
}