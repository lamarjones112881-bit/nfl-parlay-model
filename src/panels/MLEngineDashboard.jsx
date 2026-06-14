import { useState } from "react";
import { Panel, PanelTitle, Tag } from "../components/UIKit.jsx";

function MLEngineDashboard({
  // Backtest props
  backtestHistory, onAddResult, onClearBacktest,
  modelSpread, modelTotal, modelTotalLean,
  homeTeam, awayTeam, confidence,
  // CLV props
  clvHistory, onAddCLV, onClearCLV, lines, gameResult,
  // Self-learning props
  learnedWeights, patternMemory, teamBias, onResetLearning,
  // Signal weight props
  signalWeights, onUpdateWeights, calibration,
  // Feature importance props
  featureImportance, onAutoCalibrate,
  // Drift props
  driftResult,
  // Mistakes props
  mistakes,
  // Clustering props
  clusterResult, onFetchSchematicData, fetchingSchematic,
  // Season dashboard props
  clvHistory: _clv, parlayHistory, signalWeights: _sw,
  // Power rankings props
  onLoadMatchup,
}) {
  const [open, setOpen]   = useState(false);
  const [tab, setTab]     = useState("backtest");

  // Live stats for header badges
  const totalGames    = backtestHistory?.length || 0;
  const atsRate       = totalGames > 0 ? Math.round(backtestHistory.filter(g=>g.spreadCorrect).length/totalGames*100) : null;
  const weightsActive = learnedWeights && JSON.stringify(learnedWeights) !== JSON.stringify(DEFAULT_WEIGHTS);
  const clustersReady = !!(clusterResult?.teamsAnalyzed >= 6);
  const driftAlert    = driftResult?.isDrifting;
  const hasEdge       = featureImportance?.filter(f=>f.reliable&&f.recommendation==="increase_weight").length || 0;

  const TABS = [
    { key:"backtest",  icon:"🧪", label:"Backtest",      badge: totalGames > 0 ? `${totalGames}G` : null,    badgeColor: atsRate>=53?"#4ade80":atsRate>=50?"#f59e0b":atsRate!=null?"#f87171":"#555" },
    { key:"learning",  icon:"🧠", label:"Self-Learning", badge: weightsActive ? "Active" : `${totalGames}/${MIN_SAMPLE}G`, badgeColor: weightsActive?"#10b981":"#555" },
    { key:"clustering",icon:"🧬", label:"Clustering",    badge: clustersReady ? `K=6 · ${clusterResult.teamsAnalyzed}T` : "Run →", badgeColor: clustersReady?"#818cf8":"#555" },
    { key:"gamelog",   icon:"📋", label:"Game Log",    badge: totalGames > 0 ? totalGames+"G" : null, badgeColor:"#38bdf8" },
    { key:"analytics", icon:"📊", label:"Analytics",     badge: driftAlert ? "⚠ Drift" : hasEdge > 0 ? `${hasEdge} signals↑` : null, badgeColor: driftAlert?"#f87171":hasEdge?"#4ade80":"#555" },
  ];

  return (
    <div style={{marginBottom:"12px",background:"rgba(0,0,0,0.35)",border:`1px solid ${driftAlert?"rgba(239,68,68,0.22)":"rgba(255,255,255,0.07)"}`,borderRadius:"12px",overflow:"hidden"}}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",background:"rgba(255,255,255,0.02)"}} onClick={()=>setOpen(o=>!o)}>
        <div style={{display:"flex",alignItems:"center",gap:"10px",flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:"7px"}}>
            <div style={{width:"28px",height:"28px",borderRadius:"7px",background:"linear-gradient(135deg,rgba(99,102,241,0.3),rgba(16,185,129,0.2))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",flexShrink:0}}>🤖</div>
            <div>
              <div style={{fontSize:"11px",fontWeight:800,letterSpacing:"0.1em",textTransform:"uppercase",color:"#a5b4fc",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>ML Engine</div>
              <div style={{fontSize:"8px",color:"#2a2a2a",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"1px",letterSpacing:"0.07em",textTransform:"uppercase"}}>
                {weightsActive?"Weights calibrated":"Not yet calibrated"} · {clustersReady?`${clusterResult.teamsAnalyzed} teams clustered`:"No cluster"} · {totalGames} games logged
              </div>
            </div>
          </div>
          {/* Live status pills */}
          <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
            {totalGames > 0 && <Tag color={atsRate>=53?"#4ade80":atsRate>=50?"#f59e0b":"#f87171"}>ATS {atsRate}%</Tag>}
            {weightsActive && <Tag color="#10b981">⚡ Learning</Tag>}
            {clustersReady && <Tag color="#818cf8">🧬 {ARCHETYPES[clusterResult?.teamArchetypes?.[homeTeam]]?.icon||""}{ARCHETYPES[clusterResult?.teamArchetypes?.[awayTeam]]?.icon||""}</Tag>}
            {driftAlert && <Tag color="#f87171">⚠ Drift {driftResult.severity}</Tag>}
            {hasEdge > 0 && <Tag color="#4ade80">{hasEdge} signal{hasEdge>1?"s":""} ↑</Tag>}
          </div>
        </div>
        <span style={{color:"#333",fontSize:"12px",flexShrink:0}}>{open?"▲":"▼"}</span>
      </div>

      {open && (
        <div style={{padding:"12px 16px 16px"}}>
          {/* ── Tab row ───────────────────────────────────────── */}
          <div style={{display:"flex",gap:"4px",marginBottom:"14px",borderBottom:"1px solid rgba(255,255,255,0.06)",paddingBottom:"10px",flexWrap:"wrap"}}>
            {TABS.map(t=>(
              <button key={t.key} onClick={()=>setTab(t.key)}
                style={{display:"flex",alignItems:"center",gap:"5px",padding:"6px 11px",borderRadius:"7px",border:`1px solid ${tab===t.key?"rgba(165,180,252,0.35)":"rgba(255,255,255,0.07)"}`,background:tab===t.key?"rgba(99,102,241,0.12)":"transparent",color:tab===t.key?"#a5b4fc":"#555",fontSize:"10px",fontWeight:700,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",transition:"all 0.15s"}}>
                <span style={{fontSize:"11px"}}>{t.icon}</span>
                {t.label}
                {t.badge&&<span style={{background:`${t.badgeColor}20`,border:`1px solid ${t.badgeColor}40`,borderRadius:"3px",padding:"0px 5px",fontSize:"8px",fontWeight:700,color:t.badgeColor}}>{t.badge}</span>}
              </button>
            ))}
          </div>

          {/* ── BACKTEST TAB ──────────────────────────────────── */}
          {tab==="backtest"&&(
            <div>
              <BacktestPanel
                backtestHistory={backtestHistory} onAddResult={onAddResult}
                onClearBacktest={onClearBacktest} modelSpread={modelSpread}
                modelTotal={modelTotal} modelTotalLean={modelTotalLean}
                homeTeam={homeTeam} awayTeam={awayTeam} confidence={confidence}/>
              <CLVPanel
                clvHistory={clvHistory} onAddCLV={onAddCLV} onClearCLV={onClearCLV}
                modelSpread={gameResult?.spreadPick?.replace(/[^\d.]/g,"")||lines?.spread}
                lines={lines} homeTeam={homeTeam} awayTeam={awayTeam}/>
            </div>
          )}

          {/* ── SELF-LEARNING TAB ─────────────────────────────── */}
          {tab==="learning"&&(
            <div>
              <SelfLearningPanel
                learnedWeights={learnedWeights} patternMemory={patternMemory}
                teamBias={teamBias} backtestHistory={backtestHistory}
                onResetLearning={onResetLearning}/>
              <SignalWeightPanel
                weights={signalWeights} onUpdateWeights={onUpdateWeights}
                calibrationStats={calibration}/>
              <CalibrationPanel calibration={calibration}/>
            </div>
          )}

          {/* ── CLUSTERING TAB ────────────────────────────────── */}
          {tab==="clustering"&&(
            <div>
              <SchematicClusterPanel
                clusterResult={clusterResult} homeTeam={homeTeam} awayTeam={awayTeam}
                onFetchSchematicData={onFetchSchematicData}
                fetchingSchematic={fetchingSchematic}/>
              <PowerRankingsPanel
                backtestHistory={backtestHistory}
                onLoadMatchup={onLoadMatchup}/>
              <SeasonDashboard
                backtestHistory={backtestHistory} clvHistory={clvHistory}
                parlayHistory={parlayHistory} signalWeights={signalWeights}/>
            </div>
          )}

          {/* ── GAME LOG TAB — unified backtest + CLV + bankroll ── */}
          {tab==="gamelog"&&(
            <div>
              <div style={{fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"9px",lineHeight:"1.5"}}>
                Unified log: every game analyzed, model pick, ATS result, CLV, and units wagered. The complete picture in one view.
              </div>
              {/* Header */}
              <div style={{display:"grid",gridTemplateColumns:"60px 1fr 55px 55px 45px 45px",gap:"4px",padding:"4px 6px",marginBottom:"3px"}}>
                {["Date","Matchup","Pick","Result","CLV","Units"].map(h=>(
                  <div key={h} style={{fontSize:"7px",fontWeight:700,color:"#333",fontFamily:"'Barlow Condensed',sans-serif",textTransform:"uppercase",letterSpacing:"0.06em"}}>{h}</div>
                ))}
              </div>
              {backtestHistory?.length > 0 ? (
                <div style={{maxHeight:"300px",overflowY:"auto"}}>
                  {backtestHistory.map((g,i)=>{
                    const clvEntry = clvHistory?.find(c=>c.homeTeam===g.homeTeam&&c.awayTeam===g.awayTeam);
                    const bankEntry= (clvHistory||[]).find(c=>c.homeTeam===g.homeTeam&&c.awayTeam===g.awayTeam&&c.units);
                    const resColor = g.spreadCorrect?"#4ade80":g.atsResult==="PUSH"?"#f59e0b":"#f87171";
                    const clvVal   = clvEntry?.clv;
                    const clvColor = clvVal>0?"#4ade80":clvVal<0?"#f87171":"#555";
                    return(
                      <div key={i} style={{display:"grid",gridTemplateColumns:"60px 1fr 55px 55px 45px 45px",gap:"4px",padding:"5px 6px",background:i%2===0?"rgba(255,255,255,0.025)":"transparent",borderRadius:"3px",alignItems:"center"}}>
                        <div style={{fontSize:"8px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>{g.date}</div>
                        <div style={{fontSize:"8px",color:"#ccc",fontFamily:"'Barlow Condensed',sans-serif",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                          <span style={{color:tc(g.awayTeam||"")}}>{abb(g.awayTeam)}</span>
                          <span style={{color:"#333"}}> @ </span>
                          <span style={{color:tc(g.homeTeam||"")}}>{abb(g.homeTeam)}</span>
                        </div>
                        <div style={{fontSize:"8px",fontWeight:700,color:"#aaa",fontFamily:"'Barlow Condensed',sans-serif"}}>{g.modelSpread?"-"+g.modelSpread:"—"}</div>
                        <div style={{fontSize:"9px",fontWeight:800,color:resColor,fontFamily:"'Barlow Condensed',sans-serif"}}>{g.atsResult||"—"}</div>
                        <div style={{fontSize:"9px",fontWeight:700,color:clvColor,fontFamily:"'Barlow Condensed',sans-serif"}}>{clvVal!=null?(clvVal>0?"+":"")+clvVal:"—"}</div>
                        <div style={{fontSize:"9px",color:"#888",fontFamily:"'Barlow Condensed',sans-serif"}}>{bankEntry?.units?bankEntry.units+"u":"—"}</div>
                      </div>
                    );
                  })}
                </div>
              ):(
                <div style={{textAlign:"center",padding:"16px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",fontSize:"10px"}}>No games logged yet. Run analyses and fetch results to populate.</div>
              )}
            </div>
          )}

          {/* ── ANALYTICS TAB ─────────────────────────────────── */}
          {tab==="analytics"&&(
            <div>
              <DriftDetectorPanel driftResult={driftResult} onResetWeights={onResetLearning}/>
              <FeatureImportancePanel
                features={featureImportance} onAutoCalibrate={onAutoCalibrate}
                onUpdateWeights={onUpdateWeights}/>
              <MistakeDigestPanel mistakes={mistakes}/>
            </div>
          )}

          {/* ── Footer note ───────────────────────────────────── */}
          <div style={{marginTop:"10px",padding:"7px 10px",background:"rgba(99,102,241,0.04)",border:"1px solid rgba(99,102,241,0.1)",borderRadius:"6px",fontSize:"9px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.5"}}>
            🤖 All ML systems run silently in the background. Weight updates fire on every backtest result. Clustering re-runs automatically as signal data accumulates. Drift is checked after every logged game.
          </div>
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// WEEKLY EXECUTION SEQUENCE ENGINE

export default MLEngineDashboard;
