import { useState } from "react";
import { Panel, PanelTitle, Tag } from "../components/UIKit.jsx";

function SchematicClusterPanel({ clusterResult, homeTeam, awayTeam,
  onFetchSchematicData, fetchingSchematic }) {

  const [open, setOpen]    = useState(false);
  const [view, setView]    = useState("matchup"); // matchup | clusters | teams

  const homeArch  = clusterResult?.teamArchetypes?.[homeTeam];
  const awayArch  = clusterResult?.teamArchetypes?.[awayTeam];
  const tendency  = homeArch && awayArch ? getMatchupTendency(homeArch, awayArch) : null;
  const hasBothTeams = !!(homeArch && awayArch);

  const silhouetteGrade = s => s>=0.5?"A":s>=0.3?"B":s>=0.1?"C":"D";
  const silhouetteColor = s => s>=0.5?"#4ade80":s>=0.3?"#f59e0b":s>=0.1?"#f87171":"#555";

  return (
    <Panel border="rgba(99,102,241,0.22)" bg="rgba(99,102,241,0.03)" mb="10px">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <span style={{fontSize:"12px"}}>🧬</span>
          <span style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#818cf8",fontFamily:"'Barlow Condensed',sans-serif"}}>Schematic Archetype Clustering</span>
          {clusterResult && <Tag color="#818cf8">{clusterResult.teamsAnalyzed} teams · K={K_CLUSTERS}</Tag>}
          {clusterResult && <Tag color={silhouetteColor(clusterResult.silhouette)}>Silhouette {silhouetteGrade(clusterResult.silhouette)}: {clusterResult.silhouette}</Tag>}
          {hasBothTeams && tendency && <Tag color="#fbbf24">{ARCHETYPES[awayArch]?.icon} vs {ARCHETYPES[homeArch]?.icon}</Tag>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
          <button onClick={e=>{e.stopPropagation();onFetchSchematicData();}} disabled={fetchingSchematic}
            style={{padding:"5px 10px",borderRadius:"5px",border:"1px solid rgba(99,102,241,0.3)",background:"rgba(99,102,241,0.1)",color:fetchingSchematic?"#333":"#818cf8",fontSize:"9px",fontWeight:700,cursor:fetchingSchematic?"not-allowed":"pointer",fontFamily:"'Barlow Condensed',sans-serif",display:"flex",alignItems:"center",gap:"4px"}}>
            {fetchingSchematic?<><Spinner/>Clustering…</>:"↻ Run Clustering"}
          </button>
          <span style={{color:"#333",fontSize:"10px"}}>{open?"▲":"▼"}</span>
        </div>
      </div>

      {open && (
        <div style={{marginTop:"12px"}}>
          {!clusterResult ? (
            <div style={{textAlign:"center",padding:"20px 0"}}>
              <div style={{fontSize:"28px",marginBottom:"8px"}}>🧬</div>
              <div style={{fontSize:"11px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"4px"}}>Hit "Run Clustering" to classify all 32 teams</div>
              <div style={{fontSize:"9px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.6",maxWidth:"320px",margin:"0 auto"}}>Fetches current season schematic data for all teams, builds 10-dimensional feature vectors, and runs K-Means++ (K=6) to discover natural groupings. Labels each cluster with an NFL archetype based on centroid analysis.</div>
            </div>
          ) : (
            <>
              {/* View tabs */}
              <div style={{display:"flex",gap:"4px",marginBottom:"12px"}}>
                {[["matchup","⚡ Matchup Edge"],["clusters","🔵 All Clusters"],["teams","👥 Team Map"]].map(([k,l])=>(
                  <button key={k} onClick={()=>setView(k)} style={{padding:"5px 10px",borderRadius:"5px",border:`1px solid ${view===k?"rgba(99,102,241,0.4)":"rgba(255,255,255,0.07)"}`,background:view===k?"rgba(99,102,241,0.12)":"transparent",color:view===k?"#818cf8":"#555",fontSize:"9px",fontWeight:700,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif"}}>{l}</button>
                ))}
              </div>

              {/* ── MATCHUP EDGE VIEW ── */}
              {view==="matchup" && (
                <div>
                  {!hasBothTeams ? (
                    <div style={{fontSize:"10px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",textAlign:"center",padding:"12px"}}>Select both teams to see the schematic matchup edge</div>
                  ) : (
                    <>
                      {/* Team archetype cards */}
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"10px"}}>
                        {[{team:awayTeam,arch:awayArch,label:"Away (Offense)"},{team:homeTeam,arch:homeArch,label:"Home (Defense)"}].map(({team,arch,label})=>{
                          const a=ARCHETYPES[arch]||{};
                          return (
                            <div key={team} style={{background:`${a.color||"#555"}0d`,border:`1px solid ${a.color||"#555"}22`,borderRadius:"8px",padding:"10px 12px"}}>
                              <div style={{fontSize:"8px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px"}}>{label}</div>
                              <div style={{display:"flex",alignItems:"center",gap:"7px",marginBottom:"5px"}}>
                                <span style={{fontSize:"20px"}}>{a.icon||"❓"}</span>
                                <div>
                                  <div style={{fontSize:"12px",fontWeight:800,color:a.color||"#aaa",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{a.label||arch}</div>
                                  <div style={{fontSize:"9px",color:tc(team),fontFamily:"'Barlow Condensed',sans-serif",marginTop:"2px"}}>{abb(team)}</div>
                                </div>
                              </div>
                              <div style={{fontSize:"9px",color:"#666",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.4"}}>{a.desc}</div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Matchup tendency */}
                      {tendency && (
                        <div style={{background:"rgba(99,102,241,0.06)",border:"1px solid rgba(99,102,241,0.18)",borderRadius:"8px",padding:"12px",marginBottom:"10px"}}>
                          <div style={{fontSize:"9px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#818cf8",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"7px"}}>
                            🧬 Schematic Matchup Tendency
                          </div>
                          <div style={{fontSize:"10px",color:"#a5b4fc",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"9px",lineHeight:"1.5"}}>{tendency.note}</div>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"7px"}}>
                            {[["Spread Adj",tendency.spreadAdj,tendency.spreadAdj>0?"#f87171":tendency.spreadAdj<0?"#4ade80":"#555"],["Total Adj",tendency.totalAdj,tendency.totalAdj>0?"#4ade80":tendency.totalAdj<0?"#f87171":"#555"]].map(([l,v,c])=>(
                              <div key={l} style={{background:"rgba(255,255,255,0.04)",borderRadius:"6px",padding:"8px",textAlign:"center"}}>
                                <div style={{fontSize:"8px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px"}}>{l}</div>
                                <div style={{fontSize:"18px",fontWeight:900,color:c,fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{v>0?"+":""}{v}</div>
                                <div style={{fontSize:"7px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"2px"}}>pts applied to model</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ── ALL CLUSTERS VIEW ── */}
              {view==="clusters" && clusterResult.clusters && (
                <div>
                  <div style={{fontSize:"9px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"8px"}}>K={K_CLUSTERS} clusters · Silhouette score {clusterResult.silhouette} (range -1→+1, higher=better separation)</div>
                  {Object.entries(clusterResult.clusters).map(([ci,cluster])=>{
                    const arch=cluster.archetype;
                    const a=ARCHETYPES[arch]||{label:arch,icon:"❓",color:"#555",desc:""};
                    return(
                      <div key={ci} style={{background:`${a.color}0a`,border:`1px solid ${a.color}20`,borderRadius:"7px",padding:"9px 11px",marginBottom:"5px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:"7px",marginBottom:"5px"}}>
                          <span style={{fontSize:"16px"}}>{a.icon}</span>
                          <span style={{fontSize:"11px",fontWeight:800,color:a.color,fontFamily:"'Barlow Condensed',sans-serif"}}>{a.label}</span>
                          <Tag color={a.color}>{cluster.teamList.length} teams</Tag>
                        </div>
                        <div style={{display:"flex",gap:"3px",flexWrap:"wrap",marginBottom:"5px"}}>
                          {cluster.teamList.map(t=>(
                            <div key={t} style={{display:"flex",alignItems:"center",gap:"3px",background:"rgba(255,255,255,0.05)",borderRadius:"3px",padding:"2px 6px"}}>
                              <div style={{width:"5px",height:"5px",borderRadius:"50%",background:tc(t)}}/>
                              <span style={{fontSize:"9px",color:"#ccc",fontFamily:"'Barlow Condensed',sans-serif"}}>{abb(t)}</span>
                            </div>
                          ))}
                        </div>
                        <div style={{fontSize:"8px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.3"}}>{a.desc}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── TEAM MAP VIEW ── */}
              {view==="teams" && (
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px"}}>
                  {Object.entries(clusterResult.teamArchetypes).sort((a,b)=>a[1].localeCompare(b[1])).map(([team,arch])=>{
                    const a=ARCHETYPES[arch]||{label:arch,icon:"❓",color:"#555"};
                    const isActive=team===homeTeam||team===awayTeam;
                    return(
                      <div key={team} style={{display:"flex",alignItems:"center",gap:"6px",padding:"5px 8px",background:isActive?`${a.color}12`:"rgba(255,255,255,0.02)",border:`1px solid ${isActive?a.color+"30":"rgba(255,255,255,0.05)"}`,borderRadius:"5px"}}>
                        <span style={{fontSize:"12px",flexShrink:0}}>{a.icon}</span>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:"9px",fontWeight:isActive?800:600,color:isActive?tc(team):"#aaa",fontFamily:"'Barlow Condensed',sans-serif",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{abb(team)}</div>
                          <div style={{fontSize:"7px",color:a.color,fontFamily:"'Barlow Condensed',sans-serif"}}>{a.label}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{marginTop:"8px",fontSize:"8px",color:"#1a1a2a",fontFamily:"'Barlow Condensed',sans-serif"}}>
                K-Means++ · 10-dimensional feature vectors · {clusterResult.teamsAnalyzed} teams analysed · Silhouette quality score {clusterResult.silhouette}
              </div>
            </>
          )}
        </div>
      )}
    </Panel>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ML ENGINE DASHBOARD
// Single collapsible panel housing all three background ML systems:
//   Backtest Engine · Self-Learning · Schematic Clustering
// Plus analytics: Feature Importance · Mistake Log · Signal Calibration
//
// All ML logic continues running in the background regardless of whether
// this panel is open. The dashboard is just the window into the engine.
// ═══════════════════════════════════════════════════════════════════════════

function MLEngineDashboard({

export default SchematicClusterPanel;
