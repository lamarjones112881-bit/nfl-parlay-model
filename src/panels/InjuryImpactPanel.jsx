import { parseInjuryImpact } from "../utils/mathUtils.js";
import { Panel, PanelTitle, Tag } from "../components/UIKit.jsx";

function InjuryImpactPanel({ injuries, homeTeam, awayTeam, lines }) {
  if(!injuries||(!homeTeam&&!awayTeam)) return null;
  const homeImpact = parseInjuryImpact(injuries, homeTeam);
  const awayImpact = parseInjuryImpact(injuries, awayTeam);
  const totalImpact = homeImpact.total - awayImpact.total; // net vs spread
  const hasImpact = Math.abs(homeImpact.total)>0.3||Math.abs(awayImpact.total)>0.3;
  if(!hasImpact) return null;
  const gradeColor = g=>g==="CRITICAL"?"#ef4444":g==="SIGNIFICANT"?"#f87171":g==="MINOR"?"#f59e0b":"#4ade80";
  return(
    <Panel border={homeImpact.grade==="CRITICAL"||awayImpact.grade==="CRITICAL"?"rgba(239,68,68,0.22)":"rgba(248,113,113,0.16)"} bg="rgba(248,113,113,0.02)" mb="10px">
      <PanelTitle icon="🏥" title="Injury Impact Quantifier" tag={homeImpact.grade!=="OK"||awayImpact.grade!=="OK"?"Active Injuries":undefined} tagColor="#f87171"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"8px"}}>
        {[{team:awayTeam,color:tc(awayTeam),d:awayImpact},{team:homeTeam,color:tc(homeTeam),d:homeImpact}].map(({team,color,d})=>(
          <div key={team} style={{borderTop:`2px solid ${color}33`,paddingTop:"9px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"}}>
              <span style={{fontSize:"9px",fontWeight:800,color,fontFamily:"'Barlow Condensed',sans-serif"}}>{abb(team)}</span>
              <Tag color={gradeColor(d.grade)}>{d.grade}</Tag>
            </div>
            {d.items.length>0?(<>
              {d.items.map((item,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:"6px",padding:"3px 6px",background:"rgba(255,255,255,0.03)",borderRadius:"3px",marginBottom:"2px"}}>
                  <span style={{fontSize:"8px",fontWeight:700,color:"#aaa",fontFamily:"'Barlow Condensed',sans-serif",width:"30px"}}>{item.pos}</span>
                  <Tag color={item.status==="out"?"#ef4444":item.status==="doubtful"?"#f87171":"#f59e0b"}>{item.status}</Tag>
                  <span style={{marginLeft:"auto",fontSize:"9px",fontWeight:700,color:"#f87171",fontFamily:"'Barlow Condensed',sans-serif"}}>{item.impact.toFixed(1)}</span>
                </div>
              ))}
              <div style={{marginTop:"5px",display:"flex",justifyContent:"space-between",padding:"4px 6px",background:"rgba(248,113,113,0.06)",borderRadius:"3px"}}>
                <span style={{fontSize:"8px",fontWeight:700,color:"#888",fontFamily:"'Barlow Condensed',sans-serif"}}>Total impact</span>
                <span style={{fontSize:"11px",fontWeight:900,color:"#f87171",fontFamily:"'Barlow Condensed',sans-serif"}}>{d.total.toFixed(1)} pts</span>
              </div>
            </>):<div style={{fontSize:"9px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif"}}>No key injuries detected</div>}
          </div>
        ))}
      </div>
      {/* Net spread adjustment */}
      {Math.abs(totalImpact)>=0.4&&<div style={{background:"rgba(248,113,113,0.06)",border:"1px solid rgba(248,113,113,0.14)",borderRadius:"6px",padding:"8px 11px",display:"flex",alignItems:"center",gap:"10px"}}>
        <div style={{flex:1}}>
          <div style={{fontSize:"9px",fontWeight:700,color:"#f87171",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px",textTransform:"uppercase",letterSpacing:"0.08em"}}>🏥 Net Injury Spread Adjustment</div>
          <div style={{fontSize:"10px",color:"#fca5a5",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.4"}}>
            Injury stack {totalImpact>0?`favors ${abb(awayTeam)} by ${Math.abs(totalImpact).toFixed(1)} pts`:`favors ${abb(homeTeam)} by ${Math.abs(totalImpact).toFixed(1)} pts`} vs Vegas spread. {lines?.spread?`Current spread ${abb(lines.favTeam||"")} -${lines.spread} — model-adjusted: -${(parseFloat(lines.spread||0)+Math.abs(totalImpact)).toFixed(1)}.`:""} 
          </div>
        </div>
        <div style={{textAlign:"center",flexShrink:0}}>
          <div style={{fontSize:"8px",color:"#f87171",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"1px"}}>NET ADJ</div>
          <div style={{fontSize:"18px",fontWeight:900,color:"#f87171",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{totalImpact>0?"+":""}{totalImpact.toFixed(1)}</div>
        </div>
      </div>}
      <div style={{marginTop:"7px",fontSize:"8px",color:"#1a1a2a",fontFamily:"'Barlow Condensed',sans-serif"}}>Position impact table: QB out=-3.8 · LT out=-0.9 · RB1 out=-0.8 · WR1 out=-0.7 · CB1 out=-0.6</div>
    </Panel>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// ADVANCED SYSTEMS: Monte Carlo · Concept Drift · ML Feature Engine
//                   Automated Mistake Logger · Data Pipeline Watchdog
// ═══════════════════════════════════════════════════════════════════════════

const MISTAKE_KEY    = "nfl_mistakes_v1";
const PIPELINE_KEY   = "nfl_pipeline_v1";
const DRIFT_KEY      = "nfl_drift_v1";
const MC_ITERATIONS  = 10000;
const DRIFT_WINDOW   = 10;   // rolling games to detect drift
const DRIFT_THRESH   = 0.15; // 15%+ drop triggers warning
const STALE_MINS     = 120;  // data older than 2hr flagged stale

// ── Box-Muller normal distribution sampler ────────────────────────────────
function randn() {

export default InjuryImpactPanel;
