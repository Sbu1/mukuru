import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Send, Star, Gift, User } from 'lucide-react';

const Navbar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-2xl border-t border-orange-100 z-50">
      <div className="flex justify-around items-center py-2">
        <Link
          to="/"
          className={`flex flex-col items-center p-3 rounded-xl transition-all ${
            isActive('/') 
              ? 'text-orange-500 bg-orange-50' 
              : 'text-gray-500 hover:text-orange-400'
          }`}
        >
          <Home className="w-6 h-6" />
          <span className="text-xs mt-1">Home</span>
        </Link>
        
        <Link
          to="/send"
          className={`flex flex-col items-center p-3 rounded-xl transition-all ${
            isActive('/send') 
              ? 'text-orange-500 bg-orange-50' 
              : 'text-gray-500 hover:text-orange-400'
          }`}
        >
          <Send className="w-6 h-6" />
          <span className="text-xs mt-1">Send</span>
        </Link>
        
        <Link
          to="/points"
          className={`flex flex-col items-center p-3 rounded-xl transition-all ${
            isActive('/points') 
              ? 'text-orange-500 bg-orange-50' 
              : 'text-gray-500 hover:text-orange-400'
          }`}
        >
          <Star className="w-6 h-6" />
          <span className="text-xs mt-1">Points</span>
        </Link>
        
        <Link
          to="/rewards"
          className={`flex flex-col items-center p-3 rounded-xl transition-all ${
            isActive('/rewards') 
              ? 'text-orange-500 bg-orange-50' 
              : 'text-gray-500 hover:text-orange-400'
          }`}
        >
          <Gift className="w-6 h-6" />
          <span className="text-xs mt-1">Rewards</span>
        </Link>
        
        <Link
          to="/profile"
          className={`flex flex-col items-center p-3 rounded-xl transition-all ${
            isActive('/profile') 
              ? 'text-orange-500 bg-orange-50' 
              : 'text-gray-500 hover:text-orange-400'
          }`}
        >
          <User className="w-6 h-6" />
          <span className="text-xs mt-1">Profile</span>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;