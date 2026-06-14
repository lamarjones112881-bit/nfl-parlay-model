import { useState, useEffect } from "react";
import { Panel, PanelTitle, Tag, Spinner } from "../components/UIKit.jsx";

// CoachingPanel, CPOEPanel, PressurePanel, MarketEnsemblePanel, OLPanel, MicroContextPanel
function CPOEPanel({cpoeData,loading,homeTeam,awayTeam}){
  if(!cpoeData&&!loading) return null;
  const getCpoeColor=c=>c>5?"#4ade80":c>0?"#86efac":c>-5?"#f59e0b":"#f87171";
  const getCpoeLabel=c=>c>8?"ELITE":c>4?"ABOVE AVG":c>0?"AVERAGE":c>-4?"BELOW AVG":"POOR";
  return(
    <Panel border="rgba(236,72,153,0.2)" bg="rgba(236,72,153,0.03)" mb="10px">
      <PanelTitle icon="🎯" title="CPOE — Completion % Over Expected" tag={loading?"loading…":"live"} tagColor={loading?"#f59e0b":"#ec4899"}/>
      {loading&&<Skel cols={2}/>}
      {cpoeData&&!loading&&(
        <>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"8px"}}>
            {[{team:awayTeam,d:cpoeData.away},{team:homeTeam,d:cpoeData.home}].map(({team,d})=>d?(
              <div key={team} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"7px",padding:"9px 10px"}}>
                <div style={{fontSize:"9px",fontWeight:800,color:tc(team),fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"5px"}}>{d.qbName||abb(team)} QB</div>
                {/* CPOE gauge */}
                <div style={{textAlign:"center",marginBottom:"7px"}}>
                  <div style={{fontSize:"24px",fontWeight:900,color:getCpoeColor(d.cpoe||0),fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{d.cpoe!=null?(d.cpoe>0?"+":"")+d.cpoe:"+0.0"}</div>
                  <div style={{fontSize:"8px",fontWeight:700,color:getCpoeColor(d.cpoe||0),fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.1em"}}>{getCpoeLabel(d.cpoe||0)}</div>
                  <div style={{fontSize:"7px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"1px"}}>CPOE (% above expected)</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"3px"}}>
                  {[
                    ["Comp %",d.compPct,"#aaa"],
                    ["Expected %",d.expectedCompPct,"#555"],
                    ["xEPA/play",d.xEPA,(d.xEPA||0)>0.2?"#4ade80":(d.xEPA||0)>0?"#f59e0b":"#f87171"],
                    ["vs Def CPOE",d.vsDefCPOE,getCpoeColor(-(d.vsDefCPOE||0))],
                  ].map(([lbl,v,c])=>(
                    <div key={lbl} style={{background:"rgba(255,255,255,0.03)",borderRadius:"4px",padding:"4px 5px",textAlign:"center"}}>
                      <div style={{fontSize:"7px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"1px",lineHeight:"1.2"}}>{lbl}</div>
                      <div style={{fontSize:"11px",fontWeight:800,color:c,fontFamily:"'Barlow Condensed',sans-serif"}}>{v!=null?(typeof v==="number"&&lbl.includes("%")?`${v}%`:v):"—"}</div>
                    </div>
                  ))}
                </div>
                {d.note&&<div style={{marginTop:"5px",fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",lineHeight:"1.4"}}>{d.note}</div>}
              </div>
            ):null)}
          </div>
          {cpoeData.matchupEdge&&(
            <div style={{background:"rgba(236,72,153,0.06)",border:"1px solid rgba(236,72,153,0.14)",borderRadius:"6px",padding:"8px 11px"}}>
              <div style={{fontSize:"9px",fontWeight:700,color:"#ec4899",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px"}}>🎯 CPOE Matchup Edge</div>
              <div style={{fontSize:"10px",color:"#fbcfe8",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.5"}}>{cpoeData.matchupEdge}</div>
            </div>
          )}
          {cpoeData.totalImpact&&<div style={{marginTop:"6px",display:"flex",gap:"7px",alignItems:"center"}}><div style={{fontSize:"8px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>TOTAL IMPACT:</div><Tag color="#ec4899">{cpoeData.totalImpact>0?"+":""}{cpoeData.totalImpact} pts</Tag><div style={{fontSize:"9px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",flex:1}}>{cpoeData.totalImpactNote}</div></div>}
        </>
      )}
    </Panel>
  );
}
// ── Pressure Rate Panel ───────────────────────────────────────────────────────
function PressurePanel({pressureData,loading,homeTeam,awayTeam}){
  if(!pressureData&&!loading) return null;
  return(
    <Panel border="rgba(251,146,60,0.2)" bg="rgba(251,146,60,0.03)" mb="10px">
      <PanelTitle icon="🔥" title="Pressure Rate Matchup" tag={loading?"loading…":"live"} tagColor={loading?"#f59e0b":"#fb923c"}/>
      {loading&&<Skel cols={2}/>}
      {pressureData&&!loading&&(
        <>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"8px"}}>
            {[{team:awayTeam,color:tc(awayTeam),d:pressureData.away},{team:homeTeam,color:tc(homeTeam),d:pressureData.home}].map(({team,color,d})=>d?(
              <div key={team} style={{borderTop:`2px solid ${color}33`,paddingTop:"9px"}}>
                <div style={{fontSize:"10px",fontWeight:800,color,fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"7px"}}>{abb(team)}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px"}}>
                  {[["Pressure Allowed%",d.pressureAllowed,d.pressureAllowed>35?"#f87171":d.pressureAllowed>28?"#f59e0b":"#4ade80"],["Pass Rush Win%",d.passRushWin,d.passRushWin>55?"#4ade80":d.passRushWin>42?"#f59e0b":"#f87171"],["Sack Rate",d.sackRate,d.sackRate>8?"#4ade80":d.sackRate>5?"#f59e0b":"#f87171"],["Hurry Rate",d.hurryRate,d.hurryRate>15?"#f87171":d.hurryRate>10?"#f59e0b":"#4ade80"]].map(([lbl,val,color])=>(
                    <div key={lbl} style={{background:"rgba(255,255,255,0.04)",borderRadius:"5px",padding:"5px 7px",textAlign:"center"}}>
                      <div style={{fontSize:"7px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px",lineHeight:"1.2"}}>{lbl}</div>
                      <div style={{fontSize:"13px",fontWeight:900,color,fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{val!=null?`${val}%`:"—"}</div>
                    </div>
                  ))}
                </div>
                {d.note&&<div style={{fontSize:"9px",color:"#666",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"5px",fontStyle:"italic",lineHeight:"1.4"}}>{d.note}</div>}
              </div>
            ):null)}
          </div>
          {pressureData.matchupEdge&&<div style={{background:"rgba(251,146,60,0.06)",border:"1px solid rgba(251,146,60,0.15)",borderRadius:"7px",padding:"9px 12px",marginBottom:"6px"}}><div style={{fontSize:"9px",fontWeight:700,color:"#fb923c",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"4px"}}>🔥 Pressure Edge</div><div style={{fontSize:"11px",color:"#fed7aa",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.5"}}>{pressureData.matchupEdge}</div></div>}
          {pressureData.spreadImpact&&<div style={{display:"flex",gap:"8px",alignItems:"center"}}><div style={{fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif"}}>PRESSURE SPREAD ADJ:</div><Tag color="#fb923c">{pressureData.spreadImpact>0?"+":""}{pressureData.spreadImpact} pts</Tag></div>}
        </>
      )}
    </Panel>
  );
}

// ── Market Ensemble Panel ─────────────────────────────────────────────────────
function MarketEnsemblePanel({ensemble,loading,homeTeam,awayTeam}){
  if(!ensemble&&!loading) return null;
  const books=ensemble?.books||[];
  const consensusSpread=books.length?(books.reduce((s,b)=>s+(b.spread||0),0)/books.length).toFixed(1):null;
  const spreadDiv=books.length?Math.max(...books.map(b=>b.spread||0))-Math.min(...books.map(b=>b.spread||0)):0;
  const totalDiv=books.length?Math.max(...books.map(b=>b.total||0))-Math.min(...books.map(b=>b.total||0)):0;
  return(
    <Panel border="rgba(139,92,246,0.2)" bg="rgba(139,92,246,0.03)" mb="10px">
      <PanelTitle icon="📡" title="Market Ensemble" tag={loading?"loading…":"multi-book"} tagColor={loading?"#f59e0b":"#8b5cf6"}/>
      {loading&&<Skel cols={3}/>}
      {ensemble&&!loading&&(
        <>
          {books.length>0&&(
            <div style={{marginBottom:"9px"}}>
              <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(books.length,4)},1fr)`,gap:"5px",marginBottom:"7px"}}>
                {books.map((b,i)=><div key={i} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"7px",padding:"7px 6px",textAlign:"center"}}><div style={{fontSize:"8px",fontWeight:700,color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px"}}>{b.book}</div><div style={{fontSize:"12px",fontWeight:900,color:"#4ade80",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{b.favTeam?abb(b.favTeam):""} -{b.spread||"?"}</div><div style={{fontSize:"10px",fontWeight:700,color:"#c084fc",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"2px"}}>{b.total||"—"}</div></div>)}
              </div>
              <div style={{display:"flex",gap:"6px"}}>
                <div style={{flex:1,background:"rgba(139,92,246,0.07)",border:"1px solid rgba(139,92,246,0.16)",borderRadius:"5px",padding:"6px 9px",textAlign:"center"}}><div style={{fontSize:"8px",color:"#7c3aed",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,marginBottom:"2px"}}>CONSENSUS</div><div style={{fontSize:"13px",fontWeight:900,color:"#a78bfa",fontFamily:"'Barlow Condensed',sans-serif"}}>{consensusSpread?`${ensemble.favTeam?abb(ensemble.favTeam):""} -${consensusSpread}`:"—"}</div></div>
                <div style={{flex:1,background:"rgba(139,92,246,0.07)",border:"1px solid rgba(139,92,246,0.16)",borderRadius:"5px",padding:"6px 9px",textAlign:"center"}}><div style={{fontSize:"8px",color:"#7c3aed",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,marginBottom:"2px"}}>SPREAD DIV</div><div style={{fontSize:"13px",fontWeight:900,color:spreadDiv>=1.5?"#f87171":spreadDiv>=0.5?"#f59e0b":"#4ade80",fontFamily:"'Barlow Condensed',sans-serif"}}>{spreadDiv.toFixed(1)} pts</div></div>
                <div style={{flex:1,background:"rgba(139,92,246,0.07)",border:"1px solid rgba(139,92,246,0.16)",borderRadius:"5px",padding:"6px 9px",textAlign:"center"}}><div style={{fontSize:"8px",color:"#7c3aed",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,marginBottom:"2px"}}>TOTAL DIV</div><div style={{fontSize:"13px",fontWeight:900,color:totalDiv>=2?"#f87171":totalDiv>=1?"#f59e0b":"#4ade80",fontFamily:"'Barlow Condensed',sans-serif"}}>{totalDiv.toFixed(1)} pts</div></div>
              </div>
            </div>
          )}
          {ensemble.sharpConsensus&&<div style={{background:"rgba(74,222,128,0.05)",border:"1px solid rgba(74,222,128,0.12)",borderRadius:"6px",padding:"7px 10px",marginBottom:"6px"}}><div style={{fontSize:"9px",fontWeight:700,color:"#4ade80",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px"}}>📡 Sharp Consensus</div><div style={{fontSize:"10px",color:"#86efac",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.5"}}>{ensemble.sharpConsensus}</div></div>}
          {ensemble.exploit&&<div style={{background:spreadDiv>=1.5?"rgba(248,113,113,0.05)":"rgba(251,191,36,0.04)",border:`1px solid ${spreadDiv>=1.5?"rgba(248,113,113,0.16)":"rgba(251,191,36,0.13)"}`,borderRadius:"6px",padding:"7px 10px"}}><div style={{fontSize:"9px",fontWeight:700,color:spreadDiv>=1.5?"#f87171":"#fbbf24",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px"}}>{spreadDiv>=1.5?"⚠ DIVERGENCE — EXPLOIT":"💡 Market Insight"}</div><div style={{fontSize:"10px",color:"#ddd",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.5"}}>{ensemble.exploit}</div></div>}
        </>
      )}
    </Panel>
  );
}

// ── OL Degradation Panel ──────────────────────────────────────────────────────
function OLPanel({olData,loading,homeTeam,awayTeam}){
  if(!olData&&!loading) return null;
  const gc=s=>s>=75?"#4ade80":s>=55?"#f59e0b":s>=35?"#f87171":"#ef4444";
  const gl=s=>s>=75?"HEALTHY":s>=55?"DEGRADED":s>=35?"CRITICAL":"CRIPPLED";
  return(
    <Panel border="rgba(99,102,241,0.2)" bg="rgba(99,102,241,0.03)" mb="10px">
      <PanelTitle icon="🛡️" title="OL Degradation Index" tag={loading?"loading…":"live"} tagColor={loading?"#f59e0b":"#6366f1"}/>
      {loading&&<Skel cols={2}/>}
      {olData&&!loading&&(
        <>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"8px"}}>
            {[{team:awayTeam,color:tc(awayTeam),d:olData.away},{team:homeTeam,color:tc(homeTeam),d:olData.home}].map(({team,color,d})=>d?(
              <div key={team} style={{borderTop:`2px solid ${color}33`,paddingTop:"9px"}}>
                <div style={{fontSize:"10px",fontWeight:800,color,fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"8px"}}>{abb(team)}</div>
                <div style={{background:"rgba(255,255,255,0.04)",borderRadius:"7px",padding:"8px",textAlign:"center",marginBottom:"6px"}}>
                  <div style={{fontSize:"8px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px"}}>OL HEALTH</div>
                  <div style={{fontSize:"22px",fontWeight:900,color:gc(d.healthScore||75),fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{d.healthScore||"—"}</div>
                  <div style={{fontSize:"8px",fontWeight:700,color:gc(d.healthScore||75),fontFamily:"'Barlow Condensed',sans-serif"}}>{gl(d.healthScore||75)}</div>
                  <div style={{height:"4px",borderRadius:"2px",background:"rgba(255,255,255,0.06)",overflow:"hidden",marginTop:"4px"}}><div style={{width:`${d.healthScore||0}%`,height:"100%",background:gc(d.healthScore||75),borderRadius:"2px"}}/></div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"3px"}}>
                  {[["Out",d.startersOut,(d.startersOut||0)>1?"#f87171":(d.startersOut||0)>0?"#f59e0b":"#4ade80"],["Sack Trend",d.sackRateTrend,d.sackRateTrend==="up"?"#f87171":d.sackRateTrend==="down"?"#4ade80":"#f59e0b"],["PFF Grade",d.avgPFFGrade,(d.avgPFFGrade||65)>=70?"#4ade80":(d.avgPFFGrade||65)>=62?"#f59e0b":"#f87171"],["Run Blk",d.runBlockRank?(` #${d.runBlockRank}`):"—",(d.runBlockRank||16)<=10?"#4ade80":(d.runBlockRank||16)<=21?"#f59e0b":"#f87171"]].map(([lbl,v,c])=>(
                    <div key={lbl} style={{background:"rgba(255,255,255,0.03)",borderRadius:"3px",padding:"4px 5px",textAlign:"center"}}><div style={{fontSize:"7px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"1px"}}>{lbl}</div><div style={{fontSize:"11px",fontWeight:800,color:c,fontFamily:"'Barlow Condensed',sans-serif"}}>{v!=null?v:"—"}</div></div>
                  ))}
                </div>
                {d.keyInjuries?.length>0&&<div style={{marginTop:"5px"}}>{d.keyInjuries.map((inj,i)=><div key={i} style={{fontSize:"9px",color:"#f87171",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.4"}}>• {inj}</div>)}</div>}
              </div>
            ):null)}
          </div>
          {(olData.spreadImpact||olData.totalImpact)&&<div style={{display:"flex",gap:"6px"}}>{olData.spreadImpact&&<div style={{flex:1,background:"rgba(99,102,241,0.07)",border:"1px solid rgba(99,102,241,0.14)",borderRadius:"5px",padding:"6px 9px"}}><div style={{fontSize:"8px",color:"#818cf8",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,marginBottom:"2px"}}>SPREAD IMPACT</div><div style={{fontSize:"10px",color:"#c7d2fe",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.4"}}>{olData.spreadImpact}</div></div>}{olData.totalImpact&&<div style={{flex:1,background:"rgba(99,102,241,0.07)",border:"1px solid rgba(99,102,241,0.14)",borderRadius:"5px",padding:"6px 9px"}}><div style={{fontSize:"8px",color:"#818cf8",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,marginBottom:"2px"}}>TOTAL IMPACT</div><div style={{fontSize:"10px",color:"#c7d2fe",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.4"}}>{olData.totalImpact}</div></div>}</div>}
        </>
      )}
    </Panel>
  );
}

// ── Micro-Context Panel ───────────────────────────────────────────────────────
function MicroContextPanel({homeTeam,awayTeam,weather,microData,microLoading}){
  if(!homeTeam||!awayTeam) return null;
  const staticMods=getMicroModifiers(homeTeam,weather);
  const totalStaticAdj=staticMods.reduce((s,m)=>s+(m.spreadAdj||0),0);
  return(
    <Panel border="rgba(56,189,248,0.18)" bg="rgba(56,189,248,0.03)" mb="10px">
      <PanelTitle icon="🔬" title="Micro-Contextual Modifiers" tag={microLoading?"loading…":microData?"live":"static"} tagColor={microLoading?"#f59e0b":"#38bdf8"}/>
      {staticMods.length>0&&<div style={{marginBottom:"8px"}}>{staticMods.map((mod,i)=><div key={i} style={{display:"flex",alignItems:"flex-start",gap:"7px",padding:"5px 8px",background:"rgba(255,255,255,0.03)",borderRadius:"5px",marginBottom:"3px",border:`1px solid ${mod.color}1a`}}><div style={{width:"5px",height:"5px",borderRadius:"50%",background:mod.color,flexShrink:0,marginTop:"3px"}}/><div style={{fontSize:"10px",color:"#bbb",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.4",flex:1}}>{mod.impact}</div>{mod.spreadAdj!==0&&<Tag color={mod.color}>{mod.spreadAdj>0?"+":""}{mod.spreadAdj}</Tag>}</div>)}{totalStaticAdj!==0&&<div style={{textAlign:"right",fontSize:"8px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>Static adj: {totalStaticAdj>0?"+":""}{totalStaticAdj} pts to home spread</div>}</div>}
      {microLoading&&<Skel cols={2}/>}
      {microData&&!microLoading&&(
        <div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px",marginBottom:"8px"}}>
            {[["✈️ Travel",microData.travelPenalty,microData.travelColor||"#f59e0b"],["😴 Rest",microData.restEdge,microData.restColor||"#4ade80"],["📅 Week",microData.weekSpot,"#38bdf8"],["🎯 Desperation",microData.desperationIndex,"#f59e0b"],["🔊 Crowd",microData.crowdAdvantage,"#4ade80"],["🌱 Turf",microData.turfRisk,"#f87171"]].filter(([,v])=>v).map(([lbl,val,c])=>(
              <div key={lbl} style={{background:"rgba(255,255,255,0.03)",borderRadius:"5px",padding:"5px 7px"}}><div style={{fontSize:"8px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"1px"}}>{lbl}</div><div style={{fontSize:"9px",color:c,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:600,lineHeight:"1.3"}}>{val}</div></div>
            ))}
          </div>
          {microData.compositeAdj!=null&&<div style={{display:"flex",alignItems:"center",gap:"10px",padding:"7px 11px",background:"rgba(56,189,248,0.06)",border:"1px solid rgba(56,189,248,0.13)",borderRadius:"6px"}}><div style={{flex:1}}><div style={{fontSize:"8px",color:"#38bdf8",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,letterSpacing:"0.08em"}}>COMPOSITE MICRO ADJ</div><div style={{fontSize:"10px",color:"#7dd3fc",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"1px"}}>{microData.compositeNote}</div></div><div style={{fontSize:"18px",fontWeight:900,color:"#38bdf8",fontFamily:"'Barlow Condensed',sans-serif",flexShrink:0}}>{microData.compositeAdj>0?"+":""}{microData.compositeAdj}</div></div>}
        </div>
      )}
    </Panel>
  );
}
// ── Week Schedule ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
// AUTO-FETCH RESULTS ENGINE
// Stores every game you analyze as "pending". After games end, one button
// fetches all final scores, calculates ATS/total results, and auto-logs
// everything to the backtest — triggering the self-learning update.
// ═══════════════════════════════════════════════════════════════════════════

// ── Fetch final score for a single game ──────────────────────────────────
async function fetchFinalScore(awayTeam, homeTeam, gameDate) {
  const text = await callClaude({
    useSearch: true,
    maxTokens: 400,
    prompt: `Search for the final score of the NFL game: ${awayTeam} at ${homeTeam}${gameDate ? " on "+gameDate : ""} in the 2025-26 NFL season.
Return ONLY JSON (no markdown):
{"found":true,"awayScore":N,"homeScore":N,"awayTeam":"${awayTeam}","homeTeam":"${homeTeam}","gameDate":"e.g. Dec 8","finalStatus":"Final"}
If the game has not been played yet or score is unavailable: {"found":false,"awayTeam":"${awayTeam}","homeTeam":"${homeTeam}"}`
  });
  const m = text.match(/\{[\s\S]*?\}/);
  if (!m) return { found: false, awayTeam, homeTeam };
  return JSON.parse(m[0]);
}

// ── Auto-Results Panel ────────────────────────────────────────────────────
function AutoResultsPanel({ pendingGames, onFetchResults, onDismiss, fetching, fetchProgress }) {

export { CoachingPanel, CPOEPanel, PressurePanel, MarketEnsemblePanel, OLPanel, MicroContextPanel };
