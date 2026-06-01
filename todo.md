
## Crossing Monitoring & AI Enhancements (2026-05-14)

- [x] Create crossingData.ts with DAU/WSDMM data model (all attributes from spreadsheet)
- [x] Add 20+ synthetic crossing assets across CN subdivisions with realistic DAU/WSDMM data
- [x] Add crossing alarms (critical/warning/info) with SNOW ticket references
- [x] Add crossing events log with site-sortable entries
- [x] Build CrossingMonitoring.tsx page with 3 sub-views: Asset Viewer, Event Viewer, Alarm Viewer
- [x] Implement maintenance mode toggle per crossing asset
- [x] Add SNOW integration UI (ticket creation, asset sync status)
- [x] Add manual alarm clear with audit trail
- [x] Add root cause drill-down layers to AI Assistant responses (expandable RCA panels)
- [x] Enrich AI Assistant with more pre-built chat conversations (crossing-aware, RCA-focused)
- [x] Add crossing-specific suggested prompts to AI Assistant
- [x] Register /crossing-monitoring route in App.tsx navigation
- [x] Push to GitHub and trigger Vercel deployment

## Charts Across All Pages (2026-05-14)
- [x] Add charts to Network Overview (alarm trend, subdivision traffic bar, PTC state donut)
- [x] Add charts to Wayside Intel (WILD kips distribution bar, HBD temperature trend line, detector hit rate)
- [x] Add charts to Fleet Ops (train state donut, speed distribution histogram)
- [x] Add charts to Car Search (wayside reading trend per car, defect history)
- [x] Add charts to Crew & HOS (HOS remaining bar, crew status donut)
- [x] Add charts to Dispatch & Authority (authority coverage, speed restriction chart)
- [x] Add charts to System Health (uptime trend, latency sparklines)
- [x] Add charts to Crossing Monitoring (alarm frequency bar, heartbeat timeline, voltage trend)

## Theme Fix (2026-05-14)
- [x] Fix CrossingMonitoring.tsx hardcoded dark colors — replace with semantic theme tokens (bg-card, bg-background, text-foreground, border-border, etc.)

## Theme & RCA Fixes (2026-05-14)
- [x] Fix 3 remaining hardcoded dark colors in CrossingMonitoring.tsx (bg-black/60 overlay, text-white badge, bg-[#0d0f14] filter bar)
- [x] Redesign Incidents tab Root Cause column to show meaningful RCA content (not blank/placeholder) with expandable drill-down layers

## Defect RCA & Deploy (2026-05-14)
- [x] Build DefectRcaModal with 4 layers: What Detected, Rule Violated, Mandatory Action, Next Steps
- [x] Wire DefectRcaModal to Car Defect tab Root Cause column (replace — with Defect Analysis button)
- [x] Deploy all changes (CrossingMonitoring theme fix + DefectRcaModal) to Vercel

## RCA Modal Timeline Enhancement (2026-05-14)
- [x] Add visual timeline/progress tracker to Defect Analysis RCA modal (Mandatory Actions + Next Steps layers)

## Incidents Page Enhancements (2026-05-14)
- [x] Fix getNextSteps to include phase field on all NextStepItem entries
- [x] Replace Layer 3 Mandatory Action with visual vertical timeline (6 nodes: Detect → Notify → Stop/Set-Out → Inspect → Work Order → Return to Service)
- [x] Replace Layer 4 Next Steps with progress tracker (checkboxes, phase grouping, progress bar)
- [x] Fix OT System Incidents Root Cause column — show inline root cause summary text (not just a button)
- [x] Add sorting to Car Defects tab (by severity, date, detector type, subdivision, status)
- [x] Add filtering to Car Defects tab (by detector type, status, subdivision, severity)
- [x] Build Reports tab with CSV export for OT incidents and Car Defect incidents
- [x] Build Reports tab with PDF export (formatted summary report)

## Reports Tab Date Range Picker (2026-05-14) — DUPLICATE (completed above)
- [x] Add date range picker to Reports tab (start date, end date, quick presets: Today, Last 7 days, Last 30 days, This Month, Custom)
- [x] Filter OT incidents and Car Defect incidents by selected date range before export
- [x] Show record count preview ("X OT incidents, Y car defects in range") before export
- [x] Apply date range filter to both CSV and PDF exports

## Standalone Reports Page (2026-05-15) — DUPLICATE (completed above)
- [x] Remove Reports tab from Incidents.tsx (keep OT + Car Defects tabs only)
- [x] Create Reports.tsx — central report hub with left panel search/filter and right panel results
- [x] Date range picker with presets (Today, Last 7, Last 30, This Month, Custom)
- [x] Module selector: OT Incidents, Car Defects, Crossings, Fleet, Crew HOS, Wayside, Dispatch
- [x] Keyword search across all selected modules
- [x] Record count preview per module before export
- [x] CSV export per module (filtered by date + keyword)
- [x] Full HTML report export (all selected modules combined)
- [x] Register /reports route in App.tsx
- [x] Add Reports nav item to Layout.tsx sidebar
- [x] Push to GitHub and deploy to Vercel

## Reports Tab Date Range Picker — COMPLETED (2026-05-15)
- [x] Add date range picker to Reports tab (start date, end date, quick presets: Today, Last 7 days, Last 30 days, This Month, Custom)
- [x] Filter OT incidents and Car Defect incidents by selected date range before export
- [x] Show record count preview ("X OT incidents, Y car defects in range") before export
- [x] Apply date range filter to both CSV and PDF exports

## Standalone Reports Page — COMPLETED (2026-05-15)
- [x] Remove Reports tab from Incidents.tsx (keep OT + Car Defects tabs only)
- [x] Create Reports.tsx — central report hub with left panel search/filter and right panel results
- [x] Date range picker with presets (Today, Last 7, Last 30, This Month, Custom)
- [x] Module selector: OT Incidents, Car Defects, Crossings, Fleet, Crew HOS, Wayside, Dispatch
- [x] Keyword search across all selected modules
- [x] Record count preview per module before export
- [x] CSV export per module (filtered by date + keyword)
- [x] Full HTML report export (all selected modules combined)
- [x] Register /reports route in App.tsx
- [x] Add Reports nav item to Layout.tsx sidebar
- [x] Push to GitHub and deploy to Vercel

## Reports Page Enhancements — COMPLETED (2026-05-15)
- [x] Add pagination to all module tables in Reports.tsx (10/25/50/100 rows per page)
- [x] Add saved report configurations (localStorage, name/load/delete)
- [x] Add visual summary statistics panel (KPI tiles, module distribution bar, severity breakdown, HOS status)

## Crossing Monitoring UX & Clearblade Demo Alignment (2026-05-15)
- [x] Add clickable row indicators to Asset Viewer table (hover highlight, ChevronRight, tooltip)
- [x] Add pagination to Asset Viewer table (10/25/50/100, page numbers, prev/next, first/last)
- [x] Convert Alarm Viewer from cards to full table with columns: #, Actions, Severity, Alarm Code, Open, Crossing, Subdivision/MP, Device, Description, SNOW Ticket, Timestamp
- [x] Add 3-dot Actions menu per alarm row (View Asset Detail, Suppress Alarm, Create SNOW Ticket)
- [x] Add pagination to Alarm Viewer table
- [x] Convert Event Viewer from cards to full table with columns: #, Type, Site, Subdivision/MP, Device, Description, Details, Timestamp, chevron
- [x] Add clickable row indicators to Event Viewer table
- [x] Add pagination to Event Viewer table

## Incidents Page Pagination (2026-05-15)
- [x] Add pagination to OT System Incidents table (10/25/50/100 rows per page)
- [x] Add pagination to Car Defects table (resets on filter/sort change)

## Reports Page Bug Fix (2026-05-15)
- [x] Fix nested button hydration error in Reports.tsx (CSV export span inside outer button)

## Synthetic Traces Redesign (2026-05-19)
- [x] Enrich SyntheticTrace/TraceHop interfaces with hopDurationMs, signalDbm, site fields
- [x] Expand mock data from 8 to 20 enriched traces across 8 subdivisions
- [x] Add 6-KPI summary bar (Total, Complete, Degraded, Failed, Avg Latency, Delivery Rate)
- [x] Add search/filter bar (keyword, status, subdivision, latency threshold)
- [x] Add sortable columns (Trace ID, Loco, Subdivision, Status, Time)
- [x] Add inline latency waterfall bars (proportional per-hop, color-coded by status)
- [x] Add expandable detail panel per row (hop-by-hop breakdown, signal strength, AI diagnosis)
- [x] Add pagination (10/25/50 rows per page with smart ellipsis navigation)
- [x] Fix React key prop warning — wrap tbody row pairs in keyed Fragment
- [x] Push to GitHub and deploy to Vercel

## User Feedback Fixes (2026-05-19)
- [x] OT Incidents: add prominent asset identity panel (loco ID, subdivision, MP, ETC/PTC state) to each incident card
- [x] OT Incidents: ensure every incident has loco, subdivision, milepost fields populated in mock data
- [x] Synthetic Traces: use EMP sequence numbers (e.g., 02050-CN8012-20250514-001) as Trace IDs
- [x] Synthetic Traces: add ETC (Canada) / PTC (USA) region badge per trace
- [x] ETC vs PTC: add contextual terminology explainer wherever ETC or PTC appears across all pages
- [x] Train Journey: rebuild message log tab as full per-loco comms log (direction, system, EMP#, latency, status)
- [x] Train Journey: show all back-and-forth messages between loco and BOS/KES/PDS/ITCM/GCP/CARMA

## PTC/ETC Terminology Fix + EMP Volume Charts (2026-05-19)
- [x] Fix all "Region" labels to "Safety System" across Traces, Incidents, Assets pages
- [x] Add safetySystem field to SyntheticTrace: ETC-ATP | ETC-DAS | PTC with correct subdivision mapping
- [x] ETC-ATP: subdivisions with WIUs — automatic brake enforcement (high-risk corridors)
- [x] ETC-DAS: subdivisions without WIUs — advisory only, no brake enforcement (lower-risk corridors)
- [x] PTC: US/CSXT interop subdivisions
- [x] Update terminology legend on Traces page to explain ETC-ATP vs ETC-DAS vs PTC correctly
- [x] Add EMP volume time-series chart (EMP-1005 vs EMP-2005 dual-line) to Synthetic Traces page
- [x] Add EMP-2080 single-line message rate chart to Synthetic Traces page
- [x] Add same EMP volume charts to Comms Intelligence page

## Observability Platform Redesign (2026-05-19)

### Navigation Restructure
- [x] Add grouped section headers to sidebar: OBSERVE / INVESTIGATE / OPERATE / CONFIGURE
- [x] OBSERVE group: Network Overview, Incidents, Assets, Wayside Intel, System Health
- [x] INVESTIGATE group: EMP Message Traces, Train Journey, Radio & Comms, Network Security, Fleet Operations
- [x] OPERATE group: Dispatch & Authority, Crew & HOS, Car Search, Crossing Monitoring
- [x] CONFIGURE group: Alert Rules, My Watch Rules, Reports, AI Assistant
- [x] Rename "Synthetic Traces" → "EMP Message Traces" (nav + page title)
- [x] Rename "Comms Intelligence" → "Radio & Comms" (nav + page title)
- [x] Rename "WMS Observability" → "Network Security" (nav + page title)
- [x] Add LVVR fault count badge to Assets nav item

### Dashboard NOC Command Centre
- [x] Add Signal Health Ribbon at top: OWL/CARMA/COBRA/I-ETMS/BOS/KES/GCP live status pills
- [x] Reorder KPI strip: Trains Moving | Stopped | In Yards | Active Alarms | PTC Compliance | LVVR Faults
- [x] Add LVVR Fleet Health KPI tile (faults / suppressed / breakdown)
- [x] Rename "PTC State Distribution" → "Safety System State" and split by ETC-ATP/ETC-DAS/PTC
- [x] Restructure main body into 3 observability columns: Detect | Predict | Act
- [x] Make Network Time-Travel scrubber collapsible
- [x] Add subdivision health heatmap row (alarm density per subdivision)
- [x] Ensure every KPI tile links to the relevant detail page

### Header Upgrade
- [x] Replace simple incident count with mini system-health bar (coloured pills per system)
- [x] Add global search box (Cmd+K) searching locos, trains, WIUs, incidents
- [x] Add notification bell with unacknowledged critical alarm count
- [x] Keep clock and theme toggle

### Page Polish
- [x] Systems page: add service dependency topology view at top
- [x] Incidents page: add "Blast Radius" column (affected trains/WIUs per incident)
- [x] Assets page: add LVVR fleet summary bar above the loco table
- [x] Traces page: update page title to "EMP Message Traces"
- [x] CommIntel page: update page title to "Radio & Comms Intelligence"
- [x] WMSObservability page: update page title to "Network Security"
- [x] Add breadcrumb to all pages showing Group > Page Name
