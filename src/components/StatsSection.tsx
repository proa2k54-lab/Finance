import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { listenToDoc } from '../lib/data';
import { UserStats } from '../types';

export function StatsSection() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = listenToDoc<UserStats>(`users/${user.uid}`, setStats);
    return () => unsub();
  }, [user]);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
      {/* Current Balance */}
      <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full opacity-50"></div>
        <p className="text-[10px] md:text-xs font-bold text-blue-600 uppercase tracking-widest mb-1 md:mb-2">Tổng số dư</p>
        <h2 className="text-xl md:text-2xl font-bold truncate">
          {stats ? formatMoney(stats.totalBalance) : '0'} <span className="text-xs md:text-sm font-normal text-gray-400 font-sans">VND</span>
        </h2>
      </div>

      {/* Total Debt */}
      <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full opacity-50"></div>
        <p className="text-[10px] md:text-xs font-bold text-red-600 uppercase tracking-widest mb-1 md:mb-2">Tổng nợ phải trả</p>
        <h2 className="text-xl md:text-2xl font-bold truncate">
          {stats ? formatMoney(stats.totalDebt) : '0'} <span className="text-xs md:text-sm font-normal text-gray-400 font-sans">VND</span>
        </h2>
      </div>

      {/* Total Lent */}
      <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-bl-full opacity-50"></div>
        <p className="text-[10px] md:text-xs font-bold text-green-600 uppercase tracking-widest mb-1 md:mb-2">Người khác nợ</p>
        <h2 className="text-xl md:text-2xl font-bold truncate">
          {stats ? formatMoney(stats.totalLent) : '0'} <span className="text-xs md:text-sm font-normal text-gray-400 font-sans">VND</span>
        </h2>
      </div>
    </section>
  );
}
