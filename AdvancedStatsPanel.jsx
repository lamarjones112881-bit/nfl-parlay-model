import { useState } from "react";
import { calcAdvancedTotalAdj, calcTurnoverLuck, epaGrade } from "../utils/advancedStats.js";
import { Panel, PanelTitle, Tag, Spinner } from "../components/UIKit.jsx";

function AdvancedStatsPanel({ advancedData, advancedStatus, homeTeam, awayTeam, lines }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab]   = useState("rz");
  if (!advancedData && advancedStatus !== "loading") return null;

  const home = advancedData?.home;
  const away = advancedData?.away;
  const totalAdj  = home && away ? calcAdvancedTotalAdj(home, away) : null;
  const toSummary = home && away ? calcTurnoverLuck(home, away) : null;

  const statusColor = advancedStatus === "success" ? "#4ade80"
    : advancedStatus === "loading" ? "#f59e0b" : "#f87171";

  return (
    <Panel border="rgba(16,185,129,0.2)" bg="rgba(16,185,129,0.02)" mb="10px">
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <span style={{fontSize:"11px"}}>⚡</span>
          <span style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#10b981",fontFamily:"'Barlow Condensed',sans-serif"}}>Advanced Efficiency</span>
          {advancedStatus==="loading"&&<Tag color="#f59e0b">loading…</Tag>}
          {totalAdj&&Math.abs(totalAdj.total)>=0.5&&(
            <Tag color={totalAdj.total>0?"#4ade80":"#f87171"}>
              {totalAdj.total>0?"+":""}{totalAdj.total} total
            </Tag>
          )}
          {advancedData&&<Tag color="#10b981">5 signals</Tag>}
        </div>
        <span style={{color:"#333",fontSize:"10px"}}>{open?"▲":"▼"}</span>
      </div>

      {open && advancedData && (
        <div style={{marginTop:"12px"}}>
          {/* Tabs */}
          <div style={{display:"flex",gap:"4px",marginBottom:"11px",flexWrap:"wrap"}}>
            {[["rz","🏟️ Red Zone"],["third","📋 3rd Down"],["pace","⏱️ Pace"],["to","🎲 TO Luck"],["epa","📈 EPA"]].map(([k,l])=>(
              <button key={k} onClick={()=>setTab(k)} style={{padding:"5px 10px",borderRadius:"5px",border:"1px solid "+(tab===k?"rgba(16,185,129,0.4)":"rgba(255,255,255,0.07)"),background:tab===k?"rgba(16,185,129,0.1)":"transparent",color:tab===k?"#10b981":"#555",fontSize:"9px",fontWeight:700,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif"}}>{l}</button>
            ))}
          </div>

          {/* ── RED ZONE TAB ── */}
          {tab==="rz"&&(
            <div>
              <div style={{fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"9px",lineHeight:"1.5"}}>
                Red zone TD% measures scoring quality — teams converting trips to TDs vs settling for FGs. League average: 63% TD rate. Each 10% gap ≈ 0.6 pts/game vs a league-average red zone defense.
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"10px"}}>
                {[{team:awayTeam,d:away},{team:homeTeam,d:home}].map(({team,d})=>{
                  const offGrade = (d?.rzTdPct||63)>=70?"#4ade80":(d?.rzTdPct||63)>=55?"#f59e0b":"#f87171";
                  const defGrade = (d?.rzAllowedPct||63)<=55?"#4ade80":(d?.rzAllowedPct||63)<=70?"#f59e0b":"#f87171";
                  return(
                    <div key={team} style={{borderTop:"2px solid "+tc(team)+"33",paddingTop:"8px"}}>
                      <div style={{fontSize:"9px",fontWeight:800,color:tc(team),fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"7px"}}>{abb(team)}</div>
                      {[["Off RZ TD%",(d?.rzTdPct||"—")+"%",offGrade,"League avg 63%"],["Def RZ TD%",(d?.rzAllowedPct||"—")+"%",defGrade,"Lower = better"],["RZ Trips/G",d?.rzTripsPerGame||"—","#888","Opportunities"]].map(([l,v,c,s])=>(
                        <div key={l} style={{display:"flex",alignItems:"center",gap:"6px",padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                          <span style={{fontSize:"8px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",flex:1}}>{l}</span>
                          <span style={{fontSize:"12px",fontWeight:800,color:c,fontFamily:"'Barlow Condensed',sans-serif"}}>{v}</span>
                          <span style={{fontSize:"7px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif"}}>{s}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
              {totalAdj&&<div style={{background:"rgba(16,185,129,0.06)",border:"1px solid rgba(16,185,129,0.15)",borderRadius:"5px",padding:"7px 10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:"9px",color:"#6ee7b7",fontFamily:"'Barlow Condensed',sans-serif"}}>Red Zone total adjustment</span>
                <span style={{fontSize:"14px",fontWeight:900,color:totalAdj.rz>=0?"#4ade80":"#f87171",fontFamily:"'Barlow Condensed',sans-serif"}}>{totalAdj.rz>=0?"+":""}{totalAdj.rz} pts</span>
              </div>}
            </div>
          )}

          {/* ── THIRD DOWN TAB ── */}
          {tab==="third"&&(
            <div>
              <div style={{fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"9px",lineHeight:"1.5"}}>
                Third down conversion sustains drives and controls tempo. League average: 39% offense, 39% defense allowed. Each 5% above average ≈ 1.2 pts/game additional.
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"10px"}}>
                {[{team:awayTeam,d:away},{team:homeTeam,d:home}].map(({team,d})=>(
                  <div key={team} style={{borderTop:"2px solid "+tc(team)+"33",paddingTop:"8px"}}>
                    <div style={{fontSize:"9px",fontWeight:800,color:tc(team),fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"7px"}}>{abb(team)}</div>
                    {[["Off 3rd%",(d?.thirdDownPct||"—")+"%",(d?.thirdDownPct||39)>=44?"#4ade80":(d?.thirdDownPct||39)>=37?"#f59e0b":"#f87171"],["Def 3rd Allowed",(d?.thirdDownAllowed||"—")+"%",(d?.thirdDownAllowed||39)<=35?"#4ade80":(d?.thirdDownAllowed||39)<=42?"#f59e0b":"#f87171"]].map(([l,v,c])=>(
                      <div key={l} style={{display:"flex",alignItems:"center",gap:"6px",padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                        <span style={{fontSize:"8px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",flex:1}}>{l}</span>
                        <span style={{fontSize:"12px",fontWeight:800,color:c,fontFamily:"'Barlow Condensed',sans-serif"}}>{v}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              {totalAdj&&<div style={{background:"rgba(16,185,129,0.06)",border:"1px solid rgba(16,185,129,0.15)",borderRadius:"5px",padding:"7px 10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:"9px",color:"#6ee7b7",fontFamily:"'Barlow Condensed',sans-serif"}}>Third down total adjustment</span>
                <span style={{fontSize:"14px",fontWeight:900,color:totalAdj.thirdDown>=0?"#4ade80":"#f87171",fontFamily:"'Barlow Condensed',sans-serif"}}>{totalAdj.thirdDown>=0?"+":""}{totalAdj.thirdDown} pts</span>
              </div>}
            </div>
          )}

          {/* ── PACE TAB ── */}
          {tab==="pace"&&(
            <div>
              <div style={{fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"9px",lineHeight:"1.5"}}>
                Pace directly inflates or deflates totals. League avg: 64 plays/game. Two fast teams (70+) add 6-8 pts to the total. Two slow teams (58) remove 4-6 pts. Each additional play ≈ 0.28 pts to the combined score.
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"10px"}}>
                {[{team:awayTeam,d:away},{team:homeTeam,d:home}].map(({team,d})=>{
                  const pace=d?.playsPerGame||64;
                  const pc=pace>=68?"#4ade80":pace>=62?"#f59e0b":"#f87171";
                  return(
                    <div key={team} style={{borderTop:"2px solid "+tc(team)+"33",paddingTop:"8px"}}>
                      <div style={{fontSize:"9px",fontWeight:800,color:tc(team),fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"7px"}}>{abb(team)}</div>
                      {[["Plays/Game",pace,pc],["Sec/Snap",d?.secondsPerSnap||"—","#888"],["TOP/G (min)",d?.timeOfPoss||"—","#888"]].map(([l,v,c])=>(
                        <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                          <span style={{fontSize:"8px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>{l}</span>
                          <span style={{fontSize:"12px",fontWeight:800,color:c,fontFamily:"'Barlow Condensed',sans-serif"}}>{v}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
              {totalAdj&&(
                <div style={{background:"rgba(16,185,129,0.06)",border:"1px solid rgba(16,185,129,0.15)",borderRadius:"5px",padding:"7px 10px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px"}}>
                    <span style={{fontSize:"9px",color:"#6ee7b7",fontFamily:"'Barlow Condensed',sans-serif"}}>Combined pace total adjustment</span>
                    <span style={{fontSize:"14px",fontWeight:900,color:totalAdj.pace>=0?"#4ade80":"#f87171",fontFamily:"'Barlow Condensed',sans-serif"}}>{totalAdj.pace>=0?"+":""}{totalAdj.pace} pts</span>
                  </div>
                  <div style={{fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif"}}>
                    {((home?.playsPerGame||64)+(away?.playsPerGame||64))/2 >= 67
                      ? "High-pace matchup — both offenses run fast, inflating total vs Vegas line"
                      : ((home?.playsPerGame||64)+(away?.playsPerGame||64))/2 <= 61
                      ? "Slow-pace matchup — both teams grind clock, total should trend under"
                      : "Average pace matchup — no significant total inflation or deflation"}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TURNOVER LUCK TAB ── */}
          {tab==="to"&&(
            <div>
              <div style={{fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"9px",lineHeight:"1.5"}}>
                Fumble recovery rates regress toward 50% over time — these are largely random. A team at +6 in turnover differential mostly from fumble recoveries is due to regress. This separates skill-based TOs (forced fumbles, interceptions) from luck-based ones (fumble recoveries).
              </div>
              {toSummary&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"10px"}}>
                  {[{team:awayTeam,d:away,luck:toSummary.awayLuck,reg:toSummary.awayRegression},
                    {team:homeTeam,d:home,luck:toSummary.homeLuck,reg:toSummary.homeRegression}].map(({team,d,luck,reg})=>(
                    <div key={team} style={{borderTop:"2px solid "+tc(team)+"33",paddingTop:"8px"}}>
                      <div style={{fontSize:"9px",fontWeight:800,color:tc(team),fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"7px"}}>{abb(team)}</div>
                      {[["TO Diff",d?.turnoverDiff>=0?"+"+(d?.turnoverDiff||0):d?.turnoverDiff||0,d?.turnoverDiff>=0?"#4ade80":"#f87171"],
                        ["Forced Fum",d?.forcedFumbles||0,"#aaa"],
                        ["INTs Forced",d?.interceptions||0,"#aaa"],
                        ["Luck Score",luck>=0?"+"+luck:luck,Math.abs(luck)>2?luck>0?"#f59e0b":"#4ade80":"#888"]
                      ].map(([l,v,c])=>(
                        <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                          <span style={{fontSize:"8px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>{l}</span>
                          <span style={{fontSize:"11px",fontWeight:800,color:c,fontFamily:"'Barlow Condensed',sans-serif"}}>{v}</span>
                        </div>
                      ))}
                      <div style={{marginTop:"5px",padding:"4px 6px",background:"rgba(255,255,255,0.03)",borderRadius:"3px",fontSize:"8px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif"}}>{reg}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── EPA TAB ── */}
          {tab==="epa"&&(
            <div>
              <div style={{fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"9px",lineHeight:"1.5"}}>
                EPA per dropback is the most predictive QB efficiency metric — more stable than yards or completion % because it accounts for down, distance, and field position. Elite QBs: 0.20+. Average: 0.05. Poor: below 0.
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"10px"}}>
                {[{team:awayTeam,d:away},{team:homeTeam,d:home}].map(({team,d})=>{
                  const epa=d?.epaPerDropback||0;
                  const eg=epaGrade(epa);
                  return(
                    <div key={team} style={{borderTop:"2px solid "+tc(team)+"33",paddingTop:"8px",textAlign:"center"}}>
                      <div style={{fontSize:"9px",fontWeight:800,color:tc(team),fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"7px"}}>{abb(team)} QB</div>
                      <div style={{fontSize:"28px",fontWeight:900,color:eg.color,fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1,marginBottom:"4px"}}>{epa>=0?"+":""}{epa}</div>
                      <Tag color={eg.color}>{eg.label}</Tag>
                      <div style={{fontSize:"8px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"5px"}}>EPA per dropback</div>
                      {d?.epaRank&&<div style={{fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"2px"}}>Ranked #{d.epaRank} in NFL</div>}
                      {d?.cpoeBonus&&<div style={{fontSize:"8px",color:"#4ade80",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"2px"}}>CPOE confirms efficiency</div>}
                    </div>
                  );
                })}
              </div>
              {home?.epaPerDropback!=null&&away?.epaPerDropback!=null&&(
                <div style={{background:"rgba(16,185,129,0.06)",border:"1px solid rgba(16,185,129,0.15)",borderRadius:"5px",padding:"7px 10px"}}>
                  <div style={{fontSize:"9px",color:"#6ee7b7",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.4"}}>
                    QB EPA differential: {((home.epaPerDropback||0)-(away.epaPerDropback||0)).toFixed(3)} per dropback.
                    {Math.abs((home.epaPerDropback||0)-(away.epaPerDropback||0))>0.10
                      ? " Significant QB efficiency edge — impacts spread 1-3 pts."
                      : " QBs are closely matched in efficiency."}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Combined adjustment summary */}
          {totalAdj&&Math.abs(totalAdj.total)>=0.5&&(
            <div style={{marginTop:"10px",background:"rgba(16,185,129,0.07)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:"7px",padding:"9px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:"9px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#10b981",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px"}}>Combined Total Adjustment</div>
                <div style={{fontSize:"8px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif"}}>
                  RZ {totalAdj.rz>=0?"+":""}{totalAdj.rz} · 3rd {totalAdj.thirdDown>=0?"+":""}{totalAdj.thirdDown} · Pace {totalAdj.pace>=0?"+":""}{totalAdj.pace}
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:"22px",fontWeight:900,color:totalAdj.total>=0?"#4ade80":"#f87171",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{totalAdj.total>=0?"+":""}{totalAdj.total}</div>
                <div style={{fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>pts to total</div>
              </div>
            </div>
          )}
        </div>
      )}
      {advancedStatus==="loading"&&<div style={{padding:"8px 0"}}><Skel cols={3}/></div>}
    </Panel>
  );
}


// ── Line Shopping Panel ─────────────────────────────────────────────────────────
function LineShoppingPanel({ ensemble, lines, gameResult, homeTeam, awayTeam }) {
  if(!ensemble?.books?.length) return null;

export default AdvancedStatsPanel;
