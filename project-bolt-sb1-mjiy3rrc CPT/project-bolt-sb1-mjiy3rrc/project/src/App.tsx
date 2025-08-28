import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import SendMoney from './components/SendMoney';
import MyPoints from './components/MyPoints';
import RewardsShop from './components/RewardsShop';
import Profile from './components/Profile';
import Navbar from './components/Navbar';
import { UserProvider } from './context/UserContext';
import './App.css';

function App() {
  return (
    <UserProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
          <Navbar />
          <main className="pb-20">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/send" element={<SendMoney />} />
              <Route path="/points" element={<MyPoints />} />
              <Route path="/rewards" element={<RewardsShop />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </main>
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;