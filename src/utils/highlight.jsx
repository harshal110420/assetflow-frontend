import React from 'react';

export function highlight(text, query) {
    if (!query || !text) return text ?? '—';
    const str = String(text);

    // Query ke words alag karo — "Rahul Sharma" → ["Rahul", "Sharma"]
    const words = query.trim().split(/\s+/).filter(Boolean);

    for (const word of words) {
        const idx = str.toLowerCase().indexOf(word.toLowerCase());
        if (idx !== -1) {
            return (
                <>
                    {str.slice(0, idx)}
                    <mark style={{
                        background: 'rgba(251,191,36,0.45)',
                        color: 'inherit',
                        borderRadius: 2,
                        padding: '0 1px',
                    }}>
                        {str.slice(idx, idx + word.length)}
                    </mark>
                    {str.slice(idx + word.length)}
                </>
            );
        }
    }

    return str;
}