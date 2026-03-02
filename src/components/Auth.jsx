import React, { useState } from 'react';
import './Auth.css';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

function Auth({ onLogin }) {
    const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
    const [loginID, setLoginID] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const normalizeID = (id) => id.trim().toLowerCase();

    const handleLogin = async (e) => {
        e.preventDefault();
        const id = normalizeID(loginID);
        if (!id) return;

        setLoading(true);
        setErrorMsg('');
        try {
            const userRef = doc(db, "users", id);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const data = userSnap.data();
                onLogin(id, data.displayName);
            } else {
                setErrorMsg('Tài khoản không tồn tại. Vui lòng kiểm tra lại hoặc chọn "Đăng ký".');
            }
        } catch (error) {
            setErrorMsg("Lỗi kết nối: " + error.message);
        }
        setLoading(false);
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        const id = normalizeID(loginID);
        if (!id || !displayName.trim()) return;

        setLoading(true);
        setErrorMsg('');
        try {
            const userRef = doc(db, "users", id);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                setErrorMsg('Tên đăng nhập này đã có người sử dụng. Vui lòng chọn tên khác.');
            } else {
                await setDoc(userRef, {
                    displayName: displayName.trim(),
                    createdAt: new Date()
                });
                onLogin(id, displayName.trim());
            }
        } catch (error) {
            setErrorMsg("Lỗi đăng ký: " + error.message);
        }
        setLoading(false);
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-logo">🐷</div>
                <h1>Xin chào!</h1>
                <p>Vui lòng thiết lập tài khoản của anh</p>

                <div className="auth-tabs">
                    <button
                        className={authMode === 'login' ? 'active' : ''}
                        onClick={() => { setAuthMode('login'); setErrorMsg(''); }}
                    >
                        Đăng nhập
                    </button>
                    <button
                        className={authMode === 'register' ? 'active' : ''}
                        onClick={() => { setAuthMode('register'); setErrorMsg(''); }}
                    >
                        Đăng ký
                    </button>
                </div>

                {errorMsg && <div className="auth-error">{errorMsg}</div>}

                {authMode === 'login' ? (
                    <form onSubmit={handleLogin}>
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
                        <button type="submit" disabled={loading} className="btn-main">
                            {loading ? 'Đang kiểm tra...' : 'Đăng nhập ngay'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleRegister}>
                        <div className="input-group-auth">
                            <label>Tên đăng nhập mới</label>
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
                        <button type="submit" disabled={loading} className="btn-main">
                            {loading ? 'Đang khởi tạo...' : 'Tạo tài khoản mới'}
                        </button>
                    </form>
                )}

                <div className="auth-footer">
                    build by thuongvd & alla | v6.1
                </div>
            </div>
        </div>
    );
}

export default Auth;
