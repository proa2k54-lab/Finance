import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { addTransaction, listenToCollection } from '../lib/data';
import { Fund, Debt, TransactionType } from '../types';
import { X } from 'lucide-react';
import { DEFAULT_CATEGORIES } from '../lib/categories';

export function CreateTransactionModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,16));
  const [fundId, setFundId] = useState('');
  const [debtId, setDebtId] = useState('');
  const [contact, setContact] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const [funds, setFunds] = useState<Fund[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsubFunds = listenToCollection<Fund>(`users/${user.uid}/funds`, setFunds);
    const unsubDebts = listenToCollection<Debt>(`users/${user.uid}/debts`, setDebts);
    return () => { unsubFunds(); unsubDebts(); };
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount || !description) return;
    
    // Default the contact name based on debtId if applicable
    let txContact = contact;
    if (['debt_increase', 'debt_decrease', 'lend_increase', 'lend_decrease'].includes(type) && debtId) {
       const selectedDebt = debts.find(d => d.id === debtId);
       if (selectedDebt) txContact = selectedDebt.contactName;
    }

    await addTransaction(user.uid, {
      type,
      amount: parseFloat(amount),
      description,
      date: new Date(date).toISOString(),
      ...(txContact && { contact: txContact }),
      ...(fundId && { fundId }),
      ...(debtId && { debtId }),
      ...(categoryId && { categoryId })
    });
    
    onClose();
  };

  const isDebtTx = ['debt_increase', 'debt_decrease', 'lend_increase', 'lend_decrease'].includes(type);

  // Filter categories by type
  const availableCategories = DEFAULT_CATEGORIES.filter(c => c.type === 'both' || c.type === (type === 'income' ? 'income' : 'expense'));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Thêm giao dịch</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Loại giao dịch</label>
            <select 
              value={type} 
              onChange={(e) => {
                setType(e.target.value as TransactionType);
                setCategoryId(''); // Reset category when type changes
              }}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A059] focus:border-transparent transition-colors"
            >
              <option value="expense">Khoản chi</option>
              <option value="income">Khoản thu</option>
              <option value="debt_increase">Đi vay mượn (Thu vào)</option>
              <option value="debt_decrease">Trả nợ (Chi ra)</option>
              <option value="lend_increase">Cho người khác vay (Chi ra)</option>
              <option value="lend_decrease">Thu hồi nợ (Thu vào)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Số tiền (VND)</label>
            <input 
              type="number" 
              required
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A059] focus:border-transparent transition-colors"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Danh mục</label>
            <select 
              value={categoryId} 
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A059] focus:border-transparent transition-colors"
            >
              <option value="">-- Chọn danh mục --</option>
              {availableCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Mô tả</label>
            <input 
              type="text" 
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A059] focus:border-transparent transition-colors"
              placeholder="Giao dịch này là gì?"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Thời gian</label>
            <input 
              type="datetime-local" 
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A059] focus:border-transparent transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Chọn quỹ / nguồn (Không bắt buộc)</label>
            <select 
              value={fundId} 
              onChange={(e) => setFundId(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A059] focus:border-transparent transition-colors"
            >
              <option value="">-- Không chọn --</option>
              {funds.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          {isDebtTx && (
             <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">Chọn Liên hệ / Khoản nợ</label>
              <select 
                value={debtId} 
                onChange={(e) => setDebtId(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A059] focus:border-transparent transition-colors"
                required
              >
                <option value="">-- Chọn người/khoản nợ --</option>
                {debts.map(d => (
                  <option key={d.id} value={d.id}>{d.contactName} ({d.type === 'borrowed' ? 'Mình nợ' : 'Họ nợ'})</option>
                ))}
              </select>
            </div>
          )}

          {!isDebtTx && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">Người liên quan (Không bắt buộc)</label>
              <input 
                type="text" 
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A059] focus:border-transparent transition-colors"
                placeholder="Ai là người gửi hoặc nhận tiền?"
              />
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl transition-colors"
            >
              Hủy
            </button>
             <button 
              type="submit" 
              className="flex-1 px-4 py-3 bg-black hover:bg-gray-800 text-white font-bold rounded-xl transition-colors shadow-sm"
            >
              Lưu giao dịch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
