import React, { useState } from 'react';
import './Auth.css';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

function Auth({ onLogin }) {
    const [loginID, setLoginID] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [step, setStep] = useState(1); // 1: Check ID, 2: Register Name
    const [loading, setLoading] = useState(false);

    const checkAccount = async (e) => {
        e.preventDefault();
        if (!loginID.trim()) return;

        setLoading(true);
        try {
            const userRef = doc(db, "users", loginID.trim().toLowerCase());
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const data = userSnap.data();
                onLogin(loginID.trim().toLowerCase(), data.displayName);
            } else {
                setStep(2);
            }
        } catch (error) {
            alert("Lỗi kết nối: " + error.message);
        }
        setLoading(false);
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!displayName.trim()) return;

        setLoading(true);
        try {
            const id = loginID.trim().toLowerCase();
            const name = displayName.trim();
            await setDoc(doc(db, "users", id), {
                displayName: name,
                createdAt: new Date()
            });
            onLogin(id, name);
        } catch (error) {
            alert("Lỗi đăng ký: " + error.message);
        }
        setLoading(false);
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-logo">🐷</div>
                <h1>Xin chào!</h1>
                <p>Vui lòng thiết lập tài khoản của anh</p>

                {step === 1 ? (
                    <form onSubmit={checkAccount}>
                        <div className="input-group-auth">
                            <label>Tên đăng nhập</label>
                            <input
                                type="text"
                                placeholder="Nhập tên đăng nhập của anh..."
                                value={loginID}
                                onChange={(e) => setLoginID(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                        <button type="submit" disabled={loading}>
                            {loading ? 'Đang kiểm tra...' : 'Tiếp tục'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleRegister}>
                        <div className="welcome-msg">
                            Tài khoản <b>{loginID}</b> là thành viên mới! ✨
                        </div>
                        <div className="input-group-auth">
                            <label>Tên hiển thị (Nickname)</label>
                            <input
                                type="text"
                                placeholder="Ví dụ: Anh Thưởng..."
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                        <button type="submit" disabled={loading}>
                            {loading ? 'Đang khởi tạo...' : 'Bắt đầu dùng ngay'}
                        </button>
                        <button type="button" className="btn-back" onClick={() => setStep(1)}>Quay lại</button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default Auth;
