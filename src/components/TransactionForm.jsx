import React, { useState } from 'react';
import './TransactionForm.css';

const categories = [
    { id: 'eat', name: 'Ăn uống', icon: '🍲', type: 'expense' },
    { id: 'shopping', name: 'Mua sắm', icon: '🛍️', type: 'expense' },
    { id: 'transport', name: 'Di chuyển', icon: '🚗', type: 'expense' },
    { id: 'beauty', name: 'Mỹ phẩm', icon: '💅', type: 'expense' },
    { id: 'education', name: 'Giáo dục', icon: '📚', type: 'expense' },
    { id: 'home', name: 'Nhà cửa', icon: '🏠', type: 'expense' },
    { id: 'health', name: 'Sức khỏe', icon: '💊', type: 'expense' },
    { id: 'salary', name: 'Lương', icon: '💵', type: 'income' },
    { id: 'bonus', name: 'Thưởng', icon: '🧧', type: 'income' },
    { id: 'other', name: 'Khác', icon: '🪙', type: 'expense' },
];

function TransactionForm({ onSave, onCancel }) {
    const [amount, setAmount] = useState('0');
    const [selectedCat, setSelectedCat] = useState(categories[0]);
    const [note, setNote] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const handleKeyPress = (num) => {
        if (amount === '0') {
            setAmount(num);
        } else {
            setAmount(prev => prev + num);
        }
    };

    const handleBackspace = () => {
        if (amount.length === 1) {
            setAmount('0');
        } else {
            setAmount(prev => prev.slice(0, -1));
        }
    };

    const handleSave = () => {
        if (Number(amount) === 0) return;
        onSave({
            amount: Number(amount),
            category: selectedCat.name,
            icon: selectedCat.icon,
            type: selectedCat.type,
            note,
            date: new Date(date)
        });
    };

    return (
        <div className="form-overlay">
            <div className="form-container">
                <div className="form-header">
                    <button onClick={onCancel}>Hủy</button>
                    <h2>{selectedCat.type === 'expense' ? 'Chi tiền' : 'Thu tiền'}</h2>
                    <button className="save-btn" onClick={handleSave}>Xong</button>
                </div>

                <div className="amount-display">
                    <span className="currency">đ</span>
                    <span className="value">{Number(amount).toLocaleString()}</span>
                </div>

                <div className="input-group">
                    <input
                        type="text"
                        placeholder="Ghi chú..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                    />
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>

                <div className="category-grid">
                    {categories.map(cat => (
                        <div
                            key={cat.id}
                            className={`cat-btn ${selectedCat.id === cat.id ? 'active' : ''}`}
                            onClick={() => setSelectedCat(cat)}
                        >
                            <div className="cat-icon-large">{cat.icon}</div>
                            <div className="cat-name-small">{cat.name}</div>
                        </div>
                    ))}
                </div>

                <div className="keypad">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, '00', 0].map(k => (
                        <button key={k} onClick={() => handleKeyPress(k.toString())}>{k}</button>
                    ))}
                    <button onClick={handleBackspace}>⌫</button>
                </div>
            </div>
        </div>
    );
}

export default TransactionForm;
