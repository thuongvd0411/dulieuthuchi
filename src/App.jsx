import React, { useState, useEffect, useMemo } from 'react';
import './App.css';
import { db } from './firebase';
import { collection, query, onSnapshot, addDoc, serverTimestamp, where, deleteDoc, getDocs } from 'firebase/firestore';
import TransactionForm from './components/TransactionForm';
import Auth from './components/Auth';

const CHANGELOG = [
  {
    version: 'v6.1',
    date: '02/03/2026',
    title: 'Sửa lỗi Auth & Tối ưu di động',
    updates: [
      'Đăng nhập không phân biệt chữ hoa/thường (thuong == THUONG).',
      'Tách biệt luồng Đăng nhập và Đăng ký chuyên nghiệp.',
      'Cải thiện tốc độ tải và fix lỗi cache trình duyệt.'
    ]
  },
  {
    version: 'v5.9',
    date: '02/03/2026',
    title: 'Hoàn thiện hệ thống & Branding',
    updates: [
      'Thêm dấu ấn "build by thuongvd & alla" tại màn hình đăng nhập.',
      'Cập nhật số phiên bản chính xác.',
      'Tập trung tối ưu hóa hiệu năng và trải nghiệm người dùng.'
    ]
  },
  {
    version: 'v5.8',
    date: '02/03/2026',
    title: 'Báo cáo Biểu đồ & Chọn Tháng',
    updates: [
      'Tích hợp bộ chọn tháng linh hoạt (‹ ›) ở thanh tiêu đề.',
      'Báo cáo biểu đồ tròn (Donut Chart) hiển thị tỷ lệ % hạng mục.',
      'Danh sách thống kê chi tiêu chi tiết theo từng hạng mục.',
      'Tự động lọc dữ liệu toàn bộ ứng dụng theo tháng được chọn.'
    ]
  },
  {
    version: 'v5.5',
    date: '02/03/2026',
    title: 'Cloud Auth & Sửa lỗi dữ liệu',
    updates: [
      'Lưu trữ tài khoản trên Cloud Firestore, hỗ trợ đăng nhập đa thiết bị.',
      'Sửa lỗi trắng trang khi tải dữ liệu từ Firebase.',
      'Cập nhật giao diện Bottom Nav hiện đại, dễ thao tác một tay.',
      'Thêm nút "Thoát" và "Thêm hạng mục" trong Form nhập tiền.'
    ]
  },
  {
    version: 'v5.0',
    date: '01/03/2026',
    title: 'Khởi tạo Alla Finance',
    updates: [
      'Xây dựng nền tảng Web App với React & Firebase.',
      'Thiết kế giao diện theo phong cách "Heo đất cam" Komorebi.',
      'Tính năng nhập Thu/Chi cơ bản và xem danh sách hàng tháng.',
      'Triển khai thành công lên GitHub Pages.'
    ]
  }
];

function App() {
  const [loginID, setLoginID] = useState(localStorage.getItem('expense_login_id'));
  const [displayName, setDisplayName] = useState(localStorage.getItem('expense_display_name'));

  const [activeTab, setActiveTab] = useState('ledger');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);

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

  // Category summary for Report
  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

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
      {/* Header & Month Picker as before */}
      <header>
        <div className="user-info-bar">
          <div className="user-greet">
            <span>Chào, <b>{displayName}</b> 🐷</span>
            <small>@{loginID}</small>
          </div>
          <div className="header-actions">
            <button className="sync-btn" onClick={() => window.location.reload()}>🔄</button>
            <button className="settings-btn" onClick={() => { setActiveTab('settings'); setShowChangelog(false); }}>⚙️</button>
          </div>
        </div>
      </header>

      <div className="month-picker-bar">
        <button onClick={() => changeMonth(-1)}>‹</button>
        <div className="current-month-label">
          {currentMonth + 1 < 10 ? `0${currentMonth + 1}` : currentMonth + 1}/{currentYear}
        </div>
        <button onClick={() => changeMonth(1)}>›</button>
      </div>

      <main className="content">
        {activeTab === 'ledger' && (
          <div className="ledger-view">
            {/* Same SummaryCard as before */}
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
                <p>Chưa có dữ liệu.</p>
              </div> :
              Object.keys(filteredTransactions.reduce((groups, trans) => {
                const dateStr = trans.date.toLocaleDateString('vi-VN');
                if (!groups[dateStr]) groups[dateStr] = [];
                groups[dateStr].push(trans);
                return groups;
              }, {})).map(dateStr => (
                <div key={dateStr} className="day-group">
                  <div className="day-header-modern">
                    <span className="date-num">{dateStr.split('/')[0]}</span>
                    <div className="date-details">
                      <span className="day-text">Tháng 0{dateStr.split('/')[1]}</span>
                      <span className="year-text">{dateStr.split('/')[2]}</span>
                    </div>
                  </div>
                  {filteredTransactions.filter(t => t.date.toLocaleDateString('vi-VN') === dateStr).map(t => (
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
              {[...Array(new Date(currentYear, currentMonth + 1, 0).getDate())].map((_, i) => {
                const d = i + 1;
                const dayTrans = filteredTransactions.filter(t => t.date.getDate() === d);
                const income = dayTrans.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
                const expense = dayTrans.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
                return (
                  <div key={d} className={`cal-day ${income || expense ? 'has-data' : ''}`}>
                    <span className="day-num">{d}</span>
                    <div className="day-amounts">
                      {income > 0 && <span className="pos">+{Math.round(income / 1000)}k</span>}
                      {expense > 0 && <span className="neg">-{Math.round(expense / 1000)}k</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'report' && (
          <div className="report-view-modern">
            <div className="donut-section">
              <div className="donut-chart-complex">
                <div className="inner-label">
                  <small>Chi tiêu</small>
                  <strong>{totalExpense.toLocaleString()}</strong>
                </div>
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-view-modern">
            {showChangelog ? (
              <div className="changelog-container">
                <div className="changelog-header">
                  <button className="back-btn" onClick={() => setShowChangelog(false)}>‹ Quay lại</button>
                  <h3>Nhật ký cập nhật</h3>
                </div>
                <div className="changelog-list">
                  {CHANGELOG.map(item => (
                    <div key={item.version} className="changelog-item">
                      <div className="ver-tag">{item.version}</div>
                      <div className="item-body">
                        <h4>{item.title} <span>({item.date})</span></h4>
                        <ul>
                          {item.updates.map((u, i) => <li key={i}>{u}</li>)}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="section">
                  <h3>Tài khoản</h3>
                  <div className="info-box">
                    <p>Chào, <b>{displayName}</b> 👋</p>
                    <p>ID của anh: <code>{loginID}</code></p>
                  </div>
                  <button className="btn-secondary" onClick={handleLogout}>Đăng xuất khỏi thiết bị</button>
                </div>

                <div className="section">
                  <h3>Bộ máy & Phiên bản</h3>
                  <div className="info-box clickable" onClick={() => setShowChangelog(true)}>
                    <div className="row-between">
                      <span>Nhật ký cập nhật</span>
                      <span className="badge">v6.1 ›</span>
                    </div>
                  </div>
                  <div className="info-box">
                    <p>Build by <b>thuongvd & alla</b></p>
                  </div>
                </div>

                <div className="section">
                  <h3>Dữ liệu mây</h3>
                  <button className="btn-danger-lite" onClick={clearData}>Xóa toàn bộ dữ liệu trên Cloud</button>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      <nav className="bottom-nav">
        <div className={`nav-item ${activeTab === 'ledger' ? 'active' : ''}`} onClick={() => { setActiveTab('ledger'); setShowChangelog(false); }}>
          <span className="icon">📋</span>
          <span className="label">Nhập vào</span>
        </div>
        <div className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => { setActiveTab('calendar'); setShowChangelog(false); }}>
          <span className="icon">📅</span>
          <span className="label">Lịch</span>
        </div>
        <div className="nav-item fab-center" onClick={() => setShowForm(true)}>
          <div className="plus-icon">+</div>
        </div>
        <div className={`nav-item ${activeTab === 'report' ? 'active' : ''}`} onClick={() => { setActiveTab('report'); setShowChangelog(false); }}>
          <span className="icon">📊</span>
          <span className="label">Báo cáo</span>
        </div>
        <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => { setActiveTab('settings'); setShowChangelog(false); }}>
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
