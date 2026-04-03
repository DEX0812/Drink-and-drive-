'use client';

import { useEffect, useState } from 'react';
import { Shield, Users, Activity, Navigation, TrendingUp, Clock, DollarSign, Zap, Globe, Car } from 'lucide-react';
import dynamic from 'next/dynamic';

const RealTimeMap = dynamic(() => import('@/components/RealTimeMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-[#030303] flex flex-col items-center justify-center text-zinc-800 font-black tracking-[0.3em] text-xs">
      <div className="w-16 h-16 border-t-2 border-emerald-500/30 rounded-full animate-spin mb-6" />
      SYNCHRONIZING GLOBAL MESH...
    </div>
  ),
});

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Metrics {
  activeRides: number;
  onlineDrivers: number;
  totalRidesToday: number;
  revenueToday: number;
}

interface Ride {
  id: string;
  status: string;
  price: number;
  type: string;
  createdAt: string;
  rider?: { name: string };
  driver?: { name: string };
  pickupAddr?: string;
  dropoffAddr?: string;
}

const statusColors: Record<string, string> = {
  REQUESTED: 'text-amber-400 bg-amber-400/5 border-amber-400/20',
  ACCEPTED: 'text-blue-400 bg-blue-400/5 border-blue-400/20',
  ONGOING: 'text-emerald-400 bg-emerald-400/5 border-emerald-400/20',
  COMPLETED: 'text-zinc-500 bg-zinc-500/5 border-zinc-500/20',
  CANCELLED: 'text-rose-400 bg-rose-400/5 border-rose-400/20',
};

export default function Dashboard() {
  const [metrics, setMetrics] = useState<Metrics>({
    activeRides: 0,
    onlineDrivers: 0,
    totalRidesToday: 0,
    revenueToday: 0,
  });
  const [recentRides, setRecentRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [metricsRes, ridesRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/metrics`),
        fetch(`${API_BASE}/api/admin/rides`),
      ]);
      if (metricsRes.ok) setMetrics(await metricsRes.json());
      if (ridesRes.ok) setRecentRides((await ridesRes.json()).slice(0, 10));
    } catch {
      // Mock data for demo/fallback
      setMetrics({ activeRides: 12, onlineDrivers: 42, totalRidesToday: 156, revenueToday: 24850 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[#030303] text-zinc-100 overflow-hidden font-sans selection:bg-emerald-500/30">
      {/* Top Navigation Bar */}
      <header className="h-20 flex items-center justify-between px-10 border-b border-zinc-900/50 bg-[#050505]/80 backdrop-blur-xl z-20">
        <div className="flex items-center gap-6">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
            <Shield className="text-emerald-500" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white uppercase italic">Drive Safe <span className="text-emerald-500 not-italic">OS</span></h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase">System Operational · Node v4.2.0</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="px-4 py-2 rounded-full border border-zinc-800 bg-zinc-900/30 flex items-center gap-3">
             <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-black bg-zinc-800 flex items-center justify-center text-[8px] font-bold">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
             </div>
             <span className="text-[10px] font-bold text-zinc-400">12 OPERATORS ACTIVE</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar Panel: Metrics & Recent Activity */}
        <aside className="w-[420px] shrink-0 border-r border-zinc-900/50 flex flex-col bg-[#050505]/40 backdrop-blur-md z-10">
          
          {/* Main KPI Grid */}
          <div className="p-8 grid grid-cols-2 gap-4">
            {[
              { label: 'ACTIVE FLEET', value: metrics.activeRides, icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-400/5' },
              { label: 'DRIVERS LIVE', value: metrics.onlineDrivers, icon: Navigation, color: 'text-blue-400', bg: 'bg-blue-400/5' },
              { label: 'DAILY REACH', value: metrics.totalRidesToday, icon: Globe, color: 'text-indigo-400', bg: 'bg-indigo-400/5', globe: true },
              { label: 'REVENUE (INR)', value: `₹${metrics.revenueToday.toLocaleString()}`, icon: DollarSign, color: 'text-amber-400', bg: 'bg-amber-400/5' },
            ].map((kpi) => {
              const Icon = kpi.icon || Zap;
              return (
                <div key={kpi.label} className="group relative bg-[#080808] border border-zinc-900 rounded-2xl p-5 hover:border-zinc-700 transition-all duration-500">
                  <div className={`w-8 h-8 ${kpi.bg} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon size={16} className={kpi.color} />
                  </div>
                  <p className="text-2xl font-black tracking-tight text-white">{kpi.value}</p>
                  <p className="text-[10px] font-black text-zinc-600 tracking-[0.15em] mt-1 uppercase">{kpi.label}</p>
                  <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-zinc-800 to-transparent w-full opacity-0 group-hover:opacity-100 transition-opacity`} />
                </div>
              );
            })}
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-zinc-900 to-transparent mx-8 mb-8" />

          {/* Activity Feed */}
          <div className="flex-1 flex flex-col min-h-0 px-8 pb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase">Vortex Log</h3>
              <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-zinc-800" />
                <div className="w-1 h-1 rounded-full bg-zinc-800" />
                <div className="w-1 h-1 rounded-full bg-zinc-800" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
              {recentRides.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-zinc-800 border-2 border-dashed border-zinc-900 rounded-2xl">
                  <Activity size={24} className="mb-2 opacity-20" />
                  <span className="text-[10px] font-bold tracking-widest uppercase">Awaiting Data Streams</span>
                </div>
              ) : (
                recentRides.map((ride, idx) => (
                  <div
                    key={ride.id}
                    className="group relative bg-[#080808]/50 border border-zinc-900/50 rounded-2xl p-4 hover:bg-zinc-900/20 hover:border-zinc-800 transition-all duration-300"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-zinc-200 group-hover:text-white transition-colors uppercase tracking-tight">
                          {ride.rider?.name || 'RIDER_UNA'}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="w-3 h-px bg-zinc-800" />
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">to {ride.driver?.name || 'QUEUED'}</span>
                        </div>
                      </div>
                      <div className={`text-[8px] font-black px-2.5 py-1 rounded-md border ${statusColors[ride.status] || 'text-zinc-600 border-zinc-800'} tracking-widest uppercase transition-all`}>
                        {ride.status}
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between opacity-60 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <div className="w-0.5 h-0.5 rounded-full bg-emerald-500" />
                         </div>
                         <span className="text-[10px] font-bold text-zinc-500 tracking-tight">{ride.type}</span>
                      </div>
                      <span className="text-xs font-black text-zinc-400">₹{Math.round(ride.price)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Global Mesh Map Container */}
        <main className="flex-1 relative overflow-hidden bg-black">
          <div className="absolute inset-0 z-0">
             <RealTimeMap />
          </div>

          {/* Map Controls / Labels */}
          <div className="absolute bottom-10 left-10 z-10 flex flex-col gap-2">
            <div className="px-4 py-2 bg-black/60 backdrop-blur-2xl border border-white/5 rounded-lg flex items-center gap-3">
               <Car size={14} className="text-emerald-500" />
               <span className="text-[10px] font-black text-zinc-300 tracking-[0.2em] uppercase">Tracking {metrics.onlineDrivers} assets live</span>
            </div>
          </div>

          {/* Corner Decorations */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[120px] rounded-full -mr-32 -mt-32 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 blur-[150px] rounded-full -ml-44 -mb-44 pointer-events-none" />
        </main>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1a1a1a;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #2a2a2a;
        }
      `}</style>
    </div>
  );
}
