import Link from 'next/link';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  itemsPerPage: number;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  basePath,
  itemsPerPage,
}) => {
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    const halfMaxPages = Math.floor(maxPagesToShow / 2);

    // 항상 첫 페이지 추가
    pageNumbers.push(1);

    // 생략 부호 (...) 로직
    let startPage = Math.max(2, currentPage - halfMaxPages);
    let endPage = Math.min(totalPages - 1, currentPage + halfMaxPages);

    if (currentPage - halfMaxPages <= 2) {
      endPage = Math.min(totalPages - 1, maxPagesToShow -1); // 첫 페이지와 마지막 페이지를 제외하고 보여줄 페이지 수
    }

    if (currentPage + halfMaxPages >= totalPages - 1) {
      startPage = Math.max(2, totalPages - (maxPagesToShow-1) );
    }
    
    if (startPage > 2) {
      pageNumbers.push(-1); // -1은 생략 부호를 의미
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    if (endPage < totalPages - 1) {
      pageNumbers.push(-1); // -1은 생략 부호를 의미
    }
    
    // 항상 마지막 페이지 추가 (단, totalPages가 1보다 큰 경우)
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }
    // 중복 제거 (첫 페이지와 마지막 페이지가 이미 포함된 경우)
    return [...new Set(pageNumbers)]; 
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="mt-10 flex justify-center">
      <nav className="flex items-center">
        {/* 이전 페이지 버튼 */}
        {currentPage > 1 ? (
          <Link
            href={`${basePath}?page=${currentPage - 1}&size=${itemsPerPage}`}
            className="mr-2 p-2 rounded border border-gray-300 text-gray-500 hover:bg-gray-50 transition-colors"
            aria-label="Previous Page"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        ) : (
          <span className="mr-2 p-2 rounded border border-gray-200 text-gray-300 cursor-not-allowed">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </span>
        )}

        {/* 페이지 번호들 */}
        <div className="flex space-x-1">
          {pageNumbers.map((pageNumber, index) =>
            pageNumber === -1 ? (
              <span key={`ellipsis-${index}`} className="w-10 h-10 flex items-center justify-center text-gray-500">
                ...
              </span>
            ) : (
              <Link
                key={pageNumber}
                href={`${basePath}?page=${pageNumber}&size=${itemsPerPage}`}
                className={`w-10 h-10 flex items-center justify-center rounded transition-colors 
                  ${
                    pageNumber === currentPage
                      ? 'bg-[#ff9f00] text-white cursor-default'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                aria-current={pageNumber === currentPage ? 'page' : undefined}
              >
                {pageNumber}
              </Link>
            )
          )}
        </div>

        {/* 다음 페이지 버튼 */}
        {currentPage < totalPages ? (
          <Link
            href={`${basePath}?page=${currentPage + 1}&size=${itemsPerPage}`}
            className="ml-2 p-2 rounded border border-gray-300 text-gray-500 hover:bg-gray-50 transition-colors"
            aria-label="Next Page"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ) : (
          <span className="ml-2 p-2 rounded border border-gray-200 text-gray-300 cursor-not-allowed">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        )}
      </nav>
    </div>
  );
};

export default PaginationControls;
