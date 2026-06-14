import { useState, useEffect } from "react";
import { runRosterGNN, detectCoverageScheme, estimateSnapCounts } from "../ml/rosterGNN.js";
import { Panel, PanelTitle, Tag, Spinner } from "../components/UIKit.jsx";

function GNNRosterPanel({ homeTeam, awayTeam, injuries, pressureData, olData, cpoeData, ensembleData, lines }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab]   = useState("gnn");

  if (!homeTeam || !awayTeam) return null;

  // Run GNN for both teams
  const homeGNN = runRosterGNN(injuries, pressureData, olData, cpoeData, "home");
  const awayGNN = runRosterGNN(injuries, pressureData, olData, cpoeData, "away");
  const spreadAdj = rosterToSpreadAdj(homeGNN.integrityScore, awayGNN.integrityScore);

  // Coverage scheme
  const homeCoverage = COVERAGE_SCHEMES[detectCoverageScheme(pressureData, cpoeData, ensembleData)];

  // Snap counts
  const homeSnaps = estimateSnapCounts(injuries, homeGNN);
  const awaySnaps = estimateSnapCounts(injuries, awayGNN);

  const scoreColor = s => s >= 82 ? "#4ade80" : s >= 68 ? "#f59e0b" : s >= 50 ? "#f87171" : "#ef4444";
  const POS_LABELS = { QB:"QB",LT:"LT",LG:"LG",C:"C",RG:"RG",RT:"RT",WR1:"WR1",WR2:"WR2",TE:"TE",RB:"RB" };

  return (
    <Panel border="rgba(99,102,241,0.22)" bg="rgba(99,102,241,0.03)" mb="10px">
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <span style={{fontSize:"12px"}}>🕸️</span>
          <span style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#818cf8",fontFamily:"'Barlow Condensed',sans-serif"}}>GNN Roster Interdependency</span>
          <Tag color={scoreColor(homeGNN.integrityScore)}>{abb(homeTeam)} {homeGNN.integrityScore}</Tag>
          <Tag color={scoreColor(awayGNN.integrityScore)}>{abb(awayTeam)} {awayGNN.integrityScore}</Tag>
          {Math.abs(spreadAdj) >= 0.4 && <Tag color={spreadAdj > 0 ? "#4ade80" : "#f87171"}>Net {spreadAdj > 0 ? "+" : ""}{spreadAdj} pts</Tag>}
        </div>
        <span style={{color:"#333",fontSize:"10px"}}>{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div style={{marginTop:"12px"}}>
          {/* Tabs */}
          <div style={{display:"flex",gap:"4px",marginBottom:"12px",flexWrap:"wrap"}}>
            {[["gnn","🕸️ Roster Graph"],["cascade","⚡ Cascade Effects"],["coverage","🔒 Coverage"],["snaps","📋 Snap Counts"]].map(([k,l])=>(
              <button key={k} onClick={()=>setTab(k)} style={{padding:"5px 10px",borderRadius:"5px",border:`1px solid ${tab===k?"rgba(99,102,241,0.4)":"rgba(255,255,255,0.07)"}`,background:tab===k?"rgba(99,102,241,0.12)":"transparent",color:tab===k?"#818cf8":"#555",fontSize:"9px",fontWeight:700,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif"}}>{l}</button>
            ))}
          </div>

          {/* ── GNN ROSTER GRAPH TAB ── */}
          {tab==="gnn"&&(
            <div>
              <div style={{fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"10px",lineHeight:"1.6"}}>
                2-round Graph Convolutional Network. Each node = a position. Edges = interdependency strength. Injury to LT cascades to QB (pressure), QB cascades to WR1/WR2 (fewer targets). Score 0–100.
              </div>
              {/* Score comparison */}
              <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:"10px",alignItems:"center",marginBottom:"12px"}}>
                {[{team:homeTeam,gnn:homeGNN},{},{team:awayTeam,gnn:awayGNN}].map((item,i)=>
                  i===1 ? (
                    <div key="mid" style={{textAlign:"center"}}>
                      <div style={{fontSize:"8px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px"}}>NET ADJ</div>
                      <div style={{fontSize:"20px",fontWeight:900,color:Math.abs(spreadAdj)>=0.4?(spreadAdj>0?"#4ade80":"#f87171"):"#555",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{spreadAdj>0?"+":""}{spreadAdj}</div>
                      <div style={{fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"2px"}}>pts to spread</div>
                    </div>
                  ) : (
                    <div key={item.team} style={{background:`${scoreColor(item.gnn.integrityScore)}0d`,border:`1px solid ${scoreColor(item.gnn.integrityScore)}25`,borderRadius:"8px",padding:"10px 12px",textAlign:"center"}}>
                      <div style={{fontSize:"9px",fontWeight:700,color:tc(item.team),fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"4px"}}>{abb(item.team)}</div>
                      <div style={{fontSize:"28px",fontWeight:900,color:scoreColor(item.gnn.integrityScore),fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{item.gnn.integrityScore}</div>
                      <div style={{fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"3px"}}>Roster Integrity</div>
                      {/* Position node grid */}
                      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"2px",marginTop:"7px"}}>
                        {Object.entries(POS_LABELS).map(([pos,label])=>{
                          const s=item.gnn.gnnOutput[pos]?.score??1;
                          const c=s>=0.82?"#4ade80":s>=0.65?"#f59e0b":s>=0.4?"#f87171":"#ef4444";
                          return(
                            <div key={pos} style={{background:`${c}15`,border:`1px solid ${c}30`,borderRadius:"3px",padding:"2px 0",textAlign:"center"}} title={`${pos}: ${(s*100).toFixed(0)}%`}>
                              <div style={{fontSize:"6px",color:c,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700}}>{label}</div>
                              <div style={{fontSize:"8px",fontWeight:800,color:c,fontFamily:"'Barlow Condensed',sans-serif"}}>{Math.round(s*100)}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )
                )}
              </div>
              <div style={{fontSize:"8px",color:"#2a2a2a",fontFamily:"'Barlow Condensed',sans-serif"}}>GCN with mean aggregation · 2 message-passing rounds · 10 position nodes · Edge weights from NFL positional interdependency research</div>
            </div>
          )}

          {/* ── CASCADE EFFECTS TAB ── */}
          {tab==="cascade"&&(
            <div>
              <div style={{fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"9px",lineHeight:"1.5"}}>
                Positions where GNN score dropped below raw injury assessment — the cascade effect. An OL injury drops LT score, which then drops QB score, which propagates to all skill positions.
              </div>
              {[{team:homeTeam,gnn:homeGNN,color:tc(homeTeam)},{team:awayTeam,gnn:awayGNN,color:tc(awayTeam)}].map(({team,gnn,color})=>(
                <div key={team} style={{marginBottom:"12px"}}>
                  <div style={{fontSize:"9px",fontWeight:800,color,fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"6px",borderBottom:`1px solid ${color}25`,paddingBottom:"4px"}}>{team}</div>
                  {gnn.cascades.length===0
                    ? <div style={{fontSize:"9px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",padding:"6px 0"}}>✓ No significant cascade effects — roster largely intact</div>
                    : gnn.cascades.map((c,i)=>{
                        const raw=Math.round(c.rawScore*100), gnnS=Math.round(c.gnnScore*100);
                        const dropColor=c.drop>0.15?"#ef4444":c.drop>0.08?"#f87171":"#f59e0b";
                        return(
                          <div key={i} style={{display:"flex",alignItems:"center",gap:"8px",padding:"6px 9px",background:"rgba(255,255,255,0.03)",border:`1px solid ${dropColor}15`,borderRadius:"5px",marginBottom:"3px"}}>
                            <div style={{width:"32px",height:"32px",borderRadius:"6px",background:`${dropColor}15`,border:`1px solid ${dropColor}30`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                              <span style={{fontSize:"9px",fontWeight:900,color:dropColor,fontFamily:"'Barlow Condensed',sans-serif"}}>{c.pos}</span>
                            </div>
                            <div style={{flex:1}}>
                              <div style={{display:"flex",alignItems:"center",gap:"5px",marginBottom:"2px"}}>
                                <span style={{fontSize:"10px",fontWeight:700,color:"#ddd",fontFamily:"'Barlow Condensed',sans-serif"}}>{c.pos}</span>
                                {c.status&&<Tag color={c.status==="out"?"#ef4444":c.status==="doubtful"?"#f87171":"#f59e0b"}>{c.status}</Tag>}
                              </div>
                              <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
                                <span style={{fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif"}}>Raw: {raw}</span>
                                <span style={{fontSize:"9px",color:"#444"}}>→</span>
                                <span style={{fontSize:"11px",fontWeight:800,color:dropColor,fontFamily:"'Barlow Condensed',sans-serif"}}>GNN: {gnnS}</span>
                                <span style={{fontSize:"9px",color:dropColor,fontFamily:"'Barlow Condensed',sans-serif"}}>(-{Math.round(c.drop*100)} cascade)</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                  }
                </div>
              ))}
            </div>
          )}

          {/* ── COVERAGE SCHEME TAB ── */}
          {tab==="coverage"&&(
            <div>
              <div style={{background:`${homeCoverage.color}08`,border:`1px solid ${homeCoverage.color}22`,borderRadius:"8px",padding:"12px 14px",marginBottom:"10px"}}>
                <div style={{display:"flex",alignItems:"center",gap:"9px",marginBottom:"8px"}}>
                  <span style={{fontSize:"24px"}}>{homeCoverage.icon}</span>
                  <div>
                    <div style={{fontSize:"13px",fontWeight:900,color:homeCoverage.color,fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{homeCoverage.label}</div>
                    <div style={{fontSize:"8px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"2px"}}>{abb(homeTeam)} defensive scheme</div>
                  </div>
                </div>
                <div style={{fontSize:"10px",color:"#888",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.5",marginBottom:"9px"}}>{homeCoverage.desc}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"6px"}}>
                  {[["Pass Yards",homeCoverage.passAdj],["Rush Yards",homeCoverage.rushAdj],["WR1 Prop",homeCoverage.wr1Adj]].map(([l,v])=>{
                    const pct=Math.round(v*100);
                    const c=pct>0?"#4ade80":pct<0?"#f87171":"#555";
                    return(
                      <div key={l} style={{background:"rgba(255,255,255,0.04)",borderRadius:"5px",padding:"6px 8px",textAlign:"center"}}>
                        <div style={{fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px"}}>{l}</div>
                        <div style={{fontSize:"13px",fontWeight:900,color:c,fontFamily:"'Barlow Condensed',sans-serif"}}>{pct>0?"+":""}{pct}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.5",marginBottom:"7px"}}>Coverage scheme adjustments are fed into the prop modeler — WR1 receiving yards, QB pass yards, and total projections all account for defensive scheme.</div>
              <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
                {Object.entries(COVERAGE_SCHEMES).map(([key,cs])=>(
                  <div key={key} style={{display:"flex",alignItems:"center",gap:"4px",padding:"3px 8px",background:`${cs.color}08`,border:`1px solid ${cs.color}${detectCoverageScheme(pressureData,cpoeData,ensembleData)===key?"35":"15"}`,borderRadius:"5px"}}>
                    <span style={{fontSize:"10px"}}>{cs.icon}</span>
                    <span style={{fontSize:"8px",color:cs.color,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:detectCoverageScheme(pressureData,cpoeData,ensembleData)===key?800:400}}>{cs.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SNAP COUNTS TAB ── */}
          {tab==="snaps"&&(
            <div>
              <div style={{fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"9px",lineHeight:"1.5"}}>
                GNN-adjusted snap count estimates. A QB out = 0 snaps for backup. OL injuries cascade to reduced offensive efficiency. Used to calibrate prop line projections.
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
                {[{team:homeTeam,snaps:homeSnaps},{team:awayTeam,snaps:awaySnaps}].map(({team,snaps})=>(
                  <div key={team}>
                    <div style={{fontSize:"9px",fontWeight:800,color:tc(team),fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"6px"}}>{abb(team)} Snap Est.</div>
                    {Object.entries(snaps).map(([pos,d])=>{
                      const pct=d.adjusted/d.base;
                      const c=pct>=0.9?"#4ade80":pct>=0.7?"#f59e0b":pct>=0.4?"#f87171":"#ef4444";
                      return(
                        <div key={pos} style={{display:"flex",alignItems:"center",gap:"5px",marginBottom:"3px",padding:"3px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                          <span style={{fontSize:"8px",fontWeight:700,color:"#888",fontFamily:"'Barlow Condensed',sans-serif",width:"28px"}}>{pos}</span>
                          <div style={{flex:1,height:"4px",borderRadius:"2px",background:"rgba(255,255,255,0.05)",overflow:"hidden"}}>
                            <div style={{width:`${pct*100}%`,height:"100%",background:c,borderRadius:"2px"}}/>
                          </div>
                          <span style={{fontSize:"9px",fontWeight:700,color:c,fontFamily:"'Barlow Condensed',sans-serif",width:"26px",textAlign:"right"}}>{d.adjusted}</span>
                          {d.pctChange<-5&&<span style={{fontSize:"7px",color:"#f87171",fontFamily:"'Barlow Condensed',sans-serif"}}>{d.pctChange}%</span>}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function derivePlayerProjections({ gameResult, lines, weather, pressureData,

export default GNNRosterPanel;
