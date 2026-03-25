import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchEmployees, createEmployee, updateEmployee, deleteEmployee,
} from "../store/slices/employeeSlice";
import { fetchDepartments } from "../store/slices/departmentSlice";
import { fetchDivisions } from "../store/slices/divisionSlice";
import { fetchLocations } from "../store/slices/permissionSlice";
import {
    Plus, Edit2, Trash2, Search, X, UserCheck, RefreshCw,
    Eye,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { usePermission } from "../hooks/usePermission";
import { highlight } from '../utils/highlight';

// ← YE COMPONENT KE BAHAR RAKHO
function useDebounce(value, delay) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
}

const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Intern"];

// ── Employee Modal ────────────────────────────────────────────────────────────
function EmployeeModal({ employee, employees, departments, divisions, locations, onClose }) {
    const dispatch = useDispatch();
    const isEdit = !!employee;

    const [form, setForm] = useState({
        firstName: employee?.firstName || "",
        lastName: employee?.lastName || "",
        email: employee?.email || "",
        phone: employee?.phone || "",
        employeeCode: employee?.employeeCode || "",
        designation: employee?.designation || "",
        employmentType: employee?.employmentType || "Full-time",
        departmentId: employee?.departmentId || "",
        locationId: employee?.locationId || "",
        reportingManagerId: employee?.reportingManagerId || "",
        joiningDate: employee?.joiningDate || "",
        leavingDate: employee?.leavingDate || "",
        isActive: employee?.isActive !== false,
        divisionIds: employee?.divisions?.map((d) => d.id) || [],
    });
    const [loading, setLoading] = useState(false);

    const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

    const toggleDivision = (divId) => {
        setForm((p) => ({
            ...p,
            divisionIds: p.divisionIds.includes(divId)
                ? p.divisionIds.filter((id) => id !== divId)
                : [...p.divisionIds, divId],
        }));
    };

    const managerOptions = employees.filter(
        (e) => e.id !== employee?.id && e.isActive
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.firstName || !form.lastName || !form.email)
            return toast.error("Name and email are required");
        setLoading(true);
        try {
            const payload = { ...form };
            if (!payload.reportingManagerId) payload.reportingManagerId = null;
            if (!payload.departmentId) payload.departmentId = null;
            if (!payload.locationId) payload.locationId = null;
            if (!payload.leavingDate) payload.leavingDate = null;

            const action = isEdit
                ? updateEmployee({ id: employee.id, ...payload })
                : createEmployee(payload);

            const result = await dispatch(action);
            if (result.error) throw new Error(result.payload?.message || "Failed");
            toast.success(isEdit ? "Employee updated!" : "Employee created!");
            onClose(true);
        } catch (err) {
            toast.error(err.message || "Operation failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose(false)}>
            <div className="modal" style={{ maxWidth: 640, maxHeight: "90vh", overflowY: "auto" }}>
                <div className="modal-header" style={{ position: "sticky", top: 0, background: "var(--bg-card)", zIndex: 10 }}>
                    <h2 className="modal-title">{isEdit ? "Edit Employee" : "Add New Employee"}</h2>
                    <button onClick={() => onClose(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                    {/* Name */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div className="form-group">
                            <label className="form-label">First Name *</label>
                            <input className="form-input" value={form.firstName} onChange={set("firstName")} required placeholder="Rahul" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Last Name *</label>
                            <input className="form-input" value={form.lastName} onChange={set("lastName")} required placeholder="Sharma" />
                        </div>
                    </div>

                    {/* Email + Phone */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div className="form-group">
                            <label className="form-label">Email *</label>
                            <input className="form-input" type="email" value={form.email} onChange={set("email")} required placeholder="rahul@company.com" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Phone</label>
                            <input className="form-input" value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" />
                        </div>
                    </div>

                    {/* Employee Code + Designation */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div className="form-group">
                            <label className="form-label">Employee Code</label>
                            <input className="form-input" value={form.employeeCode} onChange={set("employeeCode")} placeholder="EMP001" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Designation</label>
                            <input className="form-input" value={form.designation} onChange={set("designation")} placeholder="Production Manager" />
                        </div>
                    </div>

                    {/* Employment Type + Department */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div className="form-group">
                            <label className="form-label">Employment Type</label>
                            <select className="form-select" value={form.employmentType} onChange={set("employmentType")}>
                                {EMPLOYMENT_TYPES.map((t) => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Department</label>
                            <select className="form-select" value={form.departmentId} onChange={set("departmentId")}>
                                <option value="">-- Select Department --</option>
                                {departments.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.name}{d.division?.name ? ` — ${d.division.name}` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Location + Reporting Manager */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div className="form-group">
                            <label className="form-label">Branch / Location</label>
                            <select className="form-select" value={form.locationId} onChange={set("locationId")}>
                                <option value="">-- Select Location --</option>
                                {locations.filter((l) => l.isActive !== false).map((l) => (
                                    <option key={l.id} value={l.id}>{l.name}{l.code ? ` (${l.code})` : ""}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Reporting Manager</label>
                            <select className="form-select" value={form.reportingManagerId} onChange={set("reportingManagerId")}>
                                <option value="">-- No Manager --</option>
                                {managerOptions.map((emp) => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.firstName} {emp.lastName}
                                        {emp.designation ? ` — ${emp.designation}` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Joining + Leaving Dates */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div className="form-group">
                            <label className="form-label">Joining Date</label>
                            <input className="form-input" type="date" value={form.joiningDate} onChange={set("joiningDate")} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Leaving Date</label>
                            <input className="form-input" type="date" value={form.leavingDate} onChange={set("leavingDate")} />
                        </div>
                    </div>

                    {/* Divisions */}
                    <div className="form-group">
                        <label className="form-label">
                            Divisions
                            <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8, fontWeight: 400 }}>
                                Multiple select kar sakte ho
                            </span>
                        </label>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
                            {divisions.map((div) => {
                                const active = form.divisionIds.includes(div.id);
                                const isPrimary = form.divisionIds[0] === div.id;
                                return (
                                    <button key={div.id} type="button" onClick={() => toggleDivision(div.id)}
                                        style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`, background: active ? "var(--accent-glow)" : "transparent", color: active ? "var(--accent)" : "var(--text-muted)", transition: "all 0.15s" }}>
                                        {active ? "✓ " : ""}{div.name}{isPrimary && active ? " (Primary)" : ""}
                                    </button>
                                );
                            })}
                        </div>
                        {form.divisionIds.length > 0 && (
                            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                                First selected division will be primary · {form.divisionIds.length} division(s) selected
                            </p>
                        )}
                    </div>

                    {/* Status (edit only) */}
                    {isEdit && (
                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <select className="form-input" value={form.isActive}
                                onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.value === "true" }))}>
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </select>
                        </div>
                    )}

                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 12, borderTop: "1px solid var(--border)", position: "sticky", bottom: 0, background: "var(--bg-card)" }}>
                        <button type="button" className="btn btn-secondary" onClick={() => onClose(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Saving...</> : isEdit ? "Update Employee" : "Create Employee"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function EmployeesPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { employees, isLoading, pagination } = useSelector((s) => s.employees);
    const { departments } = useSelector((s) => s.departments);
    const { divisions } = useSelector((s) => s.divisions);
    const { locations } = useSelector((s) => s.permissions);
    const { user: me } = useSelector((s) => s.auth);

    const [showModal, setShowModal] = useState(false);
    const [editEmployee, setEditEmployee] = useState(null);
    const [search, setSearch] = useState("");
    const [filterDept, setFilterDept] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const { can } = usePermission();

    const canCreate = can("employees", "new");
    const canEdit = can("employees", "edit");
    const canDelete = can("employees", "delete");
    const debouncedSearch = useDebounce(search, 300);

    useEffect(() => {
        dispatch(fetchEmployees({
            search: debouncedSearch,
            departmentId: filterDept,
            page: currentPage,
            limit: 20
        }));
    }, [debouncedSearch, filterDept, currentPage]);

    const load = () => {
        dispatch(fetchEmployees({
            search: debouncedSearch,
            departmentId: filterDept,
            page: currentPage,
            limit: 20
        }));
    };


    useEffect(() => {
        dispatch(fetchDepartments());
        dispatch(fetchDivisions());
        dispatch(fetchLocations());
    }, [dispatch]);

    const handleDelete = async (id) => {
        if (!window.confirm("Deactivate this employee?")) return;
        const result = await dispatch(deleteEmployee(id));
        if (!result.error) toast.success("Employee deactivated");
        else toast.error(result.payload || "Failed");
    };

    const handleClose = (refresh) => {
        setShowModal(false);
        setEditEmployee(null);
        if (refresh) load();
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeIn 0.4s ease" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h2 style={{ fontSize: 22, fontWeight: 700 }}>Employees</h2>
                    <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
                        {pagination.total} employees
                    </p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <button className="btn btn-secondary btn-sm" onClick={load}><RefreshCw size={15} /></button>
                    {canCreate && (
                        <button className="btn btn-primary" onClick={() => { setEditEmployee(null); setShowModal(true); }}>
                            <Plus size={16} /> Add Employee
                        </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{ padding: "14px 20px" }}>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ position: "relative", flex: "1 1 200px", minWidth: 180 }}>
                        <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                        <input className="form-input" value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} placeholder="Search name, email, code..." style={{ paddingLeft: 32 }} />
                    </div>
                    <select className="form-input" style={{ width: "auto" }} value={filterDept} onChange={(e) => { setFilterDept(e.target.value); setCurrentPage(1); }}>
                        <option value="">All Departments</option>
                        {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    {(search || filterDept) && (
                        <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(""); setFilterDept(""); setCurrentPage(1); }}>Clear</button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                {isLoading ? (
                    <div style={{ padding: 40, display: "flex", justifyContent: "center" }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
                ) : employees.length === 0 ? (
                    <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--text-muted)" }}>
                        <UserCheck size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                        <p>No employees found</p>
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th style={{ paddingLeft: 20 }}>Employee</th>
                                    <th>Code</th>
                                    <th>Designation</th>
                                    <th>Department</th>
                                    <th>Division</th>
                                    <th>Branch</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    {(canEdit || canDelete) && <th style={{ paddingRight: 20 }}>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map((emp) => {
                                    const primaryDiv = emp.divisions?.find((d) => d.EmployeeDivision?.isPrimary) || emp.divisions?.[0];
                                    return (
                                        <tr key={emp.id}>
                                            <td style={{ paddingLeft: 20 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                    {/* <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent), var(--accent-2))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#050b14", flexShrink: 0 }}>
                                                        {emp.firstName?.[0]}{emp.lastName?.[0]}
                                                    </div> */}
                                                    <div>
                                                        <div style={{ fontWeight: 600, fontSize: 13 }}>
                                                            {highlight(emp.firstName, search)}{" "}
                                                            {highlight(emp.lastName, search)}
                                                        </div>
                                                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                                            {highlight(emp.email, search)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{ fontSize: 12, fontFamily: "monospace", color: "var(--accent)", background: "var(--accent-glow)", padding: "2px 8px", borderRadius: 6 }}>
                                                    {highlight(emp.employeeCode, search) || "—"}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>{highlight(emp.designation, search) || "—"}</td>
                                            <td style={{ fontSize: 13 }}>{highlight(emp.department?.name, search) || "—"}</td>
                                            <td style={{ fontSize: 13, color: "var(--text-muted)" }}>{primaryDiv?.name || "—"}</td>
                                            <td style={{ fontSize: 13, color: "var(--text-muted)" }}>{emp.branch?.name || "—"}</td>
                                            <td>
                                                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                                                    {emp.employmentType}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${emp.isActive ? "badge-active" : "badge-inactive"}`}>
                                                    {emp.isActive ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            {(canEdit || canDelete) && (
                                                <td style={{ paddingRight: 20 }}>
                                                    <div style={{ display: "flex", gap: 6 }}>
                                                        <button
                                                            className="btn btn-secondary btn-sm"
                                                            onClick={() => navigate(`/employees/${emp.id}`)}
                                                            title="View"
                                                        >
                                                            <Eye size={14} />
                                                        </button>
                                                        {canEdit && (
                                                            <button className="btn btn-secondary btn-sm" onClick={() => { setEditEmployee(emp); setShowModal(true); }} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                                                <Edit2 size={13} /> Edit
                                                            </button>
                                                        )}
                                                        {canDelete && (
                                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(emp.id)}>
                                                                <Trash2 size={13} />
                                                            </button>
                                                        )}

                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Page {currentPage} of {pagination.pages} · {pagination.total} employees</span>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</button>
                            <button className="btn btn-secondary btn-sm" onClick={() => setCurrentPage((p) => Math.min(pagination.pages, p + 1))} disabled={currentPage === pagination.pages}>Next</button>
                        </div>
                    </div>
                )}
            </div>

            {showModal && (
                <EmployeeModal
                    employee={editEmployee}
                    employees={employees}
                    departments={departments}
                    divisions={divisions}
                    locations={locations}
                    onClose={handleClose}
                />
            )}
        </div>
    );
}