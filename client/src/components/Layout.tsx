import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  AlertTriangle,
  Cpu,
  GitBranch,
  Server,
  Radio,
  Activity,
  ChevronRight,
  Train,
  MapPinned,
  Wifi,
  Shield,
  Sun,
  Moon,
  Users,
  Search,
  Bot,
  Bell,
  Eye,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { path: "/", label: "Network Overview", icon: <LayoutDashboard size={18} /> },
  { path: "/incidents", label: "Incidents", icon: <AlertTriangle size={18} /> },
  { path: "/assets", label: "Assets", icon: <Cpu size={18} /> },
  { path: "/traces", label: "Synthetic Traces", icon: <GitBranch size={18} /> },
  { path: "/systems", label: "System Health", icon: <Server size={18} /> },
  { path: "/train", label: "Train Journey", icon: <Train size={18} /> },
  { path: "/wayside", label: "Wayside Intel", icon: <MapPinned size={18} /> },
  { path: "/comms", label: "Comms Intelligence", icon: <Wifi size={18} /> },
  { path: "/wms", label: "WMS Observability", icon: <Shield size={18} /> },
  { path: "/fleet", label: "Fleet Operations", icon: <Activity size={18} /> },
  { path: "/dispatch", label: "Dispatch & Authority", icon: <Radio size={18} /> },
  { path: "/crew", label: "Crew & HOS", icon: <Users size={18} /> },
  { path: "/cars", label: "Car Search", icon: <Search size={18} /> },
  { path: "/ai-assistant", label: "AI Assistant", icon: <Bot size={18} /> },
  { path: "/alert-rules", label: "Alert Rules", icon: <Bell size={18} /> },
  { path: "/watch-rules", label: "My Watch Rules", icon: <Eye size={18} /> },
];

const systemStatusItems = [
  { name: "OWL", status: "operational" as const },
  { name: "CARMA", status: "operational" as const },
  { name: "COBRA", status: "warning" as const },
  { name: "I-ETMS", status: "warning" as const },
  { name: "BOS", status: "operational" as const },
  { name: "KES", status: "operational" as const },
  { name: "GCP", status: "operational" as const },
];

const statusColor: Record<string, string> = {
  operational: "bg-emerald-500",
  warning: "bg-amber-500",
  critical: "bg-red-600",
  offline: "bg-slate-500",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col border-r border-border bg-sidebar">
        {/* Logo */}
        <div className="px-4 pt-5 pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#D22630] flex items-center justify-center flex-shrink-0">
              <Radio size={14} className="text-white" />
            </div>
            <div>
              <div className="text-xs font-bold text-foreground tracking-widest uppercase" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>CN Rail</div>
              <div className="text-[10px] text-muted-foreground tracking-wide">OT Observability</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 pt-4 space-y-0.5 overflow-y-auto">
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest px-2 mb-2">Navigation</div>
          {navItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={`flex items-center gap-2.5 px-2 py-2 rounded text-sm transition-colors ${
                    isActive
                      ? "bg-[#D22630]/20 text-white border-l-2 border-[#D22630] pl-[6px]"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <span className={isActive ? "text-[#D22630]" : ""}>{item.icon}</span>
                  <span style={{ fontFamily: 'DM Sans, sans-serif' }}>{item.label}</span>
                  {isActive && <ChevronRight size={12} className="ml-auto text-[#D22630]" />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* System Quick Status */}
        <div className="px-3 py-3 border-t border-border">
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">System Status</div>
          <div className="space-y-1.5">
            {systemStatusItems.map((s) => (
              <div key={s.name} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground mono">{s.name}</span>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${statusColor[s.status]} ${(s.status as string) === 'critical' ? 'animate-pulse' : ''}`} />
                  <span className={`text-[10px] ${s.status === 'operational' ? 'text-emerald-400' : s.status === 'warning' ? 'text-amber-400' : 'text-red-400'}`}>
                    {s.status === 'operational' ? 'OK' : s.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t border-border">
          <div className="text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <Activity size={10} className="text-emerald-400" />
              <span>Live · Dynatrace Grail</span>
            </div>
            <div className="mt-0.5 mono text-[9px]">Last refresh: just now</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex-shrink-0 h-12 flex items-center justify-between px-6 border-b border-border bg-card">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#D22630] animate-pulse" />
              <span className="text-xs text-muted-foreground uppercase tracking-widest">Single Pane of Glass</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <span className="text-xs text-muted-foreground">CN Rail · OT Network Observability</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-xs text-amber-400 font-medium">23 Active Incidents</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-xs text-emerald-400">1,412 Locos Online</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <span className="mono text-xs text-muted-foreground">
              {new Date().toLocaleTimeString('en-CA', { hour12: false, timeZone: 'America/Toronto' })} ET
            </span>
            <div className="h-4 w-px bg-border" />
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground transition-colors text-xs"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <><Sun size={13} /><span>Light</span></>
              ) : (
                <><Moon size={13} /><span>Dark</span></>
              )}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
