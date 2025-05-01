'use client';

import { useState, useEffect } from 'react';

interface Exhibition {
  seq: number;
  title: string;
  category?: string;
  categoryName?: string;
  startDate?: string;
  endDate?: string;
  approved: boolean;
}

export default function ExternalExhibitionsPage() {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);

  useEffect(() => {
    fetch('/api/external-exhibitions')
      .then(res => res.json())
      .then(json => {
        if (json.success) setExhibitions(json.data);
      });
  }, []);

  const toggleApproval = async (seq: number, current: boolean) => {
    const res = await fetch(`/api/admin/external-exhibitions/${seq}/approve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved: !current }),
    });
    const json = await res.json();
    if (json.success) {
      setExhibitions(exhibitions.map(ex => ex.seq === seq ? json.exhibition : ex));
    }
  };

  return (
    <div className="p-4 bg-white">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">외부 전시 목록</h1>
      <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seq</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">카테고리</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">시작일</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">종료일</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">승인</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {exhibitions.map(ex => (
              <tr key={ex.seq} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ex.seq}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ex.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ex.categoryName ?? ex.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ex.startDate ?? '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ex.endDate ?? '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${ex.approved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {ex.approved ? '승인' : '미승인'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button 
                    onClick={() => toggleApproval(ex.seq, ex.approved)} 
                    className={`px-3 py-1 text-sm font-medium shadow-sm rounded-md ${ex.approved ? 'bg-gray-100 hover:bg-gray-200 text-gray-800' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}>
                    {ex.approved ? '비승인' : '승인'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
