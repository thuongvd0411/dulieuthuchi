import React, { useState, useEffect, useMemo } from 'react';
import './App.css';
import { db } from './firebase';
import { collection, query, onSnapshot, addDoc, serverTimestamp, where, deleteDoc, getDocs, doc, updateDoc } from 'firebase/firestore';
import TransactionForm from './components/TransactionForm';
import Auth from './components/Auth';

const CHANGELOG = [
  {
    version: 'v6.5',
    date: '05/03/2026',
    title: 'Tinh tế Hóa luồng Nhập liệu',
    updates: [
      'Gắn cố định Menu điều hướng ở cạnh dưới màn hình.',
      'Đưa Nút Lưu/Nhập ngang hàng với số tiền để tiết kiệm không gian.',
      'Sửa lỗi tràn bàn phím mặc định và tối ưu kích thước form.',
      'Biểu đồ tròn thêm ghi chú tỷ lệ % chi tiết đính kèm.'
    ]
  },
  {
    version: 'v6.2',
    date: '02/03/2026',
    title: 'Đại tu Giao diện Di động',
    updates: [
      'Nén kích thước Bộ chọn tháng và Thẻ tóm tắt cho gọn gàng.',
      'Tái cấu trúc Header Form nhập liệu chuyên nghiệp hơn.',
      'Tăng mật độ hiển thị hạng mục (4 cột) trên màn hình nhỏ.',
      'Tinh chỉnh lại Keypad và các nút bấm cho vừa vặn.'
    ]
  },
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
  const [formInitialDate, setFormInitialDate] = useState(null);
  const [editTransaction, setEditTransaction] = useState(null);
  const [showChangelog, setShowChangelog] = useState(false);
  const [selectedGroupForChart, setSelectedGroupForChart] = useState(null);

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
    setSelectedGroupForChart(null);
  };

  const handleOpenForm = (dateStr = null) => {
    if (!dateStr) {
      const today = new Date();
      dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }
    setFormInitialDate(dateStr);
    setEditTransaction(null);
    setShowForm(true);
  };

  const handleOpenEditForm = (transaction) => {
    setEditTransaction(transaction);
    setShowForm(true);
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
      if (data.id) {
        // Update existing
        const docRef = doc(db, "transactions", data.id);
        const { id, ...updateData } = data;
        await updateDoc(docRef, updateData);
      } else {
        // Add new
        await addDoc(collection(db, "transactions"), {
          ...data,
          userId: loginID,
          createdAt: serverTimestamp()
        });
      }
      setShowForm(false);
      setEditTransaction(null);
    } catch (error) {
      console.error("Error: ", error);
      alert("Lỗi lưu dữ liệu: " + error.message);
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (window.confirm("Anh có chắc chắn muốn xóa giao dịch này không?")) {
      try {
        await deleteDoc(doc(db, "transactions", id));
        setShowForm(false);
        setEditTransaction(null);
      } catch (error) {
        console.error("Error deleting document: ", error);
        alert("Lỗi xóa dữ liệu: " + error.message);
      }
    }
  };

  if (!loginID) return <Auth onLogin={handleLogin} />;

  // Category summary for Report
  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const catSummary = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => {
    const groupName = t.group || t.category;
    if (!acc[groupName]) {
      acc[groupName] = { amount: 0, icon: t.icon, color: t.color, name: groupName };
    }
    acc[groupName].amount += t.amount;
    return acc;
  }, {});
  const sortedCats = Object.values(catSummary).sort((a, b) => b.amount - a.amount);

  const historicalData = useMemo(() => {
    if (!selectedGroupForChart) return [];

    const result = [];
    let maxHistoricalAmount = 0;
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();

      const amount = transactions.filter(t =>
        t.type === 'expense' &&
        (t.group === selectedGroupForChart || (!t.group && t.category === selectedGroupForChart)) &&
        t.date.getMonth() === m &&
        t.date.getFullYear() === y
      ).reduce((sum, t) => sum + t.amount, 0);

      if (amount > maxHistoricalAmount) maxHistoricalAmount = amount;

      result.push({
        label: `${m + 1}/${y.toString().slice(-2)}`,
        amount
      });
    }
    return { data: result, max: maxHistoricalAmount };
  }, [transactions, selectedGroupForChart, currentMonth, currentYear]);

  // Compute conic-gradient for the donut chart
  const getDonutStyle = () => {
    if (totalExpense === 0 || sortedCats.length === 0) return { background: '#eee' };

    let currentAngle = 0;
    const gradients = sortedCats.map(cat => {
      const percentage = (cat.amount / totalExpense) * 100;
      const start = currentAngle;
      const end = currentAngle + percentage;
      currentAngle += percentage;
      return `${cat.color} ${start}% ${end}%`;
    });

    return { background: `conic-gradient(${gradients.join(', ')})` };
  };

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
                    <div key={t.id} className="transaction-item-modern" onClick={() => handleOpenEditForm(t)} style={{ cursor: 'pointer' }}>
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
                  <div key={d} className={`cal-day ${income || expense ? 'has-data' : ''}`} onClick={() => {
                    const dStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    handleOpenForm(dStr);
                  }}>
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
            {selectedGroupForChart ? (
              <div className="historical-chart-container">
                <div className="historical-header">
                  <button className="back-btn" onClick={() => setSelectedGroupForChart(null)}>‹ Quay lại</button>
                  <h3>Thống kê 6 tháng: {selectedGroupForChart}</h3>
                </div>
                <div className="bar-chart-card">
                  <div className="bar-chart-wrapper">
                    {historicalData.data.map((item, idx) => {
                      const heightPc = historicalData.max === 0 ? 0 : Math.max(5, (item.amount / historicalData.max) * 100);
                      return (
                        <div key={idx} className="bar-column">
                          <span className="bar-val">{item.amount > 0 ? (item.amount / 1000).toLocaleString() + 'k' : ''}</span>
                          <div className="bar-fill" style={{ height: `${heightPc}%`, backgroundColor: idx === 5 ? 'var(--primary-color)' : '#FFCC80' }}></div>
                          <span className="bar-label">{item.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="donut-section">
                  <div className="donut-chart-complex" style={getDonutStyle()}>
                    <div className="inner-label">
                      <small>Chi tiêu</small>
                      <strong>{totalExpense.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
                <div className="report-cat-list">
                  {sortedCats.map(cat => {
                    const pct = totalExpense > 0 ? Math.round((cat.amount / totalExpense) * 100) : 0;
                    return (
                      <div key={cat.name} className="report-cat-item" onClick={() => setSelectedGroupForChart(cat.name)} style={{ cursor: 'pointer' }}>
                        <div className="cat-icon-sm" style={{ backgroundColor: cat.color + '15' }}>{cat.icon}</div>
                        <div className="cat-name-wrap">
                          <span className="name">{cat.name}</span>
                          <div className="indicator-wrap">
                            <span className="color-dot" style={{ backgroundColor: cat.color }}></span>
                            <span className="percent">{pct}%</span>
                          </div>
                        </div>
                        <div className="cat-amount-wrap">
                          <span className="val">{cat.amount.toLocaleString()}đ</span>
                          <span className="chev">›</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
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
                      <span className="badge">v6.2 ›</span>
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
        <div className="nav-item fab-center" onClick={() => handleOpenForm()}>
          <div className="plus-icon">+</div>
        </div>
        <div className={`nav-item ${activeTab === 'report' ? 'active' : ''}`} onClick={() => { setActiveTab('report'); setShowChangelog(false); setSelectedGroupForChart(null); }}>
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
          initialData={editTransaction}
          initialDate={formInitialDate}
          onSave={handleSaveTransaction}
          onDelete={handleDeleteTransaction}
          onCancel={() => { setShowForm(false); setEditTransaction(null); }}
        />
      )}
    </div>
  );
}

export default App;
