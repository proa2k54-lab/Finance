import React, { useState, useEffect } from 'react';
import { TransactionsSection } from './TransactionsSection';
import { useAuth } from '../context/AuthContext';
import { listenToDoc } from '../lib/data';
import { UserStats } from '../types';
import { ChevronDown, Bell, CheckCircle2, AlertCircle, Settings2 } from 'lucide-react';
import { useDashboardSettings } from '../hooks/useDashboardSettings';
import { EditDashboardModal } from './EditDashboardModal';

function AllocationItem({ label, amount, color, percentage, highlight = false }: { label: string, amount: string, color: string, percentage: string, highlight?: boolean }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`w-3 h-3 rounded-sm ${color}`}></span>
        <span className={`text-xs font-medium ${highlight ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>{label}</span>
      </div>
      <p className={`font-bold tracking-tight ${highlight ? 'text-xl md:text-2xl text-[#C5A059]' : 'text-base md:text-lg text-gray-900'}`}>{amount}</p>
      <p className="text-[10px] text-gray-400 mt-0.5">{percentage}</p>
    </div>
  );
}

function TimelineItem({ date, name, amount, status }: { date: string, name: string, amount: string, status: 'urgent' | 'pending' | 'paid' }) {
  return (
    <div className="relative pl-6">
      <div className={`absolute left-[-21px] top-1.5 w-3 h-3 rounded-full border-2 bg-white ${status === 'urgent' ? 'border-red-500' : 'border-gray-300'}`}></div>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-bold text-gray-900 leading-tight">{name}</p>
          <div className="flex gap-2 items-center mt-1.5">
             <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${status === 'urgent' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
               {date}
             </span>
             {status === 'urgent' && <span className="text-[10px] text-red-500 font-medium leading-none">Sắp đến hạn</span>}
          </div>
        </div>
        <span className="font-mono text-sm font-bold text-gray-900">{amount}</span>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);

  const { settings, setSettings } = useDashboardSettings();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = listenToDoc<UserStats>(`users/${user.uid}`, setStats);
    return () => unsub();
  }, [user]);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };
  
  const currentDebt = stats?.totalDebt || 0;
  
  const { safeToSpend, totalIncome, upcomingPayments, allocations } = settings;
  const allocated = allocations.reduce((sum, item) => sum + item.amount, 0);
  const upcoming = upcomingPayments.reduce((sum, item) => item.status !== 'paid' ? sum + item.amount : sum, 0);
  const percentAllocated = Math.round((allocated / totalIncome) * 100) || 0;
  const freeMoney = totalIncome - allocated;
  
  return (
    <div className="max-w-[1200px] mx-auto flex flex-col h-full space-y-4 md:space-y-8 pb-8 md:pb-0">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 md:gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-light text-gray-900 mb-1">
            Xin chào, <span className="font-bold">{user?.displayName || user?.email?.split('@')[0] || 'User'}</span>
          </h1>
          <p className="text-gray-500 text-xs md:text-base">Đây là tình hình tài chính tháng này của bạn.</p>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 bg-white border border-gray-200 px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Settings2 className="w-4 h-4 text-gray-500" /> <span className="hidden sm:inline">Cài đặt</span>
          </button>
          <button className="flex items-center gap-2 bg-white border border-gray-200 px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
            Tháng 6 <span className="hidden sm:inline">, 2026</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          <button className="relative w-8 h-8 md:w-10 md:h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm">
            <Bell className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
            <span className="absolute top-1.5 right-1.5 md:top-2.5 md:right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
        </div>
      </header>

      {/* 4 Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
         {/* Card 1 - Span 2 on mobile to emphasize */}
         <div className="col-span-2 lg:col-span-1 bg-black text-white p-5 md:p-6 rounded-[20px] md:rounded-[24px] shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[120px] md:min-h-[140px]">
            <div className="absolute top-0 right-[-20%] w-32 h-32 md:w-40 md:h-40 bg-white/5 rounded-bl-full"></div>
            <p className="text-[10px] md:text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Còn được phép tiêu</p>
            <div className="mt-2 md:mt-4">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-0.5 md:mb-1">{formatMoney(safeToSpend)}<span className="text-base md:text-lg font-normal text-gray-400 ml-1">đ</span></h2>
              <p className="text-[11px] md:text-xs text-green-400 font-medium">Đủ dùng đến cuối tháng</p>
            </div>
         </div>
         
         {/* Card 2 */}
         <div className="bg-white p-4 md:p-6 rounded-[20px] md:rounded-[24px] shadow-sm border border-gray-100 flex flex-col justify-between min-h-[100px] md:min-h-[140px]">
            <p className="text-[10px] md:text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Đã phân bổ</p>
            <div className="mt-2 md:mt-4">
              <h2 className="text-lg md:text-2xl font-bold text-gray-900 tracking-tight mb-0.5 md:mb-1">{formatMoney(allocated)}<span className="text-xs md:text-sm font-normal text-gray-500 ml-1">đ</span></h2>
              <p className="text-[10px] md:text-xs text-gray-500">{percentAllocated}% tổng thu nhập</p>
            </div>
         </div>

         {/* Card 3 */}
         <div className="bg-white p-4 md:p-6 rounded-[20px] md:rounded-[24px] shadow-sm border border-gray-100 flex flex-col justify-between min-h-[100px] md:min-h-[140px]">
            <p className="text-[10px] md:text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Sắp thanh toán</p>
            <div className="mt-2 md:mt-4">
              <h2 className="text-lg md:text-2xl font-bold text-gray-900 tracking-tight mb-0.5 md:mb-1">{formatMoney(upcoming)}<span className="text-xs md:text-sm font-normal text-gray-500 ml-1">đ</span></h2>
              <p className="text-[10px] md:text-xs text-[#C5A059] font-medium">{upcomingPayments.length > 0 ? `Đã có ${upcomingPayments.length} khoản` : 'Không có'}</p>
            </div>
         </div>

         {/* Card 4 - Optional on very small maybe? Wait, user still wants to see */}
         <div className="col-span-2 lg:col-span-1 border-t border-gray-100 lg:border-t-0 bg-white p-4 md:p-6 rounded-[20px] md:rounded-[24px] shadow-sm flex flex-col justify-between min-h-[100px] md:min-h-[140px] items-center text-center lg:items-start lg:text-left">
            <p className="text-[10px] md:text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Tổng nợ hiện tại</p>
            <div className="mt-2 text-center lg:text-left">
              <h2 className={`text-xl md:text-2xl font-bold tracking-tight mb-0.5 ${currentDebt > 0 ? 'text-red-500' : 'text-gray-900'}`}>{formatMoney(currentDebt)}<span className={`text-xs md:text-sm font-normal ml-1 ${currentDebt > 0 ? 'text-red-300' : 'text-gray-400'}`}>đ</span></h2>
              <p className="text-[10px] md:text-xs text-gray-500">Tỷ lệ nợ an toàn</p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 min-h-0">
        <div className="lg:col-span-8 flex flex-col gap-4 md:gap-8">
          {/* Phân bổ lương */}
          <div className="bg-white rounded-[24px] md:rounded-[32px] p-5 md:p-8 shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-6 md:mb-8 gap-4">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Phân bổ lương</h3>
                <div className="text-xs md:text-sm text-gray-500 flex items-center gap-2 bg-gray-50 px-2 py-1 md:px-3 md:py-1.5 rounded-lg w-fit">
                  <span>Tổng nhận:</span>
                  <span className="font-bold text-gray-900 text-sm md:text-base">{formatMoney(totalIncome)}đ</span>
                </div>
              </div>
              <div className="text-left sm:text-right bg-[#C5A059]/5 px-3 md:px-4 py-2 md:py-3 rounded-xl md:rounded-2xl border border-[#C5A059]/20 w-fit">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest block mb-0.5 md:mb-1">Tự do còn lại</span>
                <span className="text-xl md:text-2xl font-bold text-[#C5A059] leading-none">{formatMoney(freeMoney)}đ</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-3 md:h-4 flex rounded-full overflow-hidden mb-6 md:mb-8 bg-gray-100">
              {allocations.map(al => {
                const perc = totalIncome > 0 ? (al.amount / totalIncome) * 100 : 0;
                return (
                  <div key={al.id} className={al.color.replace('text-', 'bg-') || 'bg-gray-400'} style={{ width: `${perc}%` }} title={`${al.label}: ${perc.toFixed(1)}%`}></div>
                );
              })}
              {freeMoney > 0 && (
                <div className="bg-[#C5A059]" style={{ width: `${(freeMoney / totalIncome) * 100}%` }} title={`Tự do: ${((freeMoney / totalIncome) * 100).toFixed(1)}%`}></div>
              )}
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-6 md:gap-y-8 gap-x-3 md:gap-x-4">
              {allocations.map(al => {
                const perc = totalIncome > 0 ? (al.amount / totalIncome) * 100 : 0;
                return (
                  <AllocationItem 
                    key={al.id}
                    label={al.label} 
                    amount={`${formatMoney(al.amount)}đ`} 
                    color={al.color} 
                    percentage={`${Math.round(perc)}%`} 
                  />
                );
              })}
              <AllocationItem 
                label="Tiền tự do" 
                amount={`${formatMoney(freeMoney)}đ`} 
                color="bg-[#C5A059]" 
                percentage={`${Math.round((freeMoney / totalIncome) * 100)}%`} 
                highlight 
              />
            </div>
          </div>

          {/* Giao dịch gần đây */}
          <TransactionsSection isWidget={true} />
        </div>

        <div className="lg:col-span-4 flex flex-col gap-4 md:gap-8">
          {/* Timeline khoản sắp thanh toán */}
          <div className="bg-white rounded-[24px] md:rounded-[32px] p-5 md:p-8 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-5 md:mb-6">
              <h3 className="text-base md:text-lg font-bold text-gray-900">Sắp thanh toán</h3>
              <span className="text-[9px] md:text-[10px] font-bold text-gray-500 bg-gray-100 px-2 md:px-3 py-1 rounded-full uppercase tracking-wider">Tháng 6</span>
            </div>

            <div className="relative border-l-2 border-gray-100 ml-2 md:ml-3 space-y-5 md:space-y-6 pt-1 pb-1 md:pt-2 md:pb-2">
              {upcomingPayments.map(p => (
                 <TimelineItem 
                    key={p.id}
                    date={p.date} 
                    name={p.name} 
                    amount={`${formatMoney(p.amount)}đ`} 
                    status={p.status} 
                 />
              ))}
              {upcomingPayments.length === 0 && (
                <p className="text-gray-400 text-xs md:text-sm italic py-4 pl-4">Chưa có khoản thanh toán nào sắp tới.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {isSettingsOpen && (
        <EditDashboardModal 
          settings={settings}
          onClose={() => setIsSettingsOpen(false)}
          onSave={(newSettings) => {
            setSettings(newSettings);
            setIsSettingsOpen(false);
          }}
        />
      )}
    </div>
  );
}
