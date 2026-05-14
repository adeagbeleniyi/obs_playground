import { useState, useMemo, useRef, useEffect } from "react";
import Layout from "@/components/Layout";
import {
  Bot, Trash2, Loader2, Plus, MessageSquare, Clock,
  Train, AlertTriangle, Activity, MapPin, ChevronRight, X, Send,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { carDatabase, activeCrew } from "@/lib/crewCarData";
import { FLEET_SNAPSHOT, YARDS } from "@/lib/fleetData";

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = "user" | "assistant";
interface Message { role: Role; content: string; }
interface Session { key: string; messages: Message[]; updatedAt: Date; }

// ─── Forge API config ─────────────────────────────────────────────────────────
const FORGE_BASE_URL =
  (import.meta.env.VITE_FRONTEND_FORGE_API_URL as string | undefined) ||
  "https://forge.manus.im";
const FORGE_API_KEY = import.meta.env.VITE_FRONTEND_FORGE_API_KEY as string | undefined;

// ─── Build system prompt from live fleet data ─────────────────────────────────
function buildSystemPrompt(): string {
  const now = new Date();

  // ── Car records ──
  const carLines = carDatabase.map(c => {
    const alarms = c.waysideReadings.filter(r => r.status !== "NORMAL");
    const alarmStr = alarms.length > 0
      ? alarms.map(r => `${r.detectorType} ${r.status} at ${r.location} (${r.reading})`).join("; ")
      : "all readings normal";
    const defects = c.defectFlags.filter(d => !d.resolved);
    const defectStr = defects.length > 0
      ? defects.map(d => `${d.severity}: ${d.description}`).join("; ")
      : "no open defects";
    return `${c.carNumber} | ${c.carType} | ${c.currentStatus} | ${c.currentLocation} | ${c.hazmat ? "HAZMAT " + c.hazmatClass : "no hazmat"} | Wayside: ${alarmStr} | Defects: ${defectStr}`;
  }).join("\n");

  // ── Active trains ──
  const trainLines = FLEET_SNAPSHOT.map(t => {
    const hosH = Math.floor(t.hosRemainingMin / 60);
    const hosM = t.hosRemainingMin % 60;
    const hosStr = t.hosRemainingMin <= 0 ? "HOS EXPIRED" : t.hosRemainingMin <= 60 ? `HOS CRITICAL ${hosH}h${hosM}m` : `HOS ${hosH}h${hosM}m`;
    return `${t.symbol} | ${t.state} | ${t.subdivision} Sub MP ${t.milepost} | ${t.speed} mph | ${t.cars} cars ${t.weight}t | PTC:${t.ptcState} | Alarms:${t.activeAlarms} | ${hosStr} | ${t.origin} → ${t.destination}`;
  }).join("\n");

  // ── Crew HOS ──
  const crewLines = activeCrew.map(c => {
    const hosH = Math.floor(c.hosRemainingMinutes / 60);
    const hosM = c.hosRemainingMinutes % 60;
    return `Train ${c.trainId} | ${c.subdivision} Sub MP ${c.currentMilepost} | ${c.hosStatus} | ${hosH}h${hosM}m remaining | Limit: ${c.hosLimitHours}h | Crew: ${c.members.map(m => m.name + " (" + m.role + ")").join(", ")} | Next change: ${c.nextCrewChange.location} in ${c.nextCrewChange.distanceRemaining} miles`;
  }).join("\n");

  // ── Yards ──
  const yardLines = YARDS.map(y =>
    `${y.name} (${y.city}, ${y.subdivision} Sub) | ${y.currentCars}/${y.capacity} cars (${Math.round(y.currentCars / y.capacity * 100)}%) | ${y.currentLocos} locos | ${y.trainsInYard} trains in yard | ${y.trainsArriving} arriving | ${y.trainsDeparting} departing`
  ).join("\n");

  // ── WILD summary (all cars above 50 kips) ──
  const wildAbove50 = carDatabase.flatMap(c =>
    c.waysideReadings
      .filter(r => r.detectorType === "WILD")
      .map(r => {
        const kips = parseInt(r.reading.match(/(\d+)\s*kips/i)?.[1] ?? "0");
        return kips >= 50 ? `${c.carNumber} | ${kips} kips | ${r.status} | ${r.location} (${r.subdivision} Sub) | ${r.timestamp}` : null;
      })
      .filter(Boolean)
  ).join("\n") || "No WILD readings above 50 kips in the dataset.";

  // ── HBD summary ──
  const hbdAlerts = carDatabase.flatMap(c =>
    c.waysideReadings
      .filter(r => r.detectorType === "HBD" && r.status !== "NORMAL")
      .map(r => `${c.carNumber} | ${r.status} | ${r.reading} | ${r.location} (${r.subdivision} Sub) | ${r.timestamp}`)
  ).join("\n") || "No HBD alerts in the dataset.";

  // ── HAZMAT cars ──
  const hazmatCars = carDatabase.filter(c => c.hazmat).map(c =>
    `${c.carNumber} | ${c.hazmatClass} | ${c.currentStatus} | ${c.currentLocation} | Train: ${c.currentTrainId ?? "not in consist"}`
  ).join("\n") || "No HAZMAT cars in the dataset.";

  return `You are the CN Rail OT SPOG AI Assistant — an expert railway operations analyst embedded in CN Rail's Operational Technology Single Pane of Glass platform.

You have deep knowledge of CN Rail's OT systems: I-ETMS, PTC, wayside detectors (HBD, WILD, DED, AEI, TADS, WIM), COBRA radio, KES/BOS, yard operations, crew HOS, and fleet management.

Current date/time: ${now.toISOString()} (Eastern Time)

═══════════════════════════════════════════════════════════════
DETECTOR THRESHOLDS (reference)
═══════════════════════════════════════════════════════════════
WILD: ALARM >100 kips | ALERT 70–100 kips | ELEVATED 50–70 kips | NORMAL <50 kips
HBD: ALARM >60°C above ambient | ALERT 40–60°C | WATCH 20–40°C | NORMAL <20°C
DED: Binary PASS/FAIL
AEI: RFID tag confirmation
TADS: Truck hunting / lateral instability
WIM: Weigh-in-motion

═══════════════════════════════════════════════════════════════
CAR DATABASE (${carDatabase.length} cars)
═══════════════════════════════════════════════════════════════
${carLines}

═══════════════════════════════════════════════════════════════
WILD READINGS ABOVE 50 KIPS (sub-threshold included)
═══════════════════════════════════════════════════════════════
${wildAbove50}

═══════════════════════════════════════════════════════════════
HBD ALERTS
═══════════════════════════════════════════════════════════════
${hbdAlerts}

═══════════════════════════════════════════════════════════════
HAZMAT CARS
═══════════════════════════════════════════════════════════════
${hazmatCars}

═══════════════════════════════════════════════════════════════
ACTIVE TRAINS (${FLEET_SNAPSHOT.length} trains)
═══════════════════════════════════════════════════════════════
${trainLines}

═══════════════════════════════════════════════════════════════
CREW HOS STATUS (${activeCrew.length} active crews)
═══════════════════════════════════════════════════════════════
${crewLines}

═══════════════════════════════════════════════════════════════
YARDS (${YARDS.length} yards)
═══════════════════════════════════════════════════════════════
${yardLines}

═══════════════════════════════════════════════════════════════
SUBDIVISION CAR PASSAGE COUNTS — LAST 7 DAYS (AEI data)
═══════════════════════════════════════════════════════════════
Kingston Sub      | 847 cars | 312 unique | 18 trains | 4 defects (1 ALARM, 3 ELEVATED)
Edson Sub         | 623 cars | 241 unique | 14 trains | 2 defects
Montréal Sub      | 591 cars | 228 unique | 13 trains | 0 defects
Rivers Sub        | 412 cars | 187 unique | 9 trains  | 2 defects
Bala Sub          | 384 cars | 156 unique | 8 trains  | 2 defects
Ruel Sub          | 298 cars | 134 unique | 7 trains  | 1 defect
Oakville Sub      | 276 cars | 118 unique | 6 trains  | 0 defects
MacTier Sub       | 201 cars | 94 unique  | 5 trains  | 0 defects
Wainwright Sub    | 188 cars | 82 unique  | 4 trains  | 0 defects
Strathroy Sub     | 144 cars | 71 unique  | 3 trains  | 0 defects
TOTAL: 3,964 car passages | 1,623 unique cars | 87 trains (last 7 days)

═══════════════════════════════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════════════════════════════
You can answer ANY operational question — fleet-wide, subdivision-level, or per-car.
Examples:
- "How many cars passed through Kingston Sub in the last week?" → use subdivision counts above
- "Which cars had WILD readings above 50 kips even if below the alert threshold?" → use WILD table
- "What is the status of train M30151-05?" → use active trains data
- "Which subdivision had the most defects this week?" → use subdivision summary
- "Are there any HAZMAT cars in active consists?" → use HAZMAT section
- "Which trains have crew approaching HOS limits?" → use crew HOS section

Always:
- Be specific and cite exact data points (car numbers, kips values, subdivision, milepost, timestamp)
- Distinguish between official alert thresholds and sub-threshold elevated readings when relevant
- Provide actionable insights and flag safety-critical items
- Respond in a professional railway operations tone
- If asked about data not in the context, explain what data would normally be available`;
}

// ─── Suggested prompts ────────────────────────────────────────────────────────
const SUGGESTED_PROMPTS = [
  { icon: <Activity size={14} className="text-amber-400" />, label: "WILD above 50 kips", prompt: "Which cars had WILD readings above 50 kips in the last 7 days, even if they didn't trigger an alert?" },
  { icon: <MapPin size={14} className="text-blue-400" />, label: "Kingston Sub traffic", prompt: "How many cars passed through Kingston Sub in the last week?" },
  { icon: <AlertTriangle size={14} className="text-red-400" />, label: "Active alarms", prompt: "What are all the active ALARM and ALERT conditions across the network right now?" },
  { icon: <Train size={14} className="text-emerald-400" />, label: "Train status", prompt: "Give me a status summary of all active trains on the network." },
  { icon: <Activity size={14} className="text-purple-400" />, label: "HBD trending", prompt: "Are there any cars with HBD readings that are trending toward an alarm threshold?" },
  { icon: <MapPin size={14} className="text-cyan-400" />, label: "Subdivision comparison", prompt: "Which subdivision had the most defects detected in the last 7 days?" },
  { icon: <AlertTriangle size={14} className="text-amber-400" />, label: "Crew HOS risk", prompt: "Which trains have crew members approaching HOS limits?" },
  { icon: <Train size={14} className="text-blue-400" />, label: "HAZMAT cars", prompt: "Are there any HAZMAT cars in active consists right now? What are their readings?" },
];

// ─── LLM call (direct from browser) ──────────────────────────────────────────
async function callLLM(messages: { role: string; content: string }[]): Promise<string> {
  const endpoint = `${FORGE_BASE_URL}/v1/chat/completions`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (FORGE_API_KEY) headers["Authorization"] = `Bearer ${FORGE_API_KEY}`;

  const resp = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: "gemini-2.5-flash",
      messages,
      max_tokens: 4096,
    }),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`LLM error ${resp.status}: ${txt.slice(0, 200)}`);
  }

  const data = await resp.json() as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? "No response received. Please try again.";
}

// ─── Session sidebar item ─────────────────────────────────────────────────────
function SessionItem({
  sessionKey, preview, updatedAt, isActive, onClick,
}: {
  sessionKey: string; preview: string; updatedAt: Date; isActive: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded transition-colors group ${
        isActive ? "bg-[#D22630]/10 border border-[#D22630]/30" : "hover:bg-accent border border-transparent"
      }`}
    >
      <div className="flex items-center gap-2 mb-0.5">
        <MessageSquare size={11} className={isActive ? "text-[#D22630]" : "text-muted-foreground"} />
        <span className={`text-xs font-medium truncate ${isActive ? "text-[#D22630]" : "text-foreground"}`}>
          {sessionKey === "general" ? "General" : sessionKey}
        </span>
      </div>
      {preview && (
        <div className="text-[11px] text-muted-foreground truncate pl-4">{preview}</div>
      )}
      <div className="flex items-center gap-1 pl-4 mt-0.5">
        <Clock size={9} className="text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground">
          {new Date(updatedAt).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
        </span>
      </div>
    </button>
  );
}

// ─── Fleet context panel ──────────────────────────────────────────────────────
function FleetContextPanel() {
  const alarmCars = carDatabase.filter(c => c.waysideReadings.some(r => r.status !== "NORMAL"));
  const wildAbove50 = carDatabase.flatMap(c =>
    c.waysideReadings
      .filter(r => r.detectorType === "WILD")
      .map(r => {
        const kips = parseInt(r.reading.match(/(\d+)\s*kips/i)?.[1] ?? "0");
        return kips >= 50 ? { car: c.carNumber, kips, status: r.status, sub: r.subdivision } : null;
      })
      .filter(Boolean)
  ) as { car: string; kips: number; status: string; sub: string }[];
  wildAbove50.sort((a, b) => b.kips - a.kips);

  const criticalCrew = activeCrew.filter(c => c.hosStatus === "CRITICAL" || c.hosStatus === "WARNING");
  const movingTrains = FLEET_SNAPSHOT.filter(t => t.state === "EN_ROUTE_MOVING");

  return (
    <div className="space-y-5 p-4 text-sm">
      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Active Alarms</div>
        <div className="space-y-1.5">
          {alarmCars.slice(0, 4).map(c => {
            const alarm = c.waysideReadings.find(r => r.status !== "NORMAL")!;
            return (
              <div key={c.carNumber} className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-mono text-xs text-foreground">{c.carNumber}</div>
                  <div className="text-[11px] text-muted-foreground">{alarm.detectorType} · {alarm.subdivision} Sub</div>
                </div>
                <Badge variant="outline" className={`text-[9px] px-1 py-0 border-0 flex-shrink-0 ${
                  alarm.status === "ALARM" ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400"
                }`}>{alarm.status}</Badge>
              </div>
            );
          })}
          {alarmCars.length === 0 && <div className="text-[11px] text-emerald-400">All clear</div>}
        </div>
      </div>

      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">WILD above 50 kips</div>
        <div className="space-y-1">
          {wildAbove50.slice(0, 6).map(r => (
            <div key={r.car} className="flex items-center justify-between">
              <span className="font-mono text-xs text-foreground">{r.car}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">{r.kips}k</span>
                <Badge variant="outline" className={`text-[9px] px-1 py-0 border-0 ${
                  r.status === "ALARM" ? "bg-red-500/15 text-red-400" :
                  r.status === "ALERT" ? "bg-amber-500/15 text-amber-400" :
                  "bg-blue-500/15 text-blue-400"
                }`}>{r.status}</Badge>
              </div>
            </div>
          ))}
          {wildAbove50.length === 0 && <div className="text-[11px] text-muted-foreground">None</div>}
        </div>
      </div>

      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Active Trains</div>
        <div className="space-y-1">
          {movingTrains.slice(0, 5).map(t => {
            const hosH = Math.floor(t.hosRemainingMin / 60);
            const hosM = t.hosRemainingMin % 60;
            const hosColor = t.hosRemainingMin <= 60 ? "text-red-400" : t.hosRemainingMin <= 120 ? "text-amber-400" : "text-muted-foreground";
            return (
              <div key={t.symbol} className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-xs text-foreground">{t.symbol}</div>
                  <div className="text-[10px] text-muted-foreground">{t.subdivision} · {t.speed} mph</div>
                </div>
                <div className="text-right">
                  {t.activeAlarms > 0 && <Badge variant="outline" className="text-[9px] px-1 py-0 border-0 bg-red-500/15 text-red-400">{t.activeAlarms} ALM</Badge>}
                  <div className={`text-[10px] ${hosColor}`}>{hosH}h{hosM}m HOS</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {criticalCrew.length > 0 && (
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">HOS Alerts</div>
          <div className="space-y-1">
            {criticalCrew.map(c => {
              const hosH = Math.floor(c.hosRemainingMinutes / 60);
              const hosM = c.hosRemainingMinutes % 60;
              return (
                <div key={c.crewId} className="flex items-center justify-between">
                  <span className="font-mono text-xs text-foreground">{c.trainId}</span>
                  <Badge variant="outline" className={`text-[9px] px-1 py-0 border-0 ${
                    c.hosStatus === "CRITICAL" ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400"
                  }`}>{hosH}h{hosM}m</Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Chat message bubble ──────────────────────────────────────────────────────
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div className={`flex-shrink-0 w-7 h-7 rounded flex items-center justify-center ${
        isUser ? "bg-[#D22630]/10" : "bg-muted"
      }`}>
        {isUser ? <span className="text-[10px] text-[#D22630] font-bold">YOU</span> : <Bot size={14} className="text-muted-foreground" />}
      </div>
      <div className={`max-w-[75%] px-3.5 py-2.5 rounded-lg text-sm leading-relaxed whitespace-pre-wrap ${
        isUser
          ? "bg-[#D22630]/10 text-foreground rounded-tr-none"
          : "bg-muted text-foreground rounded-tl-none"
      }`}>
        {msg.content}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AIAssistant() {
  const [sessions, setSessions] = useState<Session[]>([
    { key: "general", messages: [], updatedAt: new Date() },
  ]);
  const [activeKey, setActiveKey] = useState("general");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [newSessionInput, setNewSessionInput] = useState("");
  const [showNewSession, setShowNewSession] = useState(false);
  const newSessionRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const systemPrompt = useMemo(() => buildSystemPrompt(), []);
  const activeSession = sessions.find(s => s.key === activeKey) ?? sessions[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession.messages, isLoading]);

  useEffect(() => {
    if (showNewSession) newSessionRef.current?.focus();
  }, [showNewSession]);

  function handleSwitchSession(key: string) {
    setActiveKey(key);
  }

  function handleNewSession() {
    const key = newSessionInput.trim() || "general";
    if (!sessions.find(s => s.key === key)) {
      setSessions(prev => [...prev, { key, messages: [], updatedAt: new Date() }]);
    }
    setActiveKey(key);
    setNewSessionInput("");
    setShowNewSession(false);
  }

  async function handleSendMessage(content: string) {
    if (!content.trim() || isLoading) return;
    setInput("");

    const userMsg: Message = { role: "user", content };

    // Optimistically add user message
    setSessions(prev => prev.map(s =>
      s.key === activeKey
        ? { ...s, messages: [...s.messages, userMsg], updatedAt: new Date() }
        : s
    ));

    setIsLoading(true);
    try {
      const history = [...activeSession.messages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const llmMessages = [
        { role: "system", content: systemPrompt },
        ...history,
      ];

      const reply = await callLLM(llmMessages);
      const assistantMsg: Message = { role: "assistant", content: reply };

      setSessions(prev => prev.map(s =>
        s.key === activeKey
          ? { ...s, messages: [...s.messages, assistantMsg], updatedAt: new Date() }
          : s
      ));
    } catch (err) {
      const errMsg: Message = {
        role: "assistant",
        content: `⚠️ Error: ${err instanceof Error ? err.message : "Unknown error"}. Please try again.`,
      };
      setSessions(prev => prev.map(s =>
        s.key === activeKey ? { ...s, messages: [...s.messages, errMsg] } : s
      ));
    } finally {
      setIsLoading(false);
    }
  }

  function handleClear() {
    setSessions(prev => prev.map(s =>
      s.key === activeKey ? { ...s, messages: [], updatedAt: new Date() } : s
    ));
  }

  const suggestedPrompts = useMemo(() => SUGGESTED_PROMPTS, []);

  return (
    <Layout>
      <div className="flex h-full overflow-hidden">

        {/* ── Left: Session Sidebar ─────────────────────────────────────────── */}
        <div className="w-52 flex-shrink-0 border-r border-border flex flex-col bg-card/30">
          <div className="px-3 pt-4 pb-2 border-b border-border flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Conversations</span>
            <button
              onClick={() => setShowNewSession(v => !v)}
              className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              title="New conversation"
            >
              {showNewSession ? <X size={13} /> : <Plus size={13} />}
            </button>
          </div>

          {showNewSession && (
            <div className="px-3 py-2 border-b border-border">
              <input
                ref={newSessionRef}
                type="text"
                value={newSessionInput}
                onChange={e => setNewSessionInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleNewSession(); if (e.key === "Escape") setShowNewSession(false); }}
                placeholder="Topic or car # (optional)"
                className="w-full h-7 px-2 text-xs rounded border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#D22630]/50"
              />
              <button
                onClick={handleNewSession}
                className="mt-1.5 w-full text-xs text-center py-1 rounded bg-[#D22630]/10 hover:bg-[#D22630]/20 text-[#D22630] transition-colors"
              >
                Start conversation
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sessions.map(s => (
              <SessionItem
                key={s.key}
                sessionKey={s.key}
                preview={s.messages.filter(m => m.role === "user").slice(-1)[0]?.content.slice(0, 60) ?? "Ask anything about the network"}
                updatedAt={s.updatedAt}
                isActive={activeKey === s.key}
                onClick={() => handleSwitchSession(s.key)}
              />
            ))}
          </div>
        </div>

        {/* ── Center: Chat ──────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Chat header */}
          <div className="flex-shrink-0 px-5 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-[#D22630]/10 rounded flex items-center justify-center">
                <Bot size={15} className="text-[#D22630]" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                  OT Intelligence Assistant
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {activeKey === "general" ? "General operational queries" : `Session: ${activeKey}`}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activeKey !== "general" && (
                <Badge variant="outline" className="font-mono text-xs border-[#D22630]/40 text-[#D22630]">
                  {activeKey}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground gap-1.5 text-xs h-7"
                onClick={handleClear}
                disabled={activeSession.messages.length === 0}
              >
                <Trash2 size={12} />
                Clear
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
            {activeSession.messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <div className="w-12 h-12 bg-[#D22630]/10 rounded-full flex items-center justify-center">
                  <Bot size={22} className="text-[#D22630]" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground mb-1">Ask me anything about the CN Rail OT network</div>
                  <div className="text-xs text-muted-foreground max-w-xs">
                    Fleet alarms, subdivision traffic, car readings, crew HOS, train status, HAZMAT cars, and more.
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 justify-center max-w-md">
                  {suggestedPrompts.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(p.prompt)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border hover:bg-accent text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {p.icon}
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeSession.messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded bg-muted flex items-center justify-center">
                  <Bot size={14} className="text-muted-foreground" />
                </div>
                <div className="bg-muted rounded-lg rounded-tl-none px-3.5 py-2.5 flex items-center gap-2">
                  <Loader2 size={13} className="animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Analyzing fleet data…</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div className="flex-shrink-0 px-4 py-3 border-t border-border">
            <div className="flex gap-2 items-end">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(input);
                  }
                }}
                placeholder="Ask anything — car readings, subdivision traffic, fleet alarms, crew status…"
                rows={1}
                className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#D22630]/50 min-h-[38px] max-h-32"
                style={{ lineHeight: "1.5" }}
              />
              <Button
                size="sm"
                className="h-[38px] w-[38px] p-0 bg-[#D22630] hover:bg-[#B01E28] flex-shrink-0"
                onClick={() => handleSendMessage(input)}
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </Button>
            </div>
            <div className="text-[10px] text-muted-foreground mt-1.5 text-center">
              Press Enter to send · Shift+Enter for new line
            </div>
          </div>
        </div>

        {/* ── Right: Fleet Context Panel ────────────────────────────────────── */}
        <div className="w-60 flex-shrink-0 border-l border-border overflow-y-auto bg-card/30">
          <div className="px-4 pt-4 pb-2 border-b border-border flex items-center justify-between">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Live Context</div>
            <ChevronRight size={12} className="text-muted-foreground" />
          </div>
          <FleetContextPanel />
        </div>
      </div>
    </Layout>
  );
}
