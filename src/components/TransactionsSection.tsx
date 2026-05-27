import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { listenToTransactions, listenToCategoryMappings, deleteTransaction, addTransaction } from '../lib/data';
import { Transaction, TransactionType, UserCategoryMapping } from '../types';
import { format, isToday, isYesterday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ArrowDownRight, ArrowUpRight, Plus, Trash2, ReceiptText, Coffee, Wallet, ArrowLeftRight, Mic, SlidersHorizontal, Loader2, Target, ShoppingBag, Car, Tv, HeartPulse, BookOpen, Users, Briefcase, PiggyBank, TrendingUp, CreditCard, MoreHorizontal, FileText, Home as HomeIcon, Utensils, Tag, X } from 'lucide-react';
import { CreateTransactionModal } from './CreateTransactionModal';
import { classifyTransaction, DEFAULT_CATEGORIES } from '../lib/categories';

const ICON_MAP: Record<string, React.ElementType> = {
  Utensils, Coffee, Car, ShoppingBag, FileText, Home: HomeIcon, Tv, HeartPulse, BookOpen, Users, Briefcase, PiggyBank, TrendingUp, CreditCard, Wallet, MoreHorizontal
};

export function TransactionsSection({ isWidget = false }: { isWidget?: boolean }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [mappings, setMappings] = useState<UserCategoryMapping[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quickAddText, setQuickAddText] = useState('');
  const [isSubmittingQuick, setIsSubmittingQuick] = useState(false);
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] = useState('Tất cả');
  const [filterMonth, setFilterMonth] = useState('');

  useEffect(() => {
    if (!user) return;
    const unsubTx = listenToTransactions(`users/${user.uid}/transactions`, setTransactions);
    const unsubMap = listenToCategoryMappings(user.uid, setMappings);
    return () => {
      unsubTx();
      unsubMap();
    };
  }, [user]);

  const handleQuickAdd = async (e?: React.FormEvent, directText?: string) => {
    if (e) e.preventDefault();
    const textToUse = directText || quickAddText;
    if (!textToUse.trim() || !user || isSubmittingQuick) return;

    setError(null);
    setIsSubmittingQuick(true);
    try {
      const text = textToUse.trim();
      
      const amountRegex = /(?:^|\s)([\d.,]+)\s*(k|tr|m|đ|d|vnd|vnd|vnđ)?(?:\s|$)/i;
      const amountMatch = text.match(amountRegex);
      
      if (!amountMatch) {
        setError("Vui lòng nhập định dạng có số tiền. Ví dụ: ăn trưa 65k, 50k đổ xăng...");
        setIsSubmittingQuick(false);
        return;
      }
      
      let amountStr = amountMatch[1].replace(/,/g, ''); 
      let amount = parseFloat(amountStr);
      const unit = amountMatch[2]?.toLowerCase();
      
      if (unit === 'k') amount *= 1000;
      else if (unit === 'tr' || unit === 'm') amount *= 1000000;
      else if (amount < 1000 && !unit) amount *= 1000; 
      
      if (amount < 1000 && amount > 0 && !unit) {
        amount *= 1000;
      }
      
      let description = text.replace(amountMatch[0], ' ').trim().replace(/\s+/g, ' ');

      if (!description) {
        description = 'Giao dịch';
      }

      let categoryId = selectedCategoryId;
      let type: TransactionType = 'expense';

      if (!categoryId) {
        // Auto-classify using logic and mapped keywords
        const classification = classifyTransaction(description, amount);
        type = classification.type;
        categoryId = classification.categoryId;

        // Check if user has mapped this before
        const existingMapping = mappings.find(m => m.keyword.toLowerCase() === description.toLowerCase());
        if (existingMapping) {
           categoryId = existingMapping.categoryId;
        }
      } 
      
      if (categoryId) {
         const cat = DEFAULT_CATEGORIES.find(c => c.id === categoryId);
         if (cat && cat.type !== 'both') {
            type = cat.type;
         }
      }

      // Check if total amount is reasonable
      if (isNaN(amount) || amount <= 0) {
        setError("Số tiền không hợp lệ");
        setIsSubmittingQuick(false);
        return;
      }

      await addTransaction(user.uid, {
        type,
        amount,
        description: description.charAt(0).toUpperCase() + description.slice(1),
        categoryId,
        date: new Date().toISOString()
      });

      setQuickAddText('');
      setSelectedCategoryId(null);
    } catch (err: any) {
       console.error("Quick add error:", err);
       setError("Lỗi hệ thống khi thêm giao dịch");
    } finally {
      setIsSubmittingQuick(false);
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const getTxDetails = (tx: Transaction) => {
    let typeLabel = '';
    let isPositive = ['income', 'debt_increase', 'lend_decrease'].includes(tx.type);
    let color = isPositive ? 'text-green-600' : 'text-gray-900';
    let iconBg = isPositive ? 'bg-green-50' : 'bg-gray-100';
    let iconClass = isPositive ? 'text-green-600' : 'text-gray-600';
    let Icon = ReceiptText;
    let label = 'Chi tiêu';

    // specific base logic
    switch (tx.type) {
      case 'income': typeLabel = 'Thu nhập'; Icon = Wallet; break;
      case 'expense': typeLabel = 'Chi tiêu'; Icon = Coffee; color = 'text-gray-900'; iconBg = 'bg-gray-100'; iconClass = 'text-gray-700'; break;
      case 'debt_increase': typeLabel = 'Đi vay'; Icon = ArrowDownRight; color = 'text-gray-900'; iconBg = 'bg-gray-100'; iconClass = 'text-gray-600'; break;
      case 'debt_decrease': typeLabel = 'Trả nợ'; Icon = ArrowUpRight; color = 'text-gray-900'; iconBg = 'bg-gray-100'; iconClass = 'text-gray-600'; break;
      case 'lend_increase': typeLabel = 'Cho vay'; Icon = ArrowUpRight; color = 'text-gray-900'; iconBg = 'bg-gray-100'; iconClass = 'text-gray-600'; break;
      case 'lend_decrease': typeLabel = 'Thu hồi nợ'; Icon = ArrowDownRight; color = 'text-green-600'; iconBg = 'bg-green-50'; iconClass = 'text-green-600'; break;
    }

    if (tx.categoryId) {
       const cat = DEFAULT_CATEGORIES.find(c => c.id === tx.categoryId);
       if (cat) {
          label = cat.name;
          if (ICON_MAP[cat.icon]) Icon = ICON_MAP[cat.icon];
          const colors = cat.color.split(' ');
          iconBg = colors[0] || iconBg;
          iconClass = colors[1] || iconClass;
       }
    } else {
       label = typeLabel;
    }
    
    return { label, color, iconBg, iconClass, isPositive, Icon };
  };

  const formatTxDate = (dateString: string) => {
    const d = new Date(dateString);
    if (isToday(d)) return `Hôm nay, ${format(d, 'dd/MM/yyyy HH:mm')}`;
    if (isYesterday(d)) return `Hôm qua, ${format(d, 'dd/MM/yyyy HH:mm')}`;
    return format(d, 'dd/MM/yyyy HH:mm', { locale: vi });
  };

  const handleDelete = async (txId: string) => {
    if (!user) return;
    if (window.confirm('Bạn có chắc chắn muốn xóa giao dịch này và hoàn tác ảnh hưởng của nó không?')) {
      await deleteTransaction(user.uid, txId);
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    let matchesType = true;
    if (activeFilter === 'Thu') matchesType = tx.type === 'income';
    else if (activeFilter === 'Chi') matchesType = tx.type === 'expense';
    else if (activeFilter === 'Nợ') matchesType = tx.type.includes('debt') || tx.type.includes('lend');
    else if (activeFilter === 'Chuyển khoản' || activeFilter === 'Khoản cố định') matchesType = false;

    let matchesMonth = true;
    if (filterMonth) {
       matchesMonth = tx.date.startsWith(filterMonth);
    }
    
    return matchesType && matchesMonth;
  });

  const displayTransactions = isWidget ? filteredTransactions.slice(0, 5) : filteredTransactions;

  return (
    <div className={`flex flex-col h-full ${isWidget ? '' : 'gap-6 md:gap-8'}`}>
      {!isWidget && (
        <>
          {/* Header & Quick Action Buttons bg-white p-4 */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-4 mt-2 mb-2 bg-white rounded-2xl md:bg-transparent md:rounded-none p-4 md:p-0 shadow-sm md:shadow-none border border-gray-100 md:border-transparent">
             <div>
               <h2 className="text-xl md:text-3xl font-light text-gray-900 mb-1">Ghi & <span className="font-bold">Theo dõi</span></h2>
               <p className="text-xs md:text-sm text-gray-500">Ghi chép dòng tiền thông minh</p>
             </div>
             
             {/* QUICK ACTIONS */}
             <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 hide-scrollbar md:mx-0 md:px-0">
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="whitespace-nowrap flex items-center gap-1.5 bg-gray-900 text-white px-3 py-2 md:px-4 md:py-2.5 rounded-xl text-xs md:text-sm font-semibold hover:bg-gray-800 transition-colors shadow-sm"
                >
                   <ArrowUpRight className="w-3.5 h-3.5" /> Chi tiêu
                </button>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="whitespace-nowrap flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-2 md:px-4 md:py-2.5 rounded-xl text-xs md:text-sm font-semibold hover:bg-green-100 transition-colors border border-green-200"
                >
                   <ArrowDownRight className="w-3.5 h-3.5" /> Thu nhập
                </button>
                <button className="whitespace-nowrap flex items-center gap-1.5 bg-white text-gray-700 px-3 py-2 md:px-4 md:py-2.5 rounded-xl text-xs md:text-sm font-semibold hover:bg-gray-50 transition-colors border border-gray-200 shadow-sm">
                   <ArrowLeftRight className="w-3.5 h-3.5" /> Chuyển khoản
                </button>
             </div>
          </div>
        </>
      )}

      {/* QUICK ADD BOX */}
      {!isWidget && (
        <div className="hidden md:block relative mb-6">
          <form onSubmit={(e) => handleQuickAdd(e)} className="bg-white rounded-[24px] md:rounded-[32px] p-2 md:p-3 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center focus-within:border-[#C5A059] focus-within:ring-2 focus-within:ring-[#C5A059]/20 transition-all gap-2 md:gap-0 relative z-20">
           
           {/* Category Selector Button */}
           <div className="flex items-center px-2 py-2 border-b md:border-b-0 md:border-r border-gray-100 shrink-0 relative">
             <button 
               type="button" 
               onClick={(e) => {
                 e.preventDefault();
                 setShowCategoryPicker(!showCategoryPicker);
               }} 
               className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${selectedCategoryId ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
             >
                {selectedCategoryId ? (
                   <>
                     <div className={`w-6 h-6 rounded-md flex items-center justify-center ${DEFAULT_CATEGORIES.find(c => c.id === selectedCategoryId)?.color.split(' ')[0]} ${DEFAULT_CATEGORIES.find(c => c.id === selectedCategoryId)?.color.split(' ')[1]}`}>
                       {(() => {
                         const cat = DEFAULT_CATEGORIES.find(c => c.id === selectedCategoryId);
                         const IconT = cat ? (ICON_MAP[cat.icon] || Tag) : Tag;
                         return <IconT className="w-3.5 h-3.5" />;
                       })()}
                     </div>
                     <span className="text-sm font-bold text-gray-900 line-clamp-1 max-w-[100px]">{DEFAULT_CATEGORIES.find(c => c.id === selectedCategoryId)?.name}</span>
                     <X 
                       className="w-4 h-4 text-gray-400 ml-1 hover:text-gray-900 cursor-pointer" 
                       onClick={(e) => {
                         e.stopPropagation();
                         setSelectedCategoryId(null);
                       }} 
                     />
                   </>
                ) : (
                   <>
                     <div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center">
                       <Tag className="w-3.5 h-3.5 text-gray-500" />
                     </div>
                     <span className="text-sm font-medium text-gray-500">Tự động phân loại</span>
                   </>
                )}
             </button>
           </div>

           <div className="flex items-center flex-1 w-full px-2">
             <input 
               id={isWidget ? "quick-add-input-widget" : "quick-add-input"}
               type="text" 
               value={quickAddText}
               onChange={(e) => {
                 setQuickAddText(e.target.value);
                 setError(null);
               }}
               disabled={isSubmittingQuick}
               placeholder="Vd: ăn trưa 65k, tiền điện 1200k, lương..."
               className="flex-1 bg-transparent px-2 md:px-3 py-3 md:py-4 outline-none text-gray-900 placeholder:text-gray-400 font-medium text-lg md:text-xl w-full"
             />
           </div>
           <div className="flex items-center justify-end gap-2 px-2 md:px-0 pb-2 md:pb-0 md:pr-1">
             <button type="button" className="p-3 md:p-4 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors">
               <Mic className="w-5 h-5 md:w-6 md:h-6" />
             </button>
             <button disabled={isSubmittingQuick || !quickAddText.trim()} type="submit" className="flex items-center justify-center min-w-[70px] bg-[#C5A059] text-white px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold leading-none hover:bg-[#b08d4b] transition-colors shadow-sm disabled:opacity-50 text-sm md:text-base">
               {isSubmittingQuick ? <Loader2 className="w-5 h-5 animate-spin" /> : <>&rarr;</>}
             </button>
           </div>
        </form>
        
        {error && (
           <div className="absolute top-100 left-4 mt-2 text-sm font-semibold text-red-500 flex items-center gap-1.5 z-0">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              {error}
           </div>
        )}
        
        {/* Click away listener for picker */}
        {showCategoryPicker && (
           <div className="fixed inset-0 z-40" onClick={() => setShowCategoryPicker(false)}></div>
        )}
        
        {showCategoryPicker && (
          <div className="absolute top-14 left-0 w-full sm:w-[320px] md:w-[400px] bg-white border border-gray-100 rounded-2xl shadow-xl p-3 z-50">
             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Chọn danh mục thẻ</p>
             <div className="grid grid-cols-4 gap-2 max-h-[300px] overflow-y-auto hide-scrollbar">
               {DEFAULT_CATEGORIES.map(cat => {
                  const CatIcon = ICON_MAP[cat.icon] || Tag;
                  const colors = cat.color.split(' ');
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedCategoryId(cat.id);
                        setShowCategoryPicker(false);
                        const inputFn = document.getElementById(isWidget ? 'quick-add-input-widget' : 'quick-add-input');
                        if(inputFn) inputFn.focus();
                      }}
                      className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl transition-colors ${selectedCategoryId === cat.id ? 'bg-gray-100 ring-2 ring-gray-200' : 'hover:bg-gray-50'}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[0]} ${colors[1]}`}>
                        <CatIcon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-medium text-gray-600 text-center leading-tight line-clamp-1 w-full">{cat.name}</span>
                    </button>
                  );
               })}
             </div>
          </div>
        )}
      </div>
      )}
      
      {!isWidget && (
        <div className="flex flex-wrap gap-2 pb-2 items-center">
           {['Tất cả', 'Thu', 'Chi', 'Nợ', 'Chuyển khoản', 'Khoản cố định'].map((filter) => (
              <button 
                key={filter} 
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${activeFilter === filter ? 'bg-gray-900 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm'}`}
              >
                {filter}
              </button>
           ))}
           <div className="flex items-center gap-2 ml-auto">
             <input 
               type="month"
               value={filterMonth}
               onChange={(e) => setFilterMonth(e.target.value)}
               className="px-4 py-2 rounded-full text-sm font-semibold transition-colors bg-white border border-gray-200 text-gray-600 outline-none focus:border-[#C5A059] shadow-sm"
             />
             <button className="px-4 py-2 rounded-full text-sm font-semibold transition-colors bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center gap-2 shadow-sm">
               <SlidersHorizontal className="w-4 h-4" />
               Bộ lọc
             </button>
           </div>
        </div>
      )}

      {/* Main Container for List */}
      <div className={`flex flex-col ${isWidget ? 'bg-white rounded-[24px] md:rounded-[32px] p-5 md:p-8 shadow-sm border border-gray-100' : 'bg-white rounded-[24px] md:rounded-[32px] p-4 md:p-8 shadow-sm border border-gray-100 flex-1'}`}>
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <h3 className="text-base md:text-xl font-bold text-gray-900">{isWidget ? 'Giao dịch gần đây' : 'Lịch sử giao dịch'}</h3>
          {isWidget && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="text-[#C5A059] text-[11px] md:text-sm font-semibold hover:underline bg-[#C5A059]/10 px-2.5 py-1 md:bg-transparent md:px-0 md:py-0 rounded-md"
            >
              + Thêm
            </button>
          )}
        </div>

        <div className="space-y-2.5 md:space-y-4">
          {displayTransactions.map((tx) => {
            const { label, color, iconBg, iconClass, isPositive, Icon } = getTxDetails(tx);
            return (
              <div key={tx.id} className={`relative group flex items-center justify-between p-3 bg-gray-50/50 border border-gray-100 rounded-xl hover:border-gray-200 hover:bg-white transition-all shadow-sm shadow-transparent hover:shadow-sm ${!isWidget ? 'md:p-4' : ''}`}>
                <div className="flex items-center gap-3 overflow-hidden pr-2 flex-1">
                   <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-bold ${iconBg} ${iconClass}`}>
                      <Icon className="w-4 h-4" />
                   </div>
                   <div className="min-w-0">
                     <p className="font-bold text-[14px] md:text-base truncate text-gray-900 leading-tight md:leading-normal mb-0.5">{tx.description}</p>
                     <p className="text-[11px] md:text-sm text-gray-500 truncate flex items-center gap-1.5">
                       <span className="font-medium">{label}</span> 
                       <span className="w-1 h-1 bg-gray-300 rounded-full mx-0.5"></span> 
                       {formatTxDate(tx.date)}
                     </p>
                   </div>
                </div>
                <div className="flex justify-end gap-2 shrink-0 items-center">
                  <div className="text-right">
                    <span className={`${color} font-bold font-mono text-[14px] md:text-base block leading-tight`}>
                       {isPositive ? '+ ' : '- '}{formatMoney(tx.amount)}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleDelete(tx.id)}
                    className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-95"
                    title="Xóa giao dịch"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
          {displayTransactions.length === 0 && (
            <div className={`flex flex-col items-center justify-center text-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 mt-2 ${!isWidget ? 'py-12 md:py-24' : 'p-6 md:p-12'}`}>
               <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 md:mb-4 border border-gray-100">
                 <ReceiptText className="w-6 h-6 md:w-8 md:h-8 text-gray-300" />
               </div>
               <p className="text-sm md:text-lg font-bold text-gray-900 mb-1">Bắt đầu ghi lại dòng tiền</p>
               <p className="text-[11px] md:text-sm text-gray-500 max-w-[250px] mb-4 md:mb-6">Thêm giao dịch đầu tiên để theo dõi tài chính.</p>
               <button 
                 onClick={() => setIsModalOpen(true)}
                 className="bg-black text-white px-5 py-2.5 md:px-6 md:py-3 rounded-xl text-xs md:text-sm font-semibold hover:bg-gray-800 transition-colors shadow-sm"
               >
                 + Thêm giao dịch đầu tiên
               </button>
            </div>
          )}
        </div>

      </div>

      {isModalOpen && <CreateTransactionModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}
