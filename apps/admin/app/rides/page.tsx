'use client';

import { useEffect, useState } from 'react';
import { Search, Filter, MapPin, Clock, DollarSign } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Ride {
  id: string;
  status: 'REQUESTED' | 'ACCEPTED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  type: 'HIRING' | 'RIDE_HAILING';
  price: number;
  distance: number;
  serviceLevel: string;
  createdAt: string;
  pickupAddr?: string;
  dropoffAddr?: string;
  rider?: { name: string; email: string };
  driver?: { name: string };
}

const statusColors: Record<string, string> = {
  REQUESTED: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  ACCEPTED: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  ONGOING: 'text-green-400 bg-green-400/10 border-green-400/20',
  COMPLETED: 'text-zinc-300 bg-zinc-800 border-zinc-700',
  CANCELLED: 'text-red-400 bg-red-400/10 border-red-400/20',
};

export default function RidesPage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const fetchRides = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/rides`);
        if (res.ok) setRides(await res.json());
      } catch {
        setRides([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRides();
  }, []);

  const filtered = rides
    .filter((r) => statusFilter === 'ALL' || r.status === statusFilter)
    .filter((r) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        r.rider?.name?.toLowerCase().includes(q) ||
        r.driver?.name?.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    });

  const totalRevenue = rides
    .filter((r) => r.status === 'COMPLETED')
    .reduce((sum, r) => sum + r.price, 0);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-[#1A1A1A] shrink-0">
        <div>
          <h2 className="text-xl font-black tracking-tight">Ride History</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {rides.length} rides · ₹{Math.round(totalRevenue).toLocaleString()} total revenue
          </p>
        </div>
      </header>

      {/* Controls */}
      <div className="flex items-center gap-3 px-8 py-4 border-b border-[#1A1A1A] shrink-0">
        {/* Search */}
        <div className="flex items-center gap-2 bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl px-4 py-2.5 flex-1 max-w-xs">
          <Search size={14} className="text-zinc-500" />
          <input
            className="bg-transparent text-white text-sm flex-1 outline-none placeholder:text-zinc-600"
            placeholder="Search rides, riders, drivers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-2">
          {['ALL', 'REQUESTED', 'ACCEPTED', 'ONGOING', 'COMPLETED', 'CANCELLED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-[10px] font-bold tracking-wide transition-all ${
                statusFilter === s
                  ? 'bg-white text-black'
                  : 'bg-[#0A0A0A] text-zinc-500 hover:text-white border border-[#1A1A1A]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-8 py-4">
        {loading ? (
          <div className="text-center py-20 text-zinc-600">Loading rides...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-zinc-600">No rides found</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1A1A1A]">
                {['RIDE ID', 'RIDER', 'DRIVER', 'ROUTE', 'TYPE', 'FARE', 'STATUS', 'TIME'].map((h) => (
                  <th key={h} className="text-left py-3 px-3 text-[9px] font-bold text-zinc-600 tracking-widest">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((ride) => (
                <tr
                  key={ride.id}
                  className="border-b border-[#0F0F0F] hover:bg-[#0A0A0A] transition-colors"
                >
                  <td className="py-4 px-3">
                    <span className="font-mono text-zinc-400 text-xs">{ride.id.slice(0, 8)}...</span>
                  </td>
                  <td className="py-4 px-3">
                    <span className="font-semibold text-white">{ride.rider?.name || '—'}</span>
                  </td>
                  <td className="py-4 px-3">
                    <span className="text-zinc-400">{ride.driver?.name || 'Unassigned'}</span>
                  </td>
                  <td className="py-4 px-3 max-w-[180px]">
                    <div className="flex items-center gap-1">
                      <MapPin size={10} className="text-zinc-600 shrink-0" />
                      <span className="text-zinc-500 text-xs truncate">
                        {ride.pickupAddr || 'Location A'} → {ride.dropoffAddr || 'Location B'}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-3">
                    <span className="text-[10px] font-bold text-zinc-500 bg-zinc-900 px-2 py-1 rounded-lg">
                      {ride.type === 'HIRING' ? 'HIRE' : 'HAIL'}
                    </span>
                  </td>
                  <td className="py-4 px-3">
                    <span className="font-bold text-white">₹{Math.round(ride.price)}</span>
                  </td>
                  <td className="py-4 px-3">
                    <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${statusColors[ride.status]}`}>
                      {ride.status}
                    </span>
                  </td>
                  <td className="py-4 px-3">
                    <div className="flex items-center gap-1">
                      <Clock size={10} className="text-zinc-600" />
                      <span className="text-zinc-600 text-xs">
                        {new Date(ride.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
