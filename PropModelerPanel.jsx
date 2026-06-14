import { useState } from "react";
import { derivePlayerProjections, calcPropEdge } from "../utils/propUtils.js";
import { Panel, PanelTitle, Tag, Spinner } from "../components/UIKit.jsx";

function PropModelerPanel({ homeTeam, awayTeam, gameResult, lines, weather,
  pressureData, olData, cpoeData, garbageData }) {

  const [open, setOpen]         = useState(false);
  const [tab, setTab]           = useState("QB");
  const [propLines, setPropLines]   = useState(null);
  const [fetching, setFetching]     = useState(false);
  const [selectedTeam, setSelectedTeam] = useState("both");
  const [sgpLegs, setSgpLegs]   = useState([]);

  if (!homeTeam || !awayTeam) return null;

  // Compute derivative projections from game signals
  const projections = derivePlayerProjections({
    gameResult, lines, weather, pressureData, olData, cpoeData, garbageData, homeTeam, awayTeam
  });

  // Fetch live prop lines from all books
  async function fetchPropLines() {
    setFetching(true); setPropLines(null);
    try {
      const text = await callClaude({
        useSearch: true, maxTokens: 1600,
        prompt: `Search for current NFL player prop betting lines for ${awayTeam} at ${homeTeam} this week. Find DraftKings, FanDuel, and Caesars prop lines.

For each starting QB, RB1, WR1, WR2, TE1 on both teams find the over/under lines for:
- QB: passing yards, passing TDs, completions, interceptions, rushing yards
- RB: rushing yards, rushing TDs, receiving yards, receptions
- WR/TE: receiving yards, receptions, TDs

Return ONLY JSON (no markdown):
{
  "gameweek": "Week 14",
  "home": {
    "team": "${homeTeam}",
    "players": [
      {
        "name": "Full Name",
        "position": "QB",
        "props": [
          {"stat":"Passing Yards","line":235.5,"overOdds":"-115","underOdds":"-105"},
          {"stat":"Passing TDs","line":1.5,"overOdds":"+120","underOdds":"-145"},
          {"stat":"Completions","line":21.5,"overOdds":"-110","underOdds":"-110"},
          {"stat":"Interceptions","line":0.5,"overOdds":"+180","underOdds":"-220"},
          {"stat":"Rushing Yards","line":14.5,"overOdds":"-115","underOdds":"-105"}
        ]
      }
    ]
  },
  "away": {
    "team": "${awayTeam}",
    "players": [...]
  }
}

Include ALL key skill position starters. Use 0.5-increment lines. If actual lines not yet posted, generate realistic estimates based on season stats clearly labeled as "estimated".`
      });
      const m = text.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("No JSON");
      setPropLines(JSON.parse(m[0]));
    } catch(e) {
      setPropLines({ error: "Could not fetch prop lines. Try again after lines post." });
    }
    setFetching(false);
  }

  const POSITIONS = ["QB","RB","WR","TE","ALL"];
  const STAT_KEYS = {
    QB:  ["QB_PASS_YDS","QB_PASS_TDS","QB_COMPS","QB_INTS","QB_RUSH_YDS"],
    RB:  ["RB1_RUSH_YDS","RB1_RUSH_TDS","RB1_REC_YDS","RB1_RECS"],
    WR:  ["WR1_REC_YDS","WR1_RECS","WR1_TDS","WR2_REC_YDS"],
    TE:  ["TE1_REC_YDS","TE1_RECS"],
  };
  const STAT_LABELS = {
    QB_PASS_YDS:"Pass Yds", QB_PASS_TDS:"Pass TDs", QB_COMPS:"Comps",
    QB_INTS:"INTs", QB_RUSH_YDS:"Rush Yds",
    RB1_RUSH_YDS:"Rush Yds", RB1_RUSH_TDS:"Rush TDs", RB1_REC_YDS:"Rec Yds", RB1_RECS:"Recs",
    WR1_REC_YDS:"WR1 Rec Yds", WR1_RECS:"WR1 Recs", WR1_TDS:"WR1 TDs", WR2_REC_YDS:"WR2 Rec Yds",
    TE1_REC_YDS:"TE Rec Yds", TE1_RECS:"TE Recs",
  };

  // Match model projection to book line by stat label
  function findBookLine(teamSide, statKey) {
    if (!propLines || propLines.error) return null;
    const team  = propLines[teamSide];
    if (!team?.players?.length) return null;
    const statLabel = STAT_LABELS[statKey];
    for (const player of team.players) {
      const prop = player.props?.find(p =>
        p.stat?.toLowerCase().includes(statLabel.toLowerCase().replace(" yds","").replace(" tds","").trim()) ||
        statLabel.toLowerCase().includes(p.stat?.toLowerCase().split(" ")[0]||"")
      );
      if (prop) return { ...prop, playerName: player.name, position: player.position };
    }
    return null;
  }

  // Render a single prop row
  function PropRow({ statKey, teamSide, projData }) {
    const proj   = projData?.[statKey];
    const book   = findBookLine(teamSide, statKey);
    const edge   = book?.line ? calcPropEdge(proj, book.line) : null;
    const edgeColor = edge?.lean === "OVER" ? "#4ade80" : edge?.lean === "UNDER" ? "#f87171" : "#555";
    return (
      <div style={{display:"flex",alignItems:"center",gap:"8px",padding:"6px 9px",background:edge?.hasEdge?`${edgeColor}06`:"rgba(255,255,255,0.02)",border:`1px solid ${edge?.hasEdge?edgeColor+"20":"rgba(255,255,255,0.05)"}`,borderRadius:"5px",marginBottom:"3px"}}>
        <div style={{width:"75px",fontSize:"9px",fontWeight:700,color:"#888",fontFamily:"'Barlow Condensed',sans-serif",flexShrink:0}}>{STAT_LABELS[statKey]}</div>
        {/* Model projection */}
        <div style={{width:"52px",textAlign:"center",background:"rgba(139,92,246,0.08)",border:"1px solid rgba(139,92,246,0.18)",borderRadius:"4px",padding:"3px 5px"}}>
          <div style={{fontSize:"7px",color:"#7c3aed",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"1px"}}>MODEL</div>
          <div style={{fontSize:"12px",fontWeight:800,color:"#a78bfa",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{proj??"-"}</div>
        </div>
        {/* Book line */}
        <div style={{width:"52px",textAlign:"center",background:"rgba(255,255,255,0.04)",borderRadius:"4px",padding:"3px 5px"}}>
          <div style={{fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"1px"}}>BOOK</div>
          <div style={{fontSize:"12px",fontWeight:800,color:"#ddd",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{book?.line??"-"}</div>
        </div>
        {/* Edge */}
        {edge ? (
          <div style={{flex:1,display:"flex",alignItems:"center",gap:"6px"}}>
            <div style={{background:`${edgeColor}10`,border:`1px solid ${edgeColor}25`,borderRadius:"4px",padding:"3px 7px",textAlign:"center"}}>
              <div style={{fontSize:"7px",color:edgeColor,fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"1px"}}>{edge.lean}</div>
              <div style={{fontSize:"11px",fontWeight:900,color:edgeColor,fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{Math.abs(edge.edge)}%</div>
            </div>
            {edge.hasEdge && <Tag color={edgeColor}>{edge.strength}</Tag>}
          </div>
        ) : (
          <div style={{flex:1,fontSize:"9px",color:"#2a2a2a",fontFamily:"'Barlow Condensed',sans-serif"}}>
            {book ? "No edge" : "Fetch lines for comparison"}
          </div>
        )}
        {/* Add to SGP */}
        {edge?.hasEdge && (
          <button onClick={()=>setSgpLegs(l=>[...l.filter(x=>x.statKey!==statKey||x.teamSide!==teamSide),{statKey,teamSide,team:projData.team,lean:edge.lean,line:book?.line,proj,playerName:book?.playerName,edge:edge.edge,stat:STAT_LABELS[statKey]}])}
            style={{padding:"3px 7px",borderRadius:"3px",border:"none",background:"linear-gradient(135deg,#7c3aed,#5b21b6)",color:"#fff",fontSize:"8px",fontWeight:700,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",flexShrink:0}}>
            + SGP
          </button>
        )}
      </div>
    );
  }

  // Modifier badges
  function ModBadges({ projData }) {
    if (!projData) return null;
    const badges = [];
    if (projData.pressAdj < 0.93)  badges.push({ label:`Pressure adj ${Math.round((1-projData.pressAdj)*100)}%↓`, color:"#f59e0b" });
    if (projData.olAdj < 0.92)     badges.push({ label:`OL health adj ${Math.round((1-projData.olAdj)*100)}%↓`, color:"#f87171" });
    if (projData.cpoeAdj > 1.04)   badges.push({ label:`CPOE boost +${Math.round((projData.cpoeAdj-1)*100)}%`, color:"#4ade80" });
    if (projData.gameScript!=="neutral") badges.push({ label:`${projData.gameScript} game script`, color:projData.gameScript==="winning"?"#4ade80":"#f59e0b" });
    return badges.length ? (
      <div style={{display:"flex",gap:"4px",flexWrap:"wrap",marginBottom:"8px"}}>
        {badges.map((b,i)=><Tag key={i} color={b.color}>{b.label}</Tag>)}
      </div>
    ) : null;
  }

  const teamsToShow = selectedTeam === "both" ? ["home","away"] : [selectedTeam];

  return (
    <Panel border="rgba(139,92,246,0.22)" bg="rgba(139,92,246,0.03)" mb="10px">
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",marginBottom:open?"12px":"0"}} onClick={()=>setOpen(o=>!o)}>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <span style={{fontSize:"12px"}}>🎯</span>
          <span style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#a78bfa",fontFamily:"'Barlow Condensed',sans-serif"}}>Player Props & Derivatives</span>
          {projections && <Tag color="#a78bfa">Model projections ready</Tag>}
          {propLines && !propLines.error && <Tag color="#4ade80">Book lines loaded</Tag>}
          {sgpLegs.length > 0 && <Tag color="#fbbf24">{sgpLegs.length} SGP legs</Tag>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
          {!fetching && <button onClick={e=>{e.stopPropagation();fetchPropLines();}} style={{padding:"5px 10px",borderRadius:"5px",border:"1px solid rgba(139,92,246,0.3)",background:"rgba(139,92,246,0.1)",color:"#a78bfa",fontSize:"9px",fontWeight:700,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif"}}>↻ Fetch Prop Lines</button>}
          {fetching && <div style={{display:"flex",alignItems:"center",gap:"5px",color:"#a78bfa",fontSize:"9px",fontFamily:"'Barlow Condensed',sans-serif"}}><Spinner/>Fetching…</div>}
          <span style={{color:"#333",fontSize:"10px"}}>{open?"▲":"▼"}</span>
        </div>
      </div>

      {open && (
        <div>
          {/* Modifier summary */}
          {projections?.modifiers && (
            <div style={{display:"flex",gap:"5px",flexWrap:"wrap",marginBottom:"10px"}}>
              {projections.modifiers.badWeather && <Tag color="#38bdf8">🌧 Weather: pass props ↓{Math.round((1-projections.modifiers.wPassAdj)*100)}%</Tag>}
              {projections.modifiers.isBlowout  && <Tag color="#f59e0b">💥 Blowout spread: game script active</Tag>}
              {projections.modifiers.isClose    && <Tag color="#4ade80">⚖️ Close game: passing volume up</Tag>}
              <Tag color="#888">Total env: {projections.modifiers.total} pts → {projections.modifiers.passYdsMod > 1 ? "high":"low"}-volume game</Tag>
            </div>
          )}

          {/* Team selector + position tabs */}
          <div style={{display:"flex",gap:"6px",marginBottom:"10px",flexWrap:"wrap",alignItems:"center"}}>
            <div style={{display:"flex",gap:"3px"}}>
              {[["both","Both"],["home",abb(homeTeam)],["away",abb(awayTeam)]].map(([k,l])=>(
                <button key={k} onClick={()=>setSelectedTeam(k)} style={{padding:"4px 9px",borderRadius:"4px",border:`1px solid ${selectedTeam===k?"rgba(139,92,246,0.4)":"rgba(255,255,255,0.08)"}`,background:selectedTeam===k?"rgba(139,92,246,0.1)":"transparent",color:selectedTeam===k?"#a78bfa":"#555",fontSize:"9px",fontWeight:700,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif"}}>{l}</button>
              ))}
            </div>
            <div style={{display:"flex",gap:"3px"}}>
              {POSITIONS.map(p=>(
                <button key={p} onClick={()=>setTab(p)} style={{padding:"4px 9px",borderRadius:"4px",border:`1px solid ${tab===p?"rgba(251,191,36,0.35)":"rgba(255,255,255,0.07)"}`,background:tab===p?"rgba(251,191,36,0.08)":"transparent",color:tab===p?"#fbbf24":"#555",fontSize:"9px",fontWeight:700,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif"}}>{p}</button>
              ))}
            </div>
          </div>

          {/* Prop rows per team */}
          {teamsToShow.map(side => {
            const projData = projections?.[side];
            const teamName = side === "home" ? homeTeam : awayTeam;
            const statsToShow = tab === "ALL"
              ? ["QB","RB","WR","TE"].flatMap(p => STAT_KEYS[p] || [])
              : STAT_KEYS[tab] || [];
            return (
              <div key={side} style={{marginBottom:"12px"}}>
                <div style={{display:"flex",alignItems:"center",gap:"7px",marginBottom:"6px",borderBottom:`2px solid ${tc(teamName)}33`,paddingBottom:"5px"}}>
                  <div style={{width:"6px",height:"6px",borderRadius:"50%",background:tc(teamName)}}/>
                  <span style={{fontSize:"10px",fontWeight:800,color:tc(teamName),fontFamily:"'Barlow Condensed',sans-serif"}}>{teamName}</span>
                  {projData && <ModBadges projData={projData}/>}
                </div>
                {statsToShow.map(sk => (
                  <PropRow key={sk} statKey={sk} teamSide={side} projData={projData}/>
                ))}
              </div>
            );
          })}

          {/* Error state */}
          {propLines?.error && (
            <div style={{background:"rgba(248,113,113,0.06)",border:"1px solid rgba(248,113,113,0.15)",borderRadius:"6px",padding:"8px 11px",color:"#fca5a5",fontSize:"10px",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"10px"}}>
              ⚠ {propLines.error}
            </div>
          )}

          {/* Same-Game Parlay Builder */}
          {sgpLegs.length > 0 && (
            <div style={{marginTop:"12px",background:"rgba(251,191,36,0.05)",border:"1px solid rgba(251,191,36,0.2)",borderRadius:"8px",padding:"12px"}}>
              <div style={{fontSize:"9px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#fbbf24",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"8px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span>🏈 Same-Game Parlay ({sgpLegs.length} legs)</span>
                <button onClick={()=>setSgpLegs([])} style={{background:"none",border:"none",color:"#f87171",fontSize:"9px",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif"}}>Clear All</button>
              </div>
              {sgpLegs.map((leg,i) => (
                <div key={i} style={{display:"flex",alignItems:"center",gap:"7px",padding:"5px 8px",background:"rgba(255,255,255,0.04)",borderRadius:"5px",marginBottom:"3px"}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:"9px",fontWeight:700,color:"#ddd",fontFamily:"'Barlow Condensed',sans-serif"}}>{leg.playerName||abb(leg.team)} — {leg.stat} {leg.lean} {leg.line}</div>
                    <div style={{fontSize:"8px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif"}}>Model: {leg.proj} · Edge: {leg.edge > 0 ? "+" : ""}{leg.edge}%</div>
                  </div>
                  <Tag color={leg.lean==="OVER"?"#4ade80":"#f87171"}>{leg.lean}</Tag>
                  <button onClick={()=>setSgpLegs(l=>l.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:"#f87171",fontSize:"10px",cursor:"pointer",padding:"0 3px",fontFamily:"'Barlow Condensed',sans-serif"}}>✕</button>
                </div>
              ))}
              <div style={{marginTop:"8px",padding:"7px 10px",background:"rgba(139,92,246,0.06)",border:"1px solid rgba(139,92,246,0.15)",borderRadius:"5px",fontSize:"9px",color:"#c4b5fd",fontFamily:"'Barlow Condensed',sans-serif"}}>
                ⚠ SGP legs are correlated — books apply a correlation discount. Positive correlations (QB pass yards + WR receiving yards) are best value. Negative correlations (QB pass yards + RB rush yards) reduce edge.
              </div>
            </div>
          )}

          <div style={{marginTop:"8px",fontSize:"8px",color:"#1a1a2a",fontFamily:"'Barlow Condensed',sans-serif"}}>
            Derivative projections use 17-signal model: CPOE · Pressure rate · OL health · Weather · Game script · Total environment · NOT actual player targets/snap counts
          </div>
        </div>
      )}
    </Panel>
  );
}

// ── Sportsbook Profiling & Sharp-Line Arbitrage ────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

export default PropModelerPanel;
