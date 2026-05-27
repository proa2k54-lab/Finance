import { useState, useEffect } from 'react';

export interface UpcomingPayment {
  id: string;
  name: string;
  amount: number;
  date: string;
  status: 'urgent' | 'pending' | 'paid';
}

export interface Allocation {
  id: string;
  label: string;
  amount: number;
  color: string;
}

export interface DashboardSettings {
  safeToSpend: number;
  totalIncome: number;
  upcomingPayments: UpcomingPayment[];
  allocations: Allocation[];
}

const defaultSettings: DashboardSettings = {
  safeToSpend: 7000000,
  totalIncome: 30000000,
  upcomingPayments: [
    { id: '1', date: '05/06', name: 'Tiền nhà', amount: 6000000, status: 'urgent' },
    { id: '2', date: '10/06', name: 'Thẻ tín dụng', amount: 3500000, status: 'pending' },
    { id: '3', date: '15/06', name: 'Bảo hiểm PVI', amount: 1200000, status: 'pending' },
    { id: '4', date: '28/06', name: 'Trả góp ngân hàng', amount: 8000000, status: 'pending' }
  ],
  allocations: [
    { id: '1', label: 'Trả góp NH', amount: 8000000, color: 'bg-gray-800' },
    { id: '2', label: 'Sinh hoạt', amount: 6000000, color: 'bg-gray-600' },
    { id: '3', label: 'Tiết kiệm', amount: 5000000, color: 'bg-gray-400' },
    { id: '4', label: 'Quỹ khẩn cấp', amount: 2000000, color: 'bg-gray-300' },
    { id: '5', label: 'Giải trí', amount: 2000000, color: 'bg-gray-200' },
    { id: '6', label: 'Tiền tự do', amount: 7000000, color: 'bg-[#C5A059]' }
  ]
};

export function useDashboardSettings() {
  const [settings, setSettings] = useState<DashboardSettings>(() => {
    const saved = localStorage.getItem('dashboardSettings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('dashboardSettings', JSON.stringify(settings));
  }, [settings]);

  return { settings, setSettings };
}
