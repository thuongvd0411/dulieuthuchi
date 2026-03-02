import React, { useState, useEffect } from 'react';
import './App.css';
import { db } from './firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import TransactionForm from './components/TransactionForm';

function App() {
  const [activeTab, setActiveTab] = useState('ledger');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "transactions"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const transData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        transData.push({
          id: doc.id,
          ...data,
          date: data.date?.toDate() || new Date()
        });
      });
      setTransactions(transData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSaveTransaction = async (data) => {
    try {
      await addDoc(collection(db, "transactions"), {
        ...data,
        createdAt: serverTimestamp()
      });
      setShowForm(false);
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Lỗi khi lưu dữ liệu!");
    }
  };

  // Group transactions by date
  const groupedTransactions = transactions.reduce((groups, trans) => {
    const dateStr = trans.date.toLocaleDateString('vi-VN');
    if (!groups[dateStr]) groups[dateStr] = [];
    groups[dateStr].push(trans);
    return groups;
  }, {});

  return (
    <div className="container">
      <header>
        <h1>Dữ liệu thu chi 🐷</h1>
      </header>

      <div className="tabs">
        <div className={`tab ${activeTab === 'ledger' ? 'active' : ''}`} onClick={() => setActiveTab('ledger')}>Hàng tháng</div>
        <div className={`tab ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>Lịch</div>
        <div className={`tab ${activeTab === 'budget' ? 'active' : ''}`} onClick={() => setActiveTab('budget')}>Ngân sách</div>
        <div className={`tab ${activeTab === 'report' ? 'active' : ''}`} onClick={() => setActiveTab('report')}>Báo cáo</div>
      </div>

      <main className="content">
        {activeTab === 'ledger' && (
          <div className="ledger-view">
            {loading ? (
              <p style={{ textAlign: 'center', marginTop: '2rem' }}>Đang tải dữ liệu...</p>
            ) : transactions.length === 0 ? (
              <div style={{ textAlign: 'center', marginTop: '4rem' }}>
                <div style={{ fontSize: '4rem' }}>🐷</div>
                <p style={{ color: '#999', marginTop: '1rem' }}>Chưa có giao dịch nào.<br />Nhấn (+) để bắt đầu ghi chép!</p>
              </div>
            ) : (
              Object.keys(groupedTransactions).map(dateStr => (
                <div key={dateStr} className="day-group">
                  <div className="day-header">
                    <div className="day-info">
                      <span className="date">{dateStr.split('/')[0]}</span>
                      <span className="day-of-week">{dateStr}</span>
                    </div>
                    <div className="day-totals">
                      <span className="total-income">
                        +{groupedTransactions[dateStr]
                          .filter(t => t.type === 'income')
                          .reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                      </span>
                      <span className="total-expense">
                        -{groupedTransactions[dateStr]
                          .filter(t => t.type === 'expense')
                          .reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {groupedTransactions[dateStr].map(t => (
                    <div key={t.id} className="transaction-item">
                      <div className="cat-icon">{t.icon || '💰'}</div>
                      <div className="trans-info">
                        <div className="trans-cat">{t.category}</div>
                        <div className="trans-note">{t.note}</div>
                      </div>
                      <div className={`trans-amount ${t.type}`}>
                        {t.type === 'expense' ? '-' : '+'}{Number(t.amount).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        )}
      </main>

      <button className="fab" onClick={() => setShowForm(true)}>+</button>

      {showForm && (
        <TransactionForm
          onSave={handleSaveTransaction}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

export default App;
