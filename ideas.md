# CN Rail OT Single Pane of Glass — Design Brainstorm

## Chosen Design: Industrial Command Center

**Design Movement:** Industrial Mission Control — inspired by railway operations centers and modern NOC dashboards.

**Core Principles:**
1. Dark background with high-contrast data elements — operators work in low-light environments
2. Information density without clutter — every pixel earns its place
3. Status-first hierarchy — critical alerts dominate visual weight
4. CN brand anchoring — CN red (#D22630) as the primary accent color

**Color Philosophy:**
- Background: Deep navy-black (#0A0E1A) — the "night sky" of the network
- Surface: Dark slate (#111827) — card and panel backgrounds
- Border: Subtle (#1E2A3A) — structural separation without distraction
- CN Red (#D22630) — critical alerts, primary actions, CN brand
- Amber (#F59E0B) — warnings
- Emerald (#10B981) — healthy / operational
- Sky Blue (#38BDF8) — informational / data highlights
- Text Primary: (#F1F5F9) — high contrast white
- Text Secondary: (#94A3B8) — muted labels

**Layout Paradigm:**
- Persistent left sidebar (system navigation + persona switcher)
- Top header bar (network health summary + active incidents count)
- Main content area: 3-column grid for dashboard, full-width for detail views
- Status bar at bottom: live clock, data freshness indicator

**Signature Elements:**
1. Pulsing status dots for live asset health (green/amber/red)
2. Horizontal "trace timeline" visualization for synthetic PTC traces
3. CN red accent line on left edge of critical alert cards

**Typography:**
- Display/Headers: Space Grotesk (bold, technical feel)
- Body/Data: DM Mono for numbers and codes, DM Sans for labels
- Font sizes: 11px (micro labels), 13px (table data), 15px (body), 20px (section headers), 32px (KPI numbers)
