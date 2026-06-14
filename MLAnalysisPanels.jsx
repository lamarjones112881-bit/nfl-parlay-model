import { useState } from "react";
import { Panel, PanelTitle, Tag } from "../components/UIKit.jsx";

// DriftDetectorPanel, FeatureImportancePanel, MistakeDigestPanel, PipelineStatusPanel
function DriftDetectorPanel({ driftResult, onResetWeights }) {
  if(!driftResult) return null;
  const [open,setOpen]=useState(driftResult.isDrifting);
  const {severity,recentRate,baselineRate,drift,direction,recommendation,signalDrift,window:w,totalGames}=driftResult;
  const color=severity==="CRITICAL"?"#ef4444":severity==="WARNING"?"#f59e0b":"#4ade80";
  const driftedSignals=Object.entries(signalDrift||{});
  return(
    <Panel border={`${color}28`} bg={`${color}05`} mb="10px">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <div style={{width:"8px",height:"8px",borderRadius:"50%",background:color,boxShadow:driftResult.isDrifting?`0 0 8px ${color}`:"none",animation:severity==="CRITICAL"?"pulse 1s infinite":"none"}}/>
          <span style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color,fontFamily:"'Barlow Condensed',sans-serif"}}>Concept Drift Detector</span>
          <Tag color={color}>{severity}</Tag>
          {driftResult.isDrifting&&<Tag color={color}>{direction} {Math.abs(Math.round(drift*100))}%</Tag>}
        </div>
        <span style={{color:"#333",fontSize:"10px"}}>{open?"▲":"▼"}</span>
      </div>
      {open&&(
        <div style={{marginTop:"11px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"5px",marginBottom:"10px"}}>
            {[["Recent ATS",`${recentRate}%`,recentRate>=53?"#4ade80":"#f87171",`Last ${w} games`],["Baseline ATS",`${baselineRate}%`,"#888",`Prior ${totalGames-w} games`],["Drift",`${drift>0?"+":""}${(drift*100).toFixed(1)}%`,color,"Recent vs baseline"]].map(([l,v,c,s])=>(
              <div key={l} style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${c}20`,borderRadius:"6px",padding:"8px 7px",textAlign:"center"}}>
                <div style={{fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px"}}>{l}</div>
                <div style={{fontSize:"16px",fontWeight:900,color:c,fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{v}</div>
                <div style={{fontSize:"7px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"2px"}}>{s}</div>
              </div>
            ))}
          </div>
          <div style={{background:`${color}08`,border:`1px solid ${color}18`,borderRadius:"6px",padding:"8px 11px",marginBottom:"8px"}}>
            <div style={{fontSize:"9px",fontWeight:700,color,fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px",textTransform:"uppercase",letterSpacing:"0.08em"}}>Recommendation</div>
            <div style={{fontSize:"10px",color:`${color}cc`,fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.5"}}>{recommendation}</div>
          </div>
          {driftedSignals.length>0&&(
            <div style={{marginBottom:"8px"}}>
              <div style={{fontSize:"8px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#555",marginBottom:"5px",fontFamily:"'Barlow Condensed',sans-serif"}}>Signal-Level Drift</div>
              {driftedSignals.map(([sig,d])=>(
                <div key={sig} style={{display:"flex",alignItems:"center",gap:"7px",padding:"4px 8px",background:"rgba(255,255,255,0.03)",borderRadius:"4px",marginBottom:"3px"}}>
                  <span style={{fontSize:"8px",fontWeight:700,color:"#aaa",fontFamily:"'Barlow Condensed',sans-serif",flex:1,textTransform:"uppercase"}}>{sig.replace(/([A-Z])/g," $1").trim()}</span>
                  <span style={{fontSize:"8px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif"}}>Baseline: {d.baseAcc}%</span>
                  <span style={{fontSize:"10px",fontWeight:700,color:d.direction==="degraded"?"#f87171":"#4ade80",fontFamily:"'Barlow Condensed',sans-serif"}}>Recent: {d.recentAcc}%</span>
                  <Tag color={d.direction==="degraded"?"#f87171":"#4ade80"}>{d.direction}</Tag>
                </div>
              ))}
            </div>
          )}
          {driftResult.isDrifting&&<button onClick={onResetWeights} style={{padding:"6px 12px",borderRadius:"5px",border:`1px solid ${color}30`,background:`${color}0a`,color,fontSize:"9px",fontWeight:700,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif"}}>⚡ Reset Learned Weights</button>}
        </div>
      )}
    </Panel>
  );
}

// ── ML Feature Importance Panel ───────────────────────────────────────────
function FeatureImportancePanel({ features, onAutoCalibrate, onUpdateWeights }) {
  const [open,setOpen]=useState(false);
  if(!features||features.filter(f=>f.reliable).length<2) return null;
  const reliable=features.filter(f=>f.reliable);
  const topPerformers=reliable.filter(f=>f.recommendation==="increase_weight").length;
  const underPerformers=reliable.filter(f=>f.recommendation==="decrease_weight").length;
  const SIG_COLORS={cpoe:"#ec4899",pressure:"#fb923c",olDegradation:"#6366f1",garbageFilter:"#f59e0b",luckRegression:"#8b5cf6",marketEnsemble:"#a78bfa",coaching:"#14b8a6",microContext:"#38bdf8",weather:"#4ade80"};
  return(
    <Panel border="rgba(34,197,94,0.18)" bg="rgba(34,197,94,0.02)" mb="10px">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        <div style={{display:"flex",alignItems:"center",gap:"7px"}}>
          <span style={{fontSize:"11px"}}>🔬</span>
          <span style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#22c55e",fontFamily:"'Barlow Condensed',sans-serif"}}>ML Feature Importance</span>
          <Tag color="#4ade80">{topPerformers} outperforming</Tag>
          {underPerformers>0&&<Tag color="#f87171">{underPerformers} underperforming</Tag>}
        </div>
        <span style={{color:"#333",fontSize:"10px"}}>{open?"▲":"▼"}</span>
      </div>
      {open&&(
        <div style={{marginTop:"11px"}}>
          <div style={{fontSize:"9px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"9px",lineHeight:"1.5"}}>
            EWMA-weighted accuracy per signal (α=0.15 — recent games count more). Scores above 58% → increase weight. Below 44% → decrease. Auto-calibrate applies ML suggestions to all weights at once.
          </div>
          {features.map((f,i)=>{
            if(!f.reliable&&f.games<2) return null;
            const color=SIG_COLORS[f.signal]||"#888";
            const recColor=f.recommendation==="increase_weight"?"#4ade80":f.recommendation==="decrease_weight"?"#f87171":"#555";
            const barW=f.score!=null?(f.score/100)*100:50;
            return(
              <div key={f.signal} style={{display:"flex",alignItems:"center",gap:"8px",padding:"6px 8px",background:"rgba(255,255,255,0.03)",border:`1px solid ${f.reliable?recColor+"22":"rgba(255,255,255,0.05)"}`,borderRadius:"5px",marginBottom:"3px"}}>
                <div style={{width:"16px",height:"16px",borderRadius:"50%",background:color,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"7px",fontWeight:900,color:"#fff",fontFamily:"'Barlow Condensed',sans-serif"}}>{i+1}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:"3px"}}>
                    <span style={{fontSize:"8px",fontWeight:700,color,fontFamily:"'Barlow Condensed',sans-serif",textTransform:"uppercase",letterSpacing:"0.04em"}}>{f.signal.replace(/([A-Z])/g," $1").trim()}</span>
                    <span style={{fontSize:"9px",fontWeight:800,color:f.score!=null?(f.score>58?"#4ade80":f.score<44?"#f87171":"#aaa"):"#333",fontFamily:"'Barlow Condensed',sans-serif"}}>{f.score!=null?`${f.score}%`:"—"}</span>
                  </div>
                  <div style={{height:"3px",borderRadius:"2px",background:"rgba(255,255,255,0.06)",overflow:"hidden"}}>
                    <div style={{width:`${barW}%`,height:"100%",background:f.score!=null?(f.score>58?"#4ade80":f.score<44?"#f87171":"#555"):"rgba(255,255,255,0.15)",borderRadius:"2px",transition:"width 0.5s ease"}}/>
                  </div>
                </div>
                <div style={{display:"flex",gap:"4px",flexShrink:0}}>
                  <span style={{fontSize:"7px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif"}}>{f.wins}W/{f.games}G</span>
                  {f.reliable&&<Tag color={recColor} >{f.recommendation==="increase_weight"?"▲":f.recommendation==="decrease_weight"?"▼":"→"} {f.suggestedWeight}%</Tag>}
                </div>
              </div>
            );
          })}
          <div style={{marginTop:"9px",display:"flex",gap:"6px"}}>
            <button onClick={()=>{ const calibrated=autoCalibrate(features,{}); onAutoCalibrate(calibrated); }} style={{flex:1,padding:"8px",borderRadius:"5px",border:"none",background:"linear-gradient(135deg,#15803d,#166534)",color:"#fff",fontSize:"10px",fontWeight:700,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:"5px"}}>
              🤖 Auto-Calibrate Weights
            </button>
          </div>
          <div style={{marginTop:"5px",fontSize:"8px",color:"#2a2a2a",fontFamily:"'Barlow Condensed',sans-serif"}}>EWMA α=0.15 · Requires 5+ games per signal · Recency-weighted accuracy</div>
        </div>
      )}
    </Panel>
  );
}

// ── Mistake Digest Panel ──────────────────────────────────────────────────
function MistakeDigestPanel({ mistakes }) {
  const [open,setOpen]=useState(false);
  if(!mistakes||mistakes.length<3) return null;
  // Aggregate by type
  const byType={};
  mistakes.forEach(m=>(m.categories||[]).forEach(cat=>{
    if(!byType[cat])byType[cat]={count:0,pct:0};
    byType[cat].count++;
  }));
  const total=mistakes.length;
  Object.keys(byType).forEach(k=>byType[k].pct=Math.round(byType[k].count/total*100));
  const sorted=Object.entries(byType).sort((a,b)=>b[1].count-a[1].count);
  return(
    <Panel border="rgba(248,113,113,0.18)" bg="rgba(248,113,113,0.02)" mb="10px">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        <div style={{display:"flex",alignItems:"center",gap:"7px"}}>
          <span style={{fontSize:"11px"}}>📋</span>
          <span style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#f87171",fontFamily:"'Barlow Condensed',sans-serif"}}>Automated Mistake Log</span>
          <Tag color="#f87171">{total} misses</Tag>
          {sorted[0]&&<Tag color={MISS_TYPES[sorted[0][0]]?.color||"#555"}>Top: {MISS_TYPES[sorted[0][0]]?.label||sorted[0][0]}</Tag>}
        </div>
        <span style={{color:"#333",fontSize:"10px"}}>{open?"▲":"▼"}</span>
      </div>
      {open&&(
        <div style={{marginTop:"11px"}}>
          <div style={{fontSize:"9px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"9px",lineHeight:"1.5"}}>
            Every incorrect prediction is automatically classified by miss-type. Identify systematic blind spots the model has so you can improve signal weighting or flag specific situations as unreliable.
          </div>
          {sorted.map(([type,d])=>{
            const mt=MISS_TYPES[type]||{label:type,color:"#555",desc:""};
            return(
              <div key={type} style={{display:"flex",alignItems:"center",gap:"8px",padding:"7px 10px",background:"rgba(255,255,255,0.03)",border:`1px solid ${mt.color}18`,borderRadius:"5px",marginBottom:"4px"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:"9px",fontWeight:700,color:mt.color,fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px"}}>{mt.label}</div>
                  <div style={{fontSize:"8px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif"}}>{mt.desc}</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:"16px",fontWeight:900,color:mt.color,fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{d.pct}%</div>
                  <div style={{fontSize:"7px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif"}}>{d.count}/{total} misses</div>
                </div>
              </div>
            );
          })}
          <div style={{marginTop:"8px",padding:"8px 10px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"5px"}}>
            <div style={{fontSize:"8px",fontWeight:700,color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"4px",textTransform:"uppercase",letterSpacing:"0.08em"}}>Actionable Insight</div>
            {sorted[0]&&<div style={{fontSize:"10px",color:"#aaa",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.5"}}>
              Your most common miss is <span style={{color:MISS_TYPES[sorted[0][0]]?.color||"#aaa",fontWeight:700}}>{MISS_TYPES[sorted[0][0]]?.label}</span> ({sorted[0][1].pct}% of losses). {MISS_TYPES[sorted[0][0]]?.desc} Consider {sorted[0][0]==="KEY_NUMBER"?"avoiding spreads within 1 of -3 and -7":sorted[0][0]==="SHARP_FADE"?"requiring 2+ confirming signals before following sharp money":"increasing the weight for the relevant counter-signal."}.
            </div>}
          </div>
        </div>
      )}
    </Panel>
  );
}

// ── Data Pipeline Health Panel ────────────────────────────────────────────
function PipelineStatusPanel({ health, onRefresh, isLoading }) {
  if(!health) return null;
  const gradeColor={A:"#4ade80",B:"#86efac",C:"#f59e0b",D:"#f87171"}[health.grade]||"#555";
  return(
    <div style={{display:"flex",alignItems:"center",gap:"8px",padding:"6px 11px",background:"rgba(255,255,255,0.02)",border:`1px solid ${health.staleCount>0?"rgba(245,158,11,0.18)":"rgba(255,255,255,0.05)"}`,borderRadius:"6px",marginBottom:"9px",flexWrap:"wrap"}}>
      <div style={{display:"flex",alignItems:"center",gap:"5px"}}>
        <div style={{width:"22px",height:"22px",borderRadius:"50%",background:`${gradeColor}18`,border:`2px solid ${gradeColor}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:900,color:gradeColor,fontFamily:"'Barlow Condensed',sans-serif",flexShrink:0}}>{health.grade}</div>
        <div>
          <div style={{fontSize:"8px",fontWeight:700,color:gradeColor,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.07em"}}>DATA PIPELINE {health.healthPct}%</div>
          <div style={{fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>{health.fresh}/{health.total} signals fresh · {health.recommendation}</div>
        </div>
      </div>
      {health.staleSignals?.length>0&&(
        <div style={{display:"flex",gap:"3px",flexWrap:"wrap",flex:1}}>
          {health.staleSignals.slice(0,4).map(s=>(
            <div key={s.name} style={{background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.18)",borderRadius:"3px",padding:"2px 6px",fontSize:"7px",color:"#f59e0b",fontFamily:"'Barlow Condensed',sans-serif"}}>{s.name} {s.ageMin}m ago</div>
          ))}
        </div>
      )}
      <button onClick={onRefresh} disabled={isLoading} style={{marginLeft:"auto",padding:"4px 9px",borderRadius:"4px",border:"1px solid rgba(255,255,255,0.07)",background:"rgba(255,255,255,0.04)",color:isLoading?"#222":"#777",fontSize:"8px",cursor:isLoading?"not-allowed":"pointer",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:600,display:"flex",alignItems:"center",gap:"3px",flexShrink:0}}>
        {isLoading?<><Spinner/>…</>:"↻ Refresh"}
      </button>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// SELF-LEARNING ENGINE
// ─────────────────────────────────────────────────────────────────────────
// How it works:
// 1. Every prediction records which signals fired (attribution fingerprint)
// 2. When you log a result, each fired signal's weight shifts up (correct)
//    or down (incorrect) using online gradient descent
// 3. Situation patterns are hashed and their win rates tracked over time
// 4. Per-team bias is measured so the model auto-corrects systematic errors
// 5. All insights feed back into the Claude analysis prompt each game
// ═══════════════════════════════════════════════════════════════════════════

const LEARNING_KEY   = "nfl_learning_v1";
const PATTERN_KEY    = "nfl_patterns_v1";
const TEAM_BIAS_KEY  = "nfl_team_bias_v1";
const LEARNING_RATE  = 0.025;   // conservative per-game nudge
const WEIGHT_MIN     = 3;       // floor — no signal goes dead
const WEIGHT_MAX     = 28;      // ceiling — no signal dominates
const MIN_SAMPLE     = 5;       // min games before weights auto-update

// ── Signal attribution ────────────────────────────────────────────────────
// Records which signals were "active" (had a meaningful value) on a prediction
function attributeSignals(gameResult, signals) {
  const { pressureData, cpoeData, leverageData, garbageData, coachData, olData, microData, lines, splitsData, situationalData, multiData, refData, primeData, weather } = signals;
  return {
    cpoe:          !!(cpoeData?.matchupEdge),
    pressure:      !!(pressureData?.spreadImpact && Math.abs(pressureData.spreadImpact) >= 0.5),
    olDegradation: !!(olData && ((olData.home?.healthScore||100) < 70 || (olData.away?.healthScore||100) < 70)),
    garbageFilter: !!(garbageData?.contaminated || garbageData?.home?.contaminated || garbageData?.away?.contaminated),
    luckRegression:!!(leverageData?.regressionVerdict && (Math.abs(leverageData.home?.luckScore||0) > 1 || Math.abs(leverageData.away?.luckScore||0) > 1)),
    marketEnsemble:!!(gameResult?.publicBetting?.rlm || (gameResult?.publicBetting?.sharpSide)),
    coaching:      !!(coachData?.spreadImpact && Math.abs(coachData.spreadImpact) >= 0.5),
    microContext:  !!(microData?.compositeAdj && Math.abs(microData.compositeAdj) >= 0.5),
    weather:       weather !== "dome" && weather !== "ideal",
    splits:        !!(splitsData?.spreadImpact),
    situational:   !!(situationalData?.home?.offByeATS || situationalData?.home?.homeDogATS),
    multiSeason:   !!(multiData?.home?.trueTalentRank),
    refProfile:    !!(refData?.avgTotal),
    primeTime:     !!(primeData?.isPrimeTime),
    logit:         !!(lines?.spread),
    keyNumber:     !!(lines?.spread && keyNumFlag(lines.spread)),
    rlm:           !!(gameResult?.publicBetting?.rlm),
  };
}

// ── Online gradient descent weight update ─────────────────────────────────
function updateWeightsOnline(currentWeights, attribution, wasCorrect, lr = LEARNING_RATE) {
  const updated = { ...currentWeights };
  Object.keys(DEFAULT_WEIGHTS).forEach(signal => {
    if (!attribution[signal]) return; // signal wasn't active — skip
    const cur = updated[signal] || DEFAULT_WEIGHTS[signal];
    if (wasCorrect) {
      // Signal fired on a win → reinforce it
      updated[signal] = Math.min(WEIGHT_MAX, cur + lr * (WEIGHT_MAX - cur));
    } else {
      // Signal fired on a loss → reduce it slightly
      updated[signal] = Math.max(WEIGHT_MIN, cur - lr * (cur - WEIGHT_MIN));
    }
    updated[signal] = parseFloat(updated[signal].toFixed(2));
  });
  // Renormalize to sum=100
  const total = Object.values(updated).reduce((s, v) => s + v, 0);
  if (total > 0) {
    Object.keys(updated).forEach(k => {
      updated[k] = parseFloat(((updated[k] / total) * 100).toFixed(2));
    });
  }
  return updated;
}

// ── Situation fingerprint ─────────────────────────────────────────────────
function fingerprintGame(signals, gameState) {
  const { weather, lines, primeData, multiData } = signals;
  const isDiv  = isDivisional(gameState.homeTeam, gameState.awayTeam);
  const isDome = STADIUM_CTX[gameState.homeTeam]?.indoor;
  const spread = parseFloat(lines?.spread || 0);
  const spreadBucket = spread <= 2 ? "pick" : spread <= 4 ? "fg" : spread <= 7 ? "td" : "blowout";
  const keyNum = keyNumFlag(spread) ? `key${keyNumFlag(spread).kn}` : "nokey";
  const parts = [
    isDiv ? "div" : "nonDiv",
    isDome ? "dome" : (weather === "wind" || weather === "rain") ? "badWeather" : "outdoor",
    spreadBucket,
    keyNum,
    primeData?.isPrimeTime ? "primeTime" : "regular",
    multiData?.home?.trend || "unknown",
  ];
  return parts.join("|");
}

// ── Team bias detector ────────────────────────────────────────────────────
function computeTeamBias(backtestHistory) {
  const teamStats = {};
  backtestHistory?.forEach(g => {
    [g.homeTeam, g.awayTeam].filter(Boolean).forEach(team => {
      if (!teamStats[team]) teamStats[team] = { wins: 0, total: 0 };
      teamStats[team].total++;
      if (g.spreadCorrect) teamStats[team].wins++;
    });
  });
  const biases = [];
  Object.entries(teamStats).forEach(([team, d]) => {
    if (d.total < 3) return;
    const rate = d.wins / d.total;
    if (rate >= 0.70) biases.push({ team, rate: Math.round(rate * 100), direction: "over-rated", games: d.total, desc: `Model predicts ${abb(team)} too favorably — consider fading` });
    if (rate <= 0.30) biases.push({ team, rate: Math.round(rate * 100), direction: "under-rated", games: d.total, desc: `Model consistently underrates ${abb(team)} — consider backing` });
  });
  return biases.sort((a, b) => Math.abs(50 - a.rate) - Math.abs(50 - b.rate));
}

// ── Pattern win rate lookup ───────────────────────────────────────────────
function lookupPatterns(currentFingerprint, patternMemory) {
  if (!patternMemory || !currentFingerprint) return null;
  const exact = patternMemory[currentFingerprint];
  // Also do partial matches (first 3 components)
  const partial = currentFingerprint.split("|").slice(0, 3).join("|");
  const partialMatches = Object.entries(patternMemory).filter(([k]) => k.startsWith(partial));
  const totalPartial = partialMatches.reduce((s, [, d]) => s + d.total, 0);
  const winsPartial  = partialMatches.reduce((s, [, d]) => s + d.wins, 0);
  return {
    exact: exact || null,
    partial: totalPartial >= 3 ? { wins: winsPartial, total: totalPartial, rate: Math.round(winsPartial / totalPartial * 100) } : null,
    fingerprint: currentFingerprint
  };
}

// ── Generate learning insights for Claude prompt ──────────────────────────
function buildLearningContext(learnedWeights, patternResult, teamBias, backtestHistory, homeTeam, awayTeam) {
  const parts = [];
  if (!backtestHistory?.length) return "";

  // Weight divergences from defaults
  const topSignals = Object.entries(learnedWeights || DEFAULT_WEIGHTS)
    .map(([k, v]) => ({ k, v, diff: v - (DEFAULT_WEIGHTS[k] || 10) }))
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
    .slice(0, 3);

  if (topSignals.some(s => Math.abs(s.diff) >= 2)) {
    const improved = topSignals.filter(s => s.diff >= 2).map(s => s.k);
    const degraded  = topSignals.filter(s => s.diff <= -2).map(s => s.k);
    if (improved.length) parts.push(`LEARNED EDGES: ${improved.join(", ")} signals historically accurate for this model (+weight)`);
    if (degraded.length)  parts.push(`LEARNED WEAKNESSES: ${degraded.join(", ")} signals historically unreliable (-weight)`);
  }

  // Pattern memory
  if (patternResult?.exact?.total >= 3) {
    const e = patternResult.exact;
    parts.push(`PATTERN MEMORY: This exact situation (${patternResult.fingerprint}) has ${e.wins}W-${e.total-e.wins}L (${Math.round(e.wins/e.total*100)}% ATS) historically`);
  } else if (patternResult?.partial?.total >= 5) {
    const p = patternResult.partial;
    parts.push(`SIMILAR PATTERN: Similar game situations have gone ${p.wins}W-${p.total-p.wins}L (${p.rate}% ATS) in model history`);
  }

  // Team bias
  const homeBias = teamBias?.find(b => b.team === homeTeam);
  const awayBias  = teamBias?.find(b => b.team === awayTeam);
  if (homeBias) parts.push(`TEAM BIAS ALERT: ${homeBias.desc} (${homeBias.games} games tracked)`);
  if (awayBias)  parts.push(`TEAM BIAS ALERT: ${awayBias.desc} (${awayBias.games} games tracked)`);

  return parts.length ? `\nSELF-LEARNING CONTEXT (${backtestHistory.length} games tracked):\n${parts.join("\n")}` : "";
}

// ═══════════════════════════════════════════════════════════════════════════
// SELF-LEARNING UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

// ── Learning Engine Dashboard ─────────────────────────────────────────────
function SelfLearningPanel({ learnedWeights, patternMemory, teamBias, backtestHistory, onResetLearning }) {
  const [open, setOpen] = useState(false);
  const hasData = (backtestHistory?.length || 0) >= MIN_SAMPLE;
  const gamesUntilActive = Math.max(0, MIN_SAMPLE - (backtestHistory?.length || 0));

  // Compute weight divergences

export { DriftDetectorPanel, FeatureImportancePanel, MistakeDigestPanel, PipelineStatusPanel };
