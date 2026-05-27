import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { DashboardSettings, Allocation, UpcomingPayment } from '../hooks/useDashboardSettings';

interface EditDashboardModalProps {
  settings: DashboardSettings;
  onSave: (newSettings: DashboardSettings) => void;
  onClose: () => void;
}

export function EditDashboardModal({ settings, onSave, onClose }: EditDashboardModalProps) {
  const [formData, setFormData] = useState<DashboardSettings>(JSON.parse(JSON.stringify(settings)));

  const handleAllocationChange = (id: string, field: keyof Allocation, value: any) => {
    setFormData(prev => ({
      ...prev,
      allocations: prev.allocations.map(a => a.id === id ? { ...a, [field]: value } : a)
    }));
  };

  const handleUpcomingChange = (id: string, field: keyof UpcomingPayment, value: any) => {
    setFormData(prev => ({
      ...prev,
      upcomingPayments: prev.upcomingPayments.map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  };

  const addAllocation = () => {
    setFormData(prev => ({
      ...prev,
      allocations: [...prev.allocations, { id: Date.now().toString(), label: 'Mục mới', amount: 0, color: 'bg-gray-200' }]
    }));
  };

  const removeAllocation = (id: string) => {
    setFormData(prev => ({
      ...prev,
      allocations: prev.allocations.filter(a => a.id !== id)
    }));
  };
  
  const addUpcoming = () => {
    setFormData(prev => ({
      ...prev,
      upcomingPayments: [...prev.upcomingPayments, { id: Date.now().toString(), name: 'Thanh toán mới', date: '', amount: 0, status: 'pending' }]
    }));
  };

  const removeUpcoming = (id: string) => {
    setFormData(prev => ({
      ...prev,
      upcomingPayments: prev.upcomingPayments.filter(p => p.id !== id)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold">Tùy chỉnh Dashboard</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-8 flex-1">
          {/* General Config */}
          <div className="space-y-4">
             <h3 className="text-lg font-bold">Cài đặt chung</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1.5">Số tiền an toàn để tiêu (VNĐ)</label>
                   <input
                     type="number"
                     value={formData.safeToSpend}
                     onChange={e => setFormData({ ...formData, safeToSpend: Number(e.target.value) })}
                     className="w-full border border-gray-200 px-4 py-2.5 rounded-xl outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] font-medium"
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1.5">Tổng thu nhập tháng (VNĐ)</label>
                   <input
                     type="number"
                     value={formData.totalIncome}
                     onChange={e => setFormData({ ...formData, totalIncome: Number(e.target.value) })}
                     className="w-full border border-gray-200 px-4 py-2.5 rounded-xl outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] font-medium"
                   />
                </div>
             </div>
          </div>

          {/* Allocations */}
          <div className="space-y-4">
             <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Phân bổ lương</h3>
                <button type="button" onClick={addAllocation} className="text-[#C5A059] text-sm font-semibold flex items-center gap-1 hover:underline">
                  <Plus className="w-4 h-4"/> Thêm mục
                </button>
             </div>
             
             <div className="space-y-3">
               {formData.allocations.map(al => (
                 <div key={al.id} className="flex gap-2 items-center bg-gray-50 p-2 rounded-xl">
                    <input 
                      type="text" 
                      value={al.label} 
                      onChange={e => handleAllocationChange(al.id, 'label', e.target.value)} 
                      className="flex-1 min-w-0 border border-gray-200 px-3 py-2 rounded-lg text-sm"
                      placeholder="Tên quỹ"
                    />
                    <input 
                      type="number" 
                      value={al.amount} 
                      onChange={e => handleAllocationChange(al.id, 'amount', Number(e.target.value))} 
                      className="w-[120px] shrink-0 border border-gray-200 px-3 py-2 rounded-lg text-sm"
                      placeholder="Số tiền"
                    />
                    <input 
                      type="text" 
                      value={al.color} 
                      onChange={e => handleAllocationChange(al.id, 'color', e.target.value)} 
                      className="w-[100px] shrink-0 border border-gray-200 px-3 py-2 rounded-lg text-sm hidden md:block"
                      placeholder="Tailwind color"
                    />
                    <button type="button" onClick={() => removeAllocation(al.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
               ))}
             </div>
          </div>

          {/* Upcoming Payments */}
          <div className="space-y-4">
             <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Sắp thanh toán</h3>
                <button type="button" onClick={addUpcoming} className="text-[#C5A059] text-sm font-semibold flex items-center gap-1 hover:underline">
                  <Plus className="w-4 h-4"/> Thêm khoản
                </button>
             </div>
             
             <div className="space-y-3">
               {formData.upcomingPayments.map(p => (
                 <div key={p.id} className="flex gap-2 items-center bg-gray-50 p-2 rounded-xl flex-wrap md:flex-nowrap">
                    <input 
                      type="text" 
                      value={p.name} 
                      onChange={e => handleUpcomingChange(p.id, 'name', e.target.value)} 
                      className="flex-1 min-w-[120px] border border-gray-200 px-3 py-2 rounded-lg text-sm"
                      placeholder="Tên khoản thu/chi"
                    />
                    <input 
                      type="text" 
                      value={p.date} 
                      onChange={e => handleUpcomingChange(p.id, 'date', e.target.value)} 
                      className="w-[80px] shrink-0 border border-gray-200 px-3 py-2 rounded-lg text-sm"
                      placeholder="DD/MM"
                    />
                    <input 
                      type="number" 
                      value={p.amount} 
                      onChange={e => handleUpcomingChange(p.id, 'amount', Number(e.target.value))} 
                      className="w-[120px] shrink-0 border border-gray-200 px-3 py-2 rounded-lg text-sm"
                      placeholder="Số tiền"
                    />
                    <select 
                      value={p.status} 
                      onChange={e => handleUpcomingChange(p.id, 'status', e.target.value)}
                      className="w-[100px] shrink-0 border border-gray-200 px-3 py-2 rounded-lg text-sm bg-white"
                    >
                      <option value="pending">Chờ</option>
                      <option value="urgent">Hạn chót</option>
                      <option value="paid">Đã trả</option>
                    </select>
                    <button type="button" onClick={() => removeUpcoming(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
               ))}
             </div>
          </div>
        </form>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
          <button onClick={onClose} type="button" className="px-6 py-3 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors border border-gray-200">
            Hủy
          </button>
          <button onClick={handleSubmit} type="button" className="px-6 py-3 rounded-xl font-medium bg-black text-white hover:bg-gray-900 transition-colors shadow-sm">
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}
