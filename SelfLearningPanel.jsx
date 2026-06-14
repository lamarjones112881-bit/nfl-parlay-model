import { useState } from "react";
import { Panel, PanelTitle, Tag } from "../components/UIKit.jsx";

function SelfLearningPanel({ learnedWeights, patternMemory, teamBias, backtestHistory, onResetLearning }) {
  const [open, setOpen] = useState(false);
  const hasData = (backtestHistory?.length || 0) >= MIN_SAMPLE;
  const gamesUntilActive = Math.max(0, MIN_SAMPLE - (backtestHistory?.length || 0));

  // Compute weight divergences
  const weightChanges = Object.entries(learnedWeights || DEFAULT_WEIGHTS).map(([k, v]) => ({
    signal: k, learned: v, default: DEFAULT_WEIGHTS[k] || 10,
    diff: parseFloat((v - (DEFAULT_WEIGHTS[k] || 10)).toFixed(2))
  })).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  const SIG_COLORS = { cpoe:"#ec4899",pressure:"#fb923c",olDegradation:"#6366f1",garbageFilter:"#f59e0b",luckRegression:"#8b5cf6",marketEnsemble:"#a78bfa",coaching:"#14b8a6",microContext:"#38bdf8",weather:"#4ade80" };
  const topPatterns = Object.entries(patternMemory || {}).filter(([, d]) => d.total >= 3).sort((a, b) => b[1].total - a[1].total).slice(0, 5);

  return (
    <Panel border="rgba(16,185,129,0.22)" bg="rgba(16,185,129,0.03)" mb="10px">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        <div style={{display:"flex",alignItems:"center",gap:"7px"}}>
          <div style={{width:"8px",height:"8px",borderRadius:"50%",background:hasData?"#10b981":"#555",boxShadow:hasData?"0 0 8px #10b981":"none",animation:hasData?"pulse 2s infinite":"none"}}/>
          <span style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#10b981",fontFamily:"'Barlow Condensed',sans-serif"}}>Self-Learning Engine</span>
          {hasData ? <Tag color="#10b981">ACTIVE — {backtestHistory.length} games</Tag> : <Tag color="#555">{gamesUntilActive} games to activate</Tag>}
          {weightChanges.some(w=>Math.abs(w.diff)>=2) && <Tag color="#facc15">Weights Updated</Tag>}
        </div>
        <span style={{color:"#333",fontSize:"10px"}}>{open?"▲":"▼"}</span>
      </div>
      {open && (
        <div style={{marginTop:"12px"}}>
          {!hasData && (
            <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"7px",padding:"12px",marginBottom:"10px",textAlign:"center"}}>
              <div style={{fontSize:"11px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"5px"}}>Log {gamesUntilActive} more game result{gamesUntilActive!==1?"s":""} in the Backtest Engine to activate learning</div>
              <div style={{height:"4px",borderRadius:"2px",background:"rgba(255,255,255,0.06)",overflow:"hidden",maxWidth:"200px",margin:"0 auto"}}><div style={{width:`${((backtestHistory?.length||0)/MIN_SAMPLE)*100}%`,height:"100%",background:"#10b981",transition:"width 0.5s ease",borderRadius:"2px"}}/></div>
              <div style={{fontSize:"9px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"4px"}}>{backtestHistory?.length||0} / {MIN_SAMPLE} games</div>
            </div>
          )}

          {/* How it works */}
          <div style={{marginBottom:"10px",padding:"9px 11px",background:"rgba(16,185,129,0.04)",border:"1px solid rgba(16,185,129,0.1)",borderRadius:"6px"}}>
            <div style={{fontSize:"9px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#10b981",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"5px"}}>How It Works</div>
            <div style={{fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.6"}}>
              Every prediction logs which signals fired. When you save a result, each active signal weight shifts +{(LEARNING_RATE*100).toFixed(1)}% (correct) or -{(LEARNING_RATE*100).toFixed(1)}% (wrong). After enough games, the model learns which signals actually predict YOUR parlay outcomes — not just the general market.
            </div>
          </div>

          {/* Signal weight evolution */}
          <div style={{marginBottom:"10px"}}>
            <div style={{fontSize:"9px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#555",marginBottom:"6px",fontFamily:"'Barlow Condensed',sans-serif"}}>Signal Weight Evolution</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px"}}>
              {weightChanges.slice(0,8).map(({ signal, learned, default: def, diff }) => {
                const color = SIG_COLORS[signal] || "#888";
                const diffColor = diff > 2 ? "#4ade80" : diff < -2 ? "#f87171" : "#555";
                return (
                  <div key={signal} style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${Math.abs(diff)>=2?diffColor+"33":"rgba(255,255,255,0.05)"}`,borderRadius:"5px",padding:"6px 8px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"3px"}}>
                      <span style={{fontSize:"8px",fontWeight:700,color,fontFamily:"'Barlow Condensed',sans-serif",textTransform:"uppercase",letterSpacing:"0.04em"}}>{signal.replace(/([A-Z])/g," $1").trim()}</span>
                      <span style={{fontSize:"8px",fontWeight:700,color:diffColor,fontFamily:"'Barlow Condensed',sans-serif"}}>{diff>0?"+":""}{diff}%</span>
                    </div>
                    <div style={{display:"flex",gap:"4px",alignItems:"center"}}>
                      <div style={{flex:1,height:"3px",borderRadius:"2px",background:"rgba(255,255,255,0.05)",overflow:"hidden"}}>
                        <div style={{width:`${(learned/WEIGHT_MAX)*100}%`,height:"100%",background:color,borderRadius:"2px"}}/>
                      </div>
                      <span style={{fontSize:"9px",fontWeight:800,color:"#fff",fontFamily:"'Barlow Condensed',sans-serif",minWidth:"24px",textAlign:"right"}}>{learned}%</span>
                    </div>
                    <div style={{fontSize:"7px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"1px"}}>default: {def}%</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Team bias */}
          {teamBias?.length > 0 && (
            <div style={{marginBottom:"10px"}}>
              <div style={{fontSize:"9px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#555",marginBottom:"5px",fontFamily:"'Barlow Condensed',sans-serif"}}>Team Bias Corrections</div>
              {teamBias.slice(0,4).map((b, i) => (
                <div key={i} style={{display:"flex",alignItems:"center",gap:"8px",padding:"5px 8px",background:b.direction==="over-rated"?"rgba(248,113,113,0.05)":"rgba(74,222,128,0.04)",border:`1px solid ${b.direction==="over-rated"?"rgba(248,113,113,0.12)":"rgba(74,222,128,0.1)"}`,borderRadius:"5px",marginBottom:"3px"}}>
                  <div style={{width:"18px",height:"18px",borderRadius:"50%",background:tc(b.team),flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"7px",fontWeight:900,color:"#fff",fontFamily:"'Barlow Condensed',sans-serif"}}>{abb(b.team).slice(0,2)}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:"9px",fontWeight:700,color:"#ddd",fontFamily:"'Barlow Condensed',sans-serif"}}>{abb(b.team)} — <span style={{color:b.direction==="over-rated"?"#f87171":"#4ade80"}}>{b.rate}% ATS</span> <span style={{fontWeight:400,color:"#444"}}>({b.games} games)</span></div>
                    <div style={{fontSize:"8px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif"}}>{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pattern memory */}
          {topPatterns.length > 0 && (
            <div style={{marginBottom:"10px"}}>
              <div style={{fontSize:"9px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#555",marginBottom:"5px",fontFamily:"'Barlow Condensed',sans-serif"}}>Pattern Memory ({Object.keys(patternMemory||{}).length} situations tracked)</div>
              {topPatterns.map(([fp, d], i) => {
                const rate = Math.round(d.wins / d.total * 100);
                const parts = fp.split("|");
                return (
                  <div key={i} style={{display:"flex",alignItems:"center",gap:"7px",padding:"5px 8px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:"5px",marginBottom:"3px"}}>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",gap:"3px",flexWrap:"wrap",marginBottom:"2px"}}>
                        {parts.map((p, pi) => <span key={pi} style={{fontSize:"7px",background:"rgba(255,255,255,0.06)",borderRadius:"3px",padding:"1px 5px",color:"#888",fontFamily:"'Barlow Condensed',sans-serif"}}>{p}</span>)}
                      </div>
                      <div style={{fontSize:"8px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>{d.wins}W-{d.total-d.wins}L · {d.total} games</div>
                    </div>
                    <div style={{fontSize:"16px",fontWeight:900,color:rate>=55?"#4ade80":rate>=50?"#f59e0b":"#f87171",fontFamily:"'Barlow Condensed',sans-serif",flexShrink:0}}>{rate}%</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Reset button */}
          {hasData && (
            <button onClick={onResetLearning} style={{padding:"5px 12px",borderRadius:"5px",border:"1px solid rgba(248,113,113,0.18)",background:"rgba(248,113,113,0.05)",color:"#f87171",fontSize:"9px",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif"}}>
              Reset Learning Data
            </button>
          )}
        </div>
      )}
    </Panel>
  );
}

// ── Pattern Match Alert (fires on current game) ───────────────────────────
function PatternMatchAlert({ currentFingerprint, patternResult }) {
  if (!patternResult || (!patternResult.exact && !patternResult.partial)) return null;
  const match = patternResult.exact?.total >= 3 ? patternResult.exact : patternResult.partial;
  if (!match || match.total < 3) return null;
  const rate = Math.round(match.wins / match.total * 100);
  const color = rate >= 58 ? "#4ade80" : rate <= 42 ? "#f87171" : "#f59e0b";
  const isExact = !!(patternResult.exact?.total >= 3);
  return (
    <div style={{background:`${color}0d`,border:`1px solid ${color}25`,borderRadius:"7px",padding:"9px 12px",marginBottom:"9px",animation:"fadeSlideUp 0.3s ease-out"}}>
      <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
        <span style={{fontSize:"14px"}}>🧠</span>
        <div style={{flex:1}}>
          <div style={{fontSize:"9px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color,fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px"}}>
            {isExact ? "EXACT PATTERN MATCH" : "SIMILAR PATTERN MATCH"} — {match.wins}W-{match.total-match.wins}L
          </div>
          <div style={{fontSize:"10px",color:`${color}cc`,fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.4"}}>
            {isExact ? "This exact game situation" : "Similar situations"} {match.total >= 10 ? "across a strong sample of " : "in "}{match.total} tracked game{match.total!==1?"s":""} has an ATS win rate of <span style={{fontWeight:900}}>{rate}%</span>{rate>=58?" — historically profitable situation":rate<=42?" — historically bad situation":" — roughly break-even"}.
          </div>
          <div style={{display:"flex",gap:"3px",marginTop:"4px",flexWrap:"wrap"}}>
            {(currentFingerprint||"").split("|").map((p,i) => <span key={i} style={{fontSize:"7px",background:"rgba(255,255,255,0.06)",borderRadius:"2px",padding:"1px 5px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif"}}>{p}</span>)}
          </div>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontSize:"24px",fontWeight:900,color,fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{rate}%</div>
          <div style={{fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>ATS WIN RATE</div>
        </div>
      </div>
    </div>
  );
}

// ── Parlay Correlation Matrix ─────────────────────────────────────────────────
function buildCorrelationMatrix(legs, weather) {

export { SelfLearningPanel, PatternMatchAlert };
