import { useState, useEffect } from "react";
import { Panel, PanelTitle, Tag, Spinner } from "../components/UIKit.jsx";

// LogitPanel, GarbageTimePanel, LeveragePanel
function LogitPanel({lines,homeTeam,awayTeam,modelWinProb}){
  if(!lines||!homeTeam||!awayTeam) return null;
  const {homeWin,awayWin}=spreadToWinProb(lines.spread,lines.favTeam,homeTeam);
  const modelHome=modelWinProb||homeWin;
  const divergence=Math.abs(modelHome-homeWin);
  const homeEdge=modelHome>homeWin?homeTeam:awayTeam;
  const edgeSize=divergence.toFixed(1);
  const hasSigEdge=divergence>=3;
  return(
    <Panel border={hasSigEdge?"rgba(167,139,250,0.25)":"rgba(255,255,255,0.07)"} bg={hasSigEdge?"rgba(167,139,250,0.04)":"rgba(255,255,255,0.03)"} mb="10px">
      <PanelTitle icon="📐" title="Logit Win Probability Map" tag={hasSigEdge?"EDGE DETECTED":undefined} tagColor="#a78bfa"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"7px",marginBottom:"10px"}}>
        <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"7px",padding:"10px 8px",textAlign:"center"}}>
          <div style={{fontSize:"8px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px",fontWeight:700,letterSpacing:"0.1em"}}>MARKET IMPLIED</div>
          <div style={{fontSize:"11px",color:"#aaa",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px"}}>{abb(awayTeam)} / {abb(homeTeam)}</div>
          <div style={{fontSize:"15px",fontWeight:900,color:"#c084fc",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{awayWin}% / {homeWin}%</div>
          <div style={{fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"3px"}}>from spread {lines.favTeam?abb(lines.favTeam):""} -{lines.spread}</div>
        </div>
        <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"7px",padding:"10px 8px",textAlign:"center"}}>
          <div style={{fontSize:"8px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px",fontWeight:700,letterSpacing:"0.1em"}}>MODEL OUTPUT</div>
          <div style={{fontSize:"11px",color:"#aaa",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px"}}>{abb(awayTeam)} / {abb(homeTeam)}</div>
          <div style={{fontSize:"15px",fontWeight:900,color:"#4ade80",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{100-modelHome}% / {modelHome}%</div>
          <div style={{fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"3px"}}>from full signal ensemble</div>
        </div>
        <div style={{background:hasSigEdge?"rgba(167,139,250,0.08)":"rgba(255,255,255,0.04)",border:`1px solid ${hasSigEdge?"rgba(167,139,250,0.22)":"rgba(255,255,255,0.06)"}`,borderRadius:"7px",padding:"10px 8px",textAlign:"center"}}>
          <div style={{fontSize:"8px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px",fontWeight:700,letterSpacing:"0.1em"}}>DIVERGENCE</div>
          <div style={{fontSize:"20px",fontWeight:900,color:hasSigEdge?"#a78bfa":"#555",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{edgeSize}%</div>
          <div style={{fontSize:"7px",fontWeight:700,color:hasSigEdge?"#a78bfa":"#444",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"3px"}}>{hasSigEdge?`MODEL FAVORS ${abb(homeEdge)}`:"NO SIGNIFICANT EDGE"}</div>
        </div>
      </div>
      {hasSigEdge&&(
        <div style={{background:"rgba(167,139,250,0.06)",border:"1px solid rgba(167,139,250,0.14)",borderRadius:"6px",padding:"8px 11px"}}>
          <div style={{fontSize:"9px",fontWeight:700,color:"#a78bfa",fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.1em",marginBottom:"3px"}}>📐 LOGIT EDGE SIGNAL</div>
          <div style={{fontSize:"10px",color:"#c4b5fd",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.5"}}>
            Model assigns {abb(homeEdge)} a {edgeSize}% higher win probability than the market implies from the spread. When model-vs-market divergence exceeds 3%, it historically correlates with a {(parseFloat(edgeSize)*0.8).toFixed(1)}% edge on the moneyline. Favor {abb(homeEdge)}.
          </div>
        </div>
      )}
      <div style={{marginTop:"7px",fontSize:"8px",color:"#1e1e28",fontFamily:"'Barlow Condensed',sans-serif"}}>Logit transform: σ(spread × 0.15) mapped to win probability · Divergence = model vs market mismatch</div>
    </Panel>
  );
}

// ── Garbage Time Filter Panel ─────────────────────────────────────────────────
function GarbageTimePanel({garbageData,loading,homeTeam,awayTeam}){
  if(!garbageData&&!loading) return null;
  return(
    <Panel border="rgba(251,146,60,0.18)" bg="rgba(251,146,60,0.03)" mb="10px">
      <PanelTitle icon="🗑️" title="Garbage-Time Signal Filter" tag={loading?"loading…":garbageData?.contaminated?"STATS SANITIZED":"CLEAN"} tagColor={loading?"#f59e0b":garbageData?.contaminated?"#fb923c":"#4ade80"}/>
      {loading&&<Skel cols={2}/>}
      {garbageData&&!loading&&(
        <>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"8px"}}>
            {[{team:awayTeam,d:garbageData.away},{team:homeTeam,d:garbageData.home}].map(({team,d})=>d?(
              <div key={team} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"7px",padding:"9px 10px"}}>
                <div style={{fontSize:"9px",fontWeight:800,color:tc(team),fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"6px"}}>{abb(team)}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"3px"}}>
                  {[
                    ["Raw PPG",d.rawPPG,"#aaa"],
                    ["Garbage-Adj PPG",d.adjustedPPG,d.adjustedPPG<d.rawPPG?"#f59e0b":"#4ade80"],
                    ["Garbage Pts",d.garbagePoints,"#f87171"],
                    ["Real PPG",d.adjustedPPG,d.contaminated?"#f59e0b":"#4ade80"],
                  ].map(([lbl,v,c])=>(
                    <div key={lbl} style={{background:"rgba(255,255,255,0.03)",borderRadius:"4px",padding:"4px 5px",textAlign:"center"}}>
                      <div style={{fontSize:"7px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"1px",lineHeight:"1.2"}}>{lbl}</div>
                      <div style={{fontSize:"12px",fontWeight:800,color:c,fontFamily:"'Barlow Condensed',sans-serif"}}>{v!=null?v:"—"}</div>
                    </div>
                  ))}
                </div>
                {d.contaminated&&<div style={{marginTop:"5px",fontSize:"9px",color:"#fb923c",fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",lineHeight:"1.4"}}>⚠ Stats inflated by garbage time</div>}
                {d.note&&<div style={{marginTop:"3px",fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",lineHeight:"1.4"}}>{d.note}</div>}
              </div>
            ):null)}
          </div>
          {garbageData.spreadImpact&&(
            <div style={{background:"rgba(251,146,60,0.06)",border:"1px solid rgba(251,146,60,0.14)",borderRadius:"6px",padding:"8px 11px"}}>
              <div style={{fontSize:"9px",fontWeight:700,color:"#fb923c",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px"}}>🗑️ Sanitized Spread Impact</div>
              <div style={{fontSize:"10px",color:"#fed7aa",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.5"}}>{garbageData.spreadImpact}</div>
            </div>
          )}
        </>
      )}
    </Panel>
  );
}

// ── Leverage Regression Panel ─────────────────────────────────────────────────
function LeveragePanel({leverageData,loading,homeTeam,awayTeam}){
  if(!leverageData&&!loading) return null;
  const getLuckColor=luck=>luck>2?"#f87171":luck<-2?"#4ade80":"#f59e0b";
  const getLuckLabel=luck=>luck>3?"VERY LUCKY":luck>1?"LUCKY":luck<-3?"VERY UNLUCKY":luck<-1?"UNLUCKY":"NEUTRAL";
  return(
    <Panel border="rgba(99,102,241,0.2)" bg="rgba(99,102,241,0.03)" mb="10px">
      <PanelTitle icon="🎲" title="Leverage Regression (Luck Filter)" tag={loading?"loading…":"live"} tagColor={loading?"#f59e0b":"#6366f1"}/>
      {loading&&<Skel cols={2}/>}
      {leverageData&&!loading&&(
        <>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"8px"}}>
            {[{team:awayTeam,d:leverageData.away},{team:homeTeam,d:leverageData.home}].map(({team,d})=>d?(
              <div key={team} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"7px",padding:"9px 10px"}}>
                <div style={{fontSize:"9px",fontWeight:800,color:tc(team),fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"7px",display:"flex",alignItems:"center",gap:"5px"}}>
                  {abb(team)}
                  <Tag color={getLuckColor(d.luckScore||0)}>{getLuckLabel(d.luckScore||0)}</Tag>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"3px",marginBottom:"5px"}}>
                  {[
                    ["Turnover Luck",d.turnoverLuck,d.turnoverLuck>1?"#f87171":d.turnoverLuck<-1?"#4ade80":"#f59e0b"],
                    ["Fumble Rec%",d.fumbleRecovery,d.fumbleRecovery>55?"#f87171":d.fumbleRecovery<45?"#4ade80":"#f59e0b"],
                    ["EPA/Drive",d.epaDrive,d.epaDrive>0.3?"#4ade80":d.epaDrive<-0.1?"#f87171":"#f59e0b"],
                    ["Regressed W-L",d.regressedRecord,"#c084fc"],
                  ].map(([lbl,v,c])=>(
                    <div key={lbl} style={{background:"rgba(255,255,255,0.03)",borderRadius:"4px",padding:"4px 5px",textAlign:"center"}}>
                      <div style={{fontSize:"7px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"1px",lineHeight:"1.2"}}>{lbl}</div>
                      <div style={{fontSize:"12px",fontWeight:800,color:c,fontFamily:"'Barlow Condensed',sans-serif"}}>{v!=null?v:"—"}</div>
                    </div>
                  ))}
                </div>
                {d.note&&<div style={{fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",lineHeight:"1.4"}}>{d.note}</div>}
              </div>
            ):null)}
          </div>
          {leverageData.regressionVerdict&&(
            <div style={{background:"rgba(99,102,241,0.07)",border:"1px solid rgba(99,102,241,0.16)",borderRadius:"6px",padding:"8px 11px"}}>
              <div style={{fontSize:"9px",fontWeight:700,color:"#818cf8",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px"}}>🎲 Regression Verdict</div>
              <div style={{fontSize:"10px",color:"#c7d2fe",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.5"}}>{leverageData.regressionVerdict}</div>
            </div>
          )}
        </>
      )}
    </Panel>
  );
}

// ── Coaching Aggressiveness Index Panel ───────────────────────────────────────
function CoachingPanel({coachData,loading,homeTeam,awayTeam}){
  if(!coachData&&!loading) return null;
  const getAggrColor=idx=>idx>=75?"#4ade80":idx>=55?"#f59e0b":"#f87171";
  const getAggrLabel=idx=>idx>=80?"AGGRESSIVE":idx>=60?"ABOVE AVG":idx>=40?"AVERAGE":idx>=25?"CONSERVATIVE":"ULTRA CONSERVATIVE";
  return(
    <Panel border="rgba(20,184,166,0.2)" bg="rgba(20,184,166,0.03)" mb="10px">
      <PanelTitle icon="🧠" title="Coaching Aggressiveness Index" tag={loading?"loading…":"live"} tagColor={loading?"#f59e0b":"#14b8a6"}/>
      {loading&&<Skel cols={2}/>}
      {coachData&&!loading&&(
        <>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"8px"}}>
            {[{team:awayTeam,d:coachData.away},{team:homeTeam,d:coachData.home}].map(({team,d})=>d?(
              <div key={team} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"7px",padding:"9px 10px"}}>
                <div style={{fontSize:"9px",fontWeight:800,color:tc(team),fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"5px"}}>{d.coachName||abb(team)}</div>
                {/* Aggressiveness bar */}
                <div style={{marginBottom:"7px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:"3px"}}>
                    <span style={{fontSize:"8px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>AGGRESSIVENESS INDEX</span>
                    <span style={{fontSize:"10px",fontWeight:800,color:getAggrColor(d.aggressivenessIndex||50),fontFamily:"'Barlow Condensed',sans-serif"}}>{d.aggressivenessIndex||"—"}</span>
                  </div>
                  <div style={{height:"5px",borderRadius:"3px",background:"rgba(255,255,255,0.06)",overflow:"hidden"}}>
                    <div style={{width:`${d.aggressivenessIndex||0}%`,height:"100%",background:getAggrColor(d.aggressivenessIndex||50),transition:"width 0.8s ease",borderRadius:"3px"}}/>
                  </div>
                  <div style={{fontSize:"7px",color:getAggrColor(d.aggressivenessIndex||50),fontFamily:"'Barlow Condensed',sans-serif",marginTop:"2px",fontWeight:700}}>{getAggrLabel(d.aggressivenessIndex||50)}</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"3px"}}>
                  {[
                    ["4th Down Go%",d.fourthDownGo,d.fourthDownGo>60?"#4ade80":d.fourthDownGo>40?"#f59e0b":"#f87171"],
                    ["2-Pt Rate",d.twoPtRate,d.twoPtRate>20?"#4ade80":d.twoPtRate>10?"#f59e0b":"#f87171"],
                    ["Fake Punt/FG",d.trickPlayRate,d.trickPlayRate>5?"#4ade80":"#f59e0b"],
                    ["Clock Mgmt",d.clockMgmt,"#c084fc"],
                  ].map(([lbl,v,c])=>(
                    <div key={lbl} style={{background:"rgba(255,255,255,0.03)",borderRadius:"4px",padding:"4px 5px",textAlign:"center"}}>
                      <div style={{fontSize:"7px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"1px",lineHeight:"1.2"}}>{lbl}</div>
                      <div style={{fontSize:"11px",fontWeight:800,color:c,fontFamily:"'Barlow Condensed',sans-serif"}}>{v!=null?(typeof v==="number"?`${v}%`:v):"—"}</div>
                    </div>
                  ))}
                </div>
                {d.note&&<div style={{marginTop:"5px",fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",lineHeight:"1.4"}}>{d.note}</div>}
              </div>
            ):null)}
          </div>
          {coachData.matchupNote&&(
            <div style={{background:"rgba(20,184,166,0.06)",border:"1px solid rgba(20,184,166,0.14)",borderRadius:"6px",padding:"8px 11px"}}>
              <div style={{fontSize:"9px",fontWeight:700,color:"#14b8a6",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px"}}>🧠 Coaching Matchup Edge</div>
              <div style={{fontSize:"10px",color:"#99f6e4",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.5"}}>{coachData.matchupNote}</div>
            </div>
          )}
          {coachData.spreadImpact&&<div style={{marginTop:"6px",display:"flex",gap:"7px",alignItems:"center"}}><div style={{fontSize:"8px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>COACHING SPREAD ADJ:</div><Tag color="#14b8a6">{coachData.spreadImpact>0?"+":""}{coachData.spreadImpact} pts</Tag><div style={{fontSize:"9px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",flex:1}}>{coachData.spreadAdjNote}</div></div>}
        </>
      )}
    </Panel>
  );
}

// ── CPOE Panel ────────────────────────────────────────────────────────────────
function CPOEPanel({cpoeData,loading,homeTeam,awayTeam}){
  if(!cpoeData&&!loading) return null;

export { LogitPanel, GarbageTimePanel, LeveragePanel };
