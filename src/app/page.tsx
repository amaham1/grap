import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <h1 className="text-4xl font-bold mb-6">안녕하세요</h1>
      <Link
        href="/alljeju"
        className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        제주도 전시문화 정보 사이트로 이동
      </Link>
    </div>
  );
}
