import React, { useState, useEffect } from 'react';
import './TransactionForm.css';

const defaultCategories = [
    // --- Khoản chi ---
    { id: 'cd1', name: 'Điện', icon: '⚡', type: 'expense', color: '#FF9800', group: 'Cố định' },
    { id: 'cd2', name: 'Mạng', icon: '🌐', type: 'expense', color: '#2196F3', group: 'Cố định' },
    { id: 'cd3', name: 'Gia đình', icon: '🏠', type: 'expense', color: '#4CAF50', group: 'Cố định' },
    { id: 'cd4', name: 'Khác (Cố định)', icon: '📦', type: 'expense', color: '#9E9E9E', group: 'Cố định' },

    { id: 'cv1', name: 'Xăng xe', icon: '⛽', type: 'expense', color: '#607D8B', group: 'Công việc' },
    { id: 'cv2', name: 'Mua bán', icon: '🤝', type: 'expense', color: '#795548', group: 'Công việc' },
    { id: 'cv3', name: 'Khác (Công việc)', icon: '💼', type: 'expense', color: '#9E9E9E', group: 'Công việc' },

    { id: 'bt1', name: 'Ăn uống', icon: '🍲', type: 'expense', color: '#FF5722', group: 'Bản thân' },
    { id: 'bt2', name: 'PT bản thân', icon: '📚', type: 'expense', color: '#9C27B0', group: 'Bản thân' },
    { id: 'bt3', name: 'Trả nợ', icon: '💸', type: 'expense', color: '#F44336', group: 'Bản thân' },
    { id: 'bt4', name: 'Lỗ đầu cơ', icon: '📉', type: 'expense', color: '#E91E63', group: 'Bản thân' },
    { id: 'bt5', name: 'Khác (Bản thân)', icon: '👤', type: 'expense', color: '#9E9E9E', group: 'Bản thân' },

    { id: 'ba1', name: 'Học phí', icon: '🎓', type: 'expense', color: '#03A9F4', group: 'Be và An' },
    { id: 'ba2', name: 'Sữa bỉm', icon: '🍼', type: 'expense', color: '#FFEB3B', group: 'Be và An' },
    { id: 'ba3', name: 'Phát sinh (B&A)', icon: '🧸', type: 'expense', color: '#8BC34A', group: 'Be và An' },
    { id: 'ba4', name: 'Khác (B&A)', icon: '👦', type: 'expense', color: '#9E9E9E', group: 'Be và An' },

    { id: 'dc1', name: 'Mua đồ chơi', icon: '🎮', type: 'expense', color: '#FFEB3B', group: 'Đồ chơi' },
    { id: 'dc2', name: 'Đi chơi', icon: '🎢', type: 'expense', color: '#00BCD4', group: 'Đồ chơi' },
    { id: 'dc3', name: 'Game', icon: '🕹️', type: 'expense', color: '#9C27B0', group: 'Đồ chơi' },
    { id: 'dc4', name: 'Khác (Đồ chơi)', icon: '🧩', type: 'expense', color: '#9E9E9E', group: 'Đồ chơi' },

    { id: 'gd1', name: 'Mua đồ gia đình', icon: '🛒', type: 'expense', color: '#E91E63', group: 'Mua sắm & Phát sinh' },
    { id: 'ps1', name: 'Phát sinh', icon: '⚠️', type: 'expense', color: '#FF5722', group: 'Mua sắm & Phát sinh' },

    { id: 'v1', name: 'Đồ cho vợ', icon: '👗', type: 'expense', color: '#E91E63', group: 'Vợ' },
    { id: 'v2', name: 'Khác (Vợ)', icon: '👩', type: 'expense', color: '#9E9E9E', group: 'Vợ' },

    // --- Khoản thu ---
    { id: 'inc1', name: 'Lương', icon: '💵', type: 'income', color: '#4CAF50', group: 'Lương' },
    { id: 'inc2', name: 'Thu nhận', icon: '🎁', type: 'income', color: '#00BCD4', group: 'Thu nhập khác' },
    { id: 'inc3', name: 'Lãi đầu cơ', icon: '📈', type: 'income', color: '#FF9800', group: 'Thu nhập khác' },
    { id: 'inc4', name: 'Tiền hoàn trả', icon: '↩️', type: 'income', color: '#8BC34A', group: 'Thu nhập khác' }
];

function TransactionForm({ onSave, onCancel, onDelete, initialDate, initialData, customCategories = [] }) {
    const [formType, setFormType] = useState(initialData ? initialData.type : 'expense');
    const [amount, setAmount] = useState(initialData ? initialData.amount.toString() : '0');
    const [note, setNote] = useState(initialData ? (initialData.note || '') : '');

    // Parse initial date from string or Firestore timestamp/Date
    let parsedDate = initialDate || new Date().toISOString().split('T')[0];
    if (initialData && initialData.date) {
        const d = initialData.date instanceof Date ? initialData.date : new Date(initialData.date);
        parsedDate = d.toISOString().split('T')[0];
    }
    const [date, setDate] = useState(parsedDate);

    const [allCats, setAllCats] = useState(() => {
        const catMap = new Map();
        [...defaultCategories, ...customCategories].forEach(c => catMap.set(c.id, c));
        return Array.from(catMap.values());
    });
    const currentCats = allCats.filter(c => c.type === formType);
    const [selectedCat, setSelectedCat] = useState(currentCats[0]);

    const [showAddCat, setShowAddCat] = useState(false);
    const [newCatName, setNewCatName] = useState('');

    useEffect(() => {
        const typeCats = allCats.filter(c => c.type === formType);

        let foundCat = typeCats[0];
        if (initialData && initialData.type === formType) {
            foundCat = typeCats.find(c => c.name === initialData.category) || typeCats[0];
        } else if (selectedCat && selectedCat.type === formType) {
            foundCat = typeCats.find(c => c.id === selectedCat.id) || typeCats[0];
        }

        setSelectedCat(foundCat);
    }, [formType, allCats]);

    useEffect(() => {
        const typeCats = allCats.filter(c => c.type === formType);

        let foundCat = typeCats[0];
        if (initialData && initialData.type === formType) {
            foundCat = typeCats.find(c => c.name === initialData.category) || typeCats[0];
        } else if (selectedCat && selectedCat.type === formType) {
            foundCat = typeCats.find(c => c.id === selectedCat.id) || typeCats[0];
        }

        setSelectedCat(foundCat);
    }, [formType, allCats]);

    const handleAddCategory = () => {
        if (!newCatName.trim()) return;
        const newCat = {
            id: 'custom_' + Date.now(),
            name: newCatName,
            icon: '✨',
            type: formType,
            color: formType === 'expense' ? '#FF9800' : '#4CAF50',
            group: formType === 'income' ? 'Lương' : 'Khác' // Map to Luong group for income 
        };
        setAllCats(prev => [...prev, newCat]);
        setNewCatName('');
        setShowAddCat(false);
    };

    const handleSave = () => {
        if (Number(amount) === 0) return;
        onSave({
            ...(initialData ? { id: initialData.id } : {}),
            amount: Number(amount),
            category: selectedCat?.name || 'Khác',
            icon: selectedCat?.icon || '💰',
            color: selectedCat?.color || '#999',
            group: selectedCat?.group || (formType === 'income' ? 'Khác (Thu)' : 'Khác (Chi)'),
            type: formType,
            note,
            date: new Date(date),
            customCategories: allCats.filter(c => c.id.startsWith('custom_'))
        });
    };

    return (
        <div className="form-overlay">
            <div className="form-container">
                <div className="form-header-simple">
                    <button className="back-home-btn" onClick={onCancel}>✕ Thoát</button>
                    <h2>{initialData ? 'Sửa giao dịch' : (formType === 'expense' ? 'Ghi khoản chi' : 'Ghi khoản thu')}</h2>
                    {initialData && onDelete ? (
                        <button className="del-btn" style={{ position: 'absolute', right: '1rem', background: 'none', border: 'none', color: '#D32F2F', fontWeight: 'bold' }} onClick={() => onDelete(initialData.id)}>Xóa</button>
                    ) : <span></span>}
                </div>

                <div className="form-tabs-top">
                    <div className={`form-tab-item ${formType === 'expense' ? 'active expense' : ''}`} onClick={() => setFormType('expense')}>Khoản Chi</div>
                    <div className={`form-tab-item ${formType === 'income' ? 'active income' : ''}`} onClick={() => setFormType('income')}>Khoản Thu</div>
                </div>

                <div className="form-body-scroll">
                    <div className="input-group-top">
                        <div className="field-row">
                            <label>Ngày</label>
                            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                        </div>
                        <div className="field-row">
                            <label>Ghi chú</label>
                            <input type="text" placeholder="Thêm ghi chú" value={note} onChange={(e) => setNote(e.target.value)} />
                        </div>
                        <div className="field-row amount-row">
                            <label>Tiền {formType === 'expense' ? 'chi' : 'thu'}</label>
                            <div className="amount-input-wrapper">
                                <input type="number"
                                    className="amount-input-native"
                                    value={amount === '0' ? '' : amount}
                                    onChange={(e) => setAmount(e.target.value || '0')}
                                    placeholder="0"
                                />
                                <span className="currency-symbol">đ</span>
                            </div>
                            <button className="inline-action-btn" onClick={handleSave}>
                                Nhập
                            </button>
                        </div>
                    </div>

                    <div className="category-section">
                        <div className="cat-title-bar">
                            <h3>Danh mục</h3>
                            <button className="add-cat-btn" onClick={() => setShowAddCat(true)}>+ Thêm mục</button>
                        </div>

                        {showAddCat && (
                            <div className="add-cat-miniform">
                                <input
                                    placeholder="Tên hạng mục mới..."
                                    value={newCatName}
                                    onChange={(e) => setNewCatName(e.target.value)}
                                    autoFocus
                                />
                                <button onClick={handleAddCategory}>OK</button>
                                <button className="cancel" onClick={() => setShowAddCat(false)}>Hủy</button>
                            </div>
                        )}

                        <div className="category-groups-scroll">
                            {Object.entries(
                                currentCats.reduce((acc, cat) => {
                                    const key = cat.group || 'Khác';
                                    if (!acc[key]) acc[key] = [];
                                    acc[key].push(cat);
                                    return acc;
                                }, {})
                            ).map(([groupName, cats]) => (
                                <div key={groupName} className="cat-group-wrapper">
                                    <div className="cat-group-title">{groupName}</div>
                                    <div className="category-grid">
                                        {cats.map(cat => (
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
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default TransactionForm;
