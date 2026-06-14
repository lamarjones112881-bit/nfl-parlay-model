import { useState } from "react";
import { Panel, PanelTitle, Tag, Spinner } from "../components/UIKit.jsx";

function AutoResultsPanel({ pendingGames, onFetchResults, onDismiss, fetching, fetchProgress }) {
  const [open, setOpen] = useState(false);
  if (!pendingGames?.length) return null;

  return (
    <Panel border="rgba(56,189,248,0.22)" bg="rgba(56,189,248,0.03)" mb="10px">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <div style={{width:"8px",height:"8px",borderRadius:"50%",background:"#38bdf8",boxShadow:"0 0 8px #38bdf8",animation:"pulse 2s infinite",flexShrink:0}}/>
          <span style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#38bdf8",fontFamily:"'Barlow Condensed',sans-serif"}}>Auto-Fetch Results</span>
          <Tag color="#38bdf8">{pendingGames.length} game{pendingGames.length>1?"s":""} pending</Tag>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"7px"}}>
          {!fetching && <button onClick={e=>{e.stopPropagation();onFetchResults();}} style={{padding:"6px 13px",borderRadius:"6px",border:"none",background:"linear-gradient(135deg,#0369a1,#0284c7)",color:"#fff",fontSize:"10px",fontWeight:700,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",display:"flex",alignItems:"center",gap:"5px"}}>
            ⚡ Fetch All Scores
          </button>}
          {fetching && <div style={{display:"flex",alignItems:"center",gap:"6px",color:"#38bdf8",fontSize:"9px",fontFamily:"'Barlow Condensed',sans-serif"}}><Spinner/>Fetching {fetchProgress}…</div>}
          <span style={{color:"#333",fontSize:"10px"}}>{open?"▲":"▼"}</span>
        </div>
      </div>

      {open && (
        <div style={{marginTop:"11px"}}>
          <div style={{fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"9px",lineHeight:"1.6"}}>
            These games were analyzed by the model but results have not been logged yet. Hit <strong style={{color:"#38bdf8"}}>Fetch All Scores</strong> after the games finish — the model will search for final scores, calculate ATS and total results, and auto-log everything to the backtest engine. Self-learning updates trigger automatically.
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"3px"}}>
            {pendingGames.map((g, i) => (
              <div key={i} style={{display:"flex",alignItems:"center",gap:"8px",padding:"7px 10px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"6px"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:"10px",fontWeight:700,fontFamily:"'Barlow Condensed',sans-serif",color:"#ddd"}}>
                    <span style={{color:tc(g.awayTeam)}}>{abb(g.awayTeam)}</span>
                    <span style={{color:"#333",margin:"0 5px"}}>@</span>
                    <span style={{color:tc(g.homeTeam)}}>{abb(g.homeTeam)}</span>
                  </div>
                  <div style={{display:"flex",gap:"6px",marginTop:"2px",flexWrap:"wrap"}}>
                    {g.analyzedAt && <span style={{fontSize:"8px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>Analyzed {g.analyzedAt}</span>}
                    {g.modelSpread && <span style={{fontSize:"8px",color:"#4ade80",fontFamily:"'Barlow Condensed',sans-serif"}}>Model: {g.favTeam?abb(g.favTeam):""} -{g.modelSpread}</span>}
                    {g.confidence && <Tag color={g.confidence==="HIGH"?"#4ade80":g.confidence==="MEDIUM"?"#f59e0b":"#f87171"}>{g.confidence}</Tag>}
                  </div>
                </div>
                <button onClick={()=>onDismiss(i)} title="Remove from pending" style={{background:"none",border:"none",color:"#444",fontSize:"12px",cursor:"pointer",padding:"2px 4px",flexShrink:0}}>✕</button>
              </div>
            ))}
          </div>
          <div style={{marginTop:"8px",fontSize:"8px",color:"#2a2a2a",fontFamily:"'Barlow Condensed',sans-serif"}}>
            Results auto-dismissed after 7 days · Requires games to have finished · Fetches one at a time
          </div>
        </div>
      )}
    </Panel>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// POWER RANKINGS TRACKER
// Three-layer view: Live Consensus · Model-Derived · Divergence Board
// Model ratings auto-update from backtest history every time you log a result
// ═══════════════════════════════════════════════════════════════════════════

// ── Compute model-derived ratings from backtest history ───────────────────
// ═══════════════════════════════════════════════════════════════════════════
// UNSUPERVISED CLUSTERING — SCHEMATIC ARCHETYPE ENGINE
// ─────────────────────────────────────────────────────────────────────────
// Pure-JS K-Means++ clustering that discovers NFL team schematic archetypes
// from accumulated signal data. No labels provided — the algorithm finds
// natural groupings and the model names them post-hoc.
//
// Feature vector per team (10 dimensions, all normalized 0→1):
//   [0] passVolumeRatio   — pass yds share of total offense
//   [1] rushStrength      — rush yds vs league avg (normalized)
//   [2] offensiveOutput   — PPG normalized
//   [3] defensiveStrength — PAPG inverted (high = elite defense)
//   [4] pressureAllowed   — QB pressure rate allowed
//   [5] pressureGenerated — pass rush win rate
//   [6] cpoeScore         — completion % over expected
//   [7] olHealth          — OL degradation index
//   [8] totalEnvironment  — avg game total when this team plays
//   [9] coverTendency     — ATS% from model history
//
// K = 6 archetypes:
//   AIR_RAID · POWER_RUN · WEST_COAST · SPREAD_SHOOT · BALL_CONTROL · ELITE_DEFENSE
// ═══════════════════════════════════════════════════════════════════════════

const K_CLUSTERS   = 6;
const MAX_ITER     = 150;
const FEATURE_DIM  = 10;

// ── Archetype definitions (used for post-hoc labeling) ────────────────────
const ARCHETYPES = {
  AIR_RAID:     { label:"Air Raid",      icon:"🏹", color:"#38bdf8", desc:"High pass volume, spread formations, CPOE-driven QB. Thrives vs zone, struggles vs elite pass rush." },
  POWER_RUN:    { label:"Power Run",     icon:"🦏", color:"#fb923c", desc:"Dominant OL, physical run game, controls clock. Low total environment. Wins close, covers as dog." },
  WEST_COAST:   { label:"West Coast",    icon:"🌊", color:"#4ade80", desc:"Balanced, YAC-heavy, underneath routes. Consistent but rarely explosive. ATS split near 50/50." },
  SPREAD_SHOOT: { label:"Spread & Shoot",icon:"🔥", color:"#f87171", desc:"Fast pace, high total environment, weak defense. Prop overs hit at high rate. Vulnerable late-season." },
  BALL_CONTROL: { label:"Ball Control",  icon:"🧱", color:"#a78bfa", desc:"Run-first, time-of-possession focused. Overs rarely hit. Strong ATS as home favorite." },
  ELITE_DEFENSE:{ label:"Elite Defense", icon:"🛡️", color:"#facc15", desc:"Dominant front-7, low PAPG, generates pressure. Totals lean under. Covers as road dog in divisional." },
};

// ── Matchup tendency table ────────────────────────────────────────────────
// [offenseArchetype][defenseArchetype] → { spreadAdj, totalAdj, note }
const MATCHUP_TENDENCIES = {
  AIR_RAID: {
    AIR_RAID:     { spreadAdj:0,    totalAdj:+4.5, note:"Both Air Raids → shootout. Strong over lean, variance spike." },
    POWER_RUN:    { spreadAdj:0,    totalAdj:+1.5, note:"Air Raid vs Power Run — pace mismatch. Passing team presses." },
    WEST_COAST:   { spreadAdj:0,    totalAdj:+2.0, note:"Air Raid offense with balanced defense — slight over." },
    SPREAD_SHOOT: { spreadAdj:0,    totalAdj:+6.0, note:"Both teams scoring freely. One of highest-total matchups." },
    BALL_CONTROL: { spreadAdj:-1.0, totalAdj:-2.5, note:"Ball Control defense slows Air Raid. Under lean, close game." },
    ELITE_DEFENSE:{ spreadAdj:+2.0, totalAdj:-4.0, note:"Elite Defense neutralises Air Raid. Strong under, fade Air Raid spread." },
  },
  POWER_RUN: {
    AIR_RAID:     { spreadAdj:+1.5, totalAdj:-2.0, note:"Power Run vs Air Raid offense. Under lean, run team covers." },
    POWER_RUN:    { spreadAdj:0,    totalAdj:-5.0, note:"Two Power Run teams = historically lowest-scoring matchup." },
    WEST_COAST:   { spreadAdj:-0.5, totalAdj:-1.5, note:"Physical game, slight under lean." },
    SPREAD_SHOOT: { spreadAdj:+2.0, totalAdj:0,    note:"Power Run pace vs Spread Shoot. Neutral total, dog covers." },
    BALL_CONTROL: { spreadAdj:0,    totalAdj:-4.5, note:"Battle of possessions. Strong under." },
    ELITE_DEFENSE:{ spreadAdj:+1.5, totalAdj:-3.0, note:"Elite Defense stacks box vs run. Under, dog has value." },
  },
  WEST_COAST: {
    AIR_RAID:     { spreadAdj:0,    totalAdj:+2.5, note:"West Coast balanced against Air Raid. Mild over lean." },
    POWER_RUN:    { spreadAdj:0,    totalAdj:-1.0, note:"Slightly under, grind game." },
    WEST_COAST:   { spreadAdj:0,    totalAdj:0,    note:"Mirror matchup — no strong lean." },
    SPREAD_SHOOT: { spreadAdj:+1.0, totalAdj:+3.0, note:"Spread Shoot exploits West Coast. Over lean." },
    BALL_CONTROL: { spreadAdj:0,    totalAdj:-2.0, note:"Mild under lean." },
    ELITE_DEFENSE:{ spreadAdj:+1.5, totalAdj:-2.5, note:"Elite Defense slows West Coast. Under lean." },
  },
  SPREAD_SHOOT: {
    AIR_RAID:     { spreadAdj:0,    totalAdj:+5.5, note:"Two explosive offenses. Very strong over." },
    POWER_RUN:    { spreadAdj:-1.5, totalAdj:0,    note:"Spread Shoot vs physical team. Spread Shoot covers, neutral total." },
    WEST_COAST:   { spreadAdj:-1.0, totalAdj:+2.5, note:"Spread Shoot paces up West Coast. Over lean." },
    SPREAD_SHOOT: { spreadAdj:0,    totalAdj:+7.0, note:"Extreme over lean. Highest-scoring matchup type." },
    BALL_CONTROL: { spreadAdj:-1.5, totalAdj:-1.0, note:"Ball control slows the game. Mild under, dog covers." },
    ELITE_DEFENSE:{ spreadAdj:+2.5, totalAdj:-3.5, note:"Elite D shuts down Spread Shoot. Strong under, fade the offense." },
  },
  BALL_CONTROL: {
    AIR_RAID:     { spreadAdj:+1.0, totalAdj:-2.5, note:"Ball Control slows Air Raid. Under lean." },
    POWER_RUN:    { spreadAdj:0,    totalAdj:-4.5, note:"Two Ball Control teams — historically low-scoring." },
    WEST_COAST:   { spreadAdj:0,    totalAdj:-2.0, note:"Grind game, under lean." },
    SPREAD_SHOOT: { spreadAdj:+1.5, totalAdj:-1.0, note:"Ball Control upsets Spread Shoot. Dog covers lean." },
    BALL_CONTROL: { spreadAdj:0,    totalAdj:-6.0, note:"Extreme under environment. Lowest total matchup." },
    ELITE_DEFENSE:{ spreadAdj:+1.0, totalAdj:-4.0, note:"Strong under, defensive battle." },
  },
  ELITE_DEFENSE: {
    AIR_RAID:     { spreadAdj:-2.0, totalAdj:-3.5, note:"Elite D dominates Air Raid. Fade offense, strong under." },
    POWER_RUN:    { spreadAdj:-1.5, totalAdj:-3.0, note:"Elite D vs run game. Under, D side covers." },
    WEST_COAST:   { spreadAdj:-1.0, totalAdj:-2.5, note:"Elite D neutralizes West Coast. Under lean." },
    SPREAD_SHOOT: { spreadAdj:-2.5, totalAdj:-4.0, note:"Elite D shuts down shooters. Strong under, fade Spread Shoot." },
    BALL_CONTROL: { spreadAdj:-1.0, totalAdj:-3.5, note:"Defensive grind. Strong under." },
    ELITE_DEFENSE:{ spreadAdj:0,    totalAdj:-5.5, note:"Two Elite Defenses — extreme under. Lowest expected total." },
  },
};

// ── K-Means++ initialisation ──────────────────────────────────────────────
function kmeansInit(points, k) {

export default AutoResultsPanel;
