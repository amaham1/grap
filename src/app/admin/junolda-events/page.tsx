'use client';
import { useState, useEffect } from 'react';

interface JunoldaEvent {
  id: number; 
  title: string;
  beginDate: string;
  endDate: string;
  organizer: string | null;
  approved: boolean; 
}

export default function JunoldaEventsAdminPage() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const [events, setEvents] = useState<JunoldaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${basePath}/api/junolda-events`);
      if (!res.ok) throw new Error('데이터를 불러오는데 실패했습니다.');
      const json = await res.json();
      if (json.success) {
        setEvents(
          json.data.map((event: any) => ({
            ...event,
            beginDate: event.beginDate ? new Date(event.beginDate).toLocaleDateString('ko-KR') : '',
            endDate: event.endDate ? new Date(event.endDate).toLocaleDateString('ko-KR') : '',
          }))
        );
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

  const handleToggleApproval = async (id: number, currentStatus: boolean) => {
    try {
      const res = await fetch(`${basePath}/api/junolda-events`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, approved: !currentStatus }), 
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setEvents((prevEvents) =>
          prevEvents.map((e) =>
            e.id === id ? { ...e, approved: !currentStatus } : e 
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
      <h1 className="text-2xl font-bold mb-6 text-gray-800">전시문화 행사 목록</h1>
      <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">행사명</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">시작일</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">종료일</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">주최</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">승인 상태</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayedEvents.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{e.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{e.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{e.beginDate}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{e.endDate}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{e.organizer ?? '-'}</td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${e.approved ? 'text-green-600' : 'text-red-600'}`}>
                  {e.approved ? '승인됨' : '미승인'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleToggleApproval(e.id, e.approved)} 
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
