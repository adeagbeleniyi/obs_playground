import { useState, useCallback } from "react";
import Layout from "@/components/Layout";
import {
  ShieldAlert, Plus, Trash2, ToggleLeft, ToggleRight, ChevronDown,
  AlertTriangle, Info, CheckCircle, Loader2, X, Edit3, Save,
  GitBranch, Layers,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  METRIC_CATALOGUE, KNOWN_ASSETS, ASSET_TYPE_LABELS, OPERATOR_LABELS,
  type AssetType, type Metric, type ComparisonOperator,
  type RuleCondition, type RuleDefinition, type LogicalOperator,
} from "@shared/ruleTypes";

// ─── Seed data shown until real DB rows exist ─────────────────────────────────
const SEED_ALERT_RULES = [
  {
    id: -1,
    title: "WILD Alarm — Any Car on Kingston Sub",
    description: "Broadcast alert when any car records a wheel impact load exceeding the ALARM threshold on Kingston Subdivision.",
    severity: "critical",
    ruleType: "car",
    active: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    condition: JSON.stringify({
      logicalOperator: "AND",
      conditions: [
        { id: "c1", assetType: "car", assetId: "Any Car", metric: "wild_kips", operator: ">", threshold: 90, unit: "kips" },
        { id: "c2", assetType: "subdivision", assetId: "Kingston Sub", metric: "active_train_count", operator: ">=", threshold: 1, unit: "trains" },
      ],
    } as RuleDefinition),
  },
  {
    id: -2,
    title: "HBD Alert — Ruel Sub Trending",
    description: "Warning when any HBD reading on Ruel Sub exceeds 40°C above ambient — below ALARM but requires monitoring.",
    severity: "warning",
    ruleType: "detector",
    active: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    condition: JSON.stringify({
      logicalOperator: "AND",
      conditions: [
        { id: "c1", assetType: "wayside", assetId: "HBD-RUL-88.4", metric: "hbd_temp_rise", operator: ">=", threshold: 40, unit: "°C above ambient" },
      ],
    } as RuleDefinition),
  },
  {
    id: -3,
    title: "Crew HOS Critical — All Trains",
    description: "Network-wide alert when any train has crew HOS remaining under 30 minutes.",
    severity: "critical",
    ruleType: "locomotive",
    active: true,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    condition: JSON.stringify({
      logicalOperator: "AND",
      conditions: [
        { id: "c1", assetType: "train", assetId: "Any Train", metric: "hos_remaining_min", operator: "<", threshold: 30, unit: "min" },
      ],
    } as RuleDefinition),
  },
  {
    id: -4,
    title: "MacMillan Yard Capacity Warning",
    description: "Inform dispatchers when MacMillan Yard exceeds 85% capacity to allow proactive car routing.",
    severity: "info",
    ruleType: "subdivision",
    active: false,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    condition: JSON.stringify({
      logicalOperator: "AND",
      conditions: [
        { id: "c1", assetType: "yard", assetId: "MacMillan Yard", metric: "capacity_pct", operator: ">=", threshold: 85, unit: "%" },
      ],
    } as RuleDefinition),
  },
  {
    id: -5,
    title: "HAZMAT Car + WILD Elevated",
    description: "Critical broadcast when a HAZMAT car records any WILD reading above 50 kips — lower threshold due to cargo risk.",
    severity: "critical",
    ruleType: "car",
    active: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    condition: JSON.stringify({
      logicalOperator: "AND",
      conditions: [
        { id: "c1", assetType: "car", assetId: "UP 448812", metric: "wild_kips", operator: ">", threshold: 50, unit: "kips" },
        { id: "c2", assetType: "car", assetId: "UP 448812", metric: "defect_count", operator: ">=", threshold: 1, unit: "defects" },
      ],
    } as RuleDefinition),
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function newCondition(): RuleCondition {
  return {
    id: crypto.randomUUID(),
    assetType: "car",
    assetId: "",
    metric: "wild_kips",
    operator: ">",
    threshold: 90,
    unit: "kips",
  };
}

function parseCondition(raw: string): RuleDefinition | null {
  try { return JSON.parse(raw); } catch { return null; }
}

function humaniseRule(def: RuleDefinition): string {
  if (!def?.conditions?.length) return "No conditions defined";
  return def.conditions
    .map(c => `${c.assetId || c.assetType} · ${c.metric.replace(/_/g, " ")} ${c.operator} ${c.threshold}${c.unit ? " " + c.unit : ""}`)
    .join(` ${def.logicalOperator} `);
}

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; badge: string; icon: React.ReactNode }> = {
  critical: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", badge: "bg-red-500/15 text-red-400 border-red-500/30", icon: <AlertTriangle size={13} className="text-red-400" /> },
  warning:  { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", badge: "bg-amber-500/15 text-amber-400 border-amber-500/30", icon: <AlertTriangle size={13} className="text-amber-400" /> },
  info:     { color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30", badge: "bg-blue-500/15 text-blue-400 border-blue-500/30", icon: <Info size={13} className="text-blue-400" /> },
};

// ─── Rule Builder ─────────────────────────────────────────────────────────────
function RuleBuilder({ value, onChange }: { value: RuleDefinition; onChange: (v: RuleDefinition) => void }) {
  const setLogical = (op: LogicalOperator) => onChange({ ...value, logicalOperator: op });

  const updateCondition = (idx: number, patch: Partial<RuleCondition>) => {
    const conditions = value.conditions.map((c, i) => {
      if (i !== idx) return c;
      const updated = { ...c, ...patch };
      if (patch.assetType && patch.assetType !== c.assetType) {
        const firstMetric = METRIC_CATALOGUE[patch.assetType]?.[0];
        updated.metric = (firstMetric?.value ?? "wild_kips") as Metric;
        updated.threshold = firstMetric?.defaultThreshold ?? 0;
        updated.unit = firstMetric?.unit ?? "";
        updated.operator = (firstMetric?.operators[0] ?? ">") as ComparisonOperator;
        updated.assetId = "";
      }
      if (patch.metric && patch.metric !== c.metric) {
        const meta = METRIC_CATALOGUE[updated.assetType]?.find(m => m.value === patch.metric);
        if (meta) { updated.unit = meta.unit; updated.threshold = meta.defaultThreshold; updated.operator = meta.operators[0] as ComparisonOperator; }
      }
      return updated;
    });
    onChange({ ...value, conditions });
  };

  return (
    <div className="space-y-3">
      {value.conditions.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Join conditions with:</span>
          {(["AND", "OR"] as LogicalOperator[]).map(op => (
            <button key={op} onClick={() => setLogical(op)}
              className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-colors ${value.logicalOperator === op ? "bg-[#D22630] text-white" : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
              {op}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {value.conditions.map((cond, idx) => {
          const metrics = METRIC_CATALOGUE[cond.assetType] ?? [];
          const selectedMetric = metrics.find(m => m.value === cond.metric);
          const assets = KNOWN_ASSETS[cond.assetType] ?? [];
          return (
            <div key={cond.id} className="rounded border border-border bg-muted/20 p-3 space-y-2">
              {value.conditions.length > 1 && (
                <div className="flex items-center gap-1.5">
                  <GitBranch size={11} className="text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                    Condition {idx + 1}{idx > 0 && <span className="ml-1 text-[#D22630] font-semibold"> {value.logicalOperator}</span>}
                  </span>
                  <button onClick={() => onChange({ ...value, conditions: value.conditions.filter((_, i) => i !== idx) })}
                    className="ml-auto p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-red-400">
                    <X size={12} />
                  </button>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Asset Type</label>
                  <div className="relative">
                    <select value={cond.assetType} onChange={e => updateCondition(idx, { assetType: e.target.value as AssetType })}
                      className="w-full h-8 px-2 pr-7 text-xs rounded border border-border bg-background text-foreground appearance-none focus:outline-none focus:ring-1 focus:ring-[#D22630]/50">
                      {(Object.keys(ASSET_TYPE_LABELS) as AssetType[]).map(t => <option key={t} value={t}>{ASSET_TYPE_LABELS[t]}</option>)}
                    </select>
                    <ChevronDown size={11} className="absolute right-2 top-2.5 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Asset</label>
                  <input list={`assets-${cond.id}`} value={cond.assetId} onChange={e => updateCondition(idx, { assetId: e.target.value })}
                    placeholder={cond.assetType === "fleet" ? "CN Fleet" : `Select or type…`}
                    className="w-full h-8 px-2 text-xs rounded border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#D22630]/50" />
                  <datalist id={`assets-${cond.id}`}>{assets.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}</datalist>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Metric</label>
                  <div className="relative">
                    <select value={cond.metric} onChange={e => updateCondition(idx, { metric: e.target.value as Metric })}
                      className="w-full h-8 px-2 pr-7 text-xs rounded border border-border bg-background text-foreground appearance-none focus:outline-none focus:ring-1 focus:ring-[#D22630]/50">
                      {metrics.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                    <ChevronDown size={11} className="absolute right-2 top-2.5 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Operator</label>
                  <div className="relative">
                    <select value={cond.operator} onChange={e => updateCondition(idx, { operator: e.target.value as ComparisonOperator })}
                      className="w-full h-8 px-2 pr-7 text-xs rounded border border-border bg-background text-foreground appearance-none focus:outline-none focus:ring-1 focus:ring-[#D22630]/50">
                      {(selectedMetric?.operators ?? (Object.keys(OPERATOR_LABELS) as ComparisonOperator[])).map(op => (
                        <option key={op} value={op}>{OPERATOR_LABELS[op]}</option>
                      ))}
                    </select>
                    <ChevronDown size={11} className="absolute right-2 top-2.5 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">
                    Threshold{cond.unit ? ` (${cond.unit})` : ""}
                  </label>
                  <input type="number" value={cond.threshold as number} onChange={e => updateCondition(idx, { threshold: parseFloat(e.target.value) || 0 })}
                    className="w-full h-8 px-2 text-xs rounded border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-[#D22630]/50" />
                </div>
              </div>
              {selectedMetric?.description && (
                <div className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                  <Info size={10} className="mt-0.5 flex-shrink-0" />{selectedMetric.description}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button onClick={() => onChange({ ...value, conditions: [...value.conditions, newCondition()] })}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <Plus size={12} />Add condition
      </button>
    </div>
  );
}

// ─── Alert Rule Card ──────────────────────────────────────────────────────────
function AlertRuleCard({ rule, isAdmin, onToggle, onDelete }: {
  rule: (typeof SEED_ALERT_RULES)[0];
  isAdmin: boolean;
  onToggle: (id: number, active: boolean) => void;
  onDelete: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = SEVERITY_CONFIG[rule.severity] ?? SEVERITY_CONFIG.info;
  const def = parseCondition(rule.condition);

  return (
    <div className={`rounded border ${cfg.bg} transition-all`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            {cfg.icon}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-foreground">{rule.title}</span>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border ${cfg.badge}`}>{rule.severity.toUpperCase()}</Badge>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground border-border">{rule.ruleType}</Badge>
                {!rule.active && <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground border-border bg-muted/50">INACTIVE</Badge>}
              </div>
              {rule.description && <p className="text-xs text-muted-foreground mt-1">{rule.description}</p>}
              {def && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <GitBranch size={10} className="text-muted-foreground flex-shrink-0" />
                  <span className="text-[11px] text-muted-foreground font-mono truncate">{humaniseRule(def)}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isAdmin ? (
              <>
                <button onClick={() => setExpanded(v => !v)} className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="View conditions">
                  <Layers size={13} />
                </button>
                <button onClick={() => onToggle(rule.id, !rule.active)} className="p-1.5 rounded hover:bg-accent transition-colors" title={rule.active ? "Deactivate" : "Activate"}>
                  {rule.active ? <ToggleRight size={16} className="text-emerald-400" /> : <ToggleLeft size={16} className="text-muted-foreground" />}
                </button>
                <button onClick={() => onDelete(rule.id)} className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-red-400 transition-colors" title="Delete rule">
                  <Trash2 size={13} />
                </button>
              </>
            ) : (
              <div className="text-[11px] text-muted-foreground">{new Date(rule.createdAt).toLocaleDateString("en-CA")}</div>
            )}
          </div>
        </div>

        {expanded && def && (
          <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <GitBranch size={10} />
              Rule Conditions — joined with <span className="text-[#D22630] font-semibold ml-1">{def.logicalOperator}</span>
            </div>
            {def.conditions.map((c, i) => (
              <div key={c.id} className="flex items-center gap-2 text-xs flex-wrap">
                {i > 0 && <span className="px-1.5 py-0.5 rounded bg-[#D22630]/15 text-[#D22630] font-semibold text-[10px]">{def.logicalOperator}</span>}
                <span className="font-mono text-foreground bg-muted/50 px-2 py-0.5 rounded">{c.assetId || c.assetType}</span>
                <span className="text-muted-foreground">{c.metric.replace(/_/g, " ")}</span>
                <span className="font-mono text-foreground">{c.operator}</span>
                <span className="font-semibold text-foreground">{c.threshold}{c.unit ? ` ${c.unit}` : ""}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── New Rule Form ────────────────────────────────────────────────────────────
function NewAlertRuleForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"critical" | "warning" | "info">("warning");
  const [ruleType, setRuleType] = useState<"car" | "locomotive" | "subdivision" | "detector" | "custom">("car");
  const [ruleDef, setRuleDef] = useState<RuleDefinition>({ logicalOperator: "AND", conditions: [newCondition()] });

  const createMutation = trpc.alertRules.create.useMutation({
    onSuccess: () => { onSaved(); onClose(); },
  });

  return (
    <div className="border border-[#D22630]/30 rounded bg-[#D22630]/5 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Edit3 size={14} className="text-[#D22630]" />
          <span className="text-sm font-semibold text-foreground">New Broadcast Alert Rule</span>
          <Badge variant="outline" className="text-[10px] border-[#D22630]/40 text-[#D22630] px-1.5 py-0">Admin Only</Badge>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"><X size={14} /></button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Rule Title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. WILD Alarm on Kingston Sub"
            className="w-full h-9 px-3 text-sm rounded border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#D22630]/50" />
        </div>
        <div className="col-span-2">
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Description</label>
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional — explain what this rule monitors"
            className="w-full h-9 px-3 text-sm rounded border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#D22630]/50" />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Severity</label>
          <div className="relative">
            <select value={severity} onChange={e => setSeverity(e.target.value as typeof severity)}
              className="w-full h-9 px-3 pr-8 text-sm rounded border border-border bg-background text-foreground appearance-none focus:outline-none focus:ring-1 focus:ring-[#D22630]/50">
              <option value="critical">🔴 Critical</option>
              <option value="warning">🟡 Warning</option>
              <option value="info">🔵 Info</option>
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-3 text-muted-foreground pointer-events-none" />
          </div>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Category</label>
          <div className="relative">
            <select value={ruleType} onChange={e => setRuleType(e.target.value as typeof ruleType)}
              className="w-full h-9 px-3 pr-8 text-sm rounded border border-border bg-background text-foreground appearance-none focus:outline-none focus:ring-1 focus:ring-[#D22630]/50">
              <option value="car">Car</option>
              <option value="locomotive">Locomotive</option>
              <option value="subdivision">Subdivision</option>
              <option value="detector">Detector</option>
              <option value="custom">Custom</option>
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-3 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      <div>
        <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-2">Rule Conditions</label>
        <RuleBuilder value={ruleDef} onChange={setRuleDef} />
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 text-xs">Cancel</Button>
        <Button size="sm" className="h-8 text-xs bg-[#D22630] hover:bg-[#b01e28] text-white gap-1.5"
          onClick={() => createMutation.mutate({ title: title.trim(), description: description.trim() || undefined, severity, ruleType, condition: JSON.stringify(ruleDef) })}
          disabled={!title.trim() || createMutation.isPending}>
          {createMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
          Save Alert Rule
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AlertRules() {
  const { user, isAuthenticated, loading } = useAuth();
  const isAdmin = user?.role === "admin";
  const [showForm, setShowForm] = useState(false);

  const listQuery = trpc.alertRules.listAll.useQuery(undefined, { enabled: isAuthenticated });
  const utils = trpc.useUtils();

  const toggleMutation = trpc.alertRules.toggle.useMutation({ onSuccess: () => utils.alertRules.listAll.invalidate() });
  const deleteMutation = trpc.alertRules.delete.useMutation({ onSuccess: () => utils.alertRules.listAll.invalidate() });

  const dbRules = (listQuery.data ?? []).map(r => ({ ...r, createdAt: new Date(r.createdAt) }));
  const displayRules = dbRules.length > 0 ? dbRules : SEED_ALERT_RULES;

  const activeCount = displayRules.filter(r => r.active).length;
  const criticalCount = displayRules.filter(r => r.severity === "critical" && r.active).length;

  const handleToggle = useCallback((id: number, active: boolean) => {
    if (id < 0) return;
    toggleMutation.mutate({ id, active });
  }, [toggleMutation]);

  const handleDelete = useCallback((id: number) => {
    if (id < 0) return;
    deleteMutation.mutate({ id });
  }, [deleteMutation]);

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;

  return (
    <Layout>
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#D22630]/10 rounded flex items-center justify-center">
              <ShieldAlert size={17} className="text-[#D22630]" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-foreground" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Broadcast Alert Rules</h1>
              <p className="text-xs text-muted-foreground">{isAdmin ? "Admin-managed rules visible to all users" : "Network-wide alert rules set by operations"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><CheckCircle size={12} className="text-emerald-400" />{activeCount} active</span>
              {criticalCount > 0 && <span className="flex items-center gap-1"><AlertTriangle size={12} className="text-red-400" />{criticalCount} critical</span>}
            </div>
            {!showForm && (
              <Button size="sm" className="h-8 text-xs bg-[#D22630] hover:bg-[#b01e28] text-white gap-1.5" onClick={() => setShowForm(true)}>
                <Plus size={13} />Create Rule
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {!isAdmin && (
          <div className="flex items-start gap-2.5 p-3 rounded border border-blue-500/20 bg-blue-500/5 text-xs text-blue-300">
            <Info size={13} className="mt-0.5 flex-shrink-0" />
            <span>These rules are managed by operations administrators and apply network-wide. Contact your operations supervisor to request changes.</span>
          </div>
        )}

        {showForm && (
          <NewAlertRuleForm onClose={() => setShowForm(false)} onSaved={() => utils.alertRules.listAll.invalidate()} />
        )}

        {listQuery.isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-muted-foreground" size={20} /></div>
        ) : (
          <div className="space-y-3">
            {displayRules.map(rule => (
              <AlertRuleCard
                key={rule.id}
                rule={rule as (typeof SEED_ALERT_RULES)[0]}
                isAdmin={isAdmin}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
    </Layout>
  );
}