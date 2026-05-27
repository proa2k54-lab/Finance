import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { listenToCollection, addFund } from '../lib/data';
import { Fund } from '../types';

export function FundsSection() {
  const { user } = useAuth();
  const [funds, setFunds] = useState<Fund[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newFundName, setNewFundName] = useState('');

  useEffect(() => {
    if (!user) return;
    const unsub = listenToCollection<Fund>(`users/${user.uid}/funds`, setFunds);
    return () => unsub();
  }, [user]);

  const handleCreateFund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newFundName.trim()) return;
    await addFund(user.uid, { name: newFundName.trim(), color: '#3b82f6' });
    setNewFundName('');
    setIsAdding(false);
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  return (
    <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 flex-1">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base md:text-md font-bold">Phân bổ chi tiêu</h3>
        <button 
          onClick={() => setIsAdding(true)}
          className="text-[#C5A059] text-xs md:text-sm font-semibold hover:underline bg-[#C5A059]/10 px-2 py-1 md:bg-transparent md:px-0 md:py-0 rounded"
        >
          + Thêm quỹ
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleCreateFund} className="flex flex-col gap-3 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <input
            type="text"
            placeholder="Tên quỹ (VD: Tiền nhà, Tiết kiệm...)"
            value={newFundName}
            onChange={(e) => setNewFundName(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C5A059] focus:border-transparent text-sm"
            autoFocus
          />
          <div className="flex gap-2 text-sm">
            <button type="submit" className="flex-1 bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors">
              Tạo
            </button>
            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 rounded-lg font-medium text-gray-500 hover:bg-gray-200">
              Hủy
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {funds.map((fund) => (
          <div key={fund.id} className="flex flex-col">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500 font-medium truncate pr-2">{fund.name}</span>
              <span className="font-bold shrink-0">{formatMoney(fund.balance)} VND</span>
            </div>
            {/* Using a static bar just for visual representation of the theme pattern */}
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-black w-full"></div>
            </div>
          </div>
        ))}
        {funds.length === 0 && !isAdding && (
          <div className="py-4 text-center text-gray-400 text-xs italic">
            Bạn chưa tạo quỹ/ngân sách nào.
          </div>
        )}
      </div>
    </div>
  );
}
