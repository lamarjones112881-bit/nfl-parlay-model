import { useState } from "react";
import { Panel, PanelTitle, Tag } from "../components/UIKit.jsx";

function WeatherForecastPanel({ homeTeam, forecastData, forecastLoading, onApplyWeather, currentWeather }) {
  if(!homeTeam) return null;
  const isIndoor = STADIUM_CTX[homeTeam]?.indoor;
  const hasOutdoor = !!OUTDOOR_STADIUMS[homeTeam];
  if(isIndoor) return null; // dome teams don't need forecast
  if(!hasOutdoor&&!forecastData&&!forecastLoading) return null;
  const suggested = forecastData?.suggested;
  const isApplied = currentWeather===suggested;
  return(
    <div style={{display:"flex",alignItems:"center",gap:"8px",padding:"7px 11px",background:forecastData?"rgba(56,189,248,0.05)":"rgba(255,255,255,0.02)",border:`1px solid ${forecastData?"rgba(56,189,248,0.18)":"rgba(255,255,255,0.06)"}`,borderRadius:"7px",marginBottom:"9px",flexWrap:"wrap"}}>
      <span style={{fontSize:"12px"}}>{forecastLoading?"⏳":forecastData?.icon||"🌤"}</span>
      <div style={{flex:1}}>
        <div style={{fontSize:"9px",fontWeight:700,color:"#38bdf8",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px",letterSpacing:"0.08em",textTransform:"uppercase"}}>
          {forecastLoading?"Fetching game-day forecast…":forecastData?`${forecastData.location} — ${forecastData.description}`:"Outdoor game — fetch forecast"}
        </div>
        {forecastData&&<div style={{fontSize:"9px",color:"#7dd3fc",fontFamily:"'Barlow Condensed',sans-serif"}}>
          {forecastData.tempF}°F · Wind {forecastData.windMph}mph · Precip {forecastData.precipPct}% · Model category: <span style={{fontWeight:700,color:"#38bdf8"}}>{suggested?.toUpperCase()}</span>
        </div>}
      </div>
      {forecastData&&suggested&&(
        <button onClick={()=>onApplyWeather(suggested)} style={{padding:"5px 10px",borderRadius:"5px",border:`1px solid ${isApplied?"rgba(74,222,128,0.3)":"rgba(56,189,248,0.3)"}`,background:isApplied?"rgba(74,222,128,0.08)":"rgba(56,189,248,0.08)",color:isApplied?"#4ade80":"#38bdf8",fontSize:"9px",fontWeight:700,cursor:isApplied?"default":"pointer",fontFamily:"'Barlow Condensed',sans-serif",flexShrink:0}}>
          {isApplied?"✓ Applied":"Apply Forecast"}
        </button>
      )}
    </div>
  );
}

// ── Line Shopping Panel ───────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
// PLAYER PROP & DERIVATIVE MODELER
// ─────────────────────────────────────────────────────────────────────────
// Three-layer system:
// 1. Book Lines — fetched live from DK/FD/Caesars/BetMGM
// 2. Model Projections — derived from the 17-signal game model
// 3. Edge Detection — where model disagrees with the book line by 8%+
//
// Derivative logic connects game signals directly to player outputs:
// • High pressure rate vs QB → pass yards trend under
// • Degraded OL → rush yards trend up (game script dependent)
// • Bad weather (wind/rain) → all passing props trend under
// • Large spread favorite → winning RB late carries trend over
// • Low total → all offensive props trend under
// • High CPOE QB → receiver props trend over
// ═══════════════════════════════════════════════════════════════════════════

// ── Derivative projection engine ──────────────────────────────────────────
// Takes the full game signal stack and projects individual stat lines.
// ─────────────────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
// GRAPH NEURAL NETWORK — ROSTER INTERDEPENDENCY ENGINE
// ─────────────────────────────────────────────────────────────────────────
// Models NFL roster health as a graph where nodes = positions and edges =
// interdependency strength. Injury to one node propagates to connected nodes
// through 2 rounds of message passing — a simplified Graph Convolutional
// Network (GCN) that captures cascading effects standard injury models miss.
//
// Also includes:
//   • Snap Count / Depth Chart Tracker — who actually lines up
//   • Coverage Scheme Detector — man vs zone vs hybrid
// ═══════════════════════════════════════════════════════════════════════════

// ── Roster graph: position interdependency edges ──────────────────────────
// Weight = how much node A depends on node B (0→1)
const POSITION_EDGES = {
  QB:   { LT:0.85, LG:0.60, C:0.65, RG:0.55, RT:0.50, WR1:0.80, WR2:0.60, TE:0.55, RB:0.35 },
  LT:   { QB:0.80, LG:0.50, EDGE_OPP:0.70 },
  LG:   { QB:0.55, C:0.55,  LT:0.45 },
  C:    { QB:0.65, LG:0.55, RG:0.55 },
  RG:   { QB:0.55, C:0.55,  RT:0.45 },
  RT:   { QB:0.45, RG:0.45 },
  WR1:  { QB:0.80, CB1_OPP:0.70, WR2:0.25 },
  WR2:  { QB:0.60, WR1:0.25, TE:0.20, CB2_OPP:0.55 },
  TE:   { QB:0.55, WR2:0.20, RB:0.15 },
  RB:   { QB:0.35, LT:0.45,  LG:0.40, C:0.45, RG:0.40, RT:0.35 },
  EDGE_OPP:{ LT:0.70 },
  CB1_OPP: { WR1:0.70 },
  CB2_OPP: { WR2:0.55 },
};

// Position importance weights for final score aggregation
const POSITION_IMPORTANCE = {
  QB:0.28, LT:0.12, WR1:0.12, C:0.08, LG:0.06, RG:0.06,
  RT:0.06, WR2:0.08, TE:0.07, RB:0.07,
};

// ── GNN message passing (2-round GCN-style mean aggregation) ─────────────
function messagePass(nodes, rounds = 2) {

export default WeatherForecastPanel;
