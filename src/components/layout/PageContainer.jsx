import React from "react";

const WIDTH_MAP = {
    sm: "900px",
    md: "1100px",
    lg: "1280px",
    xl: "1440px",
    full: "100%",
};

export default function PageContainer({
    children,
    size = "full",
    noPadding = false,
}) {
    return (
        <div
            style={{
                width: "100%",
                maxWidth: WIDTH_MAP[size] || "100%",
                margin: "0 auto",
                padding: noPadding ? "0" : "0",
                minWidth: 0,
            }}
        >
            {children}
        </div>
    );
}