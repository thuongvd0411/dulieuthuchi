import React, { useState } from 'react';
import './Auth.css';

function Auth({ onLogin }) {
    const [loginID, setLoginID] = useState(localStorage.getItem('expense_login_id') || '');
    const [displayName, setDisplayName] = useState(localStorage.getItem('expense_display_name') || '');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (loginID.trim() && displayName.trim()) {
            onLogin(loginID.trim(), displayName.trim());
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-logo">🐷</div>
                <h1>Chào mừng anh Thưởng!</h1>
                <p>Vui lòng thiết lập tài khoản của anh</p>
                <form onSubmit={handleSubmit}>
                    <div className="input-group-auth">
                        <label>Tên đăng nhập (Dùng để login)</label>
                        <input
                            type="text"
                            placeholder="Ví dụ: thuongvd0411"
                            value={loginID}
                            onChange={(e) => setLoginID(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group-auth">
                        <label>Tên hiển thị (Nickname)</label>
                        <input
                            type="text"
                            placeholder="Ví dụ: Anh Thưởng"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit">Vào ứng dụng</button>
                </form>
            </div>
        </div>
    );
}

export default Auth;
