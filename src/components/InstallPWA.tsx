import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

export function InstallPWA() {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setSupportsPWA(true);
      setPromptInstall(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
    });

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const onClick = (evt: React.MouseEvent) => {
    evt.preventDefault();
    if (!promptInstall) return;
    promptInstall.prompt();
    promptInstall.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the A2HS prompt');
      } else {
        console.log('User dismissed the A2HS prompt');
      }
    });
  };

  const onDismiss = () => {
    setSupportsPWA(false);
  };

  if (!supportsPWA || isInstalled) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-gray-900 text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
            <Download className="w-6 h-6 text-[#C5A059]" />
          </div>
          <div>
            <h4 className="font-bold text-[15px]">Cài đặt ứng dụng</h4>
            <p className="text-xs text-gray-400 mt-0.5 leading-tight">Thêm vào màn hình chính để dùng như app thật và lưu trữ offline.</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <button 
            onClick={onClick}
            className="bg-[#C5A059] text-white px-4 py-2 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
          >
            Cài đặt
          </button>
          <button 
            onClick={onDismiss}
            className="text-gray-400 px-4 py-1.5 rounded-xl text-xs font-medium active:bg-white/10 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
