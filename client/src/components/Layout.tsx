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
  FileText,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Zap,
  Network,
  Lock,
  Map,
  BarChart2,
  Gauge,
  X,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useState, useEffect, useRef } from "react";
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem,
  BreadcrumbPage, BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    id: "observe",
    label: "OBSERVE",
    items: [
      { path: "/", label: "Network Overview", icon: <LayoutDashboard size={15} /> },
      { path: "/incidents", label: "Incidents", icon: <AlertTriangle size={15} />, badge: "23", badgeColor: "bg-amber-500" },
      { path: "/assets", label: "Assets", icon: <Cpu size={15} />, badge: "3 LVVR", badgeColor: "bg-red-600" },
      { path: "/wayside", label: "Wayside Intel", icon: <MapPinned size={15} /> },
      { path: "/systems", label: "System Health", icon: <Server size={15} /> },
    ],
  },
  {
    id: "investigate",
    label: "INVESTIGATE",
    items: [
      { path: "/traces", label: "EMP Message Traces", icon: <GitBranch size={15} /> },
      { path: "/train", label: "Train Journey", icon: <Train size={15} /> },
      { path: "/comms", label: "Radio & Comms", icon: <Wifi size={15} /> },
      { path: "/wms", label: "Network Security", icon: <Lock size={15} /> },
      { path: "/fleet", label: "Fleet Operations", icon: <Activity size={15} /> },
    ],
  },
  {
    id: "operate",
    label: "OPERATE",
    items: [
      { path: "/dispatch", label: "Dispatch & Authority", icon: <Radio size={15} /> },
      { path: "/crew", label: "Crew & HOS", icon: <Users size={15} /> },
      { path: "/cars", label: "Car Search", icon: <Search size={15} /> },
      { path: "/crossings", label: "Crossing Monitoring", icon: <Crosshair size={15} /> },
    ],
  },
  {
    id: "configure",
    label: "CONFIGURE",
    items: [
      { path: "/alert-rules", label: "Alert Rules", icon: <Bell size={15} /> },
      { path: "/watch-rules", label: "My Watch Rules", icon: <Eye size={15} /> },
      { path: "/reports", label: "Reports", icon: <FileText size={15} /> },
      { path: "/ai-assistant", label: "AI Assistant", icon: <Bot size={15} /> },
    ],
  },
];

const systemStatusItems = [
  { name: "OWL",    status: "operational" as const },
  { name: "CARMA",  status: "operational" as const },
  { name: "COBRA",  status: "warning" as const },
  { name: "I-ETMS", status: "warning" as const },
  { name: "BOS",    status: "operational" as const },
  { name: "KES",    status: "operational" as const },
  { name: "GCP",    status: "operational" as const },
];

const statusColor: Record<string, string> = {
  operational: "bg-emerald-500",
  warning:     "bg-amber-500",
  critical:    "bg-red-600",
  offline:     "bg-slate-500",
};

// ─── Global search data ───────────────────────────────────────────────────────
const SEARCH_INDEX = [
  { label: "CN 3864", sub: "Kingston Sub · Lead Loco", path: "/assets", type: "loco" },
  { label: "CN 5501", sub: "Edson Sub · Lead Loco", path: "/assets", type: "loco" },
  { label: "CN 2271", sub: "Rivers Sub · Lead Loco", path: "/assets", type: "loco" },
  { label: "CN 4412", sub: "Ruel Sub · Lead Loco", path: "/assets", type: "loco" },
  { label: "CN 7701", sub: "Bala Sub · Lead Loco", path: "/assets", type: "loco" },
  { label: "Q11451-05", sub: "Kingston Sub · Train", path: "/train", type: "train" },
  { label: "M30151-05", sub: "Rivers Sub · Train", path: "/train", type: "train" },
  { label: "L50251-05", sub: "Edson Sub · Train", path: "/train", type: "train" },
  { label: "INC-2024-0891", sub: "Critical · OWL Agent Down", path: "/incidents", type: "incident" },
  { label: "INC-2024-0887", sub: "Critical · GPS Dual Fault", path: "/incidents", type: "incident" },
  { label: "WIU 180.91", sub: "Central/Flint · CP Potterville", path: "/wayside", type: "wiu" },
  { label: "WIU 183.60", sub: "Central/Flint · SIG 1837N", path: "/wayside", type: "wiu" },
  { label: "Kingston Sub", sub: "ETC-ATP · 188 WIUs", path: "/wayside", type: "subdivision" },
  { label: "Edson Sub", sub: "ETC-DAS · Advisory Only", path: "/wayside", type: "subdivision" },
  { label: "Network Overview", sub: "Dashboard", path: "/", type: "page" },
  { label: "EMP Message Traces", sub: "S-9361 ICD · Synthetic Traces", path: "/traces", type: "page" },
  { label: "Fleet Operations", sub: "Train State & Yard Status", path: "/fleet", type: "page" },
  { label: "System Health", sub: "OWL · CARMA · KES · GCP", path: "/systems", type: "page" },
];

const typeIcon: Record<string, React.ReactNode> = {
  loco:        <Cpu size={11} className="text-sky-400" />,
  train:       <Train size={11} className="text-emerald-400" />,
  incident:    <AlertTriangle size={11} className="text-amber-400" />,
  wiu:         <MapPinned size={11} className="text-violet-400" />,
  subdivision: <Map size={11} className="text-cyan-400" />,
  page:        <LayoutDashboard size={11} className="text-muted-foreground" />,
};

function GlobalSearch({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const results = query.length >= 1
    ? SEARCH_INDEX.filter(r =>
        r.label.toLowerCase().includes(query.toLowerCase()) ||
        r.sub.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : SEARCH_INDEX.slice(0, 6);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
      <div className="w-[520px] rounded-lg border border-border bg-card shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Search size={14} className="text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search locos, trains, WIUs, incidents, pages…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
            <X size={14} />
          </button>
        </div>
        <div className="py-1 max-h-80 overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-4 py-3 text-xs text-muted-foreground">No results for "{query}"</div>
          ) : (
            results.map((r, i) => (
              <button
                key={i}
                onClick={() => { onNavigate(r.path); setOpen(false); setQuery(""); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent text-left"
              >
                <span className="flex-shrink-0">{typeIcon[r.type]}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground truncate">{r.label}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{r.sub}</div>
                </div>
                <span className="text-[9px] text-muted-foreground capitalize flex-shrink-0">{r.type}</span>
              </button>
            ))
          )}
        </div>
        <div className="px-4 py-2 border-t border-border flex items-center gap-3 text-[10px] text-muted-foreground">
          <span><kbd className="px-1 py-0.5 rounded bg-border text-[9px]">↵</kbd> to select</span>
          <span><kbd className="px-1 py-0.5 rounded bg-border text-[9px]">Esc</kbd> to close</span>
          <span><kbd className="px-1 py-0.5 rounded bg-border text-[9px]">⌘K</kbd> to open</span>
        </div>
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [searchOpen, setSearchOpen] = useState(false);

  const toggleGroup = (id: string) => {
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Count critical+warning systems for notification badge
  const degradedSystems = systemStatusItems.filter(s => s.status !== "operational").length;

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <GlobalSearch onNavigate={(path) => navigate(path)} />

      {/* ─── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-52 flex-shrink-0 flex flex-col border-r border-border bg-sidebar">
        {/* Logo */}
        <div className="px-4 pt-4 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#D22630] flex items-center justify-center flex-shrink-0 rounded-sm">
              <Radio size={13} className="text-white" />
            </div>
            <div>
              <div className="text-xs font-bold text-foreground tracking-widest uppercase" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>CN Rail</div>
              <div className="text-[10px] text-muted-foreground tracking-wide">OT Observability</div>
            </div>
          </div>
        </div>

        {/* Nav Groups */}
        <nav className="flex-1 px-2 pt-3 overflow-y-auto space-y-0.5">
          {navGroups.map(group => {
            const isGroupCollapsed = collapsed[group.id];
            const hasActiveItem = group.items.some(item => location === item.path);
            return (
              <div key={group.id} className="mb-1">
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-bold tracking-widest ${hasActiveItem ? 'text-[#D22630]' : 'text-muted-foreground'}`}>
                      {group.label}
                    </span>
                    {hasActiveItem && <div className="w-1 h-1 rounded-full bg-[#D22630]" />}
                  </div>
                  {isGroupCollapsed
                    ? <ChevronDown size={10} className="text-muted-foreground" />
                    : <ChevronUp size={10} className="text-muted-foreground" />
                  }
                </button>

                {/* Group Items */}
                {!isGroupCollapsed && (
                  <div className="space-y-0.5 ml-1">
                    {group.items.map(item => {
                      const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
                      return (
                        <Link key={item.path} href={item.path}>
                          <div
                            className={`flex items-center gap-2 px-2 py-1.5 rounded text-[11px] transition-colors ${
                              isActive
                                ? "bg-[#D22630]/15 text-white border-l-2 border-[#D22630] pl-[6px]"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent"
                            }`}
                          >
                            <span className={`flex-shrink-0 ${isActive ? "text-[#D22630]" : ""}`}>{item.icon}</span>
                            <span className="flex-1 truncate" style={{ fontFamily: 'DM Sans, sans-serif' }}>{item.label}</span>
                            {item.badge && (
                              <span className={`text-[8px] font-bold px-1 py-0.5 rounded ${item.badgeColor} text-white flex-shrink-0`}>
                                {item.badge}
                              </span>
                            )}
                            {isActive && <ChevronRight size={10} className="ml-auto text-[#D22630] flex-shrink-0" />}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* System Quick Status */}
        <div className="px-3 py-2.5 border-t border-border">
          <div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1.5">System Status</div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            {systemStatusItems.map(s => (
              <div key={s.name} className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusColor[s.status]}`} />
                <span className="text-[10px] text-muted-foreground mono truncate">{s.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t border-border">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Activity size={9} className="text-emerald-400" />
            <span>Live · Dynatrace Grail</span>
          </div>
          <div className="mono text-[9px] text-muted-foreground mt-0.5">Last refresh: just now</div>
        </div>
      </aside>

      {/* ─── Main Content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex-shrink-0 h-11 flex items-center justify-between px-4 border-b border-border bg-card">
          {/* Left: breadcrumb context */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#D22630] animate-pulse" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">SPOG</span>
            </div>
            <div className="h-3 w-px bg-border" />
            <span className="text-[10px] text-muted-foreground">CN Rail · OT Network Observability</span>

            {/* System health pills */}
            <div className="h-3 w-px bg-border" />
            <div className="flex items-center gap-1">
              {systemStatusItems.map(s => (
                <div
                  key={s.name}
                  title={`${s.name}: ${s.status}`}
                  className={`text-[8px] font-bold px-1.5 py-0.5 rounded-sm ${
                    s.status === 'operational' ? 'bg-emerald-500/15 text-emerald-400' :
                    s.status === 'warning'     ? 'bg-amber-500/15 text-amber-400' :
                                                 'bg-red-500/15 text-red-400'
                  }`}
                >
                  {s.name}
                </div>
              ))}
            </div>
          </div>

          {/* Right: search + alerts + clock + theme */}
          <div className="flex items-center gap-2">
            {/* Global search trigger */}
            <button
              onClick={() => {
                const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true });
                window.dispatchEvent(event);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-border bg-background hover:bg-accent text-muted-foreground hover:text-foreground transition-colors text-[10px]"
              title="Global Search (⌘K)"
            >
              <Search size={11} />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden sm:inline text-[8px] px-1 py-0.5 rounded bg-border">⌘K</kbd>
            </button>

            {/* Notification bell */}
            <button className="relative p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Active Incidents">
              <Bell size={13} />
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-500 text-[7px] font-bold text-white flex items-center justify-center">
                23
              </span>
            </button>

            <div className="h-3 w-px bg-border" />

            {/* Active incidents */}
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-[10px] text-amber-400 font-medium">23 Incidents</span>
            </div>

            <div className="h-3 w-px bg-border" />

            {/* Locos online */}
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-emerald-400">1,412 Online</span>
            </div>

            <div className="h-3 w-px bg-border" />

            {/* Clock */}
            <span className="mono text-[10px] text-muted-foreground">
              {new Date().toLocaleTimeString('en-CA', { hour12: false, timeZone: 'America/Toronto' })} ET
            </span>

            <div className="h-3 w-px bg-border" />

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1 px-2 py-1 rounded border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground transition-colors text-[10px]"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <><Sun size={11} /><span>Light</span></> : <><Moon size={11} /><span>Dark</span></>}
            </button>
          </div>
        </header>

        {/* Breadcrumb bar */}
        {(() => {
          // Build group + page label from current location
          let groupLabel = '';
          let pageLabel = '';
          for (const group of navGroups) {
            const match = group.items.find(item =>
              item.path === location ||
              (item.path !== '/' && location.startsWith(item.path))
            );
            if (match) {
              groupLabel = group.label.charAt(0) + group.label.slice(1).toLowerCase();
              pageLabel = match.label;
              break;
            }
          }
          if (!groupLabel) return null;
          return (
            <div className="flex-shrink-0 px-5 py-1.5 border-b border-border/50 bg-background/60">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">{groupLabel}</span>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="text-muted-foreground/40" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-[10px] font-medium text-foreground">{pageLabel}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          );
        })()}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
