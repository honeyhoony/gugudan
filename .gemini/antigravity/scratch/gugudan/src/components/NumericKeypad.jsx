import { Delete, Check } from 'lucide-react';

export default function NumericKeypad({ onPress, onBackspace, onSubmit }) {
    const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

    return (
        <div className="keypad-container">
            {keys.map(key => (
                <button
                    key={key}
                    onClick={() => onPress(key.toString())}
                    className="keypad-btn"
                >
                    {key}
                </button>
            ))}
            <button
                onClick={onBackspace}
                className="keypad-btn error"
            >
                <Delete size={24} />
            </button>
            <button
                onClick={onSubmit}
                className="keypad-btn primary"
            >
                <Check size={24} />
            </button>
        </div>
    );
}
