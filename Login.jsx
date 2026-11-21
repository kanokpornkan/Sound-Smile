import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    console.log("Logging in with:", email, password);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#041228', color: '#DDDDDD' }}>
      <div className="w-full max-w-md p-8 rounded-2xl shadow-2xl border border-[#19427D]/40 backdrop-blur-md bg-[#041228]/80">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-wide" style={{ color: '#DDDDDD' }}>SoundShare</h1>
          <p className="text-sm mt-2 text-gray-400">เข้าสู่ระบบเพื่อจัดการเสียงและโปรไฟล์ของคุณ</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">อีเมล</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-4 py-3 rounded-lg bg-[#041228] border border-[#19427D] focus:outline-none focus:border-blue-400 text-white placeholder-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">รหัสผ่าน</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-lg bg-[#041228] border border-[#19427D] focus:outline-none focus:border-blue-400 text-white placeholder-gray-500"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-xs text-gray-400 hover:text-white"
              >
                {showPassword ? "ซ่อน" : "แสดง"}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full py-3 rounded-lg font-semibold text-white transition-all shadow-lg hover:opacity-90"
            style={{ backgroundColor: '#19427D' }}
          >
            เข้าสู่ระบบ
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-gray-400">
          ยังไม่มีบัญชีผู้ใช้ใช่ไหม?{' '}
          <Link to="/register" className="text-blue-400 hover:underline font-medium">
            สมัครสมาชิก
          </Link>
        </div>
      </div>
    </div>
  );
}