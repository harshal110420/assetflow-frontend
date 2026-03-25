import React, { useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    Upload, Download, CheckCircle, XCircle,
    AlertTriangle, FileText, Users, Package,
    RotateCcw, ChevronDown, ChevronUp,
} from "lucide-react";
import * as XLSX from "xlsx";
import api from "../services/api";
import {
    ASSET_COLUMNS, EMPLOYEE_COLUMNS,
    validateAssetRow, validateEmployeeRow,
    downloadTemplate,
} from "../utils/importValidators";
import toast from "react-hot-toast";

// ── File Upload Zone ──────────────────────────────────────────────────────────
function UploadZone({ onFile, loading }) {
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef();

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) onFile(file);
    }, [onFile]);

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (file) onFile(file);
        e.target.value = "";
    };

    return (
        <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !loading && inputRef.current.click()}
            style={{
                border: `2px dashed ${dragging ? "var(--accent)" : "var(--border)"}`,
                borderRadius: 16,
                padding: "48px 24px",
                textAlign: "center",
                cursor: loading ? "not-allowed" : "pointer",
                background: dragging ? "var(--accent-glow)" : "var(--bg-hover)",
                transition: "all 0.2s ease",
            }}
        >
            <input ref={inputRef} type="file" accept=".csv,.xlsx" onChange={handleFile} style={{ display: "none" }} />
            {loading ? (
                <div className="spinner" style={{ margin: "0 auto 12px" }} />
            ) : (
                <Upload size={36} style={{ margin: "0 auto 12px", color: "var(--accent)", display: "block" }} />
            )}
            <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
                {loading ? "Processing..." : "Drop your CSV or Excel file here"}
            </p>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                or click to browse — Max 500 rows, 5MB
            </p>
        </div>
    );
}

// ── Preview Table ─────────────────────────────────────────────────────────────
function PreviewTable({ results, type }) {
    const [expandedRow, setExpandedRow] = useState(null);
    const columns = type === "asset" ? ASSET_COLUMNS.slice(0, 8) : EMPLOYEE_COLUMNS.slice(0, 7);

    const validCount = results.filter(r => r.isValid).length;
    const invalidCount = results.filter(r => !r.isValid).length;

    return (
        <div>
            {/* Summary bar */}
            <div style={{
                display: "flex", gap: 16, marginBottom: 16,
                padding: "12px 16px",
                background: "var(--bg-hover)",
                borderRadius: 10,
                border: "1px solid var(--border)",
            }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    Total: <strong style={{ color: "var(--text-primary)" }}>{results.length}</strong>
                </span>
                <span style={{ fontSize: 13, color: "var(--success)" }}>
                    ✅ Valid: <strong>{validCount}</strong>
                </span>
                <span style={{ fontSize: 13, color: "var(--danger)" }}>
                    ❌ Invalid: <strong>{invalidCount}</strong>
                </span>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto", maxHeight: 400, overflowY: "auto" }}>
                <table className="table" style={{ fontSize: 12 }}>
                    <thead style={{ position: "sticky", top: 0, background: "var(--bg-secondary)", zIndex: 1 }}>
                        <tr>
                            <th style={{ width: 40 }}>#</th>
                            <th style={{ width: 60 }}>Status</th>
                            {columns.map(col => (
                                <th key={col.key}>{col.label}</th>
                            ))}
                            <th>Errors</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.map((row) => (
                            <React.Fragment key={row.rowNum}>
                                <tr
                                    style={{
                                        background: row.isValid
                                            ? "rgba(22,163,74,0.04)"
                                            : "rgba(239,68,68,0.04)",
                                        cursor: !row.isValid ? "pointer" : "default",
                                    }}
                                    onClick={() => !row.isValid && setExpandedRow(
                                        expandedRow === row.rowNum ? null : row.rowNum
                                    )}
                                >
                                    <td style={{ color: "var(--text-muted)", fontFamily: "monospace" }}>
                                        {row.rowNum}
                                    </td>
                                    <td>
                                        {row.isValid
                                            ? <CheckCircle size={14} color="var(--success)" />
                                            : <XCircle size={14} color="var(--danger)" />
                                        }
                                    </td>
                                    {columns.map(col => (
                                        <td key={col.key} style={{
                                            maxWidth: 120,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                            color: !row.preview[col.key] ? "var(--text-muted)" : "var(--text-primary)",
                                        }}>
                                            {row.preview[col.key] || "—"}
                                        </td>
                                    ))}
                                    <td>
                                        {!row.isValid && (
                                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                                <span style={{ fontSize: 11, color: "var(--danger)" }}>
                                                    {row.errors.length} error{row.errors.length > 1 ? "s" : ""}
                                                </span>
                                                {expandedRow === row.rowNum
                                                    ? <ChevronUp size={12} color="var(--danger)" />
                                                    : <ChevronDown size={12} color="var(--danger)" />
                                                }
                                            </div>
                                        )}
                                    </td>
                                </tr>
                                {/* Expanded error details */}
                                {expandedRow === row.rowNum && (
                                    <tr style={{ background: "rgba(239,68,68,0.06)" }}>
                                        <td colSpan={columns.length + 3} style={{ padding: "8px 16px" }}>
                                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                                {row.errors.map((err, i) => (
                                                    <div key={i} style={{
                                                        fontSize: 12, color: "var(--danger)",
                                                        display: "flex", alignItems: "center", gap: 6,
                                                    }}>
                                                        <AlertTriangle size={12} />
                                                        {err}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ── Result Modal ──────────────────────────────────────────────────────────────
function ResultModal({ result, onClose, type }) {
    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal" style={{ maxWidth: 480 }}>
                <div className="modal-header">
                    <h3 className="modal-title">Import Complete</h3>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                    {[
                        { label: "Total Rows", value: result.summary.total, color: "var(--accent)" },
                        { label: "Imported", value: result.summary.imported, color: "var(--success)" },
                        { label: "Skipped (Invalid)", value: result.summary.invalid, color: "var(--warning)" },
                        { label: "DB Errors", value: result.summary.dbErrors, color: "var(--danger)" },
                    ].map((item, i) => (
                        <div key={i} style={{
                            padding: "12px 16px",
                            background: "var(--bg-hover)",
                            borderRadius: 10,
                            border: "1px solid var(--border)",
                        }}>
                            <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>{item.label}</p>
                            <p style={{ fontSize: 24, fontWeight: 700, color: item.color }}>{item.value}</p>
                        </div>
                    ))}
                </div>

                {result.invalidRows?.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--danger)" }}>
                            Skipped Rows:
                        </p>
                        <div style={{ maxHeight: 200, overflowY: "auto" }}>
                            {result.invalidRows.map((row, i) => (
                                <div key={i} style={{
                                    padding: "8px 12px",
                                    background: "rgba(239,68,68,0.05)",
                                    borderRadius: 8,
                                    marginBottom: 6,
                                    border: "1px solid rgba(239,68,68,0.15)",
                                }}>
                                    <p style={{ fontSize: 12, fontWeight: 600, color: "var(--danger)" }}>
                                        Row {row.rowNum}
                                    </p>
                                    {row.errors.map((err, j) => (
                                        <p key={j} style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                                            • {err}
                                        </p>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <button className="btn btn-primary w-full" onClick={onClose}>Done</button>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BulkImport() {
    const [activeTab, setActiveTab] = useState("asset");
    const [file, setFile] = useState(null);
    const [parsing, setParsing] = useState(false);
    const [previewResults, setPreviewResults] = useState(null);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);

    const validCount = previewResults?.filter(r => r.isValid).length || 0;
    const invalidCount = previewResults?.filter(r => !r.isValid).length || 0;

    // ── Parse file on frontend ──
    const handleFile = async (selectedFile) => {
        setFile(selectedFile);
        setPreviewResults(null);
        setParsing(true);

        try {
            let rows = [];

            if (selectedFile.name.endsWith(".csv")) {
                const text = await selectedFile.text();
                const lines = text.split("\n").filter(l => l.trim());
                const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
                rows = lines.slice(1).map(line => {
                    const values = line.split(",").map(v => v.trim().replace(/"/g, ""));
                    const obj = {};
                    headers.forEach((h, i) => { obj[h] = values[i] || ""; });
                    return obj;
                });
            } else {
                const buffer = await selectedFile.arrayBuffer();
                const wb = XLSX.read(buffer);
                const ws = wb.Sheets[wb.SheetNames[0]];
                rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
            }

            // Frontend validation
            const validator = activeTab === "asset" ? validateAssetRow : validateEmployeeRow;
            const columns = activeTab === "asset" ? ASSET_COLUMNS : EMPLOYEE_COLUMNS;

            const seenTags = new Set();
            const seenEmails = new Set();

            const results = rows.map((row, i) => {
                const errors = validator(row, i);

                // Batch duplicate check on frontend
                if (activeTab === "asset" && row.assetTag?.trim()) {
                    const tag = row.assetTag.trim().toLowerCase();
                    if (seenTags.has(tag)) errors.push(`Duplicate assetTag in file: "${row.assetTag}"`);
                    else seenTags.add(tag);
                }
                if (activeTab === "employee" && row.email?.trim()) {
                    const email = row.email.trim().toLowerCase();
                    if (seenEmails.has(email)) errors.push(`Duplicate email in file: "${row.email}"`);
                    else seenEmails.add(email);
                }

                // Build preview object
                const preview = {};
                columns.forEach(col => { preview[col.key] = row[col.key] || ""; });

                return {
                    rowNum: i + 2,
                    isValid: errors.length === 0,
                    errors,
                    preview,
                };
            });

            setPreviewResults(results);
        } catch (err) {
            toast.error("Failed to parse file: " + err.message);
        } finally {
            setParsing(false);
        }
    };

    // ── Submit import ──
    const handleImport = async () => {
        if (!file || validCount === 0) return;
        setImporting(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const endpoint = activeTab === "asset" ? "/import/assets" : "/import/employees";
            const { data } = await api.post(endpoint, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setImportResult(data);
            toast.success(`${data.summary.imported} ${activeTab}s imported successfully!`);
        } catch (err) {
            toast.error(err.response?.data?.message || "Import failed");
        } finally {
            setImporting(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setPreviewResults(null);
        setImportResult(null);
    };

    const tabStyle = (tab) => ({
        padding: "8px 20px",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        background: activeTab === tab ? "var(--accent-glow)" : "transparent",
        color: activeTab === tab ? "var(--accent)" : "var(--text-muted)",
        border: activeTab === tab ? "1px solid rgba(37,99,235,0.3)" : "1px solid transparent",
        display: "flex", alignItems: "center", gap: 6,
    });

    return (
        <div style={{ maxWidth: "100%", animation: "fadeIn 0.4s ease" }}>

            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700 }}>Bulk Import</h2>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                    Import multiple assets or employees from CSV or Excel file
                </p>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                <button style={tabStyle("asset")} onClick={() => { setActiveTab("asset"); handleReset(); }}>
                    <Package size={15} /> Assets
                </button>
                <button style={tabStyle("employee")} onClick={() => { setActiveTab("employee"); handleReset(); }}>
                    <Users size={15} /> Employees
                </button>
            </div>

            {/* Template Download */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 16px",
                background: "var(--bg-hover)",
                borderRadius: 10,
                border: "1px solid var(--border)",
                marginBottom: 20,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <FileText size={16} color="var(--accent)" />
                    <div>
                        <p style={{ fontSize: 13, fontWeight: 600 }}>Download Template</p>
                        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                            Use this template to format your data correctly
                        </p>
                    </div>
                </div>
                <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => downloadTemplate(activeTab)}
                >
                    <Download size={14} /> Download CSV Template
                </button>
            </div>

            {/* Upload Zone */}
            {!previewResults && (
                <UploadZone onFile={handleFile} loading={parsing} />
            )}

            {/* Preview */}
            {previewResults && (
                <div className="card" style={{ padding: 20 }}>
                    <div style={{
                        display: "flex", justifyContent: "space-between",
                        alignItems: "center", marginBottom: 16,
                    }}>
                        <div>
                            <h3 style={{ fontSize: 15, fontWeight: 600 }}>
                                Preview — {file?.name}
                            </h3>
                            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                                Review rows below. Click on a red row to see errors.
                            </p>
                        </div>
                        <button className="btn btn-secondary btn-sm" onClick={handleReset}>
                            <RotateCcw size={14} /> Upload Different File
                        </button>
                    </div>

                    <PreviewTable results={previewResults} type={activeTab} />

                    {/* Action buttons */}
                    <div style={{
                        display: "flex", justifyContent: "flex-end",
                        gap: 10, marginTop: 16,
                        paddingTop: 16, borderTop: "1px solid var(--border)",
                    }}>
                        {invalidCount > 0 && (
                            <p style={{ fontSize: 13, color: "var(--text-muted)", alignSelf: "center" }}>
                                <AlertTriangle size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
                                {invalidCount} invalid rows will be skipped
                            </p>
                        )}
                        <button
                            className="btn btn-primary"
                            onClick={handleImport}
                            disabled={importing || validCount === 0}
                        >
                            {importing ? (
                                <><span className="spinner" style={{ width: 16, height: 16 }} /> Importing...</>
                            ) : (
                                <><CheckCircle size={15} /> Import {validCount} Valid Rows</>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Result Modal */}
            {importResult && (
                <ResultModal
                    result={importResult}
                    type={activeTab}
                    onClose={() => { setImportResult(null); handleReset(); }}
                />
            )}
        </div>
    );
}