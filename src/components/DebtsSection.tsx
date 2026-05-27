import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { listenToCollection, addDebt } from '../lib/data';
import { Debt } from '../types';

export function DebtsSection() {
  const { user } = useAuth();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [contactName, setContactName] = useState('');
  const [debtType, setDebtType] = useState<'borrowed' | 'lent'>('borrowed');

  useEffect(() => {
    if (!user) return;
    const unsub = listenToCollection<Debt>(`users/${user.uid}/debts`, setDebts);
    return () => unsub();
  }, [user]);

  const handleCreateDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !contactName.trim()) return;
    await addDebt(user.uid, { contactName: contactName.trim(), type: debtType, amount: 0 });
    setContactName('');
    setIsAdding(false);
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  return (
    <div className="bg-black text-white p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-lg">
      <div className="flex items-center justify-between mb-2 md:mb-3">
        <h3 className="text-sm font-bold">Điều chỉnh dư nợ</h3>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-white/10 px-2 py-1 rounded text-[#C5A059] text-[10px] md:text-xs font-semibold hover:bg-white/20"
        >
          + Thêm
        </button>
      </div>
      <p className="text-[10px] md:text-xs text-gray-400 mb-4">Theo dõi các khoản bạn đang nợ hoặc cho mượn.</p>

      {isAdding && (
        <form onSubmit={handleCreateDebt} className="flex flex-col gap-3 mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
          <input
            type="text"
            placeholder="Tên người liên hệ"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-black border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#C5A059] focus:border-transparent text-sm"
            autoFocus
          />
          <select 
             value={debtType} 
             onChange={(e) => setDebtType(e.target.value as any)}
             className="w-full px-4 py-2 rounded-lg bg-black border border-gray-700 text-white text-sm"
          >
             <option value="borrowed">Tôi nợ họ (Đi vay)</option>
             <option value="lent">Họ nợ tôi (Cho mượn)</option>
          </select>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 bg-[#C5A059] text-black px-4 py-2 rounded-lg font-bold hover:bg-[#b08d4b] transition-colors text-sm">
              Lưu lại
            </button>
            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/10 transition-colors">
              Hủy
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {debts.map((debt) => (
          <div key={debt.id} className="flex justify-between items-center py-3 border-b border-gray-800 last:border-0 last:pb-0">
            <div className="min-w-0 pr-2">
              <p className="text-sm font-medium leading-none truncate">{debt.contactName}</p>
              <p className="text-[10px] text-gray-500 mt-1.5">{debt.type === 'borrowed' ? 'Tôi đang nợ' : 'Họ nợ tôi'}</p>
            </div>
            <div className={`font-mono text-sm font-bold shrink-0 ${debt.type === 'borrowed' ? 'text-red-400' : 'text-green-400'}`}>
              {formatMoney(debt.amount)}
            </div>
          </div>
        ))}
        {debts.length === 0 && !isAdding && (
          <div className="py-4 text-center text-gray-500 text-xs italic">
            Không có khoản nợ nào.
          </div>
        )}
      </div>
    </div>
  );
}
