import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { Star, ShoppingBag, CheckCircle, Filter } from 'lucide-react';

const RewardsShop: React.FC = () => {
  const { user, rewards, redeemReward } = useUser();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showSuccess, setShowSuccess] = useState(false);
  const [redeemedReward, setRedeemedReward] = useState<string>('');

  const categories = ['All', 'Airtime', 'Shopping', 'Transport', 'Entertainment', 'Dining', 'Electronics'];

  const filteredRewards = selectedCategory === 'All' 
    ? rewards 
    : rewards.filter(reward => reward.category === selectedCategory);

  const handleRedeem = async (reward: any) => {
    if (user.points >= reward.pointsCost) {
      const success = await redeemReward(reward);
      if (success) {
        setRedeemedReward(reward.name);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-blue-50 p-4">
      <div className="max-w-md mx-auto pt-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold gradient-text mb-2">Rewards Shop</h1>
          <p className="text-gray-600">Redeem your points for amazing rewards</p>
        </div>

        {/* Points Balance */}
        <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Available Points</p>
              <p className="text-3xl font-bold">{user.points}</p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <ShoppingBag className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <Filter className="w-4 h-4 text-gray-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Categories</span>
          </div>
          <div className="flex overflow-x-auto gap-2 pb-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                    : 'bg-white text-gray-600 hover:text-gray-800'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Rewards Grid */}
        <div className="space-y-4">
          {filteredRewards.map(reward => {
            const canAfford = user.points >= reward.pointsCost;
            const isRedeemed = user.rewardsPurchased.includes(reward.id);
            
            return (
              <div key={reward.id} className="bg-white rounded-2xl shadow-lg overflow-hidden card-hover">
                <div className="flex">
                  <div className="w-24 h-24 bg-gray-200 flex-shrink-0">
                    <img 
                      src={reward.image} 
                      alt={reward.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-800 text-sm">{reward.name}</h3>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-orange-400 mr-1" />
                        <span className="text-sm font-medium text-gray-700">{reward.pointsCost}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">{reward.description}</p>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {reward.category}
                      </span>
                      
                      <button
                        onClick={() => handleRedeem(reward)}
                        disabled={!canAfford || isRedeemed}
                        className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                          isRedeemed
                            ? 'bg-green-100 text-green-600 cursor-not-allowed'
                            : canAfford
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {isRedeemed ? 'Redeemed' : canAfford ? 'Redeem' : 'Not Enough Points'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Success Modal */}
        {showSuccess && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 mx-4 max-w-sm text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Reward Redeemed!</h3>
              <p className="text-gray-600 mb-4">
                You've successfully redeemed {redeemedReward}
              </p>
              <div className="bg-orange-50 rounded-xl p-4">
                <p className="text-sm text-orange-600">
                  Check your email for redemption details
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RewardsShop;