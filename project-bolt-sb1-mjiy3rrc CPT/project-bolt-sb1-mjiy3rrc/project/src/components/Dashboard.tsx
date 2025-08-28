import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { Star, TrendingUp, Award, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user } = useUser();
  const [animateCoins, setAnimateCoins] = useState(false);

  useEffect(() => {
    setAnimateCoins(true);
    const timer = setTimeout(() => setAnimateCoins(false), 1000);
    return () => clearTimeout(timer);
  }, [user.points]);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Gold': return 'text-yellow-500 bg-yellow-50';
      case 'Silver': return 'text-gray-500 bg-gray-50';
      default: return 'text-amber-600 bg-amber-50';
    }
  };

  const getTierProgress = () => {
    const thresholds = { Bronze: 20000, Silver: 50000 };
    if (user.tier === 'Gold') return 100;
    
    const nextThreshold = user.tier === 'Bronze' ? thresholds.Bronze : thresholds.Silver;
    return Math.min((user.totalSent / nextThreshold) * 100, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6 pt-8">
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome back, {user.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-600 mt-1">Ready to earn more rewards?</p>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl p-6 mb-6 text-white card-hover">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-orange-100 text-sm">Available Balance</p>
              <p className="text-3xl font-bold">R{user.balance.toLocaleString()}</p>
            </div>
            <div className={`px-3 py-1 rounded-full ${getTierColor(user.tier)} text-sm font-medium`}>
              {user.tier}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="bg-white/20 rounded-full h-2 mb-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-1000 progress-bar"
              style={{ width: `${getTierProgress()}%` }}
            />
          </div>
          <p className="text-orange-100 text-xs">
            {user.tier === 'Gold' ? 'Gold tier achieved!' : 
             `R${(user.tier === 'Bronze' ? 20000 : 50000) - user.totalSent} to ${user.tier === 'Bronze' ? 'Silver' : 'Gold'}`}
          </p>
        </div>

        {/* Points Card */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Loyalty Points</p>
              <div className="flex items-center mt-1">
                <p className="text-3xl font-bold gradient-text">{user.points}</p>
                {animateCoins && (
                  <Star className="w-6 h-6 text-orange-500 ml-2 coin-collect" />
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl flex items-center justify-center float-animation">
                <Star className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </div>
          <p className="text-gray-400 text-xs mt-4">
            Earn 1 point for every R100 sent
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Link to="/send" className="group">
            <div className="bg-white rounded-2xl p-4 shadow-lg card-hover group">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-3">
                <ArrowUpRight className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="font-semibold text-gray-800">Send Money</h3>
              <p className="text-gray-500 text-xs mt-1">Quick & secure transfers</p>
            </div>
          </Link>
          
          <Link to="/rewards" className="group">
            <div className="bg-white rounded-2xl p-4 shadow-lg card-hover">
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mb-3">
                <Award className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="font-semibold text-gray-800">Rewards</h3>
              <p className="text-gray-500 text-xs mt-1">Redeem amazing prizes</p>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Recent Activity</h3>
            <Link to="/points" className="text-orange-500 text-sm">View all</Link>
          </div>
          
          {user.transactions.slice(0, 3).map(transaction => (
            <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  transaction.type === 'send' ? 'bg-green-100' : 'bg-purple-100'
                }`}>
                  {transaction.type === 'send' ? 
                    <ArrowUpRight className="w-5 h-5 text-green-500" /> :
                    <Award className="w-5 h-5 text-purple-500" />
                  }
                </div>
                <div className="ml-3">
                  <p className="font-medium text-sm text-gray-800">
                    {transaction.type === 'send' ? `Sent to ${transaction.recipient}` : `Redeemed ${transaction.reward}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {transaction.date.toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${
                  transaction.type === 'send' ? 'text-green-600' : 'text-purple-600'
                }`}>
                  {transaction.type === 'send' ? '+' : ''}{transaction.points} pts
                </p>
                {transaction.type === 'send' && (
                  <p className="text-xs text-gray-400">R{transaction.amount}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;