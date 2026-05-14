import { useState, useEffect, useRef, useMemo } from "react";
import Layout from "@/components/Layout";
import {
  Bot, Trash2, Loader2, Plus, MessageSquare, Clock,
  Train, AlertTriangle, Activity, MapPin, ChevronRight, X,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ─── Suggested prompts shown on the welcome screen ───────────────────────────
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

// ─── Right-side context panel: live fleet snapshot ───────────────────────────
function FleetContextPanel() {
  return (
    <div className="space-y-5 p-4 text-sm">
      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Active Alarms</div>
        <div className="space-y-1.5">
          {[
            { car: "TTX 891204", type: "WILD", value: "112 kips", sub: "Kingston", color: "text-red-400" },
            { car: "BNSF 584291", type: "HBD", value: "52°C above amb", sub: "Rivers", color: "text-amber-400" },
            { car: "UP 448812", type: "WILD", value: "78 kips", sub: "Edson", color: "text-amber-400" },
          ].map(a => (
            <div key={a.car} className="flex items-start justify-between gap-2">
              <div>
                <div className="font-mono text-xs text-foreground">{a.car}</div>
                <div className="text-[11px] text-muted-foreground">{a.type} · {a.sub} Sub</div>
              </div>
              <span className={`text-xs font-medium flex-shrink-0 ${a.color}`}>{a.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">WILD above 50 kips (7d)</div>
        <div className="space-y-1">
          {[
            { car: "TTX 891204", kips: 112, status: "ALARM" },
            { car: "UP 448812", kips: 78, status: "ALERT" },
            { car: "TTGX 8841", kips: 68, status: "ELEVATED" },
            { car: "BNSF 584291", kips: 61, status: "ELEVATED" },
            { car: "CN 714823", kips: 54, status: "ELEVATED" },
            { car: "CPKC 334521", kips: 52, status: "ELEVATED" },
            { car: "NS 228834", kips: 51, status: "ELEVATED" },
          ].map(r => (
            <div key={r.car} className="flex items-center justify-between">
              <span className="font-mono text-xs text-foreground">{r.car}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">{r.kips}k</span>
                <Badge
                  variant="outline"
                  className={`text-[9px] px-1 py-0 border-0 ${
                    r.status === "ALARM" ? "bg-red-500/15 text-red-400" :
                    r.status === "ALERT" ? "bg-amber-500/15 text-amber-400" :
                    "bg-blue-500/15 text-blue-400"
                  }`}
                >
                  {r.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Cars Passed (7d)</div>
        <div className="space-y-1">
          {[
            { sub: "Kingston", count: 847 },
            { sub: "Edson", count: 623 },
            { sub: "Montréal", count: 591 },
            { sub: "Rivers", count: 412 },
            { sub: "Bala", count: 384 },
            { sub: "Ruel", count: 298 },
          ].map(s => (
            <div key={s.sub} className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{s.sub} Sub</span>
              <span className="text-xs font-medium text-foreground">{s.count.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Active Trains</div>
        <div className="space-y-1.5">
          {[
            { id: "Q11451-05", sub: "Kingston", mph: 52, status: "CLR" },
            { id: "M30151-05", sub: "Rivers", mph: 48, status: "1 ALM" },
            { id: "L50251-05", sub: "Edson", mph: 44, status: "2 ALM" },
            { id: "T22151-05", sub: "Kingston", mph: 55, status: "HOS 30m" },
            { id: "F77251-05", sub: "Ruel", mph: 0, status: "HOS CRIT" },
          ].map(t => (
            <div key={t.id} className="flex items-center justify-between">
              <div>
                <div className="font-mono text-xs text-foreground">{t.id}</div>
                <div className="text-[11px] text-muted-foreground">{t.sub} · {t.mph} mph</div>
              </div>
              <Badge
                variant="outline"
                className={`text-[9px] px-1.5 py-0 ${
                  t.status.includes("ALM") ? "border-red-500/40 text-red-400" :
                  t.status.includes("HOS") ? "border-amber-500/40 text-amber-400" :
                  "border-emerald-500/40 text-emerald-400"
                }`}
              >
                {t.status}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Session list sidebar item ────────────────────────────────────────────────
function SessionItem({
  sessionKey,
  preview,
  updatedAt,
  isActive,
  onClick,
}: {
  sessionKey: string;
  preview: string;
  updatedAt: Date;
  isActive: boolean;
  onClick: () => void;
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

export default function AIAssistant() {
  const { isAuthenticated, loading } = useAuth();
  const [sessionKey, setSessionKey] = useState("general");
  const [newSessionInput, setNewSessionInput] = useState("");
  const [showNewSession, setShowNewSession] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const newSessionRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();

  // Load all sessions for the sidebar
  const sessionsQuery = trpc.ai.listSessions.useQuery(undefined, { enabled: isAuthenticated });

  // Load history for the active session
  const historyQuery = trpc.ai.getHistory.useQuery(
    { sessionKey },
    { enabled: isAuthenticated }
  );

  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: "assistant" as const, content: data.reply as string }]);
      utils.ai.listSessions.invalidate();
    },
    onError: (err) => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `⚠️ Error: ${err.message}. Please try again.`
      }]);
    }
  });

  const clearMutation = trpc.ai.clearHistory.useMutation({
    onSuccess: () => {
      setMessages([]);
      utils.ai.getHistory.invalidate({ sessionKey });
      utils.ai.listSessions.invalidate();
    }
  });

  // Load history when session changes
  useEffect(() => {
    if (historyQuery.data?.messages) {
      setMessages(historyQuery.data.messages as Message[]);
    }
  }, [historyQuery.data]);

  // Focus new session input when shown
  useEffect(() => {
    if (showNewSession) newSessionRef.current?.focus();
  }, [showNewSession]);

  function handleSwitchSession(key: string) {
    setSessionKey(key);
    setMessages([]);
  }

  function handleNewSession() {
    const key = newSessionInput.trim().toUpperCase() || "general";
    setSessionKey(key);
    setMessages([]);
    setNewSessionInput("");
    setShowNewSession(false);
  }

  function handleSendMessage(content: string) {
    const userMsg: Message = { role: "user", content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    const history = newMessages
      .slice(0, -1)
      .map(m => ({ role: m.role as "user" | "assistant", content: m.content }));

    chatMutation.mutate({ sessionKey, message: content, history });
  }

  const suggestedPrompts = useMemo(() => SUGGESTED_PROMPTS.map(p => p.prompt), []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-muted-foreground" size={24} />
      </div>
    );
  }

  // No auth gate — AI Assistant is available to all users

  const sessions = sessionsQuery.data ?? [];

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
          {/* Always show the "General" session */}
          <SessionItem
            sessionKey="general"
            preview={sessions.find(s => s.sessionKey === "general")?.preview ?? "Ask anything about the network"}
            updatedAt={sessions.find(s => s.sessionKey === "general")?.updatedAt ?? new Date()}
            isActive={sessionKey === "general"}
            onClick={() => handleSwitchSession("general")}
          />
          {sessions
            .filter(s => s.sessionKey !== "general")
            .map(s => (
              <SessionItem
                key={s.sessionKey}
                sessionKey={s.sessionKey}
                preview={s.preview}
                updatedAt={s.updatedAt}
                isActive={sessionKey === s.sessionKey}
                onClick={() => handleSwitchSession(s.sessionKey)}
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
                {sessionKey === "general" ? "General operational queries" : `Session: ${sessionKey}`}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {sessionKey !== "general" && (
              <Badge variant="outline" className="font-mono text-xs border-[#D22630]/40 text-[#D22630]">
                {sessionKey}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground gap-1.5 text-xs h-7"
              onClick={() => clearMutation.mutate({ sessionKey })}
              disabled={clearMutation.isPending || messages.length === 0}
            >
              <Trash2 size={12} />
              Clear
            </Button>
          </div>
        </div>

        {/* Chat body */}
        <div className="flex-1 overflow-hidden min-h-0">
          <AIChatBox
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={chatMutation.isPending}
            placeholder="Ask anything — car readings, subdivision traffic, fleet alarms, crew status…"
            height="100%"
            emptyStateMessage="Ask me anything about the CN Rail OT network"
            suggestedPrompts={suggestedPrompts}
          />
        </div>
      </div>

      {/* ── Right: Fleet Context Panel ────────────────────────────────────── */}
      <div className="w-60 flex-shrink-0 border-l border-border overflow-y-auto bg-card/30">
        <div className="px-4 pt-4 pb-2 border-b border-border flex items-center justify-between">
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Live Context</div>
          <ChevronRight size={12} className="text-muted-foreground" />
        </div>

        {/* Quick-fire example prompts */}
        <div className="px-3 pt-3 pb-2 border-b border-border">
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Try asking</div>
          <div className="space-y-1">
            {SUGGESTED_PROMPTS.slice(0, 5).map((p, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(p.prompt)}
                className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent transition-colors group"
              >
                <span className="flex-shrink-0">{p.icon}</span>
                <span className="text-[11px] text-muted-foreground group-hover:text-foreground truncate">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        <FleetContextPanel />
      </div>
    </div>
    </Layout>
  );
}
