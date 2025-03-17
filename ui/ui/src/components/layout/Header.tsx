import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-purple-800">Ani-Sage</span>
            </Link>
          </div>
          
          {/* Desktop navigation */}
          <nav className="hidden md:flex space-x-8 items-center">
            <Link to="/questions" className="text-gray-600 hover:text-purple-900">
              Questionnaire
            </Link>
            <Link to="/recommendations" className="text-gray-600 hover:text-purple-900">
              Recommendations
            </Link>
            <Link to="/profile" className="text-gray-600 hover:text-purple-900">
              Profile
            </Link>
          </nav>
          
          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-purple-900 hover:bg-gray-100 focus:outline-none"
            >
              <svg 
                className="h-6 w-6" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t">
            <Link 
              to="/questions" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-purple-900 hover:bg-gray-50"
              onClick={() => setIsMenuOpen(false)}
            >
              Questionnaire
            </Link>
            <Link 
              to="/recommendations" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-purple-900 hover:bg-gray-50"
              onClick={() => setIsMenuOpen(false)}
            >
              Recommendations
            </Link>
            <Link 
              to="/profile" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-purple-900 hover:bg-gray-50"
              onClick={() => setIsMenuOpen(false)}
            >
              Profile
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}