import { useState } from "react";
import { abb, tc, RISK_COLORS } from "../constants/teams.js";
import { Tag, Panel, PanelTitle } from "./UIKit.jsx";

function GameCard({result:r,homeTeam,awayTeam,weather,lines,pressureData,olData,microData,cpoeData,coachData,leverageData,garbageData,onAddToParlay,parlayFull}){
  const [betType,setBetType]=useState("Spread");const [customPick,setCustomPick]=useState("");
  const winnerIsHome=r.winner&&homeTeam.toLowerCase().includes(r.winner.toLowerCase().split(" ").pop());
  const suggestedPick=betType==="Spread"?(r.spreadPick||""):betType==="Moneyline"?(r.winner||""):betType==="Over"?`Over ${r.total||""}`:`Under ${r.total||""}`;
  const finalPick=customPick||suggestedPick;
  const pickTeam=betType==="Spread"||betType==="Moneyline"?(winnerIsHome?homeTeam:awayTeam):null;
  const winProb=betType==="Over"||betType==="Under"?r.totalWinProb:r.winProb;
  const isDiv=isDivisional(homeTeam,awayTeam);
  const isHomeDog=lines&&lines.favTeam&&lines.favTeam!==homeTeam;
  const adj=weatherAdjust(weather);
  const adjTotal=r.total&&adj.totalAdj!==0?(parseFloat(r.total)+adj.totalAdj).toFixed(1):null;
  const kFlag=keyNumFlag(lines?.spread);
  const cpoeEdge=!!(cpoeData?.matchupEdge);
  const coachEdge=!!(coachData?.spreadImpact&&Math.abs(coachData.spreadImpact)>=0.5);
  const luckRegressed=!!(leverageData?.regressionVerdict);
  const garbageContaminated=!!(garbageData?.contaminated);
  const logitWP=lines?spreadToWinProb(lines.spread,lines.favTeam,homeTeam):null;
  const logitDiv=logitWP?Math.abs((r.winProb||50)-logitWP.homeWin):0;
  // Composite spread adj
  const microAdj=microData?.compositeAdj||0;
  const pressAdj=pressureData?.spreadImpact||0;
  const weatherAdj=adj.spreadAdj||0;
  const coachAdj=coachData?.spreadImpact||0;
  const totalSpreadAdj=parseFloat((microAdj+pressAdj+weatherAdj+coachAdj).toFixed(1));

  return(<div style={{background:"linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))",border:"1px solid rgba(255,255,255,0.09)",borderRadius:"13px",padding:"16px",animation:"fadeSlideUp 0.5s ease-out",marginBottom:"8px"}}>
    {/* Header */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"9px"}}>
      <div style={{display:"flex",alignItems:"center",gap:"5px"}}><div style={{width:"5px",height:"5px",borderRadius:"50%",background:"#4ade80",boxShadow:"0 0 6px #4ade80"}}/><span style={{fontSize:"9px",fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",color:"#4ade80",fontFamily:"'Barlow Condensed',sans-serif"}}>Analysis Complete</span></div>
      <div style={{display:"flex",gap:"3px",flexWrap:"wrap",justifyContent:"flex-end"}}>{r.parlayRisk&&<Tag color={RISK_COLORS[r.parlayRisk]||"#aaa"}>Risk:{r.parlayRisk}</Tag>}{cpoeEdge&&<Tag color="#ec4899">🎯 CPOE</Tag>}{coachEdge&&<Tag color="#14b8a6">🧠 Coach</Tag>}{luckRegressed&&<Tag color="#6366f1">🎲 Regressed</Tag>}{garbageContaminated&&<Tag color="#fb923c">🗑️ Filtered</Tag>}</div>
    </div>
    {/* Contextual badges */}
    <div style={{display:"flex",gap:"3px",flexWrap:"wrap",marginBottom:"8px"}}>
      {isDiv&&<div style={{display:"flex",alignItems:"center",gap:"3px",background:"rgba(251,146,60,0.07)",border:"1px solid rgba(251,146,60,0.18)",borderRadius:"4px",padding:"2px 6px"}}><span style={{fontSize:"9px"}}>⚔️</span><span style={{fontSize:"8px",fontWeight:700,color:"#fb923c",fontFamily:"'Barlow Condensed',sans-serif",textTransform:"uppercase"}}>{getDivision(homeTeam)}</span></div>}
      {isHomeDog&&<div style={{display:"flex",alignItems:"center",gap:"3px",background:"rgba(74,222,128,0.06)",border:"1px solid rgba(74,222,128,0.15)",borderRadius:"4px",padding:"2px 6px"}}><span style={{fontSize:"9px"}}>🏠</span><span style={{fontSize:"8px",fontWeight:700,color:"#4ade80",fontFamily:"'Barlow Condensed',sans-serif",textTransform:"uppercase"}}>Home Dog +{lines?.spread}</span></div>}
      {adj.note&&adjTotal&&<div style={{display:"flex",alignItems:"center",gap:"2px",background:"rgba(56,189,248,0.05)",border:"1px solid rgba(56,189,248,0.12)",borderRadius:"4px",padding:"2px 6px"}}><span style={{fontSize:"8px"}}>🌦</span><span style={{fontSize:"8px",color:"#38bdf8",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:600}}>O/U {r.total}→{adjTotal}</span></div>}
      {totalSpreadAdj!==0&&<div style={{display:"flex",alignItems:"center",gap:"2px",background:"rgba(139,92,246,0.06)",border:"1px solid rgba(139,92,246,0.13)",borderRadius:"4px",padding:"2px 6px"}}><span style={{fontSize:"8px"}}>📐</span><span style={{fontSize:"8px",color:"#a78bfa",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:600}}>Spread adj {totalSpreadAdj>0?"+":""}{totalSpreadAdj}pts</span></div>}
      {logitDiv>=3&&<div style={{display:"flex",alignItems:"center",gap:"2px",background:"rgba(167,139,250,0.06)",border:"1px solid rgba(167,139,250,0.14)",borderRadius:"4px",padding:"2px 6px"}}><span style={{fontSize:"8px"}}>📐</span><span style={{fontSize:"8px",color:"#a78bfa",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:600}}>Logit {logitDiv.toFixed(0)}% edge</span></div>}
    </div>
    {kFlag&&<KeyNumBadge spread={lines?.spread}/>}
    <div style={{marginBottom:"10px"}}><WinBar homeWin={r.homeWin||50} awayWin={r.awayWin||50} homeTeam={homeTeam} awayTeam={awayTeam}/></div>
    {/* Numbers */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"5px",marginBottom:"9px"}}>
      {[[abb(r.winner||homeTeam),r.spreadPick||"—","SPREAD",tc(winnerIsHome?homeTeam:awayTeam)],[r.predictedScore||"—","","SCORE","#fff"],[adjTotal?`${r.total}→${adjTotal}`:r.total||"—",r.totalLean?`${r.totalLean.toUpperCase()}`:"","TOTAL",adjTotal?"#38bdf8":"#c084fc"],[r.confidence||"—","","CONF",r.confidence==="HIGH"?"#4ade80":r.confidence==="MEDIUM"?"#f59e0b":"#f87171"]].map(([val,sub,lbl,color],i)=>(
        <div key={i} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:"6px",padding:"7px 5px",textAlign:"center"}}>
          <div style={{fontSize:"7px",fontWeight:700,letterSpacing:"0.09em",textTransform:"uppercase",color:"#222",marginBottom:"2px",fontFamily:"'Barlow Condensed',sans-serif"}}>{lbl}</div>
          <div style={{fontSize:"12px",fontWeight:900,color,fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{val}</div>
          {sub&&<div style={{fontSize:"7px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"2px"}}>{sub}</div>}
        </div>
      ))}
    </div>
    {/* Public */}
    {r.publicBetting&&<div style={{background:"rgba(255,255,255,0.02)",border:`1px solid ${r.publicBetting.rlm?"rgba(251,191,36,0.18)":"rgba(255,255,255,0.05)"}`,borderRadius:"6px",padding:"8px 10px",marginBottom:"7px"}}><div style={{display:"flex",alignItems:"center",gap:"5px",marginBottom:"5px"}}><span style={{fontSize:"8px",fontWeight:700,letterSpacing:"0.09em",textTransform:"uppercase",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>👥 Public %</span>{r.publicBetting.rlm&&<Tag color="#fbbf24">🔥 RLM</Tag>}{r.publicBetting.sharpSide&&<Tag color="#4ade80">Sharp: {abb(r.publicBetting.sharpSide)}</Tag>}</div><div style={{height:"5px",borderRadius:"3px",background:"rgba(255,255,255,0.04)",overflow:"hidden",display:"flex",marginBottom:"3px"}}><div style={{width:`${r.publicBetting.awayBetPct||50}%`,background:tc(awayTeam),opacity:0.7}}/><div style={{width:`${100-(r.publicBetting.awayBetPct||50)}%`,background:tc(homeTeam),opacity:0.7}}/></div><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:"8px",color:"#2a2a2a",fontFamily:"'Barlow Condensed',sans-serif"}}>{abb(awayTeam)} {r.publicBetting.awayBetPct||"?"}%</span><span style={{fontSize:"8px",color:"#2a2a2a",fontFamily:"'Barlow Condensed',sans-serif"}}>{100-(r.publicBetting.awayBetPct||50)}% {abb(homeTeam)}</span></div>{r.publicBetting.rlm&&<div style={{fontSize:"8px",color:"#fbbf24",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"4px",fontStyle:"italic"}}>{r.publicBetting.rlmNote||"Sharp opposing public"}</div>}</div>}
    {r.qbMatchup&&<QBPanel qbData={r.qbMatchup} homeTeam={homeTeam} awayTeam={awayTeam}/>}
    {/* Situations */}
    {r.situations&&(r.situations.flags?.length>0||r.situations.edges?.length>0)&&<div style={{marginTop:"7px"}}>{r.situations.flags?.length>0&&<div style={{background:"rgba(239,68,68,0.04)",border:"1px solid rgba(239,68,68,0.1)",borderRadius:"5px",padding:"6px 8px",marginBottom:"4px"}}><div style={{fontSize:"8px",fontWeight:700,letterSpacing:"0.09em",textTransform:"uppercase",color:"#f87171",marginBottom:"2px",fontFamily:"'Barlow Condensed',sans-serif"}}>⚠ Situations</div>{r.situations.flags.map((f,i)=><div key={i} style={{fontSize:"9px",color:"#fca5a5",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.4"}}>• {f}</div>)}</div>}{r.situations.edges?.length>0&&<div style={{background:"rgba(74,222,128,0.03)",border:"1px solid rgba(74,222,128,0.09)",borderRadius:"5px",padding:"6px 8px"}}><div style={{fontSize:"8px",fontWeight:700,letterSpacing:"0.09em",textTransform:"uppercase",color:"#4ade80",marginBottom:"2px",fontFamily:"'Barlow Condensed',sans-serif"}}>✓ Sit. Edges</div>{r.situations.edges.map((e,i)=><div key={i} style={{fontSize:"9px",color:"#86efac",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.4"}}>• {e}</div>)}</div>}</div>}
    {r.flags?.length>0&&<div style={{background:"rgba(248,113,113,0.04)",border:"1px solid rgba(248,113,113,0.09)",borderRadius:"5px",padding:"6px 8px",marginTop:"6px"}}><div style={{fontSize:"8px",fontWeight:700,textTransform:"uppercase",color:"#f87171",marginBottom:"2px",fontFamily:"'Barlow Condensed',sans-serif"}}>⚠ Risk Flags</div>{r.flags.map((f,i)=><div key={i} style={{fontSize:"9px",color:"#fca5a5",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.4"}}>• {f}</div>)}</div>}
    {r.edges?.length>0&&<div style={{background:"rgba(74,222,128,0.03)",border:"1px solid rgba(74,222,128,0.08)",borderRadius:"5px",padding:"6px 8px",marginTop:"5px"}}><div style={{fontSize:"8px",fontWeight:700,textTransform:"uppercase",color:"#4ade80",marginBottom:"2px",fontFamily:"'Barlow Condensed',sans-serif"}}>✓ Model Edges</div>{r.edges.map((e,i)=><div key={i} style={{fontSize:"9px",color:"#86efac",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.4"}}>• {e}</div>)}</div>}
    <details style={{marginTop:"7px",marginBottom:"9px"}}><summary style={{fontSize:"8px",fontWeight:700,letterSpacing:"0.09em",textTransform:"uppercase",color:"#2a2a2a",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",userSelect:"none"}}>Full Analysis ▸</summary><div style={{fontSize:"10px",lineHeight:"1.7",color:"#777",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"7px"}}>{(r.analysis||"").split("\n").filter(l=>l.trim()).map((line,i)=>{const bold=line.startsWith("**")||line.startsWith("##");const clean=line.replace(/\*\*/g,"").replace(/##\s?/g,"");return clean.trim()?<p key={i} style={{margin:"0 0 4px 0",color:bold?"#ccc":"#666",fontWeight:bold?700:400}}>{clean}</p>:null;})}</div></details>
    {/* Add to parlay */}
    <div style={{borderTop:"1px solid rgba(255,255,255,0.05)",paddingTop:"8px"}}>
      <div style={{fontSize:"8px",fontWeight:700,letterSpacing:"0.09em",textTransform:"uppercase",color:"#222",marginBottom:"5px",fontFamily:"'Barlow Condensed',sans-serif"}}>Add to Parlay</div>
      <div style={{display:"flex",gap:"3px",alignItems:"center",flexWrap:"wrap"}}>
        <div style={{display:"flex",gap:"2px"}}>{BET_TYPES.map(t=><button key={t} onClick={()=>{setBetType(t);setCustomPick("");}} style={{padding:"3px 6px",borderRadius:"3px",border:`1px solid ${betType===t?"rgba(251,191,36,0.3)":"rgba(255,255,255,0.06)"}`,background:betType===t?"rgba(251,191,36,0.07)":"transparent",color:betType===t?"#fbbf24":"#333",fontSize:"8px",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700}}>{t}</button>)}</div>
        <input value={customPick} onChange={e=>setCustomPick(e.target.value)} placeholder={suggestedPick||"e.g. KC -3.5"} style={{flex:1,minWidth:"70px",padding:"4px 7px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"3px",color:"#ddd",fontSize:"9px",outline:"none",fontFamily:"'Barlow Condensed',sans-serif"}}/>
        <button onClick={()=>onAddToParlay({awayTeam,homeTeam,betType,pick:finalPick,pickTeam,winProb:winProb||55,risk:r.parlayRisk||"MEDIUM",sharpSide:r.publicBetting?.sharpSide,rlm:r.publicBetting?.rlm,divisional:isDiv,homedog:!!isHomeDog,keyNumFlag:kFlag,cpoeEdge,coachEdge,luckRegressed})} disabled={parlayFull} style={{padding:"4px 9px",borderRadius:"3px",border:"none",background:parlayFull?"rgba(255,255,255,0.03)":"linear-gradient(135deg,#b45309,#92400e)",color:parlayFull?"#222":"#fff",fontSize:"9px",fontWeight:800,cursor:parlayFull?"not-allowed":"pointer",fontFamily:"'Barlow Condensed',sans-serif",whiteSpace:"nowrap"}}>
          {parlayFull?"Full":"+ Add"}
        </button>
      </div>
    </div>
  </div>);
}
// ── Parlay Correlation Matrix Panel ──────────────────────────────────────────
function CorrelationMatrixPanel({ legs, weather }) {
  const [open, setOpen] = useState(false);
  if (!legs || legs.length < 2) return null;
  const result = buildCorrelationMatrix(legs, weather);
  if (!result) return null;
  const { matrix, baseProb, adjustedProb, totalCorr } = result;
  const hasSignificant = matrix.some(m => m.strength !== "WEAK");
  const adjDiff = (parseFloat(adjustedProb) - parseFloat(baseProb)).toFixed(1);
  const corrColor = parseFloat(totalCorr) > 0.1 ? "#f59e0b" : parseFloat(totalCorr) < -0.1 ? "#f87171" : "#4ade80";
  return (
    <Panel border="rgba(250,204,21,0.18)" bg="rgba(250,204,21,0.02)" mb="10px">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        <div style={{display:"flex",alignItems:"center",gap:"7px"}}>
          <span style={{fontSize:"11px"}}>🔗</span>
          <span style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#facc15",fontFamily:"'Barlow Condensed',sans-serif"}}>Parlay Correlation Matrix</span>
          <Tag color={corrColor}>Adj Prob: {adjustedProb}%</Tag>
          {hasSignificant && <Tag color="#f59e0b">⚠ Correlated Legs</Tag>}
        </div>
        <span style={{color:"#333",fontSize:"10px"}}>{open?"▲":"▼"}</span>
      </div>
      {open && (
        <div style={{marginTop:"11px"}}>
          <div style={{fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"9px",lineHeight:"1.5"}}>
            Correlation-adjusted parlay probability accounts for leg interdependence. Base probability multiplies legs independently — adjusted reflects real-world correlations. Target: adjusted prob &gt; base = legs reinforce each other.
          </div>
          {/* Summary row */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"5px",marginBottom:"10px"}}>
            {[["Base Prob",`${baseProb}%`,"#aaa","Independent multiplication"],["Adj Prob",`${adjustedProb}%`,parseFloat(adjustedProb)>parseFloat(baseProb)?"#4ade80":parseFloat(adjustedProb)<parseFloat(baseProb)?"#f87171":"#aaa","Correlation-adjusted"],["Net Impact",`${parseFloat(adjDiff)>0?"+":""}${adjDiff}%`,parseFloat(adjDiff)>0?"#4ade80":parseFloat(adjDiff)<0?"#f87171":"#aaa","From cross-leg correlation"]].map(([l,v,c,s])=>(
              <div key={l} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"6px",padding:"8px 7px",textAlign:"center"}}>
                <div style={{fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px"}}>{l}</div>
                <div style={{fontSize:"16px",fontWeight:900,color:c,fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{v}</div>
                <div style={{fontSize:"7px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"2px"}}>{s}</div>
              </div>
            ))}
          </div>
          {/* Leg pair correlations */}
          {matrix.map((m,i) => {
            const corrColor2 = m.direction==="positive"?"#f59e0b":m.direction==="negative"?"#4ade80":"#555";
            const bgColor = m.direction==="positive"?"rgba(245,158,11,0.05)":m.direction==="negative"?"rgba(74,222,128,0.04)":"rgba(255,255,255,0.02)";
            return (
              <div key={i} style={{background:bgColor,border:`1px solid ${corrColor2}18`,borderRadius:"6px",padding:"8px 10px",marginBottom:"5px"}}>
                <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"4px"}}>
                  <div style={{fontSize:"9px",fontWeight:700,color:"#888",fontFamily:"'Barlow Condensed',sans-serif"}}>Leg {m.legA+1} × Leg {m.legB+1}</div>
                  <Tag color={corrColor2}>{m.direction==="positive"?"+ Correlated":m.direction==="negative"?"– Anti-Correlated":"≈ Independent"}</Tag>
                  <Tag color={m.strength==="STRONG"?"#f87171":m.strength==="MODERATE"?"#f59e0b":"#555"}>{m.strength}</Tag>
                  <span style={{marginLeft:"auto",fontSize:"10px",fontWeight:900,color:corrColor2,fontFamily:"'Barlow Condensed',sans-serif"}}>{m.correlation>0?"+":""}{m.correlation}</span>
                </div>
                <div style={{fontSize:"8px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px"}}>{m.labelA} ↔ {m.labelB}</div>
                <div style={{fontSize:"9px",color:`${corrColor2}cc`,fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.4"}}>{m.reason}</div>
              </div>
            );
          })}
          <div style={{marginTop:"7px",fontSize:"8px",color:"#2a2a2a",fontFamily:"'Barlow Condensed',sans-serif"}}>Correlation values: +1.0 = perfectly correlated · 0 = independent · -1.0 = perfectly inverse</div>
        </div>
      )}
    </Panel>
  );
}

// ── Model vs Vegas Divergence Alert ──────────────────────────────────────────
function DivergenceAlert({ lines, gameResult }) {
  if (!lines || !gameResult) return null;
  const vegasSpread = lines.spread;
  const modelSpread = gameResult.spreadPick ? parseFloat((gameResult.spreadPick||"").replace(/[^0-9.]/g,"")) : null;
  if (!modelSpread || !vegasSpread) return null;
  const div = calcDivergence(modelSpread, vegasSpread, gameResult.winner, lines.favTeam);
  if (!div || div.absDiff < 1.0) return null;
  const color = div.isExtreme ? "#ef4444" : div.isSignificant ? "#f87171" : "#f59e0b";
  const bg = div.isExtreme ? "rgba(239,68,68,0.07)" : div.isSignificant ? "rgba(248,113,113,0.06)" : "rgba(245,158,11,0.05)";
  return (
    <div style={{background:bg,border:`1px solid ${color}28`,borderRadius:"7px",padding:"10px 13px",marginBottom:"9px",animation:"fadeSlideUp 0.3s ease-out"}}>
      <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
        <div style={{width:"8px",height:"8px",borderRadius:"50%",background:color,flexShrink:0,boxShadow:`0 0 8px ${color}`,animation:div.isExtreme?"pulse 1s infinite":"none"}}/>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:"7px",marginBottom:"4px"}}>
            <span style={{fontSize:"9px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color,fontFamily:"'Barlow Condensed',sans-serif"}}>{div.grade} MODEL DIVERGENCE</span>
            <div style={{display:"flex",gap:"5px"}}>
              <div style={{background:"rgba(255,255,255,0.05)",borderRadius:"4px",padding:"2px 8px",textAlign:"center"}}>
                <div style={{fontSize:"6px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>VEGAS</div>
                <div style={{fontSize:"11px",fontWeight:900,color:"#aaa",fontFamily:"'Barlow Condensed',sans-serif"}}>{lines.favTeam?abb(lines.favTeam):""} -{vegasSpread}</div>
              </div>
              <div style={{background:"rgba(255,255,255,0.05)",borderRadius:"4px",padding:"2px 8px",textAlign:"center"}}>
                <div style={{fontSize:"6px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>MODEL</div>
                <div style={{fontSize:"11px",fontWeight:900,color:"#4ade80",fontFamily:"'Barlow Condensed',sans-serif"}}>{gameResult.winner?abb(gameResult.winner):""} -{modelSpread}</div>
              </div>
              <div style={{background:`${color}10`,border:`1px solid ${color}30`,borderRadius:"4px",padding:"2px 8px",textAlign:"center"}}>
                <div style={{fontSize:"6px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>GAP</div>
                <div style={{fontSize:"11px",fontWeight:900,color,fontFamily:"'Barlow Condensed',sans-serif"}}>{div.absDiff} pts</div>
              </div>
            </div>
          </div>
          <div style={{fontSize:"9px",color:`${color}bb`,fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.4"}}>
            {div.isExtreme ? `Model projects a ${div.absDiff}-pt larger margin than the market — extreme divergence. Either the model has significant edge or is missing key market context. Verify sharp money direction before acting.` :
             div.isSignificant ? `${div.absDiff}-pt model vs market divergence detected. If model signals align with sharp money, this could represent genuine edge.` :
             `${div.absDiff}-pt divergence — worth noting but within normal model variance.`}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Home/Away Splits Panel ────────────────────────────────────────────────────
function SplitsPanel({ splitsData, loading, homeTeam, awayTeam }) {

export { GameCard, CorrelationMatrixPanel, DivergenceAlert };
