import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface Transaction {
  id: string;
  type: 'send' | 'reward';
  amount: number;
  points: number;
  recipient?: string;
  reward?: string;
  date: Date;
  status: 'completed' | 'pending';
}

interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  category: string;
  image: string;
  available: boolean;
}

interface UserData {
  name: string;
  balance: number;
  points: number;
  tier: 'Bronze' | 'Silver' | 'Gold';
  totalSent: number;
  transactions: Transaction[];
  rewardsPurchased: string[];
}

interface UserContextType {
  user: UserData;
  sendMoney: (amount: number, recipient: string) => Promise<void>;
  redeemReward: (reward: Reward) => Promise<boolean>;
  rewards: Reward[];
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

const initialRewards: Reward[] = [
  {
    id: '1',
    name: 'R50 Airtime',
    description: 'Mobile airtime voucher for any network',
    pointsCost: 50,
    category: 'Airtime',
    image: 'https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=400',
    available: true
  },
  {
    id: '2',
    name: 'R100 Grocery Voucher',
    description: 'Redeemable at major grocery stores',
    pointsCost: 100,
    category: 'Shopping',
    image: 'https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=400',
    available: true
  },
  {
    id: '3',
    name: 'R200 Fuel Voucher',
    description: 'Fuel voucher for major petrol stations',
    pointsCost: 200,
    category: 'Transport',
    image: 'https://images.pexels.com/photos/33688/delicate-arch-night-stars-landscape.jpg?auto=compress&cs=tinysrgb&w=400',
    available: true
  },
  {
    id: '4',
    name: 'Movie Tickets (2x)',
    description: 'Two movie tickets for any cinema',
    pointsCost: 150,
    category: 'Entertainment',
    image: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=400',
    available: true
  },
  {
    id: '5',
    name: 'R300 Restaurant Voucher',
    description: 'Fine dining experience voucher',
    pointsCost: 300,
    category: 'Dining',
    image: 'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=400',
    available: true
  },
  {
    id: '6',
    name: 'Bluetooth Headphones',
    description: 'Premium wireless headphones',
    pointsCost: 500,
    category: 'Electronics',
    image: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=400',
    available: true
  }
];

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData>(() => {
    const saved = localStorage.getItem('mukuru-user');
    if (saved) {
      const parsedData = JSON.parse(saved);
      // Convert date strings back to Date objects
      parsedData.transactions = parsedData.transactions.map((transaction: any) => ({
        ...transaction,
        date: new Date(transaction.date)
      }));
      return parsedData;
    }
    return {
      name: 'John Doe',
      balance: 5000,
      points: 125,
      tier: 'Silver' as const,
      totalSent: 12500,
      transactions: [
        {
          id: '1',
          type: 'send' as const,
          amount: 500,
          points: 5,
          recipient: 'Mary Smith',
          date: new Date(Date.now() - 86400000),
          status: 'completed' as const
        },
        {
          id: '2',
          type: 'send' as const,
          amount: 1000,
          points: 10,
          recipient: 'Peter Johnson',
          date: new Date(Date.now() - 172800000),
          status: 'completed' as const
        }
      ],
      rewardsPurchased: []
    };
  });

  useEffect(() => {
    localStorage.setItem('mukuru-user', JSON.stringify(user));
  }, [user]);

  const calculateTier = (totalSent: number): 'Bronze' | 'Silver' | 'Gold' => {
    if (totalSent >= 50000) return 'Gold';
    if (totalSent >= 20000) return 'Silver';
    return 'Bronze';
  };

  const sendMoney = async (amount: number, recipient: string): Promise<void> => {
    const points = Math.floor(amount / 100);
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: 'send',
      amount,
      points,
      recipient,
      date: new Date(),
      status: 'completed'
    };

    setUser(prev => ({
      ...prev,
      balance: prev.balance - amount,
      points: prev.points + points,
      totalSent: prev.totalSent + amount,
      tier: calculateTier(prev.totalSent + amount),
      transactions: [newTransaction, ...prev.transactions]
    }));
  };

  const redeemReward = async (reward: Reward): Promise<boolean> => {
    if (user.points < reward.pointsCost) return false;

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: 'reward',
      amount: 0,
      points: -reward.pointsCost,
      reward: reward.name,
      date: new Date(),
      status: 'completed'
    };

    setUser(prev => ({
      ...prev,
      points: prev.points - reward.pointsCost,
      transactions: [newTransaction, ...prev.transactions],
      rewardsPurchased: [...prev.rewardsPurchased, reward.id]
    }));

    return true;
  };

  return (
    <UserContext.Provider value={{
      user,
      sendMoney,
      redeemReward,
      rewards: initialRewards
    }}>
      {children}
    </UserContext.Provider>
  );
};