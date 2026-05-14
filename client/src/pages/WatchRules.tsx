import { useState, useCallback } from "react";
import {
  Eye, Plus, Trash2, ToggleLeft, ToggleRight, ChevronDown,
  AlertTriangle, Info, CheckCircle, Loader2, X, Edit3, Save,
  GitBranch, Mail, MailCheck, Bell,
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

// ─── Seed data ────────────────────────────────────────────────────────────────
const SEED_WATCH_RULES = [
  {
    id: -1,
    name: "TTX 891204 — Axle B2-Right WILD Watch",
    watchType: "wheel",
    target: "TTX 891204 / Axle B2-Right",
    active: true,
    emailAlert: true,
    emailAddress: "dispatcher@cn.ca",
    lastTriggeredAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    condition: JSON.stringify({
      logicalOperator: "AND",
      conditions: [
        { id: "c1", assetType: "wheel", assetId: "TTX 891204 / Axle B2-Right", metric: "wild_kips", operator: ">", threshold: 55, unit: "kips", timeWindowHours: 24 },
      ],
    } as RuleDefinition),
  },
  {
    id: -2,
    name: "Kingston Sub — Elevated WILD (50+ kips)",
    watchType: "detector",
    target: "WILD-KGS-194.2",
    active: true,
    emailAlert: false,
    emailAddress: null,
    lastTriggeredAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    condition: JSON.stringify({
      logicalOperator: "AND",
      conditions: [
        { id: "c1", assetType: "wayside", assetId: "WILD-KGS-194.2", metric: "wild_kips", operator: ">=", threshold: 50, unit: "kips" },
      ],
    } as RuleDefinition),
  },
  {
    id: -3,
    name: "UP 448812 HAZMAT — Any Defect or WILD",
    watchType: "car",
    target: "UP 448812",
    active: true,
    emailAlert: true,
    emailAddress: "safety@cn.ca",
    lastTriggeredAt: null,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    condition: JSON.stringify({
      logicalOperator: "OR",
      conditions: [
        { id: "c1", assetType: "car", assetId: "UP 448812", metric: "defect_count", operator: ">=", threshold: 1, unit: "defects" },
        { id: "c2", assetType: "car", assetId: "UP 448812", metric: "wild_kips", operator: ">", threshold: 50, unit: "kips" },
      ],
    } as RuleDefinition),
  },
  {
    id: -4,
    name: "CN 3012 Locomotive — Fuel & Fault Monitor",
    watchType: "locomotive",
    target: "CN 3012",
    active: true,
    emailAlert: false,
    emailAddress: null,
    lastTriggeredAt: null,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    condition: JSON.stringify({
      logicalOperator: "OR",
      conditions: [
        { id: "c1", assetType: "locomotive", assetId: "CN 3012", metric: "fuel_level_pct", operator: "<", threshold: 20, unit: "%" },
        { id: "c2", assetType: "locomotive", assetId: "CN 3012", metric: "fault_code_count", operator: ">=", threshold: 1, unit: "faults" },
      ],
    } as RuleDefinition),
  },
  {
    id: -5,
    name: "Edson Sub — Weekly Car Passage Spike",
    watchType: "detector",
    target: "Edson Sub",
    active: false,
    emailAlert: false,
    emailAddress: null,
    lastTriggeredAt: null,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    condition: JSON.stringify({
      logicalOperator: "AND",
      conditions: [
        { id: "c1", assetType: "subdivision", assetId: "Edson Sub", metric: "car_passage_count_7d", operator: ">", threshold: 2000, unit: "cars", timeWindowHours: 168 },
      ],
    } as RuleDefinition),
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function newCondition(): RuleCondition {
  return { id: crypto.randomUUID(), assetType: "car", assetId: "", metric: "wild_kips", operator: ">", threshold: 70, unit: "kips" };
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

const WATCH_TYPE_COLORS: Record<string, string> = {
  car: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  wheel: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  locomotive: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  train: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  detector: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
};

// ─── Shared Rule Builder ──────────────────────────────────────────────────────
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
              className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-colors ${value.logicalOperator === op ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
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
                    Condition {idx + 1}{idx > 0 && <span className="ml-1 text-emerald-400 font-semibold"> {value.logicalOperator}</span>}
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
                      className="w-full h-8 px-2 pr-7 text-xs rounded border border-border bg-background text-foreground appearance-none focus:outline-none focus:ring-1 focus:ring-emerald-500/50">
                      {(Object.keys(ASSET_TYPE_LABELS) as AssetType[]).map(t => <option key={t} value={t}>{ASSET_TYPE_LABELS[t]}</option>)}
                    </select>
                    <ChevronDown size={11} className="absolute right-2 top-2.5 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Asset</label>
                  <input list={`assets-w-${cond.id}`} value={cond.assetId} onChange={e => updateCondition(idx, { assetId: e.target.value })}
                    placeholder="Select or type…"
                    className="w-full h-8 px-2 text-xs rounded border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500/50" />
                  <datalist id={`assets-w-${cond.id}`}>{assets.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}</datalist>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Metric</label>
                  <div className="relative">
                    <select value={cond.metric} onChange={e => updateCondition(idx, { metric: e.target.value as Metric })}
                      className="w-full h-8 px-2 pr-7 text-xs rounded border border-border bg-background text-foreground appearance-none focus:outline-none focus:ring-1 focus:ring-emerald-500/50">
                      {metrics.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                    <ChevronDown size={11} className="absolute right-2 top-2.5 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Operator</label>
                  <div className="relative">
                    <select value={cond.operator} onChange={e => updateCondition(idx, { operator: e.target.value as ComparisonOperator })}
                      className="w-full h-8 px-2 pr-7 text-xs rounded border border-border bg-background text-foreground appearance-none focus:outline-none focus:ring-1 focus:ring-emerald-500/50">
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
                    className="w-full h-8 px-2 text-xs rounded border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500/50" />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">
                  Time Window (hours) — leave 0 for real-time
                </label>
                <input type="number" min={0} value={cond.timeWindowHours ?? 0}
                  onChange={e => updateCondition(idx, { timeWindowHours: parseInt(e.target.value) || undefined })}
                  placeholder="0 = real-time"
                  className="w-full h-8 px-2 text-xs rounded border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500/50" />
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

// ─── Watch Rule Card ──────────────────────────────────────────────────────────
function WatchRuleCard({ rule, onToggle, onDelete }: {
  rule: (typeof SEED_WATCH_RULES)[0];
  onToggle: (id: number, active: boolean) => void;
  onDelete: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const def = parseCondition(rule.condition);
  const typeColor = WATCH_TYPE_COLORS[rule.watchType] ?? "bg-muted text-muted-foreground border-border";

  return (
    <div className={`rounded border transition-all ${rule.active ? "border-border bg-card" : "border-border/50 bg-muted/20 opacity-70"}`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${rule.active ? "bg-emerald-500/15" : "bg-muted"}`}>
              <Eye size={11} className={rule.active ? "text-emerald-400" : "text-muted-foreground"} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-foreground">{rule.name}</span>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border ${typeColor}`}>{rule.watchType}</Badge>
                {!rule.active && <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground border-border bg-muted/50">PAUSED</Badge>}
                {rule.emailAlert && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/30 text-emerald-400 bg-emerald-500/10 flex items-center gap-1">
                    <MailCheck size={9} />Email On
                  </Badge>
                )}
              </div>
              <div className="mt-1 text-xs text-muted-foreground font-mono">{rule.target}</div>
              {def && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <GitBranch size={10} className="text-muted-foreground flex-shrink-0" />
                  <span className="text-[11px] text-muted-foreground font-mono truncate">{humaniseRule(def)}</span>
                </div>
              )}
              {rule.lastTriggeredAt && (
                <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-400">
                  <Bell size={9} />Last triggered: {new Date(rule.lastTriggeredAt).toLocaleString("en-CA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={() => setExpanded(v => !v)} className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="View conditions">
              <GitBranch size={13} />
            </button>
            <button onClick={() => onToggle(rule.id, !rule.active)} className="p-1.5 rounded hover:bg-accent transition-colors" title={rule.active ? "Pause" : "Resume"}>
              {rule.active ? <ToggleRight size={16} className="text-emerald-400" /> : <ToggleLeft size={16} className="text-muted-foreground" />}
            </button>
            <button onClick={() => onDelete(rule.id)} className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-red-400 transition-colors" title="Delete rule">
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {expanded && def && (
          <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <GitBranch size={10} />
              Conditions — joined with <span className="text-emerald-400 font-semibold ml-1">{def.logicalOperator}</span>
            </div>
            {def.conditions.map((c, i) => (
              <div key={c.id} className="flex items-center gap-2 text-xs flex-wrap">
                {i > 0 && <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-semibold text-[10px]">{def.logicalOperator}</span>}
                <span className="font-mono text-foreground bg-muted/50 px-2 py-0.5 rounded">{c.assetId || c.assetType}</span>
                <span className="text-muted-foreground">{c.metric.replace(/_/g, " ")}</span>
                <span className="font-mono text-foreground">{c.operator}</span>
                <span className="font-semibold text-foreground">{c.threshold}{c.unit ? ` ${c.unit}` : ""}</span>
                {c.timeWindowHours ? <span className="text-muted-foreground text-[10px]">({c.timeWindowHours}h window)</span> : null}
              </div>
            ))}
            {rule.emailAlert && rule.emailAddress && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-1">
                <Mail size={11} />Email alerts → {rule.emailAddress}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── New Watch Rule Form ──────────────────────────────────────────────────────
function NewWatchRuleForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [watchType, setWatchType] = useState<"car" | "wheel" | "locomotive" | "train" | "detector">("car");
  const [target, setTarget] = useState("");
  const [ruleDef, setRuleDef] = useState<RuleDefinition>({ logicalOperator: "AND", conditions: [newCondition()] });
  const [emailAlert, setEmailAlert] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");

  const createMutation = trpc.watchRules.create.useMutation({
    onSuccess: () => { onSaved(); onClose(); },
  });

  return (
    <div className="border border-emerald-500/20 rounded bg-emerald-500/5 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Edit3 size={14} className="text-emerald-400" />
          <span className="text-sm font-semibold text-foreground">New Watch Rule</span>
          <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 px-1.5 py-0">Personal</Badge>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"><X size={14} /></button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Rule Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. TTX 891204 Axle B2 Watch"
            className="w-full h-9 px-3 text-sm rounded border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500/50" />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Watch Type</label>
          <div className="relative">
            <select value={watchType} onChange={e => setWatchType(e.target.value as typeof watchType)}
              className="w-full h-9 px-3 pr-8 text-sm rounded border border-border bg-background text-foreground appearance-none focus:outline-none focus:ring-1 focus:ring-emerald-500/50">
              <option value="car">Railcar</option>
              <option value="wheel">Wheel / Axle</option>
              <option value="locomotive">Locomotive</option>
              <option value="train">Train</option>
              <option value="detector">Detector / Subdivision</option>
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-3 text-muted-foreground pointer-events-none" />
          </div>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Primary Target</label>
          <input value={target} onChange={e => setTarget(e.target.value)} placeholder="e.g. TTX 891204"
            className="w-full h-9 px-3 text-sm rounded border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500/50" />
        </div>
      </div>

      <div>
        <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-2">Rule Conditions</label>
        <RuleBuilder value={ruleDef} onChange={setRuleDef} />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] text-muted-foreground uppercase tracking-widest block">Email Notification</label>
        <button onClick={() => setEmailAlert(v => !v)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded border text-xs transition-colors ${emailAlert ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"}`}>
          {emailAlert ? <MailCheck size={13} /> : <Mail size={13} />}
          {emailAlert ? "Email alerts enabled" : "Enable email alerts"}
        </button>
        {emailAlert && (
          <input value={emailAddress} onChange={e => setEmailAddress(e.target.value)} type="email" placeholder="your@email.com"
            className="w-full h-9 px-3 text-sm rounded border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500/50" />
        )}
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 text-xs">Cancel</Button>
        <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          onClick={() => createMutation.mutate({
            name: name.trim(),
            watchType,
            target: target.trim() || ruleDef.conditions[0]?.assetId || "Unknown",
            condition: JSON.stringify(ruleDef),
            emailAlert,
            emailAddress: emailAlert ? emailAddress.trim() : undefined,
          })}
          disabled={!name.trim() || createMutation.isPending}>
          {createMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
          Save Watch Rule
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function WatchRules() {
  const { isAuthenticated, loading } = useAuth();
  const [showForm, setShowForm] = useState(false);

  const listQuery = trpc.watchRules.list.useQuery(undefined, { enabled: isAuthenticated });
  const utils = trpc.useUtils();

  const toggleMutation = trpc.watchRules.toggle.useMutation({ onSuccess: () => utils.watchRules.list.invalidate() });
  const deleteMutation = trpc.watchRules.delete.useMutation({ onSuccess: () => utils.watchRules.list.invalidate() });

  const dbRules = (listQuery.data ?? []).map(r => ({
    ...r,
    createdAt: new Date(r.createdAt),
    lastTriggeredAt: r.lastTriggeredAt ? new Date(r.lastTriggeredAt) : null,
  }));
  const displayRules = dbRules.length > 0 ? dbRules : SEED_WATCH_RULES;

  const activeCount = displayRules.filter(r => r.active).length;
  const emailCount = displayRules.filter(r => r.emailAlert).length;
  const triggeredCount = displayRules.filter(r => r.lastTriggeredAt).length;

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
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500/10 rounded flex items-center justify-center">
              <Eye size={17} className="text-emerald-400" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-foreground" style={{ fontFamily: "Space Grotesk, sans-serif" }}>My Watch Rules</h1>
              <p className="text-xs text-muted-foreground">Personal tracking rules — visible only to you</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><CheckCircle size={12} className="text-emerald-400" />{activeCount} active</span>
              {emailCount > 0 && <span className="flex items-center gap-1"><Mail size={12} className="text-blue-400" />{emailCount} with email</span>}
              {triggeredCount > 0 && <span className="flex items-center gap-1"><Bell size={12} className="text-amber-400" />{triggeredCount} triggered</span>}
            </div>
            {!showForm && (
              <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5" onClick={() => setShowForm(true)}>
                <Plus size={13} />New Watch Rule
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex items-start gap-2.5 p-3 rounded border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-300">
          <Info size={13} className="mt-0.5 flex-shrink-0" />
          <span>Watch rules are personal — only you can see them. Set custom thresholds below the official ALARM level to catch trends early. Enable email alerts to be notified when a condition is met.</span>
        </div>

        {showForm && (
          <NewWatchRuleForm onClose={() => setShowForm(false)} onSaved={() => utils.watchRules.list.invalidate()} />
        )}

        {displayRules.length === 0 && !showForm && (
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground uppercase tracking-widest">Quick-start suggestions</div>
            {[
              { label: "Track a specific car's WILD readings", desc: "Get notified when WILD exceeds your custom threshold", icon: <AlertTriangle size={13} className="text-amber-400" /> },
              { label: "Monitor a specific wheel / axle", desc: "Watch one axle across multiple detector passes", icon: <Eye size={13} className="text-purple-400" /> },
              { label: "Watch a subdivision for elevated readings", desc: "Alert when any car on a sub exceeds your threshold", icon: <Bell size={13} className="text-blue-400" /> },
            ].map((s, i) => (
              <button key={i} onClick={() => setShowForm(true)}
                className="w-full flex items-center gap-3 p-3 rounded border border-border hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-colors text-left">
                <div className="w-7 h-7 rounded bg-muted flex items-center justify-center flex-shrink-0">{s.icon}</div>
                <div>
                  <div className="text-sm font-medium text-foreground">{s.label}</div>
                  <div className="text-xs text-muted-foreground">{s.desc}</div>
                </div>
                <Plus size={14} className="ml-auto text-muted-foreground" />
              </button>
            ))}
          </div>
        )}

        {listQuery.isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-muted-foreground" size={20} /></div>
        ) : (
          <div className="space-y-3">
            {displayRules.map(rule => (
              <WatchRuleCard
                key={rule.id}
                rule={rule as (typeof SEED_WATCH_RULES)[0]}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
