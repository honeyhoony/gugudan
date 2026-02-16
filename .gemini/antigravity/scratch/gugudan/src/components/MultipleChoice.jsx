import React from 'react';

export default function MultipleChoice({ options, onSelect, disabled, selectedAnswer, correctAnswer }) {
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
                        boxShadow: opt === selectedAnswer ? 'inset 0 2px 4px rgba(0,0,0,0.1)' : '0 4px 0 #e2e8f0',
                        border: correctAnswer === opt ? '2px solid #22c55e' : (selectedAnswer === opt && selectedAnswer !== correctAnswer && correctAnswer) ? '2px solid #ef4444' : '2px solid #e2e8f0',
                        background: correctAnswer === opt ? '#dcfce7' : (selectedAnswer === opt && selectedAnswer !== correctAnswer && correctAnswer) ? '#fee2e2' : 'white',
                        color: correctAnswer === opt ? '#15803d' : (selectedAnswer === opt && selectedAnswer !== correctAnswer && correctAnswer) ? '#b91c1c' : 'var(--text)',
                        transform: (disabled && opt === selectedAnswer) ? 'translateY(2px)' : 'none',
                        transition: 'all 0.1s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '80px',
                        opacity: disabled ? (opt === selectedAnswer || opt === correctAnswer ? 1 : 0.5) : 1,
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
