import { useState, useEffect } from "react";
import { Panel, PanelTitle, Tag, Spinner } from "../components/UIKit.jsx";

function WeatherSeverityBar({ severityResult }) {
  if (!severityResult || severityResult.severity <= 5) return null;
  const { severity, label, color, components, totalAdj, spreadAdj } = severityResult;
  return (
    <div style={{background:`${color}08`,border:`1px solid ${color}25`,borderRadius:"7px",padding:"9px 12px",marginBottom:"8px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"7px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"7px"}}>
          <span style={{fontSize:"13px"}}>{severity>=65?"🌪️":severity>=50?"⛈️":severity>=25?"🌬️":"🌤️"}</span>
          <div>
            <div style={{fontSize:"10px",fontWeight:800,color,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.08em"}}>{label.toUpperCase()} CONDITIONS — {severity}/100</div>
            <div style={{fontSize:"8px",color:`${color}99`,fontFamily:"'Barlow Condensed',sans-serif",marginTop:"1px"}}>
              {Math.abs(totalAdj)} pts off total · {spreadAdj > 0 ? "+" : ""}{spreadAdj} spread
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:"5px"}}>
          {[["🌡️","Temp",components.tempScore],["💨","Wind",components.windScore],["🌧️","Precip",components.precipScore]].map(([icon,l,s])=>(
            <div key={l} style={{textAlign:"center",minWidth:"32px"}}>
              <div style={{fontSize:"8px"}}>{icon}</div>
              <div style={{fontSize:"10px",fontWeight:800,color:s>60?"#f87171":s>30?"#f59e0b":"#888",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{s}</div>
              <div style={{fontSize:"6px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif"}}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Severity bar */}
      <div style={{height:"5px",borderRadius:"3px",background:"rgba(255,255,255,0.06)",overflow:"hidden"}}>
        <div style={{width:`${severity}%`,height:"100%",borderRadius:"3px",background:`linear-gradient(90deg,#4ade80,#f59e0b,#f87171)`,transition:"width 0.7s cubic-bezier(0.16,1,0.3,1)"}}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:"2px",fontSize:"7px",color:"#2a2a2a",fontFamily:"'Barlow Condensed',sans-serif"}}>
        <span>Ideal</span><span>Mild</span><span>Moderate</span><span>Severe</span><span>Extreme</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. HEAD-TO-HEAD MATCHUP DATABASE
// ═══════════════════════════════════════════════════════════════════════════

function H2HPanel({ h2hData, loading, homeTeam, awayTeam }) {
  if (!h2hData && !loading) return null;
  const [open, setOpen] = useState(false);
  if (!h2hData && !loading) return null;
  return (
    <Panel border="rgba(251,146,60,0.2)" bg="rgba(251,146,60,0.02)" mb="10px">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <span style={{fontSize:"11px"}}>⚔️</span>
          <span style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#fb923c",fontFamily:"'Barlow Condensed',sans-serif"}}>Head-to-Head History</span>
          {loading && <Tag color="#f59e0b">loading…</Tag>}
          {h2hData && !loading && <Tag color="#fb923c">{h2hData.gamesAnalyzed} games</Tag>}
          {h2hData?.atsPct != null && <Tag color={h2hData.atsPct>=53?"#4ade80":"#f87171"}>{h2hData.favTeamLabel} ATS {h2hData.atsPct}%</Tag>}
        </div>
        <span style={{color:"#333",fontSize:"10px"}}>{open?"▲":"▼"}</span>
      </div>
      {open && h2hData && !loading && (
        <div style={{marginTop:"11px"}}>
          {/* Record summary */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"5px",marginBottom:"10px"}}>
            {[
              [abb(homeTeam)+" SU","All-time vs "+abb(awayTeam),h2hData.homeSU,tc(homeTeam)],
              ["ATS Record","Fav team covering",h2hData.atsRecord,"#fbbf24"],
              ["Over/Under","Total hit rate",h2hData.totalRecord,"#a78bfa"],
            ].map(([l,sub,v,c])=>(
              <div key={l} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"7px",padding:"8px 7px",textAlign:"center"}}>
                <div style={{fontSize:"7px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px"}}>{l}</div>
                <div style={{fontSize:"16px",fontWeight:900,color:c,fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{v||"—"}</div>
                <div style={{fontSize:"7px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"2px"}}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Key stats */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"5px",marginBottom:"10px"}}>
            {[
              ["Avg Margin",h2hData.avgMargin,Math.abs(parseFloat(h2hData.avgMargin||0))>7?"#f87171":"#888"],
              ["Avg Total",h2hData.avgTotal,"#a78bfa"],
              ["Home ATS",h2hData.homeAts,parseFloat((h2hData.homeAts||"0").replace("%",""))>=53?"#4ade80":"#f87171"],
              ["Away ATS",h2hData.awayAts,parseFloat((h2hData.awayAts||"0").replace("%",""))>=53?"#4ade80":"#f87171"],
            ].map(([l,v,c])=>(
              <div key={l} style={{background:"rgba(255,255,255,0.03)",borderRadius:"5px",padding:"6px 8px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif"}}>{l}</span>
                <span style={{fontSize:"12px",fontWeight:800,color:c,fontFamily:"'Barlow Condensed',sans-serif"}}>{v||"—"}</span>
              </div>
            ))}
          </div>

          {/* Notable pattern */}
          {h2hData.pattern && (
            <div style={{background:"rgba(251,146,60,0.07)",border:"1px solid rgba(251,146,60,0.18)",borderRadius:"6px",padding:"8px 11px",marginBottom:"8px"}}>
              <div style={{fontSize:"8px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#fb923c",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px"}}>📌 Matchup Pattern</div>
              <div style={{fontSize:"10px",color:"#fed7aa",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.5"}}>{h2hData.pattern}</div>
            </div>
          )}

          {/* Last 5 meetings */}
          {h2hData.lastFive?.length > 0 && (
            <div>
              <div style={{fontSize:"8px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#555",marginBottom:"5px",fontFamily:"'Barlow Condensed',sans-serif"}}>Last 5 Meetings</div>
              {h2hData.lastFive.map((g,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:"7px",padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                  <span style={{fontSize:"8px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",width:"55px",flexShrink:0}}>{g.date}</span>
                  <span style={{fontSize:"9px",color:"#aaa",fontFamily:"'Barlow Condensed',sans-serif",flex:1}}>{g.score}</span>
                  <span style={{fontSize:"8px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif"}}>{g.margin}</span>
                  <Tag color={g.coverTeam?"#4ade80":"#555"}>{g.coverResult||"—"}</Tag>
                </div>
              ))}
            </div>
          )}

          {h2hData.note && (
            <div style={{marginTop:"7px",fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.5",fontStyle:"italic"}}>{h2hData.note}</div>
          )}
        </div>
      )}
      {loading && <div style={{padding:"8px 0"}}><Skel cols={3}/></div>}
    </Panel>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. OPPONENT-ADJUSTED STATS
// SOS-corrected PPG/PAPG. Raw PPG against bad defenses inflates numbers.
// Formula: adj_ppg = (raw_ppg / avg_opp_papg) × league_avg_ppg
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// DVOA — Defense-Adjusted Value Over Average (Football Outsiders)
// ─────────────────────────────────────────────────────────────────────────
// The most predictive NFL efficiency metric. Calculated on every snap,
// adjusted for down/distance/field position/opponent. Published weekly
// at footballoutsiders.com. Replaces the OppAdj SOS approximation entirely.
//
// Key numbers:
//   Offensive DVOA: +% = above average offense (good), -% = below average
//   Defensive DVOA: -% = above average defense (good), +% = below average
//   Range: typically -40% to +40% for most teams
// ═══════════════════════════════════════════════════════════════════════════


// ── Normalize DVOA for clustering feature vectors ─────────────────────────
// Maps typical -40% to +40% range onto 0-1
function normalizeDVOA(dvoa, invert = false) {

export { WeatherSeverityBar, H2HPanel };
