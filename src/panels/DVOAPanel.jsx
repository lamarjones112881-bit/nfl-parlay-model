import { useState, useEffect } from "react";
import { normalizeDVOA, dvoaToSpreadAdj, dvoaGrade } from "../utils/dvoaUtils.js";
import { Panel, PanelTitle, Tag, Spinner } from "../components/UIKit.jsx";

function DVOAPanel({ dvoaData, loading, homeTeam, awayTeam }) {
  const [open, setOpen] = useState(false);
  if (!dvoaData && !loading) return null;

  const home = dvoaData?.home;
  const away = dvoaData?.away;
  const spreadAdj = home && away
    ? dvoaToSpreadAdj(home.offDVOA, home.defDVOA, away.offDVOA, away.defDVOA)
    : null;

  function TeamDVOA({ team, d, side }) {
    if (!d) return null;
    const offG = dvoaGrade(d.offDVOA, false);
    const defG = dvoaGrade(d.defDVOA, true);
    return (
      <div style={{borderTop:"2px solid "+tc(team)+"33",paddingTop:"9px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"8px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
            <div style={{width:"6px",height:"6px",borderRadius:"50%",background:tc(team)}}/>
            <span style={{fontSize:"11px",fontWeight:800,color:tc(team),fontFamily:"'Barlow Condensed',sans-serif"}}>{abb(team)}</span>
          </div>
          {d.week && <span style={{fontSize:"8px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>{d.week}</span>}
        </div>
        {/* Off DVOA */}
        <div style={{marginBottom:"5px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"3px"}}>
            <span style={{fontSize:"8px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase"}}>Off DVOA</span>
            <div style={{display:"flex",alignItems:"center",gap:"5px"}}>
              <Tag color={offG.color}>{offG.label}</Tag>
              <span style={{fontSize:"13px",fontWeight:900,color:offG.color,fontFamily:"'Barlow Condensed',sans-serif"}}>{d.offDVOA >= 0 ? "+" : ""}{d.offDVOA}%</span>
              {d.offRank && <span style={{fontSize:"8px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>#{d.offRank}</span>}
            </div>
          </div>
          <div style={{height:"4px",borderRadius:"2px",background:"rgba(255,255,255,0.06)",overflow:"hidden"}}>
            <div style={{width:Math.abs(d.offDVOA)/50*100+"%",marginLeft:d.offDVOA<0?(50-Math.abs(d.offDVOA)/50*50)+"%":"50%",height:"100%",background:offG.color,borderRadius:"2px",transition:"all 0.6s ease"}}/>
          </div>
        </div>
        {/* Def DVOA */}
        <div style={{marginBottom:"5px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"3px"}}>
            <span style={{fontSize:"8px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase"}}>Def DVOA</span>
            <div style={{display:"flex",alignItems:"center",gap:"5px"}}>
              <Tag color={defG.color}>{defG.label}</Tag>
              <span style={{fontSize:"13px",fontWeight:900,color:defG.color,fontFamily:"'Barlow Condensed',sans-serif"}}>{d.defDVOA >= 0 ? "+" : ""}{d.defDVOA}%</span>
              {d.defRank && <span style={{fontSize:"8px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>#{d.defRank}</span>}
            </div>
          </div>
          <div style={{height:"4px",borderRadius:"2px",background:"rgba(255,255,255,0.06)",overflow:"hidden"}}>
            <div style={{width:Math.abs(d.defDVOA)/50*100+"%",marginLeft:d.defDVOA<0?(50-Math.abs(d.defDVOA)/50*50)+"%":"50%",height:"100%",background:defG.color,borderRadius:"2px",transition:"all 0.6s ease"}}/>
          </div>
          <div style={{fontSize:"7px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"1px"}}>Negative = better defense</div>
        </div>
        {/* Total + trend */}
        <div style={{display:"flex",gap:"5px",marginTop:"5px"}}>
          {d.totalDVOA != null && (
            <div style={{background:"rgba(255,255,255,0.04)",borderRadius:"4px",padding:"3px 8px",flex:1,textAlign:"center"}}>
              <div style={{fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>Total DVOA</div>
              <div style={{fontSize:"12px",fontWeight:800,color:d.totalDVOA>=0?"#4ade80":"#f87171",fontFamily:"'Barlow Condensed',sans-serif"}}>{d.totalDVOA>=0?"+":""}{d.totalDVOA}%</div>
            </div>
          )}
          {d.trend && (
            <div style={{background:"rgba(255,255,255,0.04)",borderRadius:"4px",padding:"3px 8px",flex:1,textAlign:"center"}}>
              <div style={{fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>Trend</div>
              <div style={{fontSize:"11px",fontWeight:700,color:d.trend==="improving"?"#4ade80":d.trend==="declining"?"#f87171":"#f59e0b",fontFamily:"'Barlow Condensed',sans-serif"}}>
                {d.trend==="improving"?"▲ Improving":d.trend==="declining"?"▼ Declining":"→ Stable"}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Panel border="rgba(99,102,241,0.2)" bg="rgba(99,102,241,0.02)" mb="10px">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <span style={{fontSize:"11px"}}>📊</span>
          <span style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#818cf8",fontFamily:"'Barlow Condensed',sans-serif"}}>DVOA — Football Outsiders</span>
          {loading && <Tag color="#f59e0b">loading…</Tag>}
          {dvoaData && !loading && <Tag color="#818cf8">{dvoaData.week||"Current"}</Tag>}
          {spreadAdj != null && Math.abs(spreadAdj) >= 0.5 && (
            <Tag color={spreadAdj > 0 ? "#4ade80" : "#f87171"}>
              DVOA adj {spreadAdj > 0 ? "+" : ""}{spreadAdj} pts
            </Tag>
          )}
        </div>
        <span style={{color:"#333",fontSize:"10px"}}>{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div style={{marginTop:"12px"}}>
          <div style={{fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"10px",lineHeight:"1.5"}}>
            Football Outsiders DVOA measures every snap vs what an average NFL team would do in the same situation — down, distance, field position, opponent. More predictive than raw points or yards. Negative defensive DVOA = elite defense.
          </div>

          {dvoaData && !loading ? (
            <>
              {/* Team cards */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"10px"}}>
                <TeamDVOA team={awayTeam} d={away} side="away"/>
                <TeamDVOA team={homeTeam} d={home} side="home"/>
              </div>

              {/* DVOA differential + spread impact */}
              {spreadAdj != null && (
                <div style={{background:Math.abs(spreadAdj)>=1?"rgba(99,102,241,0.08)":"rgba(255,255,255,0.03)",border:"1px solid "+(Math.abs(spreadAdj)>=1?"rgba(99,102,241,0.22)":"rgba(255,255,255,0.06)"),borderRadius:"7px",padding:"9px 12px",marginBottom:"8px"}}>
                  <div style={{fontSize:"9px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#818cf8",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"5px"}}>📐 DVOA Differential → Spread Impact</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"6px",marginBottom:"6px"}}>
                    {[
                      ["Off Diff",(home?.offDVOA||0)-(away?.offDVOA||0),(home?.offDVOA||0)-(away?.offDVOA||0)>=0?"#4ade80":"#f87171"],
                      ["Def Diff",(away?.defDVOA||0)-(home?.defDVOA||0),(away?.defDVOA||0)-(home?.defDVOA||0)<=0?"#4ade80":"#f87171"],
                      ["Spread Adj",spreadAdj,spreadAdj>0?"#4ade80":spreadAdj<0?"#f87171":"#888"],
                    ].map(([l,v,c])=>(
                      <div key={l} style={{background:"rgba(255,255,255,0.04)",borderRadius:"5px",padding:"6px",textAlign:"center"}}>
                        <div style={{fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px"}}>{l}</div>
                        <div style={{fontSize:"13px",fontWeight:900,color:c,fontFamily:"'Barlow Condensed',sans-serif"}}>{v>=0?"+":""}{typeof v==="number"?v.toFixed(1):v}</div>
                      </div>
                    ))}
                  </div>
                  {dvoaData.matchupNote && (
                    <div style={{fontSize:"9px",color:"#a5b4fc",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.4"}}>{dvoaData.matchupNote}</div>
                  )}
                </div>
              )}

              <div style={{fontSize:"8px",color:"#2a2a2a",fontFamily:"'Barlow Condensed',sans-serif"}}>
                Source: Football Outsiders · Updated weekly Tuesday · Per 10% DVOA differential ≈ 2 pts spread
              </div>
            </>
          ) : loading ? (
            <Skel cols={2}/>
          ) : null}
        </div>
      )}
    </Panel>
  );
}

// // 2. HEAD-TO-HEAD MATCHUP DATABASE
// ═══════════════════════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════════════════════
// 3. OPPONENT-ADJUSTED STATS
// SOS-corrected PPG/PAPG. Raw PPG against bad defenses inflates numbers.
// Formula: adj_ppg = (raw_ppg / avg_opp_papg) × league_avg_ppg
// ═══════════════════════════════════════════════════════════════════════════

// ── Legacy weather (binary fallback) ────────────────────────────────────────
const weatherAdjust = w => {
  if(w==="dome"||w==="ideal") return {totalAdj:0,spreadAdj:0,note:null};
  if(w==="wind")  return {totalAdj:-3.5,spreadAdj:0.5,note:"Wind 20+ mph → -3.5 total, run game favored"};
  if(w==="cold")  return {totalAdj:-2.0,spreadAdj:0.5,note:"Cold <35°F → -2.0 total, passing drops"};
  if(w==="rain")  return {totalAdj:-4.5,spreadAdj:1.0,note:"Rain/Snow → -4.5 total, turnovers up, favor dog"};
  return {totalAdj:0,spreadAdj:0,note:null};
};

// ── Key number proximity ──────────────────────────────────────────────────────
const keyNumFlag = spread => {
  if(!spread) return null;
  const s = Math.abs(parseFloat(spread));
  for(const kn of KEY_NUMBERS){
    const diff=Math.abs(s-kn);
    if(diff<=0.5) return {kn,diff,danger:true};
    if(diff<=1.0) return {kn,diff,danger:false};
  }
  return null;
};

// ── Logit Transform: Spread → Win Probability ─────────────────────────────────
// Calibrated NFL formula: each point of spread ≈ 2.75% win prob shift
// logit(p) = spread * 0.125 (in log-odds space), then sigmoid
const spreadToWinProb = (spread, favTeam, homeTeam) => {
  if(!spread||!favTeam) return {homeWin:50,awayWin:50};
  const isHomeFav = favTeam===homeTeam;
  const logOdds = spread * 0.15; // calibrated NFL constant
  const homeFavProb = Math.round(100 / (1 + Math.exp(-(logOdds))));
  const homeWin = isHomeFav ? homeFavProb : 100 - homeFavProb;
  return {homeWin:Math.max(5,Math.min(95,homeWin)), awayWin:Math.max(5,Math.min(95,100-homeWin))};
};

// ── Micro-context modifiers ───────────────────────────────────────────────────
const getMicroModifiers = (homeTeam, weather) => {
  const ctx = STADIUM_CTX[homeTeam]||{};
  const mods = [];
  if(ctx.altitude>4000) mods.push({type:"altitude",impact:"5,280ft altitude → +1.5 pts fatigue for away team",spreadAdj:1.5,color:"#f59e0b"});
  if(ctx.noise==="ELITE") mods.push({type:"noise",impact:"Elite crowd noise → +1.0 false starts for away offense",spreadAdj:0.7,color:"#4ade80"});
  if(ctx.noise==="HIGH")  mods.push({type:"noise",impact:"High-noise stadium → communication penalty for away",spreadAdj:0.3,color:"#4ade80"});
  if(ctx.turf==="field_turf") mods.push({type:"turf",impact:"Field turf → injury risk +18% vs natural grass",spreadAdj:0,color:"#f87171"});
  if(ctx.indoor&&weather!=="dome") mods.push({type:"dome",impact:"Indoor stadium — weather conditions irrelevant",spreadAdj:0,color:"#38bdf8"});
  return mods;
};

// ── API helper ────────────────────────────────────────────────────────────────
// Routing logic:
//   window.__USE_PROXY === true  →  /api/claude  (Vercel — key stays server-side)
//   otherwise                   →  Anthropic direct (Claude artifact runtime)
async function callClaude({prompt,useSearch=false,maxTokens=900}){
  const body={model:"claude-sonnet-4-20250514",max_tokens:maxTokens,messages:[{role:"user",content:prompt}]};
  if(useSearch) body.tools=[{type:"web_search_20250305",name:"web_search"}];
  const useProxy = typeof window!=="undefined" && window.__USE_PROXY===true;
  const endpoint = useProxy ? "/api/claude" : "https://api.anthropic.com/v1/messages";
  const headers  = {"Content-Type":"application/json"};
  if(useProxy && typeof window!=="undefined" && window.__APP_TOKEN)
    headers["x-app-token"]=window.__APP_TOKEN;
  const res=await fetch(endpoint,{method:"POST",headers,body:JSON.stringify(body)});
  const data=await res.json();
  if(data.error) throw new Error(data.error.message);
  return data.content?.filter(b=>b.type==="text").map(b=>b.text).join("")||"";
}
// ── Shared UI atoms ───────────────────────────────────────────────────────────
function Spinner(){return <span style={{width:"10px",height:"10px",border:"1.5px solid rgba(255,255,255,0.2)",borderTopColor:"#aaa",borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite"}}/>;}
function Tag({children,color="#555"}){return <span style={{fontSize:"9px",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color,background:`${color}18`,border:`1px solid ${color}33`,borderRadius:"4px",padding:"2px 6px",fontFamily:"'Barlow Condensed',sans-serif"}}>{children}</span>;}

export default DVOAPanel;
