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
                    className="choice-btn animate-pop"
                    style={{
                        ...(correctAnswer === opt ? {
                            borderColor: '#22c55e',
                            backgroundColor: '#dcfce7',
                            color: '#15803d'
                        } : (selectedAnswer === opt && selectedAnswer !== correctAnswer && correctAnswer) ? {
                            borderColor: '#ef4444',
                            backgroundColor: '#fee2e2',
                            color: '#b91c1c'
                        } : disabled ? {
                            opacity: (opt === selectedAnswer || opt === correctAnswer) ? 1 : 0.5
                        } : {}),
                        ...(disabled && opt === selectedAnswer ? {
                            transform: 'translateY(2px)',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                        } : {})
                    }}
                >
                    {opt}
                </button>
            ))}
        </div>
    );
}
