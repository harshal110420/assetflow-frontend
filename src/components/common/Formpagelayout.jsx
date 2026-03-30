import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Save, X, AlertCircle } from "lucide-react";

export default function FormPageLayout({
    title,
    subtitle,
    breadcrumbs = [],
    sections = [],
    onSave,
    onCancel,
    saving = false,
    saveLabel = "Save",
    isDirty = false,
    children,
}) {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState(sections[0]?.id || "");
    const contentRef = useRef(null);
    const observerRef = useRef(null);

    useEffect(() => {
        if (!sections.length) return;
        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) setActiveSection(entry.target.id);
                });
            },
            { root: contentRef.current, rootMargin: "-30% 0px -60% 0px", threshold: 0 }
        );
        sections.forEach(({ id }) => {
            const el = document.getElementById(id);
            if (el) observerRef.current.observe(el);
        });
        return () => observerRef.current?.disconnect();
    }, [sections]);

    const scrollToSection = (id) => {
        const el = document.getElementById(id);
        if (!el || !contentRef.current) return;
        contentRef.current.scrollTo({ top: el.offsetTop - 24, behavior: "smooth" });
        setActiveSection(id);
    };

    const handleCancel = () => {
        if (isDirty && !window.confirm("Unsaved changes will be lost. Continue?")) return;
        onCancel ? onCancel() : navigate(-1);
    };

    return (
        <div style={styles.root}>

            {/* ── Breadcrumb ───────────────────────────────────────────────── */}
            <div style={styles.breadcrumbBar}>
                {breadcrumbs.map((crumb, i) => (
                    <React.Fragment key={i}>
                        {crumb.path ? (
                            <button onClick={() => navigate(crumb.path)} style={styles.breadcrumbLink}>
                                {crumb.label}
                            </button>
                        ) : (
                            <span style={styles.breadcrumbCurrent}>{crumb.label}</span>
                        )}
                        {i < breadcrumbs.length - 1 && (
                            <ChevronRight size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                        )}
                    </React.Fragment>
                ))}
                {isDirty && (
                    <span style={styles.dirtyBadge}>
                        <AlertCircle size={11} /> Unsaved changes
                    </span>
                )}
            </div>

            {/* ── Page Header ──────────────────────────────────────────────── */}
            <div style={styles.pageHeader}>
                <h1 style={styles.pageTitle}>{title}</h1>
                {subtitle && <p style={styles.pageSubtitle}>{subtitle}</p>}
            </div>

            {/* ── Body ─────────────────────────────────────────────────────── */}
            <div style={styles.body}>

                {/* Sidebar */}
                {sections.length > 0 && (
                    <aside style={styles.sidebar}>
                        <div style={styles.sidebarSticky}>
                            <p style={styles.sidebarLabel}>Sections</p>
                            <nav style={styles.sidebarNav}>
                                {sections.map(({ id, label, icon: Icon }) => {
                                    const isActive = activeSection === id;
                                    return (
                                        <button
                                            key={id}
                                            onClick={() => scrollToSection(id)}
                                            style={{ ...styles.navItem, ...(isActive ? styles.navItemActive : {}) }}
                                        >
                                            {isActive && <span style={styles.navActiveDot} />}
                                            {Icon && <Icon size={14} color={isActive ? "var(--accent)" : "var(--text-muted)"} style={{ flexShrink: 0 }} />}
                                            <span>{label}</span>
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                    </aside>
                )}

                {/* Scrollable form content — ONLY this scrolls */}
                <main ref={contentRef} style={styles.content}>
                    <div style={styles.contentInner}>
                        {children}
                    </div>
                    <div style={{ height: 80 }} />
                </main>
            </div>

            {/* ── Sticky Footer ─────────────────────────────────────────────── */}
            <div style={styles.footer}>
                <button className="btn btn-secondary" onClick={handleCancel} disabled={saving} style={{ minWidth: 100 }}>
                    <X size={15} /> Cancel
                </button>
                <button className="btn btn-primary" onClick={onSave} disabled={saving} style={{ minWidth: 140, opacity: saving ? 0.7 : 1 }}>
                    {saving ? (
                        <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving…</>
                    ) : (
                        <><Save size={15} /> {saveLabel}</>
                    )}
                </button>
            </div>
        </div>
    );
}

// ── Sub-components ────────────────────────────────────────────────────────────

export function FormSection({ id, title, subtitle, children }) {
    return (
        <section id={id} style={sectionStyles.wrapper}>
            <div style={sectionStyles.header}>
                <div style={sectionStyles.headerLine} />
                <div>
                    <h2 style={sectionStyles.title}>{title}</h2>
                    {subtitle && <p style={sectionStyles.subtitle}>{subtitle}</p>}
                </div>
            </div>
            <div style={sectionStyles.body}>{children}</div>
        </section>
    );
}

export function FormRow({ children, cols = 2, gap = 16 }) {
    return (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap }}>
            {children}
        </div>
    );
}

export function FormField({ label, required, hint, error, children }) {
    return (
        <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {label && (
                <label style={{
                    fontSize: 12, fontWeight: 600,
                    color: error ? "var(--danger)" : "var(--text-muted)",
                    textTransform: "uppercase", letterSpacing: "0.05em",
                }}>
                    {label}
                    {required && <span style={{ color: "var(--danger)", marginLeft: 3 }}>*</span>}
                </label>
            )}
            {children}
            {hint && !error && <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>{hint}</p>}
            {error && (
                <p style={{ fontSize: 11, color: "var(--danger)", margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
                    <AlertCircle size={11} /> {error}
                </p>
            )}
        </div>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
    root: {
        flex: 1,               // fills Layout's <main> which is now display:flex flex-col
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",    // root must NOT scroll — children handle it
        minHeight: 0,
        animation: "fadeIn 0.3s ease",
        paddingLeft: 24,       // replaces the padding that Layout was giving
        paddingRight: 24,
    },
    breadcrumbBar: {
        display: "flex", alignItems: "center", gap: 6,
        padding: "10px 0",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0, flexWrap: "wrap",
    },
    breadcrumbLink: {
        background: "none", border: "none", cursor: "pointer",
        color: "var(--text-muted)", fontSize: 13, padding: 0,
        transition: "color 0.15s", fontWeight: 500,
    },
    breadcrumbCurrent: { color: "var(--text-primary)", fontSize: 13, fontWeight: 600 },
    dirtyBadge: {
        marginLeft: 8, display: "flex", alignItems: "center", gap: 4,
        fontSize: 11, color: "var(--warning)",
        background: "rgba(255,183,3,0.1)", border: "1px solid rgba(255,183,3,0.3)",
        borderRadius: 20, padding: "2px 8px", fontWeight: 600,
    },
    pageHeader: {
        padding: "20px 0 16px",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
    },
    pageTitle: {
        fontSize: 22, fontWeight: 700, color: "var(--text-primary)",
        letterSpacing: "-0.02em", margin: 0,
    },
    pageSubtitle: { color: "var(--text-muted)", fontSize: 13, margin: "4px 0 0 0" },
    body: {
        display: "flex",
        flex: 1,        // takes up all space between header and footer
        minHeight: 0,   // critical — without this flex overflow breaks
        overflow: "hidden",
    },
    sidebar: {
        width: 200, flexShrink: 0,
        borderRight: "1px solid var(--border)",
        overflowY: "auto",
    },
    sidebarSticky: {
        position: "sticky", top: 0,
        padding: "20px 16px 20px 0",
    },
    sidebarLabel: {
        fontSize: 10, fontWeight: 700, color: "var(--text-muted)",
        textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px 0",
    },
    sidebarNav: { display: "flex", flexDirection: "column", gap: 2 },
    navItem: {
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 10px", borderRadius: 8,
        background: "none", border: "none", cursor: "pointer",
        color: "var(--text-muted)", fontSize: 13, fontWeight: 500,
        textAlign: "left", width: "100%",
        transition: "all 0.15s", position: "relative",
    },
    navItemActive: { color: "var(--accent)", background: "var(--accent-glow)", fontWeight: 600 },
    navActiveDot: {
        position: "absolute", left: -1, width: 3, height: 20,
        borderRadius: 2, background: "var(--accent)",
    },
    content: {
        flex: 1,
        overflowY: "auto",  // ONLY this element scrolls
        padding: "0 0 0 28px",
        minWidth: 0,
    },
    contentInner: { maxWidth: 680, paddingTop: 24 },
    footer: {
        display: "flex", justifyContent: "flex-end", gap: 10,
        padding: "12px 0",
        borderTop: "1px solid var(--border)",
        flexShrink: 0,
        background: "var(--bg-primary)",
    },
};

const sectionStyles = {
    wrapper: { marginBottom: 40, scrollMarginTop: 24 },
    header: { display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 },
    headerLine: {
        width: 3, minWidth: 3, height: 44, borderRadius: 4,
        background: "linear-gradient(180deg, var(--accent), var(--accent-2, var(--accent)))",
        marginTop: 2,
    },
    title: { fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.01em" },
    subtitle: { fontSize: 12, color: "var(--text-muted)", margin: "4px 0 0 0" },
    body: { display: "flex", flexDirection: "column", gap: 16, paddingLeft: 17 },
};