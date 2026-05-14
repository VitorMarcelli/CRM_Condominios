'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Sidebar } from '@/components/layout/sidebar';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen flex relative bg-slate-100 dark:bg-[#0A0A0B] overflow-hidden selection:bg-blue-500/30">
      {/* Premium Ornamented Background - Non-transparent, rich colors */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Base solid gradient for depth without transparency */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 dark:from-[#0A0A0B] dark:via-[#0F1420] dark:to-[#0A0A0B]" />
        
        {/* Structural Geometric Shapes */}
        <div className="absolute top-0 right-0 w-[60vw] h-[60vw] bg-gradient-to-b from-blue-200/50 to-transparent rounded-full blur-[100px] dark:from-blue-600/10 opacity-70" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-gradient-to-t from-cyan-200/50 to-transparent rounded-full blur-[80px] dark:from-cyan-600/10 opacity-70" />
        
        {/* Dense Grid Pattern for 'Ornamented' architectural feel */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
        
        {/* High-end Film Grain Texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.25] mix-blend-overlay dark:opacity-[0.15]" />
      </div>

      {/* Sidebar - fixed width */}
      <div className="relative z-20 flex border-r border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#0A0A0B]/95 backdrop-blur-xl shadow-2xl">
        <Sidebar />
      </div>
      
      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-auto relative z-10">
        <div className="max-w-7xl mx-auto p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
