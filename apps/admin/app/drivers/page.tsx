'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, User, Star, Car } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface DriverProfile {
  id: string;
  driverId: string;
  licenseNumber: string;
  experienceYears: number;
  manualCertified: boolean;
  status: 'PENDING' | 'ACTIVE' | 'REJECTED';
  isOnline: boolean;
  rating: number;
  driver: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
  };
  licenseUrl?: string;
  insuranceUrl?: string;
  backgroundCheckUrl?: string;
}

const statusConfig = {
  PENDING: { label: 'Pending Review', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', icon: Clock },
  ACTIVE: { label: 'Active', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'text-red-400 bg-red-400/10 border-red-400/20', icon: XCircle },
};

export default function DriversPage() {
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'ACTIVE' | 'REJECTED'>('ALL');
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchDrivers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/drivers`);
      if (res.ok) setDrivers(await res.json());
    } catch {
      // Mock data
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDrivers(); }, []);

  const updateStatus = async (driverId: string, status: 'ACTIVE' | 'REJECTED') => {
    setUpdating(driverId);
    try {
      const res = await fetch(`${API_BASE}/api/admin/drivers/${driverId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) await fetchDrivers();
    } catch {
      alert('Failed to update driver status');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = filter === 'ALL' ? drivers : drivers.filter((d) => d.status === filter);

  const counts = {
    ALL: drivers.length,
    PENDING: drivers.filter((d) => d.status === 'PENDING').length,
    ACTIVE: drivers.filter((d) => d.status === 'ACTIVE').length,
    REJECTED: drivers.filter((d) => d.status === 'REJECTED').length,
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-[#1A1A1A] shrink-0">
        <div>
          <h2 className="text-xl font-black tracking-tight">Driver Management</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Verify and manage driver applications</p>
        </div>
        <div className="text-sm font-bold text-zinc-400">{drivers.length} total drivers</div>
      </header>

      {/* Filters */}
      <div className="flex items-center gap-2 px-8 py-4 border-b border-[#1A1A1A] shrink-0">
        {(['ALL', 'PENDING', 'ACTIVE', 'REJECTED'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${
              filter === f
                ? 'bg-white text-black'
                : 'bg-[#0A0A0A] text-zinc-400 hover:text-white border border-[#1A1A1A]'
            }`}
          >
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      {/* Driver List */}
      <div className="flex-1 overflow-auto px-8 py-6">
        {loading ? (
          <div className="text-center py-20 text-zinc-600">Loading drivers...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <User size={40} className="text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-600 font-bold">No {filter !== 'ALL' ? filter.toLowerCase() : ''} drivers found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((d) => {
              const config = statusConfig[d.status];
              const StatusIcon = config.icon;
              return (
                <div
                  key={d.id}
                  className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl p-6 hover:border-zinc-700 transition-all"
                >
                  {/* Driver Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center">
                        <span className="text-lg font-black">{d.driver.name[0]}</span>
                      </div>
                      <div>
                        <p className="font-bold text-white">{d.driver.name}</p>
                        <p className="text-xs text-zinc-500">{d.driver.email}</p>
                      </div>
                    </div>
                    <span className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full border ${config.color}`}>
                      <StatusIcon size={10} />
                      {config.label}
                    </span>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-zinc-900 rounded-xl p-3 text-center">
                      <p className="text-white font-bold text-sm">{d.licenseNumber}</p>
                      <p className="text-[9px] text-zinc-600 uppercase tracking-wider mt-0.5">License</p>
                    </div>
                    <div className="bg-zinc-900 rounded-xl p-3 text-center">
                      <p className="text-white font-bold text-sm">{d.experienceYears}y</p>
                      <p className="text-[9px] text-zinc-600 uppercase tracking-wider mt-0.5">Experience</p>
                    </div>
                    <div className="bg-zinc-900 rounded-xl p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star size={10} className="text-yellow-400 fill-yellow-400" />
                        <p className="text-white font-bold text-sm">{d.rating > 0 ? d.rating.toFixed(1) : '—'}</p>
                      </div>
                      <p className="text-[9px] text-zinc-600 uppercase tracking-wider mt-0.5">Rating</p>
                    </div>
                  </div>

                  {/* Flags */}
                  <div className="flex gap-2 mb-4">
                    {d.manualCertified && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-blue-400 bg-blue-400/10 px-2.5 py-1 rounded-full">
                        <Car size={10} />
                        Manual Certified
                      </span>
                    )}
                    {d.isOnline && (
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Online
                      </span>
                    )}
                  </div>

                  {/* Document Links Section */}
                  <div className="bg-[#050505] border border-zinc-900 rounded-xl p-4 mb-5">
                    <p className="text-[9px] font-black text-zinc-500 tracking-[0.2em] mb-3 uppercase">Verification Documents</p>
                    <div className="space-y-2">
                       {[
                         { label: 'Driving License', url: d.licenseUrl },
                         { label: 'Vehicle Insurance', url: d.insuranceUrl },
                         { label: 'Background Check', url: d.backgroundCheckUrl },
                       ].map((doc) => (
                         <div key={doc.label} className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-zinc-400">{doc.label}</span>
                            {doc.url ? (
                              <a 
                                href={doc.url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-[10px] font-black text-emerald-500 hover:text-emerald-400 underline tracking-tighter"
                              >
                                VIEW_MEDIA
                              </a>
                            ) : (
                              <span className="text-[10px] font-bold text-zinc-800">NOT_UPLOADED</span>
                            )}
                         </div>
                       ))}
                    </div>
                  </div>

                  {/* Action Buttons (PENDING only) */}
                  {d.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateStatus(d.driverId, 'ACTIVE')}
                        disabled={updating === d.driverId}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
                      >
                        <CheckCircle size={14} />
                        {updating === d.driverId ? 'Approving...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => updateStatus(d.driverId, 'REJECTED')}
                        disabled={updating === d.driverId}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-zinc-900 hover:bg-red-900 text-red-400 text-xs font-bold rounded-xl border border-red-400/20 transition-colors disabled:opacity-50"
                      >
                        <XCircle size={14} />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
