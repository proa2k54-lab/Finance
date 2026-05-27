import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Loader2, LogOut, LayoutDashboard, ReceiptText, ArrowLeftRight, PiggyBank, Plus } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { TransactionsSection } from './components/TransactionsSection';
import { DebtsSection } from './components/DebtsSection';
import { FundsSection } from './components/FundsSection';
import { QuickAddBottomSheet } from './components/QuickAddBottomSheet';
import { InstallPWA } from './components/InstallPWA';

function Logo() {
  return (
    <div className="w-10 h-10 bg-[#C5A059] rounded-xl flex flex-col items-center justify-center pt-1 shadow-sm shrink-0">
      <div className="w-5 h-3.5 bg-white rounded-t-full rounded-b-sm border-b border-black/10"></div>
      <div className="w-2.5 h-2.5 bg-white rounded-b-sm rounded-t-[1px]"></div>
    </div>
  );
}

function LoginScreen() {
  const { signIn } = useAuth();
  return (
    <div className="min-h-screen bg-[#F4F5F7] text-[#1A1A1A] font-sans flex items-center justify-center p-4">
      <div className="bg-white max-w-sm w-full rounded-3xl shadow-sm border border-gray-100 p-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="scale-125 transform transition-transform">
             <Logo />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">NẤM MỐI</h1>
          <p className="text-gray-500 mt-2 text-sm">Quản lý thu chi, quỹ và nợ của bạn một cách dễ dàng và minh bạch.</p>
        </div>
        <button 
          onClick={signIn}
          className="w-full bg-black hover:bg-gray-800 text-white font-medium py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
        >
          Đăng nhập với Google
        </button>
      </div>
    </div>
  );
}

type Tab = 'dashboard' | 'transactions' | 'debts' | 'budgets';

function MainLayout() {
  const { user, loading, logOut } = useAuth();
  const [currentTab, setCurrentTab] = useState<Tab>('dashboard');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F5F7]">
        <Loader2 className="w-8 h-8 text-[#C5A059] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard': return <Dashboard />;
      case 'transactions': return <div className="max-w-[1200px] mx-auto h-full py-4"><TransactionsSection /></div>;
      case 'debts': return <div className="max-w-[1200px] mx-auto h-full py-4"><DebtsSection /></div>;
      case 'budgets': return <div className="max-w-[1200px] mx-auto h-full py-4"><FundsSection /></div>;
      case 'account': return (
        <div className="max-w-[600px] mx-auto h-full py-4 flex flex-col items-center justify-center space-y-6">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-md">
            {user.photoURL ? <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" /> : <div className="w-24 h-24 bg-gray-200"></div>}
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold">{user.displayName || user.email}</h2>
            <p className="text-gray-500">{user.email}</p>
          </div>
          <div className="mt-8 w-full px-4">
            <button onClick={logOut} className="w-full bg-red-50 text-red-600 hover:bg-red-100 py-4 rounded-2xl font-bold transition-colors">
              Đăng xuất
            </button>
          </div>
        </div>
      );
      default: return <Dashboard />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'transactions', label: 'Giao dịch', icon: ReceiptText },
    { id: 'budgets', label: 'Ngân sách', icon: PiggyBank },
    { id: 'debts', label: 'Vay & Nợ', icon: ArrowLeftRight },
    { id: 'account', label: 'Tài khoản', icon: LogOut }, // Using LogOut as account for simplicity on mobile, or user can sign out
  ] as const;

  return (
    <div className="min-h-[100dvh] bg-[#F4F5F7] text-[#1A1A1A] font-sans flex flex-col md:flex-row pb-[72px] md:pb-0 relative">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 p-8 flex-col shrink-0">
        <div className="flex items-center gap-3 mb-12">
          <Logo />
          <span className="font-bold text-xl tracking-tight uppercase">Nấm Mối</span>
        </div>
        
        <nav className="flex-1 space-y-4">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            if (item.id === 'account') return null; // Hide from desktop sidebar
            return (
              <div 
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center gap-4 cursor-pointer transition-colors px-3 py-2 -mx-3 rounded-lg ${isActive ? 'text-[#C5A059] bg-[#C5A059]/10 font-bold' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>

        <div className="mt-auto p-4 bg-gray-50 rounded-xl mb-4 overflow-hidden border border-gray-100">
          <p className="text-xs text-gray-500 mb-1 uppercase font-bold tracking-widest">Tài khoản</p>
          <p className="text-sm font-medium truncate">{user.displayName || user.email}</p>
        </div>

        <button 
          onClick={logOut}
          className="flex items-center gap-4 text-gray-400 px-3 py-2 -mx-3 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-semibold">Đăng xuất</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 max-h-[100dvh] overflow-y-auto w-full p-4 pt-[calc(1rem+env(safe-area-inset-top))] md:p-10 hide-scrollbar">
        {renderContent()}
      </main>

      {/* Bottom Nav - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] z-40 shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.05)]">
         {navItems.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.id === 'account' ? LogOut : item.icon;
            return (
              <button 
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex flex-col items-center justify-center w-full py-1 gap-1 ${isActive ? 'text-[#C5A059]' : 'text-gray-400'}`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-current' : ''}`} />
                <span className={`text-[10px] font-semibold ${isActive ? 'text-[#C5A059]' : ''}`}>{item.label}</span>
              </button>
            );
          })}
      </nav>

      {/* Floating Action Button - Mobile */}
      <button
        onClick={() => setIsQuickAddOpen(true)}
        className="md:hidden fixed bottom-[84px] right-4 w-14 h-14 bg-black text-[#C5A059] rounded-2xl flex items-center justify-center shadow-xl shadow-black/20 z-[60] active:scale-95 transition-transform"
      >
        <Plus className="w-7 h-7" />
      </button>

      {isQuickAddOpen && <QuickAddBottomSheet onClose={() => setIsQuickAddOpen(false)} />}
      <InstallPWA />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
