import React, { useState, useEffect } from 'react';
import './TransactionForm.css';

const defaultCategories = [
    { id: 'cat1', name: 'Ăn uống', icon: '🍲', type: 'expense', color: '#FF9800' },
    { id: 'cat2', name: 'Chi tiêu hàng ngày', icon: '🛍️', type: 'expense', color: '#4CAF50' },
    { id: 'cat3', name: 'Quần áo', icon: '👕', type: 'expense', color: '#2196F3' },
    { id: 'cat4', name: 'Mỹ phẩm', icon: '💄', type: 'expense', color: '#E91E63' },
    { id: 'cat5', name: 'Y tế', icon: '💊', type: 'expense', color: '#F44336' },
    { id: 'cat6', name: 'Giáo dục', icon: '📚', type: 'expense', color: '#9C27B0' },
    { id: 'cat7', name: 'Điện nước', icon: '💡', type: 'expense', color: '#FFEB3B' },
    { id: 'cat8', name: 'Đi lại', icon: '🚗', type: 'expense', color: '#795548' },
    { id: 'cat9', name: 'Liên lạc', icon: '📱', type: 'expense', color: '#607D8B' },
    { id: 'cat10', name: 'Tiền nhà', icon: '🏠', type: 'expense', color: '#3F51B5' },
    { id: 'inc1', name: 'Lương', icon: '💵', type: 'income', color: '#4CAF50' },
    { id: 'inc2', name: 'Thưởng', icon: '🧧', type: 'income', color: '#FFC107' },
];

function TransactionForm({ onSave, onCancel, customCategories = [] }) {
    const [formType, setFormType] = useState('expense'); // expense or income
    const [amount, setAmount] = useState('0');
    const [note, setNote] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const allCategories = [...defaultCategories, ...customCategories].filter(c => c.type === formType);
    const [selectedCat, setSelectedCat] = useState(allCategories[0]);

    // Sync selected category when tab changes
    useEffect(() => {
        setSelectedCat(allCategories[0]);
    }, [formType]);

    const handleKeyPress = (num) => {
        if (amount === '0') setAmount(num);
        else setAmount(prev => prev + num);
    };

    const handleBackspace = () => {
        if (amount.length <= 1) setAmount('0');
        else setAmount(prev => prev.slice(0, -1));
    };

    const handleSave = () => {
        if (Number(amount) === 0) return;
        onSave({
            amount: Number(amount),
            category: selectedCat.name,
            icon: selectedCat.icon,
            color: selectedCat.color,
            type: formType,
            note,
            date: new Date(date)
        });
    };

    return (
        <div className="form-overlay">
            <div className="form-container">
                <div className="form-tabs-top">
                    <div className={`form-tab-item ${formType === 'expense' ? 'active expense' : ''}`} onClick={() => setFormType('expense')}>Tiền chi</div>
                    <div className={`form-tab-item ${formType === 'income' ? 'active income' : ''}`} onClick={() => setFormType('income')}>Tiền thu</div>
                    <div className="edit-icon" onClick={() => alert('Chức năng chỉnh sửa danh mục sắp ra mắt!')}>✎</div>
                </div>

                <div className="form-body-scroll">
                    <div className="input-row">
                        <span className="label">Ngày</span>
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="date-input" />
                    </div>

                    <div className="input-row">
                        <span className="label">Ghi chú</span>
                        <input
                            type="text"
                            placeholder="Bạn đã chi vào việc gì?"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="note-input"
                        />
                    </div>

                    <div className="input-row amount-row">
                        <span className="label">Tiền {formType === 'expense' ? 'chi' : 'thu'}</span>
                        <div className="amount-val">
                            {Number(amount).toLocaleString()} <span className="currency-symbol">đ</span>
                        </div>
                    </div>

                    <div className="category-section">
                        <h3>Danh mục</h3>
                        <div className="category-grid">
                            {allCategories.map(cat => (
                                <div
                                    key={cat.id}
                                    className={`cat-btn ${selectedCat?.id === cat.id ? 'active' : ''}`}
                                    onClick={() => setSelectedCat(cat)}
                                >
                                    <div className="cat-icon-wrap" style={{ backgroundColor: selectedCat?.id === cat.id ? cat.color : '#F5F5F5' }}>
                                        <span className="icon">{cat.icon}</span>
                                    </div>
                                    <span className="name">{cat.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="keypad-section">
                    <button className="main-action-btn" onClick={handleSave}>
                        Nhập khoản {formType === 'expense' ? 'chi' : 'thu'}
                    </button>
                    <div className="keypad-grid">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, '00', 0].map(k => (
                            <button key={k} onClick={() => handleKeyPress(k.toString())}>{k}</button>
                        ))}
                        <button key="back" onClick={handleBackspace}>⌫</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TransactionForm;
