import { useState, useEffect } from "react";
import { computeModelRatings } from "../utils/modelRatings.js";
import { Panel, PanelTitle, Tag, Spinner } from "../components/UIKit.jsx";

function PowerRankingsPanel({ backtestHistory, onLoadMatchup }) {
  const [open, setOpen]               = useState(false);
  const [tab, setTab]                 = useState("model");
  const [consensusRankings, setConsensusRankings] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [sortBy, setSortBy]           = useState("composite");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [savedRankings, setSavedRankings] = useState(null);

  // Load saved consensus rankings from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(POWER_KEY);
        if (r) {
          const d = JSON.parse(r.value);
          setSavedRankings(d.rankings);
          setConsensusRankings(d.rankings);
          setLastUpdated(d.savedAt);
        }
      } catch {}
    })();
  }, []);

  // Model ratings — recomputed live from backtest
  const modelRatings = computeModelRatings(backtestHistory);
  const hasModelData = Object.keys(modelRatings).length >= 3;

  // Sorted model teams
  const modelTeams = Object.entries(modelRatings)
    .sort((a, b) => {
      if (sortBy === "composite") return b[1].composite - a[1].composite;
      if (sortBy === "ats")       return b[1].atsPct - a[1].atsPct;
      if (sortBy === "margin")    return b[1].avgMargin - a[1].avgMargin;
      if (sortBy === "games")     return b[1].games - a[1].games;
      return b[1].composite - a[1].composite;
    });

  // Fetch live consensus rankings via Claude web search
  async function fetchConsensusRankings() {
    setFetchLoading(true);
    try {
      const text = await callClaude({
        useSearch: true,
        maxTokens: 1400,
        prompt: `Search for the current NFL power rankings this week from ESPN, NFL.com, or CBS Sports. Get the latest rankings for all 32 teams.

Return ONLY JSON (no markdown):
{
  "week": "Week 14",
  "source": "ESPN",
  "updatedDate": "Dec 3",
  "rankings": [
    {
      "rank": 1,
      "team": "full team name e.g. Kansas City Chiefs",
      "record": "11-1",
      "change": 0,
      "blurb": "One sentence on why they are ranked here",
      "tier": "Elite"
    }
  ]
}

Include ALL 32 teams ranked 1-32. Tiers: Elite (1-4), Contender (5-12), Average (13-20), Rebuilding (21-32).
change = rank movement from last week (positive = moved up, negative = moved down, 0 = same).`
      });

      const m = text.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("No JSON");
      const data = JSON.parse(m[0]);
      setConsensusRankings(data.rankings);
      const savedAt = new Date().toLocaleString("en-US", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" });
      setLastUpdated(savedAt);
      // Persist
      await window.storage.set(POWER_KEY, JSON.stringify({ rankings: data.rankings, savedAt, week: data.week, source: data.source }));
    } catch(e) {
      setConsensusRankings([{ error: "Could not fetch rankings — try again." }]);
    }
    setFetchLoading(false);
  }

  // Divergence: compare model rank vs consensus rank
  const divergenceBoard = (() => {
    if (!consensusRankings?.length || !hasModelData) return [];
    const consensusMap = {};
    consensusRankings.forEach((r, i) => { if (r.team) consensusMap[r.team] = i + 1; });

    return modelTeams
      .map(([team, stats], i) => {
        const modelRank     = i + 1;
        const consensusRank = consensusMap[team];
        if (!consensusRank) return null;
        const diff = consensusRank - modelRank; // positive = model rates higher
        return { team, modelRank, consensusRank, diff, stats };
      })
      .filter(Boolean)
      .filter(d => Math.abs(d.diff) >= 3)
      .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
      .slice(0, 10);
  })();

  const tierColor = t => t==="Elite"?"#4ade80":t==="Contender"?"#38bdf8":t==="Average"?"#f59e0b":"#888";
  const changeArrow = c => c > 0 ? "▲" : c < 0 ? "▼" : "—";
  const changeColor = c => c > 0 ? "#4ade80" : c < 0 ? "#f87171" : "#444";
  const trendIcon   = t => t==="hot"?"🔥":t==="cold"?"🧊":"—";

  return (
    <Panel border="rgba(251,146,60,0.2)" bg="rgba(251,146,60,0.02)" mb="10px">
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <span style={{fontSize:"12px"}}>📊</span>
          <span style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#fb923c",fontFamily:"'Barlow Condensed',sans-serif"}}>Power Rankings Tracker</span>
          {hasModelData && <Tag color="#fb923c">{Object.keys(modelRatings).length} teams rated</Tag>}
          {consensusRankings?.length > 0 && !consensusRankings[0]?.error && <Tag color="#38bdf8">Consensus loaded</Tag>}
          {divergenceBoard.length > 0 && <Tag color="#a78bfa">{divergenceBoard.length} divergences</Tag>}
        </div>
        <span style={{color:"#333",fontSize:"10px"}}>{open?"▲":"▼"}</span>
      </div>

      {open && (
        <div style={{marginTop:"12px"}}>
          {/* Tab row */}
          <div style={{display:"flex",gap:"5px",marginBottom:"12px",flexWrap:"wrap"}}>
            {[["model","🤖 Model Ratings"],["consensus","📡 Consensus"],["divergence","⚡ Divergences"],["ats","📋 ATS Board"]].map(([k,l])=>(
              <button key={k} onClick={()=>setTab(k)} style={{padding:"5px 10px",borderRadius:"5px",border:`1px solid ${tab===k?"rgba(251,146,60,0.4)":"rgba(255,255,255,0.08)"}`,background:tab===k?"rgba(251,146,60,0.1)":"transparent",color:tab===k?"#fb923c":"#555",fontSize:"9px",fontWeight:700,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif"}}>{l}</button>
            ))}
            {/* Fetch button */}
            <button onClick={fetchConsensusRankings} disabled={fetchLoading} style={{marginLeft:"auto",padding:"5px 10px",borderRadius:"5px",border:"1px solid rgba(56,189,248,0.25)",background:"rgba(56,189,248,0.07)",color:fetchLoading?"#333":"#38bdf8",fontSize:"9px",fontWeight:700,cursor:fetchLoading?"not-allowed":"pointer",fontFamily:"'Barlow Condensed',sans-serif",display:"flex",alignItems:"center",gap:"4px"}}>
              {fetchLoading?<><Spinner/>Fetching…</>:"↻ Fetch Rankings"}
            </button>
          </div>
          {lastUpdated && <div style={{fontSize:"8px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"8px"}}>Last fetched: {lastUpdated}</div>}

          {/* ── MODEL RATINGS TAB ── */}
          {tab==="model"&&(
            <div>
              {!hasModelData ? (
                <div style={{textAlign:"center",padding:"20px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>
                  <div style={{fontSize:"24px",marginBottom:"8px"}}>📊</div>
                  <div style={{fontSize:"11px",marginBottom:"4px",color:"#555"}}>Log 3+ game results in the Backtest Engine</div>
                  <div style={{fontSize:"9px",color:"#333"}}>Model ratings auto-compute from your prediction history</div>
                </div>
              ) : (
                <>
                  {/* Sort controls */}
                  <div style={{display:"flex",gap:"4px",marginBottom:"8px",flexWrap:"wrap"}}>
                    <span style={{fontSize:"8px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",alignSelf:"center"}}>Sort by:</span>
                    {[["composite","Composite"],["ats","ATS%"],["margin","Margin"],["games","Games"]].map(([k,l])=>(
                      <button key={k} onClick={()=>setSortBy(k)} style={{padding:"3px 7px",borderRadius:"3px",border:`1px solid ${sortBy===k?"rgba(251,146,60,0.35)":"rgba(255,255,255,0.07)"}`,background:sortBy===k?"rgba(251,146,60,0.08)":"transparent",color:sortBy===k?"#fb923c":"#444",fontSize:"8px",fontWeight:700,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif"}}>{l}</button>
                    ))}
                  </div>
                  {/* Rankings list */}
                  <div style={{display:"flex",flexDirection:"column",gap:"3px"}}>
                    {modelTeams.map(([team, stats], i) => {
                      const rating = stats.composite;
                      const ratingColor = rating >= 65?"#4ade80":rating >= 55?"#f59e0b":"#f87171";
                      return (
                        <div key={team}
                          onClick={()=>{ /* can't load without an opponent */ }}
                          style={{display:"flex",alignItems:"center",gap:"8px",padding:"7px 10px",background:"rgba(255,255,255,0.03)",border:`1px solid ${i<4?"rgba(74,222,128,0.12)":i<12?"rgba(56,189,248,0.08)":"rgba(255,255,255,0.05)"}`,borderRadius:"6px",cursor:"pointer",transition:"background 0.15s"}}
                          onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.06)"}
                          onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.03)"}>
                          {/* Rank */}
                          <div style={{width:"22px",textAlign:"center",fontSize:"10px",fontWeight:900,color:i<4?"#4ade80":i<12?"#38bdf8":"#555",fontFamily:"'Barlow Condensed',sans-serif",flexShrink:0}}>#{i+1}</div>
                          {/* Team color dot */}
                          <div style={{width:"8px",height:"8px",borderRadius:"50%",background:tc(team),flexShrink:0}}/>
                          {/* Team name */}
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:"11px",fontWeight:700,color:"#ddd",fontFamily:"'Barlow Condensed',sans-serif",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{team}</div>
                            <div style={{display:"flex",gap:"6px",marginTop:"1px",flexWrap:"wrap"}}>
                              <span style={{fontSize:"8px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>{stats.atsW}-{stats.atsL} ATS</span>
                              <span style={{fontSize:"8px",color:stats.avgMargin>=0?"#4ade80":"#f87171",fontFamily:"'Barlow Condensed',sans-serif"}}>{stats.avgMargin>=0?"+":""}{stats.avgMargin} avg margin</span>
                              <span style={{fontSize:"10px"}}>{trendIcon(stats.trend)}</span>
                            </div>
                          </div>
                          {/* Rating */}
                          <div style={{textAlign:"right",flexShrink:0}}>
                            <div style={{fontSize:"16px",fontWeight:900,color:ratingColor,fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{rating}</div>
                            <div style={{fontSize:"7px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"1px"}}>{stats.games}G · {stats.atsPct}% ATS</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{marginTop:"8px",fontSize:"8px",color:"#2a2a2a",fontFamily:"'Barlow Condensed',sans-serif"}}>Composite = 40% ATS% + 30% avg margin + 20% predicted win% + 10% recent form · Updates automatically when you log results</div>
                </>
              )}
            </div>
          )}

          {/* ── CONSENSUS TAB ── */}
          {tab==="consensus"&&(
            <div>
              {!consensusRankings ? (
                <div style={{textAlign:"center",padding:"20px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>
                  <div style={{fontSize:"24px",marginBottom:"8px"}}>📡</div>
                  <div style={{fontSize:"11px",color:"#555",marginBottom:"12px"}}>Fetch live power rankings from ESPN, NFL.com, or CBS Sports</div>
                  <button onClick={fetchConsensusRankings} disabled={fetchLoading} style={{padding:"9px 18px",borderRadius:"7px",border:"none",background:"linear-gradient(135deg,#0369a1,#0284c7)",color:"#fff",fontSize:"11px",fontWeight:700,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",display:"flex",alignItems:"center",gap:"6px",margin:"0 auto"}}>
                    {fetchLoading?<><Spinner/>Fetching Rankings…</>:"📡 Fetch This Week's Rankings"}
                  </button>
                </div>
              ) : consensusRankings[0]?.error ? (
                <div style={{color:"#f87171",fontSize:"10px",fontFamily:"'Barlow Condensed',sans-serif",textAlign:"center",padding:"12px"}}>
                  {consensusRankings[0].error} <button onClick={fetchConsensusRankings} style={{color:"#38bdf8",background:"none",border:"none",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif"}}>Retry</button>
                </div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:"3px"}}>
                  {consensusRankings.map((r, i) => (
                    <div key={i} style={{display:"flex",alignItems:"center",gap:"8px",padding:"6px 10px",background:"rgba(255,255,255,0.03)",border:`1px solid ${r.tier==="Elite"?"rgba(74,222,128,0.1)":r.tier==="Contender"?"rgba(56,189,248,0.08)":"rgba(255,255,255,0.04)"}`,borderRadius:"5px"}}>
                      <div style={{width:"22px",textAlign:"center",fontSize:"10px",fontWeight:900,color:r.rank<=4?"#4ade80":r.rank<=12?"#38bdf8":r.rank<=20?"#f59e0b":"#555",fontFamily:"'Barlow Condensed',sans-serif",flexShrink:0}}>#{r.rank}</div>
                      <div style={{width:"6px",height:"6px",borderRadius:"50%",background:tc(r.team||""),flexShrink:0}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:"10px",fontWeight:700,color:"#ddd",fontFamily:"'Barlow Condensed',sans-serif",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.team}</div>
                        {r.blurb&&<div style={{fontSize:"8px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"1px",lineHeight:"1.3"}}>{r.blurb}</div>}
                      </div>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"2px",flexShrink:0}}>
                        {r.record&&<span style={{fontSize:"9px",fontWeight:700,color:"#aaa",fontFamily:"'Barlow Condensed',sans-serif"}}>{r.record}</span>}
                        <div style={{display:"flex",gap:"4px",alignItems:"center"}}>
                          {r.change!==undefined&&r.change!==0&&<span style={{fontSize:"8px",fontWeight:700,color:changeColor(r.change),fontFamily:"'Barlow Condensed',sans-serif"}}>{changeArrow(r.change)}{Math.abs(r.change)}</span>}
                          {r.tier&&<Tag color={tierColor(r.tier)}>{r.tier}</Tag>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── DIVERGENCE TAB ── */}
          {tab==="divergence"&&(
            <div>
              <div style={{fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"10px",lineHeight:"1.6"}}>
                Teams where the model ranking differs from consensus by 3+ spots. These are your best potential edges — the market may be mispricing teams your model knows differently.
              </div>
              {(!hasModelData||!consensusRankings?.length||consensusRankings[0]?.error) ? (
                <div style={{textAlign:"center",padding:"16px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",fontSize:"10px"}}>
                  Requires both Model Ratings (log 3+ backtest results) and Consensus Rankings (fetch above)
                </div>
              ) : divergenceBoard.length === 0 ? (
                <div style={{textAlign:"center",padding:"16px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",fontSize:"10px"}}>No significant divergences found yet — model and consensus are aligned</div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:"5px"}}>
                  {divergenceBoard.map((d, i) => {
                    const modelBetter = d.diff > 0; // model ranks team higher than consensus
                    const color = modelBetter ? "#4ade80" : "#f87171";
                    const label = modelBetter ? "MODEL OVERRATES" : "MODEL UNDERRATES";
                    return (
                      <div key={d.team} style={{background:modelBetter?"rgba(74,222,128,0.04)":"rgba(248,113,113,0.04)",border:`1px solid ${color}18`,borderRadius:"7px",padding:"9px 11px",cursor:"pointer"}}
                        onClick={()=>{ /* highlight team for next analysis */ }}>
                        <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"5px"}}>
                          <div style={{width:"6px",height:"6px",borderRadius:"50%",background:tc(d.team),flexShrink:0}}/>
                          <span style={{fontSize:"11px",fontWeight:800,color:"#ddd",fontFamily:"'Barlow Condensed',sans-serif",flex:1}}>{d.team}</span>
                          <Tag color={color}>{label}</Tag>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"6px",marginBottom:"5px"}}>
                          {[["Model Rank",`#${d.modelRank}`,"#fb923c"],["Consensus",`#${d.consensusRank}`,"#38bdf8"],["Gap",`${d.diff>0?"+":""}${d.diff} spots`,color]].map(([l,v,c])=>(
                            <div key={l} style={{background:"rgba(255,255,255,0.04)",borderRadius:"4px",padding:"4px 6px",textAlign:"center"}}>
                              <div style={{fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>{l}</div>
                              <div style={{fontSize:"13px",fontWeight:900,color:c,fontFamily:"'Barlow Condensed',sans-serif"}}>{v}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{fontSize:"9px",color:`${color}bb`,fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.4"}}>
                          {modelBetter
                            ? `Model sees ${abb(d.team)} as ${Math.abs(d.diff)} spots better than consensus. ${d.stats.atsPct}% ATS in model history — potentially undervalued by the market.`
                            : `Consensus ranks ${abb(d.team)} ${Math.abs(d.diff)} spots higher than model. ${d.stats.atsPct}% ATS suggests possible overvaluation — fade opportunities when spread is inflated.`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── ATS LEADERBOARD TAB ── */}
          {tab==="ats"&&(
            <div>
              {!hasModelData ? (
                <div style={{textAlign:"center",padding:"20px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",fontSize:"10px"}}>Log game results in the Backtest Engine to build the ATS leaderboard</div>
              ) : (
                <>
                  <div style={{fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"9px"}}>Teams ranked by ATS% in your prediction history. Minimum 2 games to appear.</div>
                  {/* Header row */}
                  <div style={{display:"grid",gridTemplateColumns:"28px 1fr 50px 50px 60px 45px",gap:"6px",padding:"4px 10px",marginBottom:"4px"}}>
                    {["#","Team","ATS%","W-L","Margin","Trend"].map(h=><div key={h} style={{fontSize:"7px",fontWeight:700,color:"#333",fontFamily:"'Barlow Condensed',sans-serif",textTransform:"uppercase",letterSpacing:"0.06em"}}>{h}</div>)}
                  </div>
                  {Object.entries(modelRatings)
                    .filter(([,s])=>s.games>=2)
                    .sort((a,b)=>b[1].atsPct-a[1].atsPct)
                    .map(([team, stats], i) => {
                      const pctColor = stats.atsPct>=60?"#4ade80":stats.atsPct>=53?"#86efac":stats.atsPct>=47?"#f59e0b":"#f87171";
                      return (
                        <div key={team} style={{display:"grid",gridTemplateColumns:"28px 1fr 50px 50px 60px 45px",gap:"6px",padding:"6px 10px",background:i%2===0?"rgba(255,255,255,0.025)":"transparent",borderRadius:"4px",alignItems:"center"}}>
                          <div style={{fontSize:"9px",fontWeight:900,color:"#555",fontFamily:"'Barlow Condensed',sans-serif"}}>#{i+1}</div>
                          <div style={{display:"flex",alignItems:"center",gap:"5px",minWidth:0}}>
                            <div style={{width:"5px",height:"5px",borderRadius:"50%",background:tc(team),flexShrink:0}}/>
                            <span style={{fontSize:"9px",fontWeight:700,color:"#ccc",fontFamily:"'Barlow Condensed',sans-serif",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{abb(team)}</span>
                          </div>
                          <div style={{fontSize:"12px",fontWeight:900,color:pctColor,fontFamily:"'Barlow Condensed',sans-serif"}}>{stats.atsPct}%</div>
                          <div style={{fontSize:"9px",color:"#777",fontFamily:"'Barlow Condensed',sans-serif"}}>{stats.atsW}-{stats.atsL}</div>
                          <div style={{fontSize:"9px",fontWeight:700,color:stats.avgMargin>=0?"#4ade80":"#f87171",fontFamily:"'Barlow Condensed',sans-serif"}}>{stats.avgMargin>=0?"+":""}{stats.avgMargin}</div>
                          <div style={{fontSize:"12px"}}>{trendIcon(stats.trend)}</div>
                        </div>
                      );
                    })
                  }
                </>
              )}
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// WEEKLY RECOMMENDED PICK
// Scans the full week's schedule and surfaces the single highest-confidence,
// most edge-positive bet using 9 quick signal checks per game.
// ═══════════════════════════════════════════════════════════════════════════

function WeeklyPick({ onLoadMatchup }) {
  const [pick, setPick]         = useState(null);

export default PowerRankingsPanel;
