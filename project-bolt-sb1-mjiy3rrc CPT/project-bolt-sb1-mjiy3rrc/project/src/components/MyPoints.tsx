import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { Star, TrendingUp, Award, ArrowUpRight, Calendar } from 'lucide-react';

const MyPoints: React.FC = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');

  const monthlyPoints = user.transactions
    .filter(t => t.date.getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + (t.points > 0 ? t.points : 0), 0);

  const totalEarned = user.transactions
    .reduce((sum, t) => sum + (t.points > 0 ? t.points : 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-4">
      <div className="max-w-md mx-auto pt-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold gradient-text mb-2">My Points</h1>
          <p className="text-gray-600">Track and manage your loyalty rewards</p>
        </div>

        {/* Points Summary */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-purple-100 text-sm">Available Points</p>
              <p className="text-4xl font-bold">{user.points}</p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center float-animation">
              <Star className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-purple-300/30">
            <div>
              <p className="text-purple-100 text-xs">This Month</p>
              <p className="text-xl font-bold">+{monthlyPoints}</p>
            </div>
            <div>
              <p className="text-purple-100 text-xs">Total Earned</p>
              <p className="text-xl font-bold">{totalEarned}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl p-2 mb-6 shadow-lg">
          <div className="flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                activeTab === 'overview'
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              History
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' ? (
          <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-4 shadow-lg card-hover">
                <div className="w-10 h-10 bg-green-100 rounded-2xl flex items-center justify-center mb-3">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-gray-800">{monthlyPoints}</p>
                <p className="text-sm text-gray-500">Points This Month</p>
              </div>
              
              <div className="bg-white rounded-2xl p-4 shadow-lg card-hover">
                <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center mb-3">
                  <Award className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-gray-800">{user.rewardsPurchased.length}</p>
                <p className="text-sm text-gray-500">Rewards Redeemed</p>
              </div>
            </div>

            {/* Points Timeline */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="font-semibold text-gray-800 mb-4">Points Timeline</h3>
              <div className="space-y-4">
                {user.transactions.slice(0, 5).map(transaction => (
                  <div key={transaction.id} className="flex items-center">
                    <div className="flex-shrink-0 w-3 h-3 bg-orange-400 rounded-full"></div>
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium text-gray-800">
                          {transaction.type === 'send' ? 
                            `Sent R${transaction.amount} to ${transaction.recipient}` :
                            `Redeemed ${transaction.reward}`
                          }
                        </p>
                        <span className={`text-sm font-medium ${
                          transaction.points > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.points > 0 ? '+' : ''}{transaction.points}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {transaction.date.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Transaction History</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {user.transactions.map(transaction => (
                <div key={transaction.id} className="p-4">
                  <div className="flex items-center justify-between">
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
                          {transaction.type === 'send' ? 
                            `Sent to ${transaction.recipient}` : 
                            `Redeemed ${transaction.reward}`
                          }
                        </p>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <Calendar className="w-3 h-3 mr-1" />
                          {transaction.date.toLocaleDateString()} at {transaction.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${
                        transaction.points > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.points > 0 ? '+' : ''}{transaction.points} pts
                      </p>
                      {transaction.type === 'send' && (
                        <p className="text-xs text-gray-400">R{transaction.amount}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPoints;