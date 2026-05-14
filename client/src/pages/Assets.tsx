import Layout from "@/components/Layout";
import { assets } from "@/lib/mockData";
import { Train, Radio, MapPin, Clock, Cpu, Satellite } from "lucide-react";

const typeIcon: Record<string, React.ReactNode> = {
  locomotive: <Train size={14} />,
  wayside: <MapPin size={14} />,
  crossing: <MapPin size={14} />,
  atip: <Satellite size={14} />,
  radio: <Radio size={14} />,
  server: <Cpu size={14} />,
};

const statusColor: Record<string, string> = {
  critical: "text-red-400 border-red-500/30 bg-red-500/10",
  warning: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  info: "text-sky-400 border-sky-500/30 bg-sky-500/10",
  operational: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
};

const statusDot: Record<string, string> = {
  critical: "bg-red-500 shadow-[0_0_6px_#ef4444]",
  warning: "bg-amber-500",
  info: "bg-sky-400",
  operational: "bg-emerald-500 shadow-[0_0_6px_#10b981]",
};

export default function Assets() {
  return (
    <Layout>
      <div className="p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Asset Inventory</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Locomotives, wayside devices, radio sites, and ATIP cars — monitored via OWL, CARMA, COBRA, and WASP
          </p>
        </div>

        {/* Asset Type Summary */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Locomotives', count: assets.filter(a => a.type === 'locomotive').length, icon: <Train size={16} />, color: 'text-sky-400' },
            { label: 'Wayside Devices', count: assets.filter(a => a.type === 'wayside').length, icon: <MapPin size={16} />, color: 'text-amber-400' },
            { label: 'Radio Sites', count: assets.filter(a => a.type === 'radio').length, icon: <Radio size={16} />, color: 'text-emerald-400' },
            { label: 'ATIP Cars', count: assets.filter(a => a.type === 'atip').length, icon: <Satellite size={16} />, color: 'text-purple-400' },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className={s.color}>{s.icon}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{s.label}</span>
              </div>
              <div className={`text-3xl font-bold kpi-number ${s.color}`}>{s.count}</div>
            </div>
          ))}
        </div>

        {/* Asset Cards */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {assets.map((asset) => (
            <div key={asset.id} className={`bg-card border rounded p-4 ${asset.status === 'critical' ? 'border-red-500/30' : asset.status === 'warning' ? 'border-amber-500/30' : 'border-border'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot[asset.status]}`} />
                  <div className={`flex items-center gap-1.5 ${asset.status === 'critical' ? 'text-red-400' : asset.status === 'warning' ? 'text-amber-400' : 'text-muted-foreground'}`}>
                    {typeIcon[asset.type]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{asset.name}</div>
                    <div className="text-[10px] text-muted-foreground mono">{asset.id}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-border text-muted-foreground mono">{asset.system}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${statusColor[asset.status]}`}>
                    {asset.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-3 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin size={10} />
                  <span>{asset.subdivision}</span>
                  {asset.milepost && <span className="mono">MP {asset.milepost}</span>}
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={10} />
                  <span>{asset.lastSeen}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(asset.details).map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between bg-muted/30 rounded px-2 py-1">
                    <span className="text-[10px] text-muted-foreground">{key}</span>
                    <span className={`text-[10px] mono font-medium ${
                      val === 'Disconnected' || val === 'Offline' || val === 'Failed Init' ? 'text-red-400' :
                      val === 'Active' || val === 'Connected' || val === 'Nominal' ? 'text-emerald-400' :
                      val === 'Enforcement' ? 'text-amber-400' : 'text-foreground'
                    }`}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
