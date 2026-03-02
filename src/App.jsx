import React, { useState, useEffect } from 'react';
import './App.css';
import { db } from './firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, deleteDoc, getDocs } from 'firebase/firestore';
import TransactionForm from './components/TransactionForm';
import Auth from './components/Auth';

function App() {
  const [user, setUser] = useState(localStorage.getItem('expense_user'));
  const [activeTab, setActiveTab] = useState('ledger');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const q = query(
      collection(db, "transactions"),
      where("userId", "==", user),
      orderBy("date", "desc")
    );
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
  }, [user]);

  const handleLogin = (name) => {
    localStorage.setItem('expense_user', name);
    setUser(name);
  };

  const handleLogout = () => {
    if (window.confirm("Bỏ tên hiện tại? Dữ liệu vẫn được lưu trên mây theo tên của anh.")) {
      localStorage.removeItem('expense_user');
      setUser(null);
    }
  };

  const clearData = async () => {
    if (window.confirm("Anh có chắc muốn xóa HẾT dữ liệu của tên này trên Firebase không?")) {
      const q = query(collection(db, "transactions"), where("userId", "==", user));
      const snapshot = await getDocs(q);
      const batch = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(batch);
      alert("Đã xóa xong ạ!");
    }
  };

  const handleSaveTransaction = async (data) => {
    try {
      await addDoc(collection(db, "transactions"), {
        ...data,
        userId: user,
        createdAt: serverTimestamp()
      });
      setShowForm(false);
    } catch (error) {
      console.error("Error: ", error);
      alert("Lỗi lưu dữ liệu!");
    }
  };

  if (!user) return <Auth onLogin={handleLogin} />;

  // Filter for current month reports
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyTrans = transactions.filter(t => t.date.getMonth() === currentMonth && t.date.getFullYear() === currentYear);

  const totalIncome = monthlyTrans.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = monthlyTrans.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  // Grouping by category for Report
  const catSummary = monthlyTrans.filter(t => t.type === 'expense').reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});

  const groupedTransactions = transactions.reduce((groups, trans) => {
    const dateStr = trans.date.toLocaleDateString('vi-VN');
    if (!groups[dateStr]) groups[dateStr] = [];
    groups[dateStr].push(trans);
    return groups;
  }, {});

  return (
    <div className="container">
      <header>
        <div className="user-info-bar">
          <span>Chào anh, <b>{user}</b> 🐷</span>
          <button className="settings-btn" onClick={() => setActiveTab('settings')}>⚙️</button>
        </div>
      </header>

      <div className="tabs">
        <div className={`tab ${activeTab === 'ledger' ? 'active' : ''}`} onClick={() => setActiveTab('ledger')}>Hàng tháng</div>
        <div className={`tab ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>Lịch</div>
        <div className={`tab ${activeTab === 'report' ? 'active' : ''}`} onClick={() => setActiveTab('report')}>Báo cáo</div>
        <div className={`tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>Khác</div>
      </div>

      <main className="content">
        {activeTab === 'ledger' && (
          <div className="ledger-view">
            <div className="summary-card">
              <div className="month-selector">‹ 0{currentMonth + 1}/{currentYear} ›</div>
              <div className="stats-row">
                <div className="stat"><span>Chi tiêu</span><p className="neg">-{totalExpense.toLocaleString()}</p></div>
                <div className="stat"><span>Thu nhập</span><p className="pos">+{totalIncome.toLocaleString()}</p></div>
                <div className="stat"><span>Thu chi</span><p><b>{(totalIncome - totalExpense).toLocaleString()}</b></p></div>
              </div>
            </div>
            {loading ? <p className="center-msg">Đang tải...</p> : transactions.length === 0 ? <p className="center-msg">Chưa có giao dịch.</p> :
              Object.keys(groupedTransactions).map(dateStr => (
                <div key={dateStr} className="day-group">
                  <div className="day-header">
                    <div className="day-info">
                      <span className="date">{dateStr.split('/')[0]}</span>
                      <span className="day-of-week">Th {new Date(groupedTransactions[dateStr][0].date).getDay() + 1}</span>
                    </div>
                  </div>
                  {groupedTransactions[dateStr].map(t => (
                    <div key={t.id} className="transaction-item">
                      <div className="cat-icon" style={{ backgroundColor: t.color + '15', color: t.color }}>{t.icon}</div>
                      <div className="trans-info">
                        <div className="trans-cat">{t.category}</div>
                        <div className="trans-note">{t.note}</div>
                      </div>
                      <div className={`trans-amount ${t.type}`}>
                        {t.type === 'expense' ? '-' : '+'}{t.amount.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ))
            }
          </div>
        )}

        {activeTab === 'report' && (
          <div className="report-view">
            <div className="donut-wrap">
              <div className="donut" style={{ background: `conic-gradient(#FF9800 0% 40%, #4CAF50 40% 70%, #2196F3 70% 100%)` }}>
                <div className="donut-inner">
                  <span>Chi tiêu tháng</span>
                  <p>{totalExpense.toLocaleString()}đ</p>
                </div>
              </div>
            </div>
            <div className="cat-list">
              {Object.entries(catSummary).map(([cat, val]) => (
                <div key={cat} className="cat-summary-item">
                  <div className="cat-name">{cat}</div>
                  <div className="cat-val">{val.toLocaleString()}đ <small>{Math.round(val / totalExpense * 100)}%</small></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-view">
            <button className="set-action-btn" onClick={handleLogout}>Đăng xuất (Đổi tên)</button>
            <button className="set-action-btn danger" onClick={clearData}>Xóa sạch dữ liệu Firebase</button>
            <p className="version-info">Hệ thống Dữ liệu Thu Chi v5.1<br />Dành riêng cho anh Thưởng</p>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="calendar-placeholder">
            <h2>Chức năng Lịch chi tiết</h2>
            <p>Hiện tại anh có thể xem chi tiết theo ngày ở tab "Hàng tháng" rất rõ ràng rồi ạ!</p>
            <div className="calendar-grid-mock">
              {[...Array(31)].map((_, i) => <div key={i} className="cal-day">{i + 1}</div>)}
            </div>
          </div>
        )}
      </main>

      {activeTab !== 'settings' && (
        <button className="fab" onClick={() => setShowForm(true)}>+</button>
      )}

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
