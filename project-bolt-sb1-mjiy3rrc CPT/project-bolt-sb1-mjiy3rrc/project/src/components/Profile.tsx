import React from 'react';
import { useUser } from '../context/UserContext';
import { User, Star, TrendingUp, Award, Settings, ChevronRight } from 'lucide-react';

const Profile: React.FC = () => {
  const { user } = useUser();

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Gold': return 'from-yellow-400 to-yellow-600';
      case 'Silver': return 'from-gray-300 to-gray-500';
      default: return 'from-amber-400 to-amber-600';
    }
  };

  const getNextTierRequirement = () => {
    if (user.tier === 'Gold') return null;
    const requirement = user.tier === 'Bronze' ? 20000 : 50000;
    const remaining = requirement - user.totalSent;
    return { tier: user.tier === 'Bronze' ? 'Silver' : 'Gold', amount: remaining };
  };

  const nextTier = getNextTierRequirement();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-md mx-auto pt-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold gradient-text mb-2">Profile</h1>
          <p className="text-gray-600">Manage your account and rewards</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg">
          <div className="flex items-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-red-500 rounded-2xl flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-bold text-gray-800">{user.name}</h2>
              <div className={`inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r ${getTierColor(user.tier)} text-white text-sm font-medium mt-1`}>
                <Award className="w-4 h-4 mr-1" />
                {user.tier} Member
              </div>
            </div>
          </div>
          
          {nextTier && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Progress to {nextTier.tier}</span>
                <span className="text-sm font-medium text-gray-800">
                  R{nextTier.amount.toLocaleString()} remaining
                </span>
              </div>
              <div className="bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-orange-400 to-red-500 rounded-full h-2 transition-all duration-1000"
                  style={{ width: `${Math.max(0, (1 - nextTier.amount / (nextTier.tier === 'Silver' ? 20000 : 50000)) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-lg card-hover">
            <div className="w-10 h-10 bg-orange-100 rounded-2xl flex items-center justify-center mb-3">
              <Star className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{user.points}</p>
            <p className="text-sm text-gray-500">Available Points</p>
          </div>
          
          <div className="bg-white rounded-2xl p-4 shadow-lg card-hover">
            <div className="w-10 h-10 bg-green-100 rounded-2xl flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-gray-800">R{user.totalSent.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Total Sent</p>
          </div>
        </div>

        {/* Achievement Badges */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg">
          <h3 className="font-semibold text-gray-800 mb-4">Achievements</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 ${
                user.transactions.length >= 5 ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <Award className={`w-6 h-6 ${
                  user.transactions.length >= 5 ? 'text-green-500' : 'text-gray-400'
                }`} />
              </div>
              <p className="text-xs text-gray-600">First 5</p>
              <p className="text-xs text-gray-400">Transactions</p>
            </div>
            
            <div className="text-center">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 ${
                user.points >= 100 ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                <Star className={`w-6 h-6 ${
                  user.points >= 100 ? 'text-blue-500' : 'text-gray-400'
                }`} />
              </div>
              <p className="text-xs text-gray-600">Century</p>
              <p className="text-xs text-gray-400">100 Points</p>
            </div>
            
            <div className="text-center">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 ${
                user.rewardsPurchased.length >= 1 ? 'bg-purple-100' : 'bg-gray-100'
              }`}>
                <Award className={`w-6 h-6 ${
                  user.rewardsPurchased.length >= 1 ? 'text-purple-500' : 'text-gray-400'
                }`} />
              </div>
              <p className="text-xs text-gray-600">First</p>
              <p className="text-xs text-gray-400">Reward</p>
            </div>
          </div>
        </div>

        {/* Menu Options */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Account Settings</h3>
          </div>
          
          <div className="divide-y divide-gray-100">
            {[
              { icon: Settings, label: 'Account Settings', description: 'Manage your account preferences' },
              { icon: Star, label: 'Loyalty Program', description: 'Learn about tier benefits' },
              { icon: Award, label: 'Rewards History', description: 'View redeemed rewards' },
            ].map((item, index) => (
              <button
                key={index}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-100 rounded-2xl flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="ml-3 text-left">
                    <p className="font-medium text-gray-800 text-sm">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;