import React, { useState, useEffect } from 'react';
import './App.css';
import { db } from './firebase';
import { collection, query, onSnapshot, addDoc, serverTimestamp, where, deleteDoc, getDocs } from 'firebase/firestore';
import TransactionForm from './components/TransactionForm';
import Auth from './components/Auth';

function App() {
  const [loginID, setLoginID] = useState(localStorage.getItem('expense_login_id'));
  const [displayName, setDisplayName] = useState(localStorage.getItem('expense_display_name'));

  const [activeTab, setActiveTab] = useState('ledger');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!loginID) return;
    setLoading(true);
    // Simple query WITHOUT orderby and where on different fields to avoid index requirement
    const q = query(
      collection(db, "transactions"),
      where("userId", "==", loginID)
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
      // Client-side sorting for DESC date
      transData.sort((a, b) => b.date - a.date);
      setTransactions(transData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [loginID]);

  const handleLogin = (id, name) => {
    localStorage.setItem('expense_login_id', id);
    localStorage.setItem('expense_display_name', name);
    setLoginID(id);
    setDisplayName(name);
  };

  const handleLogout = () => {
    if (window.confirm("Đăng xuất tài khoản hiện tại?")) {
      localStorage.removeItem('expense_login_id');
      localStorage.removeItem('expense_display_name');
      setLoginID(null);
      setDisplayName(null);
    }
  };

  const clearData = async () => {
    if (window.confirm("Xóa HẾT dữ liệu của anh trên mây? Thao tác này không thể hoàn tác!")) {
      const q = query(collection(db, "transactions"), where("userId", "==", loginID));
      const snapshot = await getDocs(q);
      const batch = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(batch);
      alert("Đã xóa sạch dữ liệu ạ!");
    }
  };

  const handleSaveTransaction = async (data) => {
    try {
      await addDoc(collection(db, "transactions"), {
        ...data,
        userId: loginID,
        createdAt: serverTimestamp()
      });
      setShowForm(false);
    } catch (error) {
      console.error("Error: ", error);
      alert("Lỗi lưu dữ liệu: " + error.message);
    }
  };

  if (!loginID) return <Auth onLogin={handleLogin} />;

  // Filter for current month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Grouping for Ledger
  const groupedTransactions = transactions.reduce((groups, trans) => {
    const dateStr = trans.date.toLocaleDateString('vi-VN');
    if (!groups[dateStr]) groups[dateStr] = [];
    groups[dateStr].push(trans);
    return groups;
  }, {});

  // Grouping for Calendar
  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const days = [...Array(getDaysInMonth(currentMonth, currentYear))].map((_, i) => {
    const day = i + 1;
    const dayTrans = transactions.filter(t => t.date.getDate() === day && t.date.getMonth() === currentMonth && t.date.getFullYear() === currentYear);
    const income = dayTrans.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = dayTrans.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { day, income, expense };
  });

  const totalIncome = transactions.filter(t => t.date.getMonth() === currentMonth && t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.date.getMonth() === currentMonth && t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="container">
      <header>
        <div className="user-info-bar">
          <div className="user-greet">
            <span>Chào mừng, <b>{displayName}</b> 🐷</span>
            <small>ID: {loginID}</small>
          </div>
          <div className="header-actions">
            <button className="sync-btn" onClick={() => window.location.reload()} title="Đồng bộ">🔄</button>
            <button className="settings-btn" onClick={() => setActiveTab('settings')}>⚙️</button>
          </div>
        </div>
      </header>

      <main className="content">
        {activeTab === 'ledger' && (
          <div className="ledger-view">
            <div className="summary-card-modern">
              <div className="month-display">Tháng 0{currentMonth + 1}/{currentYear}</div>
              <div className="stat-grid">
                <div className="stat-item income">
                  <label>Thu nhập</label>
                  <p>+{totalIncome.toLocaleString()}</p>
                </div>
                <div className="stat-item expense">
                  <label>Chi tiêu</label>
                  <p>-{totalExpense.toLocaleString()}</p>
                </div>
                <div className="stat-item balance">
                  <label>Còn lại</label>
                  <p>{(totalIncome - totalExpense).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {loading ? <p className="center-msg">🔄 Đang tải dữ liệu...</p> : transactions.length === 0 ?
              <div className="empty-state">
                <div className="icon">🐷</div>
                <p>Chưa có dữ liệu nào.<br />Nhấn (+) để bắt đầu ghi chép!</p>
              </div> :
              Object.keys(groupedTransactions).map(dateStr => (
                <div key={dateStr} className="day-group">
                  <div className="day-header-modern">
                    <span className="date-num">{dateStr.split('/')[0]}</span>
                    <div className="date-details">
                      <span className="day-text">Tháng 0{dateStr.split('/')[1]}</span>
                      <span className="year-text">{dateStr.split('/')[2]}</span>
                    </div>
                    <div className="day-total-summary">
                      {groupedTransactions[dateStr].some(t => t.type === 'expense') &&
                        <span className="neg">-{groupedTransactions[dateStr].filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0).toLocaleString()}</span>
                      }
                      {groupedTransactions[dateStr].some(t => t.type === 'income') &&
                        <span className="pos">+{groupedTransactions[dateStr].filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0).toLocaleString()}</span>
                      }
                    </div>
                  </div>
                  {groupedTransactions[dateStr].map(t => (
                    <div key={t.id} className="transaction-item-modern">
                      <div className="cat-icon-wrap" style={{ backgroundColor: t.color + '15', color: t.color }}>{t.icon}</div>
                      <div className="trans-body">
                        <div className="top">
                          <span className="cat">{t.category}</span>
                          <span className={`amount ${t.type}`}>{t.type === 'expense' ? '-' : '+'}{t.amount.toLocaleString()}</span>
                        </div>
                        <div className="note">{t.note || '-'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            }
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="calendar-view">
            <div className="calendar-header-title">Lịch chi tiêu 0{currentMonth + 1}/{currentYear}</div>
            <div className="calendar-grid">
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => <div key={d} className="cal-weekday">{d}</div>)}
              {/* Empty days before 1st of month - simplified */}
              {[...Array(new Date(currentYear, currentMonth, 1).getDay())].map((_, i) => <div key={i} className="cal-day empty"></div>)}
              {days.map(d => (
                <div key={d.day} className={`cal-day ${d.income || d.expense ? 'has-data' : ''}`}>
                  <span className="day-num">{d.day}</span>
                  <div className="day-amounts">
                    {d.income > 0 && <span className="pos">{Math.round(d.income / 1000)}k</span>}
                    {d.expense > 0 && <span className="neg">{Math.round(d.expense / 1000)}k</span>}
                  </div>
                </div>
              ))}
            </div>
            <div className="calendar-meta">
              <p>* Đơn vị: nghìn đồng (k)</p>
            </div>
          </div>
        )}

        {activeTab === 'report' && (
          <div className="report-view-modern">
            <h2>Báo cáo chi tiêu</h2>
            <div className="donut-container">
              <div className="donut-chart" style={{ background: `conic-gradient(var(--primary-color) 0% 70%, #EEE 70% 100%)` }}>
                <div className="inner">
                  <label>Tổng chi</label>
                  <p>{totalExpense.toLocaleString()}đ</p>
                </div>
              </div>
            </div>
            <p className="center-msg-small">Phân tích hạng mục sắp ra mắt!</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-view-modern">
            <div className="section">
              <h3>Tài khoản</h3>
              <div className="info-box">
                <p>Tên đăng nhập: <b>{loginID}</b></p>
                <p>Tên hiển thị: <b>{displayName}</b></p>
              </div>
              <button className="btn-secondary" onClick={handleLogout}>Đăng xuất / Đổi tên</button>
            </div>
            <div className="section">
              <h3>Dữ liệu</h3>
              <button className="btn-danger" onClick={clearData}>Xóa toàn bộ dữ liệu trên Cloud</button>
            </div>
            <p className="footer-credits">Alla Finance v5.5<br />Dành cho di động</p>
          </div>
        )}
      </main>

      <nav className="bottom-nav">
        <div className={`nav-item ${activeTab === 'ledger' ? 'active' : ''}`} onClick={() => setActiveTab('ledger')}>
          <span className="icon">📋</span>
          <span className="label">Hàng tháng</span>
        </div>
        <div className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>
          <span className="icon">📅</span>
          <span className="label">Lịch</span>
        </div>
        <div className="nav-item fab-center" onClick={() => setShowForm(true)}>
          <div className="plus-icon">+</div>
        </div>
        <div className={`nav-item ${activeTab === 'report' ? 'active' : ''}`} onClick={() => setActiveTab('report')}>
          <span className="icon">📊</span>
          <span className="label">Báo cáo</span>
        </div>
        <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <span className="icon">⚙️</span>
          <span className="label">Khác</span>
        </div>
      </nav>

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
