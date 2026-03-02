import React, { useState } from 'react';
import './Auth.css';

function Auth({ onLogin }) {
    const [username, setUsername] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (username.trim()) {
            onLogin(username.trim());
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-logo">🐷</div>
                <h1>Chào mừng anh Thưởng!</h1>
                <p>Nhập tên người dùng để bắt đầu quản lý chi tiêu</p>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Tên của anh (Vídụ: Thưởng)..."
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoFocus
                    />
                    <button type="submit">Vào ứng dụng</button>
                </form>
            </div>
        </div>
    );
}

export default Auth;
