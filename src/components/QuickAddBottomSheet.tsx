import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { addTransaction, listenToCategoryMappings } from '../lib/data';
import { classifyTransaction, DEFAULT_CATEGORIES } from '../lib/categories';
import { TransactionType, UserCategoryMapping } from '../types';
import { X, Mic, Loader2, Tag, Utensils, Coffee, Car, ShoppingBag, FileText, Home as HomeIcon, Tv, HeartPulse, BookOpen, Users, Briefcase, PiggyBank, TrendingUp, CreditCard, Wallet, MoreHorizontal } from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Utensils, Coffee, Car, ShoppingBag, FileText, Home: HomeIcon, Tv, HeartPulse, BookOpen, Users, Briefcase, PiggyBank, TrendingUp, CreditCard, Wallet, MoreHorizontal
};

interface QuickAddBottomSheetProps {
  onClose: () => void;
}

export function QuickAddBottomSheet({ onClose }: QuickAddBottomSheetProps) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mappings, setMappings] = useState<UserCategoryMapping[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const [predictedAmount, setPredictedAmount] = useState<number | null>(null);
  const [predictedCategory, setPredictedCategory] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = listenToCategoryMappings(user.uid, setMappings);
    
    // Auto focus with a slight delay for animation
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    return () => unsub();
  }, [user]);

  // Real-time parsing for suggestions
  useEffect(() => {
    if (!text.trim()) {
      setPredictedAmount(null);
      setPredictedCategory(null);
      return;
    }

    const { amount, description } = parseText(text);
    if (amount) {
      setPredictedAmount(amount);
      const classification = classifyTransaction(description, amount);
      let catId = classification.categoryId;
      // Check user mappings
      const existingMapping = mappings.find(m => m.keyword.toLowerCase() === description.toLowerCase());
      if (existingMapping) catId = existingMapping.categoryId;
      
      setPredictedCategory(catId);
    } else {
      setPredictedAmount(null);
      setPredictedCategory(null);
    }
  }, [text, mappings]);

  const parseText = (rawText: string) => {
    const amountRegex = /(?:^|\s)([\d.,]+)\s*(k|tr|m|đ|d|vnd|vnđ)?(?:\s|$)/i;
    const amountMatch = rawText.match(amountRegex);
    let amount = 0;
    
    if (amountMatch) {
      let amountStr = amountMatch[1].replace(/,/g, ''); 
      amount = parseFloat(amountStr);
      const unit = amountMatch[2]?.toLowerCase();
      
      if (unit === 'k') amount *= 1000;
      else if (unit === 'tr' || unit === 'm') amount *= 1000000;
      else if (amount < 1000 && !unit) amount *= 1000; 
      
      if (amount < 1000 && amount > 0 && !unit) {
        amount *= 1000;
      }
    }
    
    let description = amountMatch ? rawText.replace(amountMatch[0], ' ').trim() : rawText.trim();
    if (!description) description = 'Giao dịch';
    
    return { amount, description };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSubmitting || !text.trim()) return;

    const { amount, description } = parseText(text);
    
    if (!amount || amount <= 0) {
      setError("Hãy nhập số tiền (vd: cafe 55k)");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let type: TransactionType = 'expense';
      let categoryId = predictedCategory;

      if (!categoryId) {
        const classification = classifyTransaction(description, amount);
        type = classification.type;
        categoryId = classification.categoryId;
      } else {
         const cat = DEFAULT_CATEGORIES.find(c => c.id === categoryId);
         if (cat && cat.type !== 'both') type = cat.type;
      }

      await addTransaction(user.uid, {
        type,
        amount,
        description: description.charAt(0).toUpperCase() + description.slice(1),
        categoryId: categoryId || 'other',
        date: new Date().toISOString()
      });

      onClose();
    } catch (err: any) {
      console.error(err);
      setError("Lỗi khi lưu giao dịch");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formatMoney = (val: number) => new Intl.NumberFormat('vi-VN').format(val);

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] md:hidden animate-in fade-in duration-300" onClick={onClose} />
      <div className="fixed -bottom-4 left-0 right-0 bg-gray-100 rounded-t-3xl z-[80] md:hidden pb-12 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white rounded-t-3xl">
           <h3 className="font-bold text-lg">Ghi chép nhanh</h3>
           <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500 active:scale-95 transition-transform"><X className="w-5 h-5"/></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4 bg-white">
           <div className="relative">
             <input
               ref={inputRef}
               type="text"
               value={text}
               onChange={e => { setText(e.target.value); setError(null); }}
               placeholder="Vd: ăn sáng 35k..."
               className="w-full bg-gray-100 text-2xl font-medium px-4 pt-5 pb-6 rounded-2xl outline-none focus:ring-2 focus:ring-[#C5A059]/30 border border-transparent focus:border-[#C5A059]/50"
             />
             <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <button type="button" className="p-3 text-gray-400 bg-white rounded-xl shadow-sm">
                  <Mic className="w-6 h-6" />
                </button>
             </div>
           </div>
           
           {error && <p className="text-red-500 text-sm font-semibold ml-2">{error}</p>}

           {/* Suggestions Bar */}
           <div className="flex items-center gap-3 px-2 h-14">
              {predictedAmount ? (
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 px-4 py-2.5 rounded-xl flex-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
                   {predictedCategory ? (() => {
                     const cat = DEFAULT_CATEGORIES.find(c => c.id === predictedCategory);
                     if (!cat) return null;
                     const CatIcon = ICON_MAP[cat.icon] || Tag;
                     const cSplit = cat.color.split(' ');
                     return (
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cSplit[0]} ${cSplit[1]}`}>
                           <CatIcon className="w-4 h-4" />
                        </div>
                     )
                   })() : (
                     <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
                       <Tag className="w-4 h-4 text-gray-500" />
                     </div>
                   )}
                   <div className="flex-1 min-w-0">
                     <p className="font-bold text-gray-900 leading-tight">{formatMoney(predictedAmount)}đ</p>
                     <p className="text-xs text-gray-500 truncate">{predictedCategory ? DEFAULT_CATEGORIES.find(c => c.id === predictedCategory)?.name : 'Đang phân loại...'}</p>
                   </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                   <Tag className="w-4 h-4" /> Bắt đầu nhập để thấy gợi ý
                </div>
              )}

              <button 
                type="submit" 
                disabled={!text.trim() || isSubmitting}
                className="bg-[#C5A059] text-white p-3 rounded-xl shadow-sm disabled:opacity-50 active:scale-95 transition-transform"
              >
                 {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <X className="w-6 h-6 rotate-45" />}
              </button>
           </div>
        </form>
      </div>
    </>
  );
}
