export default function AllJejuFooter() {
  return (
    <footer className="bg-white border-t border-gray-200 py-8 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center">
          <div className="text-primary font-bold text-xl mb-4">GRAP</div>
          <div className="flex space-x-6 mb-4">
            <a href="#" className="text-gray-500 hover:text-primary transition-colors">이용약관</a>
            <a href="#" className="text-gray-500 hover:text-primary transition-colors">개인정보처리방침</a>
            <a href="#" className="text-gray-500 hover:text-primary transition-colors">고객센터</a>
          </div>
          <div className="text-center text-sm text-gray-500">
            <p>{new Date().getFullYear()} GRAP. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
