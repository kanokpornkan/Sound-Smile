import React, { useState } from 'react';

export default function EditProfile() {
  const [username, setUsername] = useState('Gwen Noah');
  const [email, setEmail] = useState('gwen.noah@example.com');
  const [bio, setBio] = useState('Music lover & Creator.');
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150');
  const [tiktok, setTiktok] = useState('@gwennoah');
  const [instagram, setInstagram] = useState('@gwen_n');
  const [facebook, setFacebook] = useState('Gwen Noah');

  const handleSave = (e) => {
    e.preventDefault();
    console.log({ username, email, bio, avatar, tiktok, instagram, facebook });
    alert('บันทึกข้อมูลเรียบร้อยแล้ว');
  };

  return (
    <div className="min-h-screen p-8 flex justify-center items-center" style={{ backgroundColor: '#041228', color: '#DDDDDD' }}>
      <div className="w-full max-w-2xl p-8 rounded-2xl shadow-2xl border border-[#19427D]/40 backdrop-blur-md bg-[#041228]/80">
        
        <h1 className="text-2xl font-bold mb-6 border-b border-[#19427D]/50 pb-4">แก้ไขโปรไฟล์</h1>

        <form onSubmit={handleSave} className="space-y-6">
          
          <div className="flex items-center space-x-6">
            <img 
              src={avatar} 
              alt="Avatar Preview" 
              className="w-20 h-20 rounded-full object-cover border-2 border-[#19427D]" 
            />
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">ลิงก์รูปโปรไฟล์ (Avatar URL)</label>
              <input 
                type="text" 
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-[#041228] border border-[#19427D] text-white text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">ชื่อที่แสดง</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-[#041228] border border-[#19427D] text-white focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">อีเมล</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-[#041228] border border-[#19427D] text-white focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Bio (แนะนำตัวสั้นๆ)</label>
            <textarea 
              rows="3"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[#041228] border border-[#19427D] text-white focus:outline-none focus:border-blue-400"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">TikTok</label>
              <input 
                type="text" 
                value={tiktok}
                onChange={(e) => setTiktok(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#041228] border border-[#19427D] text-white text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Instagram</label>
              <input 
                type="text" 
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#041228] border border-[#19427D] text-white text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Facebook</label>
              <input 
                type="text" 
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#041228] border border-[#19427D] text-white text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button 
              type="submit" 
              className="px-6 py-3 rounded-lg font-semibold text-white shadow-lg hover:opacity-90 transition-all"
              style={{ backgroundColor: '#19427D' }}
            >
              บันทึกการเปลี่ยนแปลง
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}