import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { ArrowRight, Plane, CheckCircle, Star } from 'lucide-react';

const SendMoney: React.FC = () => {
  const { user, sendMoney } = useUser();
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);

  const pointsToEarn = Math.floor(Number(amount) / 100);
  const isValidAmount = Number(amount) > 0 && Number(amount) <= user.balance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidAmount || !recipient) return;

    setIsLoading(true);
    setShowAnimation(true);

    // Show money traveling animation
    setTimeout(() => {
      sendMoney(Number(amount), recipient);
      setShowSuccess(true);
      setIsLoading(false);
    }, 2000);

    setTimeout(() => {
      setShowSuccess(false);
      setShowAnimation(false);
      setAmount('');
      setRecipient('');
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-md mx-auto pt-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">Send Money</h1>
          <p className="text-gray-600">Send money and earn loyalty points</p>
        </div>

        {/* Balance Display */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Available Balance</p>
              <p className="text-2xl font-bold text-gray-800">R{user.balance.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl flex items-center justify-center">
              <ArrowRight className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Send Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Name
                </label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Enter recipient name"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (R)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-2xl font-bold"
                  disabled={isLoading}
                />
              </div>

              {/* Points Preview */}
              {amount && isValidAmount && (
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Star className="w-5 h-5 text-orange-500 mr-2" />
                      <span className="text-sm text-gray-700">You'll earn</span>
                    </div>
                    <span className="font-bold text-orange-600">{pointsToEarn} points</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!isValidAmount || !recipient || isLoading}
            className={`w-full py-4 rounded-xl font-semibold text-white transition-all ${
              isValidAmount && recipient && !isLoading
                ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 pulse-glow'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                Sending...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                Send R{amount || '0'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </div>
            )}
          </button>
        </form>

        {/* Animation Overlay */}
        {showAnimation && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
            <div className="money-travel">
              <Plane className="w-12 h-12 text-orange-500" />
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccess && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 mx-4 max-w-sm text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Money Sent!</h3>
              <p className="text-gray-600 mb-4">
                R{amount} sent to {recipient}
              </p>
              <div className="bg-orange-50 rounded-xl p-4">
                <div className="flex items-center justify-center">
                  <Star className="w-5 h-5 text-orange-500 mr-2 coin-collect" />
                  <span className="font-semibold text-orange-600">
                    +{pointsToEarn} points earned!
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SendMoney;