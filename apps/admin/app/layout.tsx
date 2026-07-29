import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Shield, Users, Navigation, BarChart3, Map, History } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DriveSafe | Operations Center",
  description: "Real-time fleet monitoring and driver management",
};

const navItems = [
  { href: "/", label: "Live Dashboard", icon: BarChart3, dot: true },
  { href: "/", label: "Real-Time Map", icon: Map, dot: false },
  { href: "/drivers", label: "Driver Management", icon: Users, dot: false },
  { href: "/rides", label: "Ride History", icon: History, dot: false },
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-white antialiased overflow-hidden`}>
        <div className="flex h-screen w-screen overflow-hidden">
          {/* Sidebar */}
          <aside className="w-72 h-full border-r border-[#1A1A1A] flex flex-col p-8 z-10 shrink-0 bg-black">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0">
                <Shield className="text-black" size={22} />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tighter leading-none">DRIVESAFE</h1>
                <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">Ops Center</p>
              </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 space-y-1">
              <p className="text-[10px] font-bold text-zinc-600 tracking-widest mb-4 uppercase">Navigation</p>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center justify-between group px-3 py-3 rounded-xl hover:bg-zinc-900 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={16} className="text-zinc-400 group-hover:text-white transition-colors" />
                      <span className="text-sm font-semibold text-zinc-400 group-hover:text-white transition-colors">
                        {item.label}
                      </span>
                    </div>
                    {item.dot && (
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="pt-6 border-t border-[#1A1A1A]">
              <div className="bg-[#0A0A0A] p-4 rounded-xl border border-[#1A1A1A]">
                <p className="text-[10px] font-bold text-emerald-500 mb-1 tracking-widest">SYSTEM STATUS</p>
                <p className="text-xs font-bold text-white">All Systems Operational</p>
                <p className="text-[10px] text-zinc-600 mt-1">v1.0.0 · Production</p>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 h-full overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
