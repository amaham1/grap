'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || '로그인에 실패했습니다.');
        return;
      }
      router.push('/admin/dashboard');
    } catch (err) {
      console.error(err);
      setError('요청 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md p-6 bg-white rounded shadow-lg border border-gray-100">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">관리자 로그인</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <label htmlFor="email" className="block mb-1 text-gray-700">이메일</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-2 border border-gray-300 rounded mb-4 bg-white text-gray-900"
        />
        <label htmlFor="password" className="block mb-1 text-gray-700">비밀번호</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-2 border border-gray-300 rounded mb-6 bg-white text-gray-900"
        />
        <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow-md">로그인</button>
      </form>
    </div>
  );
}
