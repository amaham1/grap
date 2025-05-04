'use client';
import { useState, useEffect } from 'react';

interface JejuEvent {
  seq: number;
  title: string;
  writeDate: string; 
  writer?: string;
  approved: boolean; 
}

export default function JejuEventsAdminPage() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const [events, setEvents] = useState<JejuEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${basePath}/api/jeju-events`); 
      if (!res.ok) throw new Error('데이터를 불러오는데 실패했습니다.');
      const json = await res.json();
      if (json.success) {
        setEvents(json.data.map((event: any) => ({ ...event, writeDate: event.writeDate ? new Date(event.writeDate).toLocaleDateString('ko-KR') : '' })));
      } else {
        throw new Error(json.error || '데이터 로딩 실패');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleToggleApproval = async (seq: number, currentStatus: boolean) => {
    try {
      const res = await fetch(`${basePath}/api/jeju-events`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seq: seq, approved: !currentStatus }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setEvents((prevEvents) =>
          prevEvents.map((e) =>
            e.seq === seq ? { ...e, approved: !currentStatus } : e
          )
        );
      } else {
        throw new Error(json.error || '승인 상태 변경 실패');
      }
    } catch (err) {
      alert(`오류: ${(err as Error).message}`);
    }
  };

  const totalPages = Math.ceil(events.length / ITEMS_PER_PAGE);
  const displayedEvents = events.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (loading) return <div className="p-4">로딩 중...</div>;
  if (error) return <div className="p-4 text-red-500">오류: {error}</div>;

  return (
    <div className="p-4 bg-white">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">제주 행사 목록</h1>
      <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seq</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작성일</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작성자</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">승인 상태</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayedEvents.map((e) => (
              <tr key={e.seq} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{e.seq}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{e.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{e.writeDate}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{e.writer ?? '-'}</td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${e.approved ? 'text-green-600' : 'text-red-600'}`}>
                  {e.approved ? '승인됨' : '미승인'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleToggleApproval(e.seq, e.approved)}
                    className={`px-3 py-1 rounded text-white text-xs font-medium ${e.approved ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'}`}>
                    {e.approved ? '미승인 처리' : '승인 처리'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            이전
          </button>
          <span className="mx-4 text-gray-700">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
