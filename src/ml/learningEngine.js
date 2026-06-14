// ── Self-Learning & Drift Detection Engine ──────────────────────────────────
function detectConceptDrift(history, windowSize=DRIFT_WINDOW) {
  if(!history||history.length < windowSize+5) return null;
  const recent   = history.slice(0, windowSize);
  const baseline = history.slice(windowSize);
  const recentATS   = recent.filter(g=>g.spreadCorrect).length/recent.length;
  const baselineATS = baseline.filter(g=>g.spreadCorrect).length/baseline.length;
  const overallATS  = history.filter(g=>g.spreadCorrect).length/history.length;
  const drift = recentATS - baselineATS;
  const severity = Math.abs(drift)>0.25?"CRITICAL":Math.abs(drift)>DRIFT_THRESH?"WARNING":"STABLE";

  // Detect signal-level drift: which signals changed firing patterns?
  const signalDrift = {};
  Object.keys(DEFAULT_WEIGHTS).forEach(sig=>{
    const recentFired   = recent.filter(g=>g.attribution?.[sig]).length/recent.length;
    const baselineFired = baseline.filter(g=>g.attribution?.[sig]).length/baseline.length;
    const recentAcc     = recent.filter(g=>g.attribution?.[sig]&&g.spreadCorrect).length/Math.max(1,recent.filter(g=>g.attribution?.[sig]).length);
    const baseAcc       = baseline.filter(g=>g.attribution?.[sig]&&g.spreadCorrect).length/Math.max(1,baseline.filter(g=>g.attribution?.[sig]).length);
    if(Math.abs(recentAcc-baseAcc)>0.15&&recent.filter(g=>g.attribution?.[sig]).length>=3){
      signalDrift[sig]={recentAcc:Math.round(recentAcc*100),baseAcc:Math.round(baseAcc*100),direction:recentAcc<baseAcc?"degraded":"improved"};
    }
  });

  return {
    recentRate:    Math.round(recentATS*100),
    baselineRate:  Math.round(baselineATS*100),
    overallRate:   Math.round(overallATS*100),
    drift:         parseFloat(drift.toFixed(3)),
    isDrifting:    Math.abs(drift)>DRIFT_THRESH,
    severity,
    direction:     drift<0?"degrading":"improving",
    signalDrift,
    window:        windowSize,
    totalGames:    history.length,
    recommendation: severity==="CRITICAL"
      ? "Accuracy has dropped sharply. Reset learned weights and recalibrate — NFL landscape may have shifted (QB change, coaching hire, injury wave)."
      : severity==="WARNING"
      ? "Recent accuracy below baseline. Monitor for 3 more games before resetting. Check if degraded signals match recent roster/coaching changes."
      : "Model is stable. No intervention needed."
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. ML FEATURE IMPORTANCE ENGINE
// Computes per-signal accuracy, recommends weight adjustments, auto-selects
// top features. Uses EWMA for recency-weighted importance scoring.
// ═══════════════════════════════════════════════════════════════════════════
function computeFeatureImportance(history) {
  if(!history||history.length<3) return [];
  const alpha = 0.15; // EWMA decay — recent games weight more
  const signalStats = {};

  // Forward pass: compute EWMA accuracy per signal
  [...history].reverse().forEach((game,i)=>{
    if(!game.attribution)return;
    Object.entries(game.attribution).forEach(([sig,fired])=>{
      if(!fired)return;
      if(!signalStats[sig])signalStats[sig]={ewmaAcc:0.5,total:0,wins:0,streak:0};
      const d=signalStats[sig];
      const outcome=game.spreadCorrect?1:0;
      d.ewmaAcc = alpha*outcome+(1-alpha)*d.ewmaAcc;
      d.total++;
      if(game.spreadCorrect)d.wins++;
      d.streak = game.spreadCorrect ? d.streak+1 : 0;
    });
  });

  return Object.entries(signalStats).map(([signal,d])=>{
    const rawAcc = d.total>0 ? d.wins/d.total : 0.5;
    const score  = d.total>=5 ? (0.6*d.ewmaAcc+0.4*rawAcc) : null;
    return {
      signal,
      score:    score!=null?parseFloat((score*100).toFixed(1)):null,
      rawAcc:   Math.round(rawAcc*100),
      ewmaAcc:  Math.round(d.ewmaAcc*100),
      games:    d.total,
      wins:     d.wins,
      streak:   d.streak,
      reliable: d.total>=5,
      recommendation: !score?"insufficient_data"
        : score>=0.58?"increase_weight"
        : score<=0.44?"decrease_weight"
        : "maintain",
      suggestedWeight: !score ? (DEFAULT_WEIGHTS[signal]||10)
        : Math.round(Math.max(WEIGHT_MIN, Math.min(WEIGHT_MAX, (DEFAULT_WEIGHTS[signal]||10) * (score/0.5))))
    };
  }).sort((a,b)=>(b.score||50)-(a.score||50));
}

// Auto-apply ML-suggested weights
function autoCalibrate(featureImportance, currentWeights) {
  const updated = {...currentWeights};
  featureImportance.filter(f=>f.reliable&&f.recommendation!=="insufficient_data").forEach(f=>{
    if(f.suggestedWeight) updated[f.signal]=f.suggestedWeight;
  });
  // Renorm
  const total=Object.values(updated).reduce((s,v)=>s+v,0);
  if(total>0) Object.keys(updated).forEach(k=>{updated[k]=parseFloat(((updated[k]/total)*100).toFixed(2));});
  return updated;
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. AUTOMATED MISTAKE CLASSIFIER
// Categorizes every incorrect prediction by miss-type so you can see
// systematic blind spots in the model over time.
// ═══════════════════════════════════════════════════════════════════════════
const MISS_TYPES = {
  KEY_NUMBER:     { label:"Key Number Push", color:"#f59e0b", desc:"Spread landed on/near -3/-7 — push risk wasn't weighted enough" },
  WEATHER:        { label:"Weather Underweighted", color:"#38bdf8", desc:"Weather conditions caused unexpected scoring shift" },
  SHARP_FADE:     { label:"Sharp Fade Failed", color:"#a78bfa", desc:"RLM/steam move followed but market corrected differently" },
  LUCK_TRAP:      { label:"Luck Trap", color:"#f87171", desc:"Lucky team continued outperforming regression expectation" },
  GARBAGE_TIME:   { label:"Garbage Time Distortion", color:"#fb923c", desc:"Garbage-time stats inflated a blowout — model mispriced" },
  OL_UNDERWEIGHT: { label:"OL Degradation Missed", color:"#6366f1", desc:"OL injury impact was larger than model predicted" },
  PRIME_TIME:     { label:"Prime Time Trap", color:"#ec4899", desc:"Prime time spot disadvantaged one team more than modeled" },
  DIVISIONAL:     { label:"Divisional Dog Bite", color:"#4ade80", desc:"Divisional underdog covered — familiarity factor underweighted" },
  GENERAL:        { label:"General Model Miss", color:"#555", desc:"No dominant attributable cause — noise event" },
};

function classifyMistake(prediction, result, attribution, gameState) {
  if(result.spreadCorrect) return [];
  const cats=[];
  if(attribution?.keyNumber) cats.push("KEY_NUMBER");
  if(attribution?.weather && Math.abs(weatherAdjust(gameState.weather).totalAdj)>=2) cats.push("WEATHER");
  if(attribution?.rlm || attribution?.marketEnsemble) cats.push("SHARP_FADE");
  if(attribution?.luckRegression && result.luckScore>2) cats.push("LUCK_TRAP");
  if(attribution?.garbageFilter && result.garbageContaminated) cats.push("GARBAGE_TIME");
  if(attribution?.olDegradation && result.olRisk) cats.push("OL_UNDERWEIGHT");
  if(attribution?.primeTime) cats.push("PRIME_TIME");
  if(isDivisional(gameState.homeTeam,gameState.awayTeam) && result.homedog) cats.push("DIVISIONAL");
  if(cats.length===0) cats.push("GENERAL");
  return cats;
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. DATA PIPELINE WATCHDOG
// Tracks freshness timestamps per signal, flags stale data, provides
// a real-time health score for the full data stack.
// ═══════════════════════════════════════════════════════════════════════════
function computePipelineHealth(timestamps) {
  if(!timestamps||!Object.keys(timestamps).length) return null;
  const now=Date.now();
  const signals=Object.entries(timestamps);
  const stale=signals.filter(([,ts])=>(now-ts)>STALE_MINS*60*1000);
  const fresh=signals.filter(([,ts])=>(now-ts)<=STALE_MINS*60*1000);
  const healthPct=Math.round(fresh.length/signals.length*100);
  return {
    healthPct,
    fresh:fresh.length, total:signals.length, staleCount:stale.length,
    staleSignals:stale.map(([name,ts])=>({name,ageMin:Math.round((now-ts)/60000)})),
    grade: healthPct>=90?"A":healthPct>=70?"B":healthPct>=50?"C":"D",
    recommendation: stale.length>0?`${stale.length} signal${stale.length>1?"s":""} stale — reload before analysis`:"All data fresh"
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

// ── Monte Carlo Panel ─────────────────────────────────────────────────────
function MonteCarloPanel({ mcResult, running, homeTeam, awayTeam, lines }) {
  if(!mcResult&&!running) return null;
  const [tab, setTab] = useState("summary");
  if(running) return(
    <Panel border="rgba(168,85,247,0.22)" bg="rgba(168,85,247,0.03)" mb="10px">
      <div style={{display:"flex",alignItems:"center",gap:"9px",padding:"6px 0"}}>
        <Spinner/><span style={{fontSize:"10px",fontWeight:700,color:"#a855f7",fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.1em"}}>Running {MC_ITERATIONS.toLocaleString()} Monte Carlo simulations…</span>
      </div>
    </Panel>
  );
  const {coverProb,pushProb,overProb,blowoutProb,oneScoreProb,medianMargin,marginP10,marginP25,marginP75,marginP90,totalP10,totalP25,totalMedian,totalP75,totalP90,scoreDistribution,params}=mcResult;
  const coverColor=coverProb>=55?"#4ade80":coverProb>=50?"#f59e0b":"#f87171";
  const overColor=overProb>=55?"#4ade80":overProb>=50?"#f59e0b":"#f87171";
  const maxDistPct=scoreDistribution?.length?Math.max(...scoreDistribution.map(d=>d.pct)):1;
  const favStr=lines?.favTeam?abb(lines.favTeam):"FAV";

  return(
    <Panel border="rgba(168,85,247,0.22)" bg="rgba(168,85,247,0.03)" mb="10px">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"12px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <span style={{fontSize:"11px"}}>🎲</span>
          <span style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#a855f7",fontFamily:"'Barlow Condensed',sans-serif"}}>Monte Carlo Simulation</span>
          <Tag color="#a855f7">{MC_ITERATIONS.toLocaleString()} runs</Tag>
        </div>
        <div style={{display:"flex",gap:"4px"}}>
          {["summary","distribution","intervals"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:"3px 8px",borderRadius:"4px",border:`1px solid ${tab===t?"rgba(168,85,247,0.4)":"rgba(255,255,255,0.08)"}`,background:tab===t?"rgba(168,85,247,0.12)":"transparent",color:tab===t?"#a855f7":"#444",fontSize:"8px",fontWeight:700,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",textTransform:"capitalize"}}>{t}</button>
          ))}
        </div>
      </div>

      {tab==="summary"&&(
        <>
          {/* Primary metrics */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:"5px",marginBottom:"10px"}}>
            {[
              ["Cover %",`${coverProb}%`,coverColor,`${favStr} covers ATS`,`+${pushProb}% push`],
              ["Over %",`${overProb}%`,overColor,"Total goes over",""],
              ["1-Score Game",`${oneScoreProb}%`,"#38bdf8","≤8 pt margin","high variance"],
              ["Blowout",`${blowoutProb}%`,blowoutProb>25?"#f87171":"#555","21+ pt margin",""],
            ].map(([l,v,c,sub,sub2])=>(
              <div key={l} style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${c}22`,borderRadius:"7px",padding:"8px 7px",textAlign:"center"}}>
                <div style={{fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px"}}>{l}</div>
                <div style={{fontSize:"19px",fontWeight:900,color:c,fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{v}</div>
                <div style={{fontSize:"7px",color:`${c}88`,fontFamily:"'Barlow Condensed',sans-serif",marginTop:"2px"}}>{sub}</div>
                {sub2&&<div style={{fontSize:"6px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"1px"}}>{sub2}</div>}
              </div>
            ))}
          </div>
          {/* Margin fan */}
          <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"7px",padding:"10px 12px",marginBottom:"8px"}}>
            <div style={{fontSize:"8px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#555",marginBottom:"8px",fontFamily:"'Barlow Condensed',sans-serif"}}>Margin Distribution Fan</div>
            <div style={{position:"relative",height:"32px",marginBottom:"6px"}}>
              {/* P10-P90 bar */}
              <div style={{position:"absolute",top:"50%",left:`${(parseFloat(marginP10)+35)/70*100}%`,right:`${100-(parseFloat(marginP90)+35)/70*100}%`,height:"8px",background:"rgba(168,85,247,0.18)",borderRadius:"4px",transform:"translateY(-50%)"}}/>
              {/* P25-P75 bar */}
              <div style={{position:"absolute",top:"50%",left:`${(parseFloat(marginP25)+35)/70*100}%`,right:`${100-(parseFloat(marginP75)+35)/70*100}%`,height:"14px",background:"rgba(168,85,247,0.32)",borderRadius:"4px",transform:"translateY(-50%)"}}/>
              {/* Median line */}
              <div style={{position:"absolute",top:"10%",left:`${(parseFloat(medianMargin)+35)/70*100}%`,width:"2px",height:"80%",background:"#a855f7",borderRadius:"1px"}}/>
              {/* Zero line */}
              <div style={{position:"absolute",top:"5%",left:"50%",width:"1px",height:"90%",background:"rgba(255,255,255,0.15)",borderRadius:"1px"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>
              <span>P10: {marginP10}</span><span>P25: {marginP25}</span><span style={{color:"#a855f7",fontWeight:700}}>Med: {medianMargin}</span><span>P75: {marginP75}</span><span>P90: {marginP90}</span>
            </div>
            <div style={{marginTop:"5px",fontSize:"8px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",textAlign:"center"}}>
              {abb(awayTeam)} @ {abb(homeTeam)} · σ margin = {params.marginSD} pts · {params.totalSD} pts total SD
            </div>
          </div>
        </>
      )}

      {tab==="distribution"&&scoreDistribution?.length>0&&(
        <div>
          <div style={{fontSize:"8px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#555",marginBottom:"8px",fontFamily:"'Barlow Condensed',sans-serif"}}>Score Total Distribution (% of simulations)</div>
          <div style={{display:"flex",alignItems:"flex-end",gap:"3px",height:"80px",marginBottom:"6px"}}>
            {scoreDistribution.filter(d=>d.pct>0).map(d=>{
              const h=(d.pct/maxDistPct)*100;
              const isOver=d.range>parseFloat(lines?.total||44);
              return(
                <div key={d.range} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"1px"}}>
                  <div style={{width:"100%",height:`${h}%`,background:isOver?"rgba(74,222,128,0.6)":"rgba(248,113,113,0.6)",borderRadius:"2px 2px 0 0",minHeight:"2px"}} title={`${d.range} pts: ${d.pct}%`}/>
                  <div style={{fontSize:"6px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",transform:"rotate(-45deg)",transformOrigin:"top left",marginTop:"2px",whiteSpace:"nowrap"}}>{d.range}</div>
                </div>
              );
            })}
          </div>
          <div style={{display:"flex",gap:"10px",justifyContent:"center",marginTop:"14px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"4px"}}><div style={{width:"8px",height:"8px",borderRadius:"1px",background:"rgba(248,113,113,0.6)"}}/><span style={{fontSize:"8px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif"}}>Under {lines?.total||44}</span></div>
            <div style={{display:"flex",alignItems:"center",gap:"4px"}}><div style={{width:"8px",height:"8px",borderRadius:"1px",background:"rgba(74,222,128,0.6)"}}/><span style={{fontSize:"8px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif"}}>Over {lines?.total||44}</span></div>
          </div>
        </div>
      )}

      {tab==="intervals"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
          {[["Margin Confidence Intervals","margin",[[marginP10,marginP90,"80% CI"],[marginP25,marginP75,"50% CI"],[medianMargin,null,"Median"]]],["Total Confidence Intervals","total",[[totalP10,totalP90,"80% CI"],[totalP25,totalP75,"50% CI"],[totalMedian,null,"Median"]]]].map(([title,,rows])=>(
            <div key={title} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"6px",padding:"9px 10px"}}>
              <div style={{fontSize:"8px",fontWeight:700,color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"7px"}}>{title}</div>
              {rows.map(([lo,hi,lbl])=>(
                <div key={lbl} style={{display:"flex",alignItems:"center",gap:"7px",marginBottom:"4px"}}>
                  <span style={{fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",width:"40px"}}>{lbl}</span>
                  <div style={{flex:1,height:"4px",borderRadius:"2px",background:"rgba(255,255,255,0.06)",overflow:"hidden",position:"relative"}}>
                    <div style={{position:"absolute",left:hi?`${(parseFloat(lo)+40)/80*100}%`:"50%",right:hi?`${100-(parseFloat(hi)+40)/80*100}%`:"50%",top:0,bottom:0,background:"rgba(168,85,247,0.5)",borderRadius:"2px"}}/>
                  </div>
                  <span style={{fontSize:"8px",fontWeight:700,color:"#a855f7",fontFamily:"'Barlow Condensed',sans-serif",width:"60px",textAlign:"right"}}>{hi?`${lo} → ${hi}`:lo}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      <div style={{marginTop:"7px",fontSize:"8px",color:"#1a1a2a",fontFamily:"'Barlow Condensed',sans-serif"}}>σ margin calibrated to NFL historical variance · Results are probabilistic not deterministic</div>
    </Panel>
  );
}

// ── Concept Drift Panel ───────────────────────────────────────────────────
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

export { detectConceptDrift, computeFeatureImportance, autoCalibrate, classifyMistake, computePipelineHealth, attributeSignals, updateWeightsOnline, fingerprintGame, computeTeamBias, lookupPatterns, buildLearningContext };
