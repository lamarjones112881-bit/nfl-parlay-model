import { Panel, PanelTitle, Tag, Spinner } from "../components/UIKit.jsx";

// SplitsPanel, RefPanel, PrimeTimePanel, MultiSeasonPanel, SituationalATSPanel
function SplitsPanel({ splitsData, loading, homeTeam, awayTeam }) {
  if (!splitsData && !loading) return null;
  return (
    <Panel border="rgba(56,189,248,0.18)" bg="rgba(56,189,248,0.03)" mb="10px">
      <PanelTitle icon="🏠" title="Home / Away Performance Splits" tag={loading?"loading…":"live"} tagColor={loading?"#f59e0b":"#38bdf8"}/>
      {loading && <Skel cols={2}/>}
      {splitsData && !loading && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
          {[{team:awayTeam,color:tc(awayTeam),d:splitsData.away,label:"Away (visiting)"},{team:homeTeam,color:tc(homeTeam),d:splitsData.home,label:"Home (hosting)"}].map(({team,color,d,label})=>d?(
            <div key={team} style={{borderTop:`2px solid ${color}33`,paddingTop:"9px"}}>
              <div style={{fontSize:"9px",fontWeight:800,color,fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"6px"}}>{abb(team)} <span style={{fontSize:"7px",color:"#444",fontWeight:400}}>{label}</span></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px"}}>
                {[
                  ["Home W-L",d.homeRecord,"#4ade80"],
                  ["Home ATS",d.homeATS,parseFloat((d.homeATS||"0-0").split("-")[0])/(parseFloat((d.homeATS||"1-1").split("-")[0])+parseFloat((d.homeATS||"1-1").split("-")[1])||1)>0.5?"#4ade80":"#f87171"],
                  ["Away W-L",d.awayRecord,"#f59e0b"],
                  ["Away ATS",d.awayATS,parseFloat((d.awayATS||"0-0").split("-")[0])/(parseFloat((d.awayATS||"1-1").split("-")[0])+parseFloat((d.awayATS||"1-1").split("-")[1])||1)>0.5?"#4ade80":"#f87171"],
                  ["Home PPG",d.homePPG,"#4ade80"],
                  ["Away PPG",d.awayPPG,"#f59e0b"],
                ].map(([lbl,v,c])=>(
                  <div key={lbl} style={{background:"rgba(255,255,255,0.04)",borderRadius:"5px",padding:"5px 6px",textAlign:"center"}}>
                    <div style={{fontSize:"7px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px"}}>{lbl}</div>
                    <div style={{fontSize:"11px",fontWeight:800,color:c,fontFamily:"'Barlow Condensed',sans-serif"}}>{v||"—"}</div>
                  </div>
                ))}
              </div>
              {d.splitNote && <div style={{fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"5px",fontStyle:"italic",lineHeight:"1.4"}}>{d.splitNote}</div>}
            </div>
          ):null)}
        </div>
      )}
      {splitsData?.spreadImpact && <div style={{marginTop:"8px",background:"rgba(56,189,248,0.05)",border:"1px solid rgba(56,189,248,0.12)",borderRadius:"5px",padding:"7px 10px",fontSize:"10px",color:"#7dd3fc",fontFamily:"'Barlow Condensed',sans-serif"}}>{splitsData.spreadImpact}</div>}
    </Panel>
  );
}

// ── Referee Tendency Panel ────────────────────────────────────────────────────
function RefPanel({ refData, loading }) {
  if (!refData && !loading) return null;
  return (
    <Panel border="rgba(168,85,247,0.18)" bg="rgba(168,85,247,0.03)" mb="10px">
      <PanelTitle icon="🦺" title="Referee Crew Profile" tag={loading?"loading…":refData?.crewName?"live":"fetched"} tagColor={loading?"#f59e0b":"#a855f7"}/>
      {loading && <Skel cols={3}/>}
      {refData && !loading && (
        <>
          {refData.crewName && (
            <div style={{marginBottom:"10px",padding:"7px 10px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"6px"}}>
              <div style={{fontSize:"8px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px"}}>CREW / REFEREE</div>
              <div style={{fontSize:"14px",fontWeight:800,color:"#a855f7",fontFamily:"'Barlow Condensed',sans-serif"}}>{refData.crewName}</div>
            </div>
          )}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"6px",marginBottom:"8px"}}>
            {[
              ["Avg Total/G",refData.avgTotal,parseFloat(refData.avgTotal||44)>46?"#4ade80":parseFloat(refData.avgTotal||44)<42?"#f87171":"#f59e0b","vs league avg 44.5"],
              ["Penalties/G",refData.penaltiesPerGame,parseFloat(refData.penaltiesPerGame||6)>8?"#f87171":parseFloat(refData.penaltiesPerGame||6)<5?"#4ade80":"#f59e0b","league avg ~6.5/g"],
              ["Over Rate",refData.overRate?`${refData.overRate}%`:null,parseFloat(refData.overRate||50)>54?"#4ade80":parseFloat(refData.overRate||50)<46?"#f87171":"#aaa","past 3 seasons"],
              ["Yards/G",refData.yardsPerGame,parseFloat(refData.yardsPerGame||340)>360?"#4ade80":parseFloat(refData.yardsPerGame||340)<320?"#f87171":"#aaa","total yds/game"],
              ["Home W-ATS",refData.homeTeamATS,parseFloat((refData.homeTeamATS||"50%"))>53?"#4ade80":"#aaa","home team covers"],
              ["Crew Rank",refData.crewRank?`#${refData.crewRank}`:null,"#c084fc","of 17 crews"],
            ].filter(([,v])=>v!=null).map(([lbl,v,c,sub])=>(
              <div key={lbl} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"6px",padding:"8px 7px",textAlign:"center"}}>
                <div style={{fontSize:"7px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px"}}>{lbl}</div>
                <div style={{fontSize:"14px",fontWeight:900,color:c,fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{v}</div>
                <div style={{fontSize:"6px",color:"#2a2a2a",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"2px"}}>{sub}</div>
              </div>
            ))}
          </div>
          {refData.totalImpact && (
            <div style={{background:"rgba(168,85,247,0.06)",border:"1px solid rgba(168,85,247,0.14)",borderRadius:"6px",padding:"8px 10px"}}>
              <div style={{fontSize:"9px",fontWeight:700,color:"#a855f7",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px",textTransform:"uppercase",letterSpacing:"0.08em"}}>🦺 Total Impact</div>
              <div style={{fontSize:"10px",color:"#d8b4fe",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.5"}}>{refData.totalImpact}</div>
            </div>
          )}
        </>
      )}
      <div style={{marginTop:"7px",fontSize:"8px",color:"#1a1a2a",fontFamily:"'Barlow Condensed',sans-serif"}}>Crews announced Wednesday · Refresh mid-week for accuracy</div>
    </Panel>
  );
}

// ── Prime Time Performance Panel ─────────────────────────────────────────────
function PrimeTimePanel({ primeData, loading, homeTeam, awayTeam }) {
  if (!primeData && !loading) return null;
  return (
    <Panel border="rgba(236,72,153,0.18)" bg="rgba(236,72,153,0.03)" mb="10px">
      <PanelTitle icon="🌙" title="Prime Time Performance" tag={loading?"loading…":"live"} tagColor={loading?"#f59e0b":"#ec4899"}/>
      {loading && <Skel cols={2}/>}
      {primeData && !loading && (
        <>
          {primeData.isPrimeTime && (
            <div style={{marginBottom:"9px",display:"flex",gap:"5px"}}>
              <Tag color="#ec4899">{primeData.gameType||"Prime Time"}</Tag>
              {primeData.network && <Tag color="#a78bfa">{primeData.network}</Tag>}
            </div>
          )}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
            {[{team:awayTeam,color:tc(awayTeam),d:primeData.away},{team:homeTeam,color:tc(homeTeam),d:primeData.home}].map(({team,color,d})=>d?(
              <div key={team} style={{borderTop:`2px solid ${color}33`,paddingTop:"9px"}}>
                <div style={{fontSize:"9px",fontWeight:800,color,fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"6px"}}>{abb(team)}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"3px"}}>
                  {[
                    ["PT Record",d.primeRecord,d.primeRecord?.split("-")[0]>d.primeRecord?.split("-")[1]?"#4ade80":"#f87171"],
                    ["PT ATS",d.primeATS,parseFloat((d.primeATS||"0-0").split("-")[0])/(parseFloat((d.primeATS||"1-1").split("-")[0])+parseFloat((d.primeATS||"1-1").split("-")[1])||1)>0.5?"#4ade80":"#f87171"],
                    ["Avg Pts PT",d.avgPtsPT,"#c084fc"],
                    ["Last 5 PT",d.last5PT,d.last5PT?.includes("W")?"#4ade80":"#f87171"],
                  ].map(([lbl,v,c])=>(
                    <div key={lbl} style={{background:"rgba(255,255,255,0.04)",borderRadius:"4px",padding:"4px 5px",textAlign:"center"}}>
                      <div style={{fontSize:"7px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"1px"}}>{lbl}</div>
                      <div style={{fontSize:"11px",fontWeight:800,color:c,fontFamily:"'Barlow Condensed',sans-serif"}}>{v||"—"}</div>
                    </div>
                  ))}
                </div>
                {d.note && <div style={{fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"4px",fontStyle:"italic"}}>{d.note}</div>}
              </div>
            ):null)}
          </div>
          {primeData.atsNote && <div style={{marginTop:"8px",background:"rgba(236,72,153,0.05)",border:"1px solid rgba(236,72,153,0.12)",borderRadius:"5px",padding:"7px 10px",fontSize:"10px",color:"#fbcfe8",fontFamily:"'Barlow Condensed',sans-serif"}}>{primeData.atsNote}</div>}
        </>
      )}
    </Panel>
  );
}

// ── Multi-Season Regression Baseline Panel ────────────────────────────────────
function MultiSeasonPanel({ multiData, loading, homeTeam, awayTeam }) {
  if (!multiData && !loading) return null;
  return (
    <Panel border="rgba(99,102,241,0.18)" bg="rgba(99,102,241,0.03)" mb="10px">
      <PanelTitle icon="📅" title="Multi-Season Regression Baseline" tag={loading?"loading…":"3-season"} tagColor={loading?"#f59e0b":"#6366f1"}/>
      {loading && <Skel cols={2}/>}
      {multiData && !loading && (
        <>
          <div style={{marginBottom:"8px",fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.5"}}>
            Weighted 3-season true talent baseline: recent season 50% weight, prior 30%, 2 seasons ago 20%. More stable than single-season sample — reduces impact of hot/cold streaks.
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
            {[{team:awayTeam,color:tc(awayTeam),d:multiData.away},{team:homeTeam,color:tc(homeTeam),d:multiData.home}].map(({team,color,d})=>d?(
              <div key={team} style={{borderTop:`2px solid ${color}33`,paddingTop:"9px"}}>
                <div style={{fontSize:"9px",fontWeight:800,color,fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"6px"}}>{abb(team)}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"3px",marginBottom:"5px"}}>
                  {[
                    ["Weighted W%",d.weightedWinPct?`${d.weightedWinPct}%`:null,parseFloat(d.weightedWinPct||50)>55?"#4ade80":parseFloat(d.weightedWinPct||50)<45?"#f87171":"#f59e0b"],
                    ["Weighted ATS%",d.weightedAtsPct?`${d.weightedAtsPct}%`:null,parseFloat(d.weightedAtsPct||50)>53?"#4ade80":parseFloat(d.weightedAtsPct||50)<47?"#f87171":"#aaa"],
                    ["3-Yr Avg PPG",d.avgPPG3yr,"#c084fc"],
                    ["3-Yr Avg PAPG",d.avgPAPG3yr,"#f59e0b"],
                    ["True Talent Rank",d.trueTalentRank?`#${d.trueTalentRank}`:null,(d.trueTalentRank||16)<=10?"#4ade80":(d.trueTalentRank||16)<=21?"#f59e0b":"#f87171"],
                    ["Trend",d.trend,d.trend==="improving"?"#4ade80":d.trend==="declining"?"#f87171":"#f59e0b"],
                  ].filter(([,v])=>v!=null).map(([lbl,v,c])=>(
                    <div key={lbl} style={{background:"rgba(255,255,255,0.04)",borderRadius:"4px",padding:"4px 5px",textAlign:"center"}}>
                      <div style={{fontSize:"7px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"1px"}}>{lbl}</div>
                      <div style={{fontSize:"11px",fontWeight:800,color:c,fontFamily:"'Barlow Condensed',sans-serif"}}>{v}</div>
                    </div>
                  ))}
                </div>
                {d.note && <div style={{fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic"}}>{d.note}</div>}
              </div>
            ):null)}
          </div>
          {multiData.baselineNote && <div style={{marginTop:"8px",background:"rgba(99,102,241,0.06)",border:"1px solid rgba(99,102,241,0.14)",borderRadius:"5px",padding:"7px 10px",fontSize:"10px",color:"#c7d2fe",fontFamily:"'Barlow Condensed',sans-serif"}}>{multiData.baselineNote}</div>}
        </>
      )}
    </Panel>
  );
}

// ── Situational ATS Panel ─────────────────────────────────────────────────────
function SituationalATSPanel({ situationalData, loading, homeTeam, awayTeam }) {
  if (!situationalData && !loading) return null;
  return (
    <Panel border="rgba(234,179,8,0.18)" bg="rgba(234,179,8,0.02)" mb="10px">
      <PanelTitle icon="📋" title="Situational ATS Database" tag={loading?"loading…":"live"} tagColor={loading?"#f59e0b":"#eab308"}/>
      {loading && <Skel cols={2}/>}
      {situationalData && !loading && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
          {[{team:awayTeam,color:tc(awayTeam),d:situationalData.away},{team:homeTeam,color:tc(homeTeam),d:situationalData.home}].map(({team,color,d})=>d?(
            <div key={team} style={{borderTop:`2px solid ${color}33`,paddingTop:"9px"}}>
              <div style={{fontSize:"9px",fontWeight:800,color,fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"7px"}}>{abb(team)} Situational ATS</div>
              <div style={{display:"flex",flexDirection:"column",gap:"3px"}}>
                {[
                  ["Off Bye Week",d.offByeATS,d.offByeRecord],
                  ["As Home Dog",d.homeDogATS,d.homeDogRecord],
                  ["Div Games",d.divisionalATS,d.divisionalRecord],
                  ["Short Rest (<6 days)",d.shortRestATS,d.shortRestRecord],
                  ["After SU Loss",d.afterLossATS,d.afterLossRecord],
                  ["Prime Time",d.primeTimeATS,d.primeTimeRecord],
                  ["Cold Weather",d.coldWeatherATS,d.coldWeatherRecord],
                ].filter(([,v])=>v).map(([lbl,pct,rec])=>{
                  const pctNum = parseFloat(pct||"50");
                  const pctColor = pctNum >= 60 ? "#4ade80" : pctNum >= 53 ? "#86efac" : pctNum <= 40 ? "#f87171" : pctNum <= 47 ? "#fca5a5" : "#888";
                  return (
                    <div key={lbl} style={{display:"flex",alignItems:"center",gap:"6px",padding:"4px 6px",background:"rgba(255,255,255,0.03)",borderRadius:"4px"}}>
                      <div style={{fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",flex:1}}>{lbl}</div>
                      {rec && <div style={{fontSize:"9px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>{rec}</div>}
                      <div style={{fontSize:"11px",fontWeight:800,color:pctColor,fontFamily:"'Barlow Condensed',sans-serif",flexShrink:0,minWidth:"36px",textAlign:"right"}}>{pct}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ):null)}
        </div>
      )}
    </Panel>
  );
}

// ── Season-Long Analytics Dashboard ──────────────────────────────────────────
function SeasonDashboard({ backtestHistory, clvHistory, parlayHistory, signalWeights }) {

export { SplitsPanel, RefPanel, PrimeTimePanel, MultiSeasonPanel, SituationalATSPanel };
