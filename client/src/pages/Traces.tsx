import Layout from "@/components/Layout";
import { syntheticTraces } from "@/lib/mockData";
import { GitBranch, CheckCircle, AlertTriangle, XCircle, Clock } from "lucide-react";

const hopStatusColor: Record<string, string> = {
  ok: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  slow: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  failed: "text-red-400 border-red-500/30 bg-red-500/10",
};

const hopDot: Record<string, string> = {
  ok: "bg-emerald-500",
  slow: "bg-amber-500",
  failed: "bg-red-500",
};

const traceStatusIcon: Record<string, React.ReactNode> = {
  complete: <CheckCircle size={14} className="text-emerald-400" />,
  degraded: <AlertTriangle size={14} className="text-amber-400" />,
  failed: <XCircle size={14} className="text-red-400" />,
};

const traceStatusColor: Record<string, string> = {
  complete: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  degraded: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  failed: "text-red-400 border-red-500/30 bg-red-500/10",
};

export default function Traces() {
  return (
    <Layout>
      <div className="p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Synthetic PTC Traces</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            End-to-end message delivery tracing across the PTC communication chain — Locomotive → 220MHz → COBRA → BOS
          </p>
        </div>

        {/* Explainer */}
        <div className="bg-sky-500/5 border border-sky-500/20 rounded p-3">
          <div className="flex items-start gap-2">
            <GitBranch size={14} className="text-sky-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-sky-300">
              <span className="font-semibold">How Synthetic Tracing Works:</span> Since PTC hardware cannot carry native OTel trace IDs, CN correlates messages using the PTC sequence number embedded in every I-ETMS packet. Dynatrace stitches the journey across OWL logs, ITCnet routing logs, and BOS acknowledgement logs to reconstruct the full trace — proving delivery and measuring latency at every hop.
            </div>
          </div>
        </div>

        {/* Trace Cards */}
        <div className="space-y-4">
          {syntheticTraces.map((trace) => (
            <div key={trace.id} className={`bg-card border rounded p-4 ${trace.status === 'failed' ? 'border-red-500/30' : trace.status === 'degraded' ? 'border-amber-500/30' : 'border-border'}`}>
              {/* Trace Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {traceStatusIcon[trace.status]}
                    <span className="text-sm font-semibold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {trace.locoId} — {trace.subdivision} Subdivision
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${traceStatusColor[trace.status]}`}>
                      {trace.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="mono">{trace.seqNum}</span>
                    <div className="flex items-center gap-1">
                      <Clock size={10} />
                      <span>Started {trace.startTime}</span>
                    </div>
                    {trace.latencyMs > 0 && (
                      <span className={`mono font-medium ${trace.latencyMs > 2000 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        Total: {trace.latencyMs}ms
                      </span>
                    )}
                    {trace.latencyMs === 0 && trace.status === 'failed' && (
                      <span className="mono font-medium text-red-400">Message not delivered</span>
                    )}
                  </div>
                </div>
                <span className="mono text-[10px] text-muted-foreground">{trace.id}</span>
              </div>

              {/* Hop Timeline */}
              <div className="relative">
                {/* Connecting line */}
                <div className="absolute top-3 left-3 right-3 h-px bg-border" style={{ zIndex: 0 }} />

                <div className="flex items-start justify-between relative" style={{ zIndex: 1 }}>
                  {trace.hops.map((hop, idx) => (
                    <div key={idx} className="flex flex-col items-center" style={{ width: `${100 / trace.hops.length}%` }}>
                      {/* Node */}
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mb-2 ${
                        hop.status === 'ok' ? 'border-emerald-500 bg-emerald-500/20' :
                        hop.status === 'slow' ? 'border-amber-500 bg-amber-500/20' :
                        'border-red-500 bg-red-500/20'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${hopDot[hop.status]}`} />
                      </div>

                      {/* Label */}
                      <div className="text-center px-1">
                        <div className="text-[11px] font-medium text-foreground">{hop.name}</div>
                        <div className="text-[10px] text-muted-foreground mono">{hop.system}</div>
                        {hop.timestampOffset > 0 && (
                          <div className={`text-[10px] mono mt-0.5 ${hop.status === 'slow' ? 'text-amber-400' : hop.status === 'failed' ? 'text-red-400' : 'text-emerald-400'}`}>
                            +{hop.timestampOffset}ms
                          </div>
                        )}
                        {hop.timestampOffset === 0 && idx > 0 && (
                          <div className="text-[10px] mono mt-0.5 text-red-400">—</div>
                        )}
                      </div>

                      {/* Detail */}
                      <div className={`mt-2 px-2 py-1 rounded border text-[10px] text-center ${hopStatusColor[hop.status]}`}>
                        {hop.detail}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Diagnosis */}
              {trace.status !== 'complete' && (
                <div className={`mt-4 p-2.5 rounded border text-xs ${trace.status === 'failed' ? 'border-red-500/20 bg-red-500/5 text-red-300' : 'border-amber-500/20 bg-amber-500/5 text-amber-300'}`}>
                  <span className="font-semibold">AI Diagnosis: </span>
                  {trace.status === 'failed'
                    ? `PTC message ${trace.seqNum} was transmitted by ${trace.locoId} and routed through the 220MHz network, but was never received by the BOS. The LIG socket on ${trace.locoId} was closed at the time of transmission, preventing the message from being forwarded to the BOS receiver. Root cause: LIG socket failure (see INC-20240501-001).`
                    : `PTC message ${trace.seqNum} was delivered but with a 4.2-second end-to-end latency, exceeding the Trip Optimizer initialization threshold of 2 seconds. The delay originated at the COBRA site queue (1,800ms above threshold). Root cause: COBRA queue congestion at Hornepayne site.`
                  }
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
