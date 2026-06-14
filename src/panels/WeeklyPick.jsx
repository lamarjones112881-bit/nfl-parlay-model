import { useState, useEffect } from "react";
import { Panel, PanelTitle, Tag, Spinner } from "../components/UIKit.jsx";

function WeeklyPick({ onLoadMatchup }) {
  const [pick, setPick]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [open, setOpen]         = useState(true);
  const [lastFetched, setLastFetched] = useState(null);
  const [expanded, setExpanded] = useState(false);

  async function fetchWeeklyPick() {
    setLoading(true); setPick(null);
    try {
      const text = await callClaude({
        useSearch: true,
        maxTokens: 1400,
        prompt: `You are an elite NFL handicapper. Search for the current NFL week's full schedule and betting lines.

Analyze EVERY game on this week's slate. For each game evaluate:
1. Sharp money / line movement direction
2. Public betting % vs sharp % (reverse line movement)
3. Home/away ATS splits and trends
4. Injury report impact
5. Divisional game spot (historically tighter, dogs cover higher rate)
6. Prime time advantage/disadvantage
7. Rest advantage (days since last game)
8. Key number proximity (-3/-7)
9. Multi-season ATS trend for both teams

Score each game 0-100 on bet-ability. Find the SINGLE best bet of the week — the one with the most convergent signals, real sharp backing, and genuine edge.

Return ONLY JSON (no markdown):
{
  "weekLabel": "Week 14",
  "pick": {
    "away": "full team name",
    "home": "full team name",
    "betType": "Spread or Moneyline or Over or Under",
    "side": "e.g. Bills -3 or Under 44.5",
    "confidence": 72,
    "grade": "A",
    "spread": "e.g. -3",
    "total": "e.g. 44.5",
    "favTeam": "full team name",
    "odds": "-110",
    "isPrimeTime": false,
    "isDivisional": false,
    "isHomeDog": false,
    "rlm": true,
    "reasons": [
      "Sharp money at 68% on Bills despite public at 72% on KC — clear RLM signal",
      "Bills 7-2 ATS off a rest advantage, KC 3-6 ATS on short week",
      "Key number -3: historically the most frequent final margin in NFL"
    ],
    "risks": [
      "Patrick Mahomes historically dominant in prime time (+4.2 pts vs spread average)"
    ],
    "analysis": "150-word breakdown of why this is the best bet of the week integrating all signals above",
    "betScore": 87
  },
  "honourableMentions": [
    {"away":"full name","home":"full name","side":"e.g. Ravens -7","reason":"Brief 1-line reason this is also worth watching","grade":"B"}
  ]
}

Be specific with real data. If a game is unavailable or lines aren't posted yet, skip it.`
      });

      const m = text.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("No JSON");
      const data = JSON.parse(m[0]);
      setPick(data);
      setLastFetched(new Date());
    } catch(e) {
      setPick({ error: "Could not generate weekly pick — try again." });
    }
    setLoading(false);
  }

  const p = pick?.pick;
  const gradeColor = g => ({A:"#4ade80",B:"#86efac",C:"#f59e0b",D:"#f87171"}[g]||"#888");
  const confColor  = c => c>=70?"#4ade80":c>=58?"#f59e0b":"#f87171";

  return (
    <div style={{marginBottom:"14px",background:"linear-gradient(135deg,rgba(251,191,36,0.07),rgba(251,191,36,0.02))",border:"1px solid rgba(251,191,36,0.25)",borderRadius:"13px",overflow:"hidden",animation:"fadeSlideUp 0.4s ease-out"}}>
      {/* Header bar */}
      <div style={{padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",borderBottom:open&&p?"1px solid rgba(251,191,36,0.12)":"none"}} onClick={()=>setOpen(o=>!o)}>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <div style={{width:"32px",height:"32px",borderRadius:"8px",background:"linear-gradient(135deg,#b45309,#78350f)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",flexShrink:0}}>🏆</div>
          <div>
            <div style={{fontSize:"12px",fontWeight:900,letterSpacing:"0.1em",textTransform:"uppercase",color:"#fbbf24",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>
              Weekly Best Bet {pick?.weekLabel?`— ${pick.weekLabel}`:""}
            </div>
            <div style={{fontSize:"8px",color:"#78350f",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"2px",letterSpacing:"0.07em",textTransform:"uppercase"}}>
              {loading?"Scanning full schedule…":p?`${p.betType}: ${p.side}`:lastFetched?`Last updated ${lastFetched.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}`:"Model scans entire week · finds highest-edge bet"}
            </div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"7px"}}>
          {!p&&!loading&&<button onClick={e=>{e.stopPropagation();fetchWeeklyPick();}} style={{padding:"7px 14px",borderRadius:"7px",border:"none",background:"linear-gradient(135deg,#b45309,#92400e)",color:"#fff",fontSize:"10px",fontWeight:800,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",display:"flex",alignItems:"center",gap:"5px"}}>
            ✨ Get Pick
          </button>}
          {p&&!loading&&<button onClick={e=>{e.stopPropagation();fetchWeeklyPick();}} style={{padding:"5px 10px",borderRadius:"5px",border:"1px solid rgba(251,191,36,0.25)",background:"rgba(251,191,36,0.08)",color:"#fbbf24",fontSize:"9px",fontWeight:700,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif"}}>↻ Refresh</button>}
          {loading&&<div style={{display:"flex",alignItems:"center",gap:"6px",color:"#f59e0b",fontSize:"9px",fontFamily:"'Barlow Condensed',sans-serif"}}><Spinner/>Analyzing {pick?.weekLabel||"schedule"}…</div>}
          <span style={{color:"#78350f",fontSize:"10px"}}>{open?"▲":"▼"}</span>
        </div>
      </div>

      {/* Main pick */}
      {open && p && (
        <div style={{padding:"14px 16px"}}>
          {/* Grade + confidence */}
          <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"12px"}}>
            <div style={{width:"52px",height:"52px",borderRadius:"10px",background:`${gradeColor(p.grade)}15`,border:`2px solid ${gradeColor(p.grade)}40`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <span style={{fontSize:"26px",fontWeight:900,color:gradeColor(p.grade),fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{p.grade}</span>
            </div>
            <div style={{flex:1,minWidth:0}}>
              {/* Matchup */}
              <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"4px",flexWrap:"wrap"}}>
                <span style={{fontSize:"14px",fontWeight:900,color:tc(p.away),fontFamily:"'Barlow Condensed',sans-serif"}}>{abb(p.away)}</span>
                <span style={{fontSize:"10px",color:"#444"}}>@</span>
                <span style={{fontSize:"14px",fontWeight:900,color:tc(p.home),fontFamily:"'Barlow Condensed',sans-serif"}}>{abb(p.home)}</span>
                <div style={{display:"flex",gap:"4px",flexWrap:"wrap"}}>
                  {p.isDivisional&&<Tag color="#fb923c">⚔️ DIV</Tag>}
                  {p.isHomeDog&&<Tag color="#4ade80">🏠 Dog</Tag>}
                  {p.rlm&&<Tag color="#fbbf24">🔥 RLM</Tag>}
                  {p.isPrimeTime&&<Tag color="#ec4899">🌙 PT</Tag>}
                </div>
              </div>
              {/* The pick itself — large and prominent */}
              <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                <div style={{background:"linear-gradient(135deg,rgba(251,191,36,0.15),rgba(251,191,36,0.05))",border:"1px solid rgba(251,191,36,0.3)",borderRadius:"8px",padding:"6px 12px"}}>
                  <div style={{fontSize:"7px",color:"#78350f",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"1px",letterSpacing:"0.09em",textTransform:"uppercase"}}>{p.betType}</div>
                  <div style={{fontSize:"18px",fontWeight:900,color:"#fbbf24",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{p.side}</div>
                  {p.odds&&<div style={{fontSize:"9px",color:"#a16207",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"1px"}}>{p.odds}</div>}
                </div>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:"8px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"1px"}}>CONFIDENCE</div>
                  <div style={{fontSize:"22px",fontWeight:900,color:confColor(p.confidence||70),fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{p.confidence}%</div>
                </div>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:"8px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"1px"}}>BET SCORE</div>
                  <div style={{fontSize:"22px",fontWeight:900,color:p.betScore>=80?"#4ade80":p.betScore>=65?"#f59e0b":"#888",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{p.betScore}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Confidence bar */}
          <div style={{marginBottom:"11px"}}>
            <div style={{height:"5px",borderRadius:"3px",background:"rgba(255,255,255,0.06)",overflow:"hidden"}}>
              <div style={{width:`${p.confidence||70}%`,height:"100%",background:`linear-gradient(90deg,${confColor(p.confidence||70)},${confColor(p.confidence||70)}aa)`,borderRadius:"3px",transition:"width 0.8s cubic-bezier(0.16,1,0.3,1)"}}/>
            </div>
          </div>

          {/* Reasons */}
          <div style={{marginBottom:"10px"}}>
            <div style={{fontSize:"8px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#4ade80",marginBottom:"5px",fontFamily:"'Barlow Condensed',sans-serif"}}>✓ WHY THIS BET</div>
            {p.reasons?.map((r,i)=>(
              <div key={i} style={{display:"flex",alignItems:"flex-start",gap:"7px",padding:"5px 8px",background:"rgba(74,222,128,0.04)",border:"1px solid rgba(74,222,128,0.1)",borderRadius:"5px",marginBottom:"3px"}}>
                <div style={{width:"16px",height:"16px",borderRadius:"50%",background:"rgba(74,222,128,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"8px",fontWeight:900,color:"#4ade80",flexShrink:0,marginTop:"1px"}}>{i+1}</div>
                <div style={{fontSize:"10px",color:"#86efac",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.5"}}>{r}</div>
              </div>
            ))}
          </div>

          {/* Risks */}
          {p.risks?.length>0&&(
            <div style={{marginBottom:"10px"}}>
              <div style={{fontSize:"8px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#f59e0b",marginBottom:"4px",fontFamily:"'Barlow Condensed',sans-serif"}}>⚠ RISKS TO MONITOR</div>
              {p.risks.map((r,i)=>(
                <div key={i} style={{fontSize:"9px",color:"#fde68a",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.5",padding:"3px 0"}}>• {r}</div>
              ))}
            </div>
          )}

          {/* Full analysis (collapsed by default) */}
          {p.analysis&&(
            <div style={{marginBottom:"10px"}}>
              {!expanded?(
                <button onClick={()=>setExpanded(true)} style={{fontSize:"8px",fontWeight:700,letterSpacing:"0.09em",textTransform:"uppercase",color:"#555",background:"none",border:"none",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",padding:0}}>Full Analysis ▸</button>
              ):(
                <>
                  <div style={{fontSize:"8px",fontWeight:700,letterSpacing:"0.09em",textTransform:"uppercase",color:"#555",marginBottom:"5px",fontFamily:"'Barlow Condensed',sans-serif",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span>Full Analysis</span>
                    <button onClick={()=>setExpanded(false)} style={{color:"#555",background:"none",border:"none",cursor:"pointer",fontSize:"9px",fontFamily:"'Barlow Condensed',sans-serif"}}>▴ Collapse</button>
                  </div>
                  <div style={{fontSize:"10px",color:"#888",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.7",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:"6px",padding:"10px"}}>{p.analysis}</div>
                </>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div style={{display:"flex",gap:"7px"}}>
            <button onClick={()=>onLoadMatchup(p.away,p.home)} style={{flex:1,padding:"10px",borderRadius:"7px",border:"none",background:"linear-gradient(135deg,#16a34a,#15803d)",color:"#fff",fontSize:"11px",fontWeight:800,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:"6px"}}>
              🔍 Load Full 17-Signal Analysis
            </button>
            <button onClick={()=>{onLoadMatchup(p.away,p.home);if(window._onBetIntent)window._onBetIntent();}}
              style={{padding:"10px 14px",borderRadius:"7px",border:"none",background:"linear-gradient(135deg,#b45309,#92400e)",color:"#fff",fontSize:"10px",fontWeight:800,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:"5px"}}>
              💰 Bet This
            </button>
          </div>

          {/* Honourable mentions */}
          {pick?.honourableMentions?.length>0&&(
            <div style={{marginTop:"11px",borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:"10px"}}>
              <div style={{fontSize:"8px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#555",marginBottom:"6px",fontFamily:"'Barlow Condensed',sans-serif"}}>Also Watching This Week</div>
              {pick.honourableMentions.map((m,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:"8px",padding:"6px 9px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"5px",marginBottom:"3px",cursor:"pointer"}}
                  onClick={()=>onLoadMatchup(m.away,m.home)}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.06)"}
                  onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.03)"}>
                  <div style={{width:"18px",height:"18px",borderRadius:"50%",background:`${gradeColor(m.grade)}15`,border:`1px solid ${gradeColor(m.grade)}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"9px",fontWeight:900,color:gradeColor(m.grade),flexShrink:0}}>{m.grade}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:"10px",fontWeight:700,color:"#ccc",fontFamily:"'Barlow Condensed',sans-serif"}}><span style={{color:tc(m.away)}}>{abb(m.away)}</span> @ <span style={{color:tc(m.home)}}>{abb(m.home)}</span> — <span style={{color:"#fbbf24"}}>{m.side}</span></div>
                    <div style={{fontSize:"8px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"1px"}}>{m.reason}</div>
                  </div>
                  <span style={{fontSize:"9px",color:"#38bdf8",fontFamily:"'Barlow Condensed',sans-serif",flexShrink:0}}>Analyze →</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error state */}
      {open && pick?.error && (
        <div style={{padding:"12px 16px",fontSize:"10px",color:"#f87171",fontFamily:"'Barlow Condensed',sans-serif"}}>
          {pick.error} <button onClick={fetchWeeklyPick} style={{color:"#38bdf8",background:"none",border:"none",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif"}}>Try again</button>
        </div>
      )}
    </div>
  );
}

// ── Week Schedule ─────────────────────────────────────────────────────────────────
function WeekSchedule({onSelectGame}){

export default WeeklyPick;
