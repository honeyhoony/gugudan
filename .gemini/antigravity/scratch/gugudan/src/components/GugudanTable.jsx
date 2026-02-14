import { X, Lightbulb } from 'lucide-react';
import { useState } from 'react';

const GugudanTable = ({ onClose }) => {
    const [tab, setTab] = useState('basic'); // 'basic' or 'advanced'

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content animate-pop" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
                <button className="close-btn" onClick={onClose}>
                    <X size={20} />
                </button>
                <h2>구구단 표 (참고)</h2>

                <div style={{ marginBottom: '1rem' }}>
                    <button
                        className={`btn ${tab === 'basic' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setTab('basic')}
                        style={{ width: 'auto', display: 'inline-block', marginRight: '0.5rem', color: tab === 'basic' ? 'white' : 'var(--dark)' }}
                    >
                        기본 (2~9단)
                    </button>
                    <button
                        className={`btn ${tab === 'advanced' ? 'btn-accent' : 'btn-outline'}`}
                        onClick={() => setTab('advanced')}
                        style={{ width: 'auto', display: 'inline-block', color: 'var(--dark)' }}
                    >
                        19단 (10~19단)
                    </button>
                </div>

                <div className="gugudan-table" style={{ maxHeight: '50vh', overflowY: 'auto' }}>
                    {tab === 'basic' ? (
                        [2, 3, 4, 5, 6, 7, 8, 9].map((dan) => (
                            <div key={dan} className="dan-column">
                                <div className="dan-title">{dan} 단</div>
                                {Array.from({ length: 9 }).map((_, i) => (
                                    <div key={`${dan}x${i + 1}`}>
                                        {dan} x {i + 1} = {dan * (i + 1)}
                                    </div>
                                ))}
                            </div>
                        ))
                    ) : (
                        [10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map((dan) => (
                            <div key={dan} className="dan-column" style={{ background: '#e0f2fe' }}>
                                <div className="dan-title" style={{ color: '#0284c7' }}>{dan} 단</div>
                                {Array.from({ length: 19 }).map((_, i) => (
                                    <div key={`${dan}x${i + 1}`}>
                                        {dan} x {i + 1} = {dan * (i + 1)}
                                    </div>
                                ))}
                            </div>
                        ))
                    )}
                </div>

                {tab === 'advanced' && (
                    <div className="tip-box" style={{ marginTop: '2rem' }}>
                        <h3 style={{ marginTop: 0 }}><Lightbulb style={{ verticalAlign: 'middle', marginRight: '5px' }} /> 19단 암기 비법!</h3>
                        <p><strong>(앞의 수) × (뒤의 수)</strong>를 계산할 때 이렇게 해보세요:</p>
                        <ol style={{ paddingLeft: '1.5rem', lineHeight: '1.6' }}>
                            <li>앞의 수에 뒤의 수의 <strong>'1의 자리'</strong>를 더하세요.</li>
                            <li>그 결과에 <strong>0</strong>을 붙이세요. (×10)</li>
                            <li>두 수의 <strong>'1의 자리'끼리 곱한 값</strong>을 더하세요.</li>
                        </ol>
                        <div style={{ background: 'rgba(255,255,255,0.7)', padding: '0.5rem', borderRadius: '8px', fontSize: '0.9rem' }}>
                            예) <strong>12 × 13</strong> <br />
                            1. 12 + 3 = 15 <br />
                            2. 150 <br />
                            3. 2 × 3 = 6 <br />
                            👉 150 + 6 = <strong>156</strong>!
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
export default GugudanTable;
