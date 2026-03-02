import React, { useState, useEffect, useMemo } from 'react';
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

  // Date selection state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();

  useEffect(() => {
    if (!loginID) return;
    setLoading(true);
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
      transData.sort((a, b) => b.date - a.date);
      setTransactions(transData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [loginID]);

  // Filtered transactions for the selected month
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t =>
      t.date.getMonth() === currentMonth &&
      t.date.getFullYear() === currentYear
    );
  }, [transactions, currentMonth, currentYear]);

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

  const changeMonth = (offset) => {
    const nextDate = new Date(currentYear, currentMonth + offset, 1);
    setSelectedDate(nextDate);
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

  // Grouping for Ledger
  const groupedTransactions = filteredTransactions.reduce((groups, trans) => {
    const dateStr = trans.date.toLocaleDateString('vi-VN');
    if (!groups[dateStr]) groups[dateStr] = [];
    groups[dateStr].push(trans);
    return groups;
  }, {});

  // Grouping for Calendar
  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const days = [...Array(getDaysInMonth(currentMonth, currentYear))].map((_, i) => {
    const day = i + 1;
    const dayTrans = filteredTransactions.filter(t => t.date.getDate() === day);
    const income = dayTrans.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = dayTrans.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { day, income, expense };
  });

  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  // Category summary for Report
  const catSummary = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => {
    if (!acc[t.category]) {
      acc[t.category] = { amount: 0, icon: t.icon, color: t.color, name: t.category };
    }
    acc[t.category].amount += t.amount;
    return acc;
  }, {});
  const sortedCats = Object.values(catSummary).sort((a, b) => b.amount - a.amount);

  return (
    <div className="container">
      <header>
        <div className="user-info-bar">
          <div className="user-greet">
            <span>Chào, <b>{displayName}</b> 🐷</span>
            <small>@{loginID}</small>
          </div>
          <div className="header-actions">
            <button className="sync-btn" onClick={() => window.location.reload()}>🔄</button>
            <button className="settings-btn" onClick={() => setActiveTab('settings')}>⚙️</button>
          </div>
        </div>
      </header>

      {/* Month Picker Shell */}
      <div className="month-picker-bar">
        <button onClick={() => changeMonth(-1)}>‹</button>
        <div className="current-month-label">
          {currentMonth + 1 < 10 ? `0${currentMonth + 1}` : currentMonth + 1}/{currentYear}
          <small>({getDaysInMonth(currentMonth, currentYear)} ngày)</small>
        </div>
        <button onClick={() => changeMonth(1)}>›</button>
      </div>

      <main className="content">
        {activeTab === 'ledger' && (
          <div className="ledger-view">
            <div className="summary-card-modern">
              <div className="stat-grid">
                <div className="stat-item expense">
                  <label>Chi tiêu</label>
                  <p>-{totalExpense.toLocaleString()}đ</p>
                </div>
                <div className="stat-item income">
                  <label>Thu nhập</label>
                  <p>+{totalIncome.toLocaleString()}đ</p>
                </div>
                <div className="stat-item balance">
                  <label>Thu chi</label>
                  <p>{(totalIncome - totalExpense >= 0 ? '+' : '')}{(totalIncome - totalExpense).toLocaleString()}đ</p>
                </div>
              </div>
            </div>

            {loading ? <p className="center-msg">🔄 Đang tải...</p> : filteredTransactions.length === 0 ?
              <div className="empty-state">
                <div className="icon">🐷</div>
                <p>Chưa có dữ liệu tháng này.</p>
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
                      <span className="neg">-{groupedTransactions[dateStr].filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0).toLocaleString()}</span>
                      <span className="pos">+{groupedTransactions[dateStr].filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0).toLocaleString()}</span>
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
                        <div className="note">{t.note}</div>
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
            <div className="calendar-grid">
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => <div key={d} className="cal-weekday">{d}</div>)}
              {[...Array(new Date(currentYear, currentMonth, 1).getDay())].map((_, i) => <div key={i} className="cal-day empty"></div>)}
              {days.map(d => (
                <div key={d.day} className={`cal-day ${d.income || d.expense ? 'has-data' : ''}`}>
                  <span className="day-num">{d.day}</span>
                  <div className="day-amounts">
                    {d.income > 0 && <span className="pos">+{Math.round(d.income / 1000)}k</span>}
                    {d.expense > 0 && <span className="neg">-{Math.round(d.expense / 1000)}k</span>}
                  </div>
                </div>
              ))}
            </div>
            <p className="unit-label">* Đơn vị: nghìn đồng (k)</p>
          </div>
        )}

        {activeTab === 'report' && (
          <div className="report-view-modern">
            <div className="report-header-stats">
              <div className="stat"><span>Chi tiêu</span><p className="neg">-{totalExpense.toLocaleString()}đ</p></div>
              <div className="stat"><span>Thu nhập</span><p className="pos">+{totalIncome.toLocaleString()}đ</p></div>
              <div className="stat"><span>Tổng cộng</span><p>{(totalIncome - totalExpense).toLocaleString()}đ</p></div>
            </div>

            <div className="donut-section">
              <div className="donut-chart-complex">
                <div className="inner-label">
                  <small>Chi tiêu</small>
                  <strong>{totalExpense.toLocaleString()}</strong>
                </div>
                {/* Simplified CSS Pie Chart for demonstration */}
                <div className="donut-segments"></div>
              </div>
            </div>

            <div className="report-cat-list">
              {sortedCats.map(cat => (
                <div key={cat.name} className="report-cat-item">
                  <div className="cat-icon-sm" style={{ backgroundColor: cat.color + '15' }}>{cat.icon}</div>
                  <div className="cat-name-wrap">
                    <span className="name">{cat.name}</span>
                    <span className="percent">{Math.round((cat.amount / totalExpense) * 100)}%</span>
                  </div>
                  <div className="cat-amount-wrap">
                    <span className="val">{cat.amount.toLocaleString()}đ</span>
                    <span className="arrow">›</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-view-modern">
            <div className="section">
              <h3>Tài khoản của anh</h3>
              <div className="info-box">
                <p>👤 {displayName}</p>
                <p>🆔 {loginID}</p>
              </div>
              <button className="btn-secondary" onClick={handleLogout}>Đổi tài khoản đăng nhập</button>
            </div>
            <p className="footer-credits">Alla Finance v5.8<br />🐷🧡</p>
          </div>
        )}
      </main>

      <nav className="bottom-nav">
        <div className={`nav-item ${activeTab === 'ledger' ? 'active' : ''}`} onClick={() => setActiveTab('ledger')}>
          <span className="icon">📋</span>
          <span className="label">Nhập vào</span>
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
