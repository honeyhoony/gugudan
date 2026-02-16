import React from 'react';

export default function MultipleChoice({ options, onSelect, disabled }) {
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.8rem',
            marginTop: '0.5rem',
            width: '100%',
            perspective: '1000px'
        }}>
            {options.map((opt, idx) => (
                <button
                    key={idx}
                    onClick={() => onSelect(opt)}
                    disabled={disabled}
                    className="btn animate-pop"
                    style={{
                        padding: '1.2rem',
                        fontSize: '1.8rem',
                        fontWeight: 'bold',
                        background: 'white',
                        borderRadius: '16px',
                        boxShadow: '0 4px 0 #e2e8f0',
                        border: '2px solid #e2e8f0',
                        color: 'var(--text)',
                        transition: 'all 0.1s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '80px',
                        opacity: disabled ? 0.7 : 1,
                        cursor: disabled ? 'default' : 'pointer'
                    }}
                    onMouseEnter={(e) => {
                        if (!disabled) {
                            e.currentTarget.style.borderColor = 'var(--primary)';
                            e.currentTarget.style.color = 'var(--primary)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!disabled) {
                            e.currentTarget.style.borderColor = '#e2e8f0';
                            e.currentTarget.style.color = 'var(--text)';
                        }
                    }}
                    onMouseDown={(e) => {
                        if (!disabled) {
                            e.currentTarget.style.transform = 'translateY(2px)';
                            e.currentTarget.style.boxShadow = '0 2px 0 #e2e8f0';
                        }
                    }}
                    onMouseUp={(e) => {
                        if (!disabled) {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 0 #e2e8f0';
                        }
                    }}
                >
                    {opt}
                </button>
            ))}
        </div>
    );
}
