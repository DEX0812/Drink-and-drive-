'use client';

import { Shield, Users, Activity, Navigation } from 'lucide-react';
import dynamic from 'next/dynamic';

const RealTimeMap = dynamic(() => import('@/components/RealTimeMap'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-[#0A0A0A] flex items-center justify-center text-zinc-800 font-black tracking-widest italic antialiased">INITIALIZING GLOBAL MESH...</div>
});

export default function Home() {
  return (
    <main className="flex h-screen w-screen bg-black overflow-hidden font-sans">
      {/* 🚀 OPERATIONS CENTER SIDEBAR */}
      <aside className="w-80 h-full border-r border-[#1A1A1A] flex flex-col p-8 z-10 shrink-0">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-white rounded-sm flex items-center justify-center">
            <Shield className="text-black" size={24} />
          </div>
          <div>
             <h1 className="text-xl font-black tracking-tighter leading-none">DRIVESAFE</h1>
             <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">OPS CENTER</p>
          </div>
        </div>

        <nav className="flex-1 space-y-8">
          <div>
            <p className="text-[10px] font-bold text-zinc-600 tracking-widest mb-4 uppercase">FLEET MONITORING</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between group cursor-pointer border-b border-transparent hover:border-white transition-all pb-1">
                 <div className="flex items-center gap-3">
                    <Navigation size={18} className="text-zinc-400 group-hover:text-white" />
                    <span className="text-sm font-bold tracking-tight text-zinc-400 group-hover:text-white">Live Tracking</span>
                 </div>
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="flex items-center gap-3 text-zinc-400 group cursor-pointer hover:text-white transition-all">
                 <Activity size={18} />
                 <span className="text-sm font-bold tracking-tight">System Performance</span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-zinc-600 tracking-widest mb-4 uppercase">MANAGEMENT</p>
            <div className="space-y-4">
               <div className="flex items-center gap-3 text-white transition-all cursor-pointer">
                  <Users size={18} />
                  <span className="text-sm font-bold tracking-tight">Verified Drivers</span>
               </div>
            </div>
          </div>
        </nav>

        <footer className="pt-8 border-t border-[#1A1A1A]">
           <div className="bg-[#111111] p-4 rounded-sm border border-[#1A1A1A]">
              <p className="text-[10px] font-bold text-emerald-500 mb-1 tracking-widest">SYSTEM STATUS</p>
              <h2 className="text-xs font-bold leading-tight uppercase">Global Mesh Active</h2>
           </div>
        </footer>
      </aside>

      {/* 🗺️ REAL-TIME MAP CANVAS */}
      <section className="flex-1 h-full relative">
        <div className="absolute inset-0">
           <RealTimeMap />
        </div>
        
        {/* OVERLAY METRICS */}
        <div className="absolute top-8 right-8 flex gap-4 z-[1000]">
           <div className="px-6 py-4 bg-black/80 backdrop-blur-md border border-[#1A1A1A] rounded-sm flex flex-col items-center min-w-[140px]">
              <span className="text-[10px] font-bold text-emerald-500 tracking-widest mb-1">ACTIVE RIDES</span>
              <span className="text-3xl font-black italic">12</span>
           </div>
           <div className="px-6 py-4 bg-black/80 backdrop-blur-md border border-[#1A1A1A] rounded-sm flex flex-col items-center min-w-[140px]">
              <span className="text-[10px] font-bold text-emerald-500 tracking-widest mb-1">ONLINE DRIVERS</span>
              <span className="text-3xl font-black italic">48</span>
           </div>
        </div>
      </section>
    </main>
  );
}
