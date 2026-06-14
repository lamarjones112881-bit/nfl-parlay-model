import { useState, useEffect } from "react";
import { abb, tc, isDivisional, PRESETS_KEY } from "../constants/teams.js";
import { Tag, Spinner } from "./UIKit.jsx";

function WeekSchedule({onSelectGame}){
  const [open,setOpen]=useState(false);const [schedule,setSchedule]=useState(null);const [loading,setLoading]=useState(false);const [error,setError]=useState(null);
  async function load(){setLoading(true);setError(null);try{const text=await callClaude({useSearch:true,maxTokens:1200,prompt:`Search current NFL week schedule 2025-26. All games this week.\nONLY JSON: {"week":N,"weekLabel":"Week X","games":[{"away":"full name","home":"full name","date":"Sun Dec 8","time":"1:00 PM ET","tvNetwork":"FOX","isThursday":false,"isMNF":false,"isSNF":false}]}`});const m=text.match(/\{[\s\S]*\}/);if(!m)throw new Error();setSchedule(JSON.parse(m[0]));}catch{setError("Could not load schedule");}setLoading(false);}
  useEffect(()=>{if(open&&!schedule)load();},[open]);
  return(<div style={{marginBottom:"12px"}}><button onClick={()=>setOpen(o=>!o)} style={{width:"100%",padding:"10px 14px",borderRadius:"8px",border:"1px solid rgba(56,189,248,0.2)",background:open?"rgba(56,189,248,0.07)":"rgba(56,189,248,0.03)",color:"#38bdf8",fontSize:"10px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
    <span>📅 {schedule?`${schedule.weekLabel} — ${schedule.games?.length} Games`:"Load This Week's Schedule"}</span><span style={{opacity:0.4}}>{open?"▲":"▼"}</span></button>
    {open&&<div style={{marginTop:"5px",background:"rgba(0,0,0,0.3)",border:"1px solid rgba(56,189,248,0.1)",borderRadius:"8px",padding:"10px",animation:"fadeSlideUp 0.3s ease-out"}}>
      {loading&&<div style={{textAlign:"center",padding:"10px",display:"flex",alignItems:"center",justifyContent:"center",gap:"6px",color:"#38bdf8",fontFamily:"'Barlow Condensed',sans-serif",fontSize:"11px"}}><Spinner/>Fetching…</div>}
      {error&&<div style={{color:"#f87171",fontSize:"10px",fontFamily:"'Barlow Condensed',sans-serif",textAlign:"center"}}>{error} <button onClick={load} style={{color:"#38bdf8",background:"none",border:"none",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif"}}>Retry</button></div>}
      {schedule?.games&&<div style={{display:"grid",gap:"3px"}}>{schedule.games.map((g,i)=>{const isDiv=isDivisional(g.away,g.home);const badge=g.isThursday?"TNF":g.isSNF?"SNF":g.isMNF?"MNF":null;return(<button key={i} onClick={()=>{onSelectGame(g.away,g.home);setOpen(false);}} style={{width:"100%",padding:"7px 10px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"5px",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:"6px"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(56,189,248,0.07)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.04)"}><span style={{fontSize:"10px",fontWeight:700,color:tc(g.away),fontFamily:"'Barlow Condensed',sans-serif"}}>{abb(g.away)}</span><span style={{fontSize:"9px",color:"#2a2a2a"}}>@</span><span style={{fontSize:"10px",fontWeight:700,color:tc(g.home),fontFamily:"'Barlow Condensed',sans-serif"}}>{abb(g.home)}</span>{isDiv&&<span style={{fontSize:"9px",color:"#fb923c"}}>⚔️</span>}{badge&&<Tag color="#f59e0b">{badge}</Tag>}{g.date&&<span style={{fontSize:"8px",color:"#2a2a2a",fontFamily:"'Barlow Condensed',sans-serif",marginLeft:"auto"}}>{g.date}</span>}</button>);})}</div>}
    </div>}
  </div>);
}

// ── Saved Presets ─────────────────────────────────────────────────────────────
function SavedPresets({onLoad,currentHome,currentAway,currentVenue,currentWeather}){
  const [presets,setPresets]=useState([]);const [open,setOpen]=useState(false);
  useEffect(()=>{(async()=>{try{const r=await window.storage.get(PRESETS_KEY);if(r)setPresets(JSON.parse(r.value));}catch{}})();},[]);
  async function save(){if(!currentHome||!currentAway)return;const name=`${abb(currentAway)}@${abb(currentHome)}`;const updated=[{name,away:currentAway,home:currentHome,venue:currentVenue,weather:currentWeather,saved:new Date().toLocaleDateString()},...presets.filter(p=>p.name!==name)].slice(0,10);setPresets(updated);try{await window.storage.set(PRESETS_KEY,JSON.stringify(updated));}catch{}}
  async function del(idx){const updated=presets.filter((_,i)=>i!==idx);setPresets(updated);try{await window.storage.set(PRESETS_KEY,JSON.stringify(updated));}catch{}}
  return(<div style={{display:"flex",gap:"5px",flexWrap:"wrap",marginBottom:"8px"}}>{currentHome&&currentAway&&<button onClick={save} style={{padding:"4px 9px",borderRadius:"4px",border:"1px solid rgba(251,191,36,0.2)",background:"rgba(251,191,36,0.05)",color:"#fbbf24",fontSize:"9px",fontWeight:700,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif"}}>💾 Save</button>}{presets.length>0&&<div style={{position:"relative"}}><button onClick={()=>setOpen(o=>!o)} style={{padding:"4px 9px",borderRadius:"4px",border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",color:"#777",fontSize:"9px",fontWeight:700,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif"}}>📁 Saved ({presets.length}) {open?"▲":"▼"}</button>{open&&<div style={{position:"absolute",top:"calc(100% + 4px)",left:0,zIndex:50,background:"#0f0f1e",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"7px",padding:"5px",minWidth:"170px",boxShadow:"0 8px 24px rgba(0,0,0,0.5)"}}>{presets.map((p,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:"5px",padding:"4px 5px"}}><button onClick={()=>{onLoad(p);setOpen(false);}} style={{flex:1,background:"none",border:"none",color:"#ccc",fontSize:"9px",cursor:"pointer",textAlign:"left",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:600,padding:0}}>{p.name}</button><span style={{fontSize:"8px",color:"#2a2a2a"}}>{p.saved}</span><button onClick={()=>del(i)} style={{background:"none",border:"none",color:"#f87171",fontSize:"10px",cursor:"pointer",padding:0}}>✕</button></div>)}</div>}</div>}</div>);
}

// ── Key Number Badge ──────────────────────────────────────────────────────────
function KeyNumBadge({spread}){
  const flag=keyNumFlag(spread);if(!flag)return null;
  const color=flag.danger?"#ef4444":"#f59e0b";
  return(<div style={{background:`${color}0d`,border:`1px solid ${color}28`,borderRadius:"5px",padding:"5px 9px",marginBottom:"6px",display:"flex",alignItems:"center",gap:"6px"}}><span style={{fontSize:"11px"}}>{flag.danger?"🚨":"⚠️"}</span><div><div style={{fontSize:"9px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color,fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"1px"}}>Key Number {flag.kn}</div><div style={{fontSize:"9px",color:`${color}aa`,fontFamily:"'Barlow Condensed',sans-serif"}}>Spread within {flag.danger?"0.5 of":"1 of"} key margin — push/backdoor cover risk</div></div></div>);
}

// ── QB Panel ──────────────────────────────────────────────────────────────────
function QBPanel({qbData,homeTeam,awayTeam}){
  if(!qbData)return null;
  const {homeQB,awayQB,edge,note}=qbData;
  const ec=edge==="home"?tc(homeTeam):edge==="away"?tc(awayTeam):"#888";
  const eTeam=edge==="home"?homeTeam:edge==="away"?awayTeam:null;
  return(<div style={{marginTop:"8px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"7px",padding:"10px 12px"}}><div style={{fontSize:"9px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#555",marginBottom:"7px",fontFamily:"'Barlow Condensed',sans-serif",display:"flex",alignItems:"center",gap:"6px"}}>🏈 QB Matchup {eTeam&&<Tag color={ec}>Edge: {abb(eTeam)}</Tag>}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px"}}>{[awayQB,homeQB].filter(Boolean).map((qb,i)=><div key={i} style={{background:"rgba(255,255,255,0.03)",borderRadius:"5px",padding:"7px"}}><div style={{fontSize:"9px",fontWeight:800,color:tc(qb.team),fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"4px"}}>{qb.name||abb(qb.team)}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"3px"}}>{[["Rtg",qb.rating,"#4ade80"],["TDs",qb.tds,"#c084fc"],["INTs",qb.ints,"#f87171"],["vs Def",qb.vsDefRating,qb.vsDefRating>95?"#f87171":qb.vsDefRating>85?"#f59e0b":"#4ade80"]].map(([lbl,v,c])=><div key={lbl} style={{background:"rgba(255,255,255,0.03)",borderRadius:"3px",padding:"3px 4px",textAlign:"center"}}><div style={{fontSize:"7px",color:"#2a2a2a",fontFamily:"'Barlow Condensed',sans-serif"}}>{lbl}</div><div style={{fontSize:"11px",fontWeight:800,color:c,fontFamily:"'Barlow Condensed',sans-serif"}}>{v!=null?v:"—"}</div></div>)}</div>{qb.note&&<div style={{fontSize:"8px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"3px",fontStyle:"italic"}}>{qb.note}</div>}</div>)}</div>{note&&<div style={{fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"5px",lineHeight:"1.4"}}>{note}</div>}</div>);
}

// ── Parlay Builder ────────────────────────────────────────────────────────────
function ParlayBuilder({legs,onRemove,parlayAnalysis,onAnalyze,analyzing,onSave}){
  const count=legs.length;const combProb=legs.reduce((a,l)=>a*(l.winProb||55)/100,1)*100;
  const amOdds=p=>{if(p<=0)return"N/A";if(p>=50)return`-${Math.round(p/(1-p/100))}`;return`+${Math.round((1-p/100)/(p/100)*100)}`;};
  const rl=combProb>40?"LOW":combProb>25?"MEDIUM":combProb>15?"HIGH":"VERY HIGH";
  const rc=RISK_COLORS[rl]||"#aaa";
  const [res,setRes]=useState("PENDING");const [notes,setNotes]=useState("");
  return(<div style={{background:"rgba(0,0,0,0.45)",border:"1px solid rgba(255,200,0,0.15)",borderRadius:"12px",padding:"14px",marginBottom:"12px",animation:"fadeSlideUp 0.4s ease-out"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"8px"}}>
      <div style={{display:"flex",alignItems:"center",gap:"8px"}}><span style={{fontSize:"13px"}}>🎯</span><div><div style={{fontSize:"12px",fontWeight:900,letterSpacing:"0.1em",textTransform:"uppercase",color:"#fbbf24",fontFamily:"'Barlow Condensed',sans-serif"}}>Parlay Builder</div><div style={{fontSize:"8px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>{count}/4 LEGS</div></div></div>
      {count>0&&<div style={{textAlign:"right"}}><div style={{fontSize:"17px",fontWeight:900,color:rc,fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{combProb.toFixed(1)}%</div><div style={{fontSize:"10px",fontWeight:700,color:"#c084fc",fontFamily:"'Barlow Condensed',sans-serif"}}>{amOdds(combProb)}</div></div>}
    </div>
    <div style={{display:"flex",gap:"4px",marginBottom:"9px"}}>{Array(4).fill(0).map((_,i)=><div key={i} style={{flex:1,height:"3px",borderRadius:"2px",background:i<count?"#fbbf24":"rgba(255,255,255,0.06)",transition:"background 0.3s"}}/>)}</div>
    {count===0&&<div style={{textAlign:"center",padding:"10px 0",color:"#2a2a2a",fontSize:"11px",fontFamily:"'Barlow Condensed',sans-serif"}}>Analyze a game below and click "+ Add to Parlay"</div>}
    {legs.map((l,i)=>(
      <div key={i} style={{display:"flex",alignItems:"center",gap:"5px",padding:"6px 8px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"6px",marginBottom:"3px"}}>
        <div style={{width:"16px",height:"16px",borderRadius:"50%",background:"#fbbf2418",border:"1px solid #fbbf2435",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"8px",fontWeight:900,color:"#fbbf24",flexShrink:0}}>{i+1}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:"10px",fontWeight:800,color:"#fff",fontFamily:"'Barlow Condensed',sans-serif",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{abb(l.awayTeam)}@{abb(l.homeTeam)}{l.divisional?" ⚔️":""}{l.homedog?" 🏠":""}{l.rlm?" 📡":""}</div>
          <div style={{display:"flex",gap:"3px",marginTop:"1px",flexWrap:"wrap",alignItems:"center"}}>
            <span style={{fontSize:"9px",fontWeight:700,color:tc(l.pickTeam||l.homeTeam),fontFamily:"'Barlow Condensed',sans-serif"}}>{l.betType}: {l.pick}</span>
            {l.winProb&&<span style={{fontSize:"8px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif"}}>{l.winProb}%</span>}
            {l.keyNumFlag&&<Tag color="#f59e0b">Key#{l.keyNumFlag.kn}</Tag>}
            {l.cpoeEdge&&<Tag color="#ec4899">CPOE Edge</Tag>}
            {l.coachEdge&&<Tag color="#14b8a6">Coach Edge</Tag>}
            {l.luckRegressed&&<Tag color="#6366f1">Regressed</Tag>}
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"2px"}}>
          {l.risk&&<Tag color={RISK_COLORS[l.risk]||"#aaa"}>{l.risk}</Tag>}
          <button onClick={()=>onRemove(i)} style={{background:"rgba(248,113,113,0.1)",border:"1px solid rgba(248,113,113,0.18)",borderRadius:"3px",color:"#f87171",fontSize:"9px",cursor:"pointer",padding:"2px 5px",fontFamily:"'Barlow Condensed',sans-serif"}}>✕</button>
        </div>
      </div>
    ))}
    {count>=2&&<div style={{marginTop:"7px"}}>
      <button onClick={onAnalyze} disabled={analyzing} style={{width:"100%",padding:"9px",borderRadius:"6px",border:"none",background:analyzing?"rgba(255,255,255,0.04)":"linear-gradient(135deg,#b45309,#92400e)",color:analyzing?"#333":"#fff",fontSize:"11px",fontWeight:800,letterSpacing:"0.1em",textTransform:"uppercase",cursor:analyzing?"not-allowed":"pointer",fontFamily:"'Barlow Condensed',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:"5px",marginBottom:"7px"}}>
        {analyzing?<><Spinner/>Analyzing…</>:"🎯 Analyze Full Parlay"}
      </button>
      {parlayAnalysis&&<>
        <div style={{background:"rgba(0,0,0,0.3)",border:"1px solid rgba(251,191,36,0.1)",borderRadius:"8px",padding:"11px",marginBottom:"7px"}}>
          <div style={{fontSize:"9px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#fbbf24",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"5px"}}>Parlay Assessment</div>
          <div style={{fontSize:"10px",lineHeight:"1.6",color:"#bbb",fontFamily:"'Barlow Condensed',sans-serif"}}>
            {parlayAnalysis.split("\n").filter(l=>l.trim()).map((line,i)=>{const bold=line.startsWith("**")||line.match(/^[A-Z].+:/);const clean=line.replace(/\*\*/g,"").trim();return clean?<p key={i} style={{margin:"0 0 4px 0",color:bold?"#fff":"#888",fontWeight:bold?700:400,fontSize:bold?"10px":"9px"}}>{clean}</p>:null;})}
          </div>
        </div>
        <div style={{background:"rgba(99,102,241,0.05)",border:"1px solid rgba(99,102,241,0.11)",borderRadius:"7px",padding:"9px"}}>
          <div style={{fontSize:"9px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#818cf8",marginBottom:"5px",fontFamily:"'Barlow Condensed',sans-serif"}}>💾 Save to History</div>
          <div style={{display:"flex",gap:"4px",marginBottom:"4px"}}>{["PENDING","WIN","LOSS"].map(r=><button key={r} onClick={()=>setRes(r)} style={{flex:1,padding:"4px",borderRadius:"3px",border:`1px solid ${res===r?(r==="WIN"?"rgba(74,222,128,0.3)":r==="LOSS"?"rgba(248,113,113,0.3)":"rgba(251,191,36,0.3)"):"rgba(255,255,255,0.06)"}`,background:res===r?(r==="WIN"?"rgba(74,222,128,0.07)":r==="LOSS"?"rgba(248,113,113,0.07)":"rgba(251,191,36,0.07)"):"transparent",color:res===r?(r==="WIN"?"#4ade80":r==="LOSS"?"#f87171":"#fbbf24"):"#333",fontSize:"9px",fontWeight:700,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif"}}>{r}</button>)}</div>
          <input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notes…" style={{width:"100%",padding:"4px 8px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:"4px",color:"#888",fontSize:"9px",outline:"none",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"4px",boxSizing:"border-box"}}/>
          <button onClick={()=>onSave(res,notes)} style={{width:"100%",padding:"6px",borderRadius:"4px",border:"none",background:"linear-gradient(135deg,#4f46e5,#3730a3)",color:"#fff",fontSize:"9px",fontWeight:700,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif"}}>Save Parlay</button>
        </div>
      </>}
    </div>}
  </div>);
}

// ── History ───────────────────────────────────────────────────────────────────
function HistoryTracker({history,onClear}){
  const [open,setOpen]=useState(false);if(history.length===0)return null;
  const wins=history.filter(h=>h.result==="WIN").length,losses=history.filter(h=>h.result==="LOSS").length;
  const wr=wins+losses>0?((wins/(wins+losses))*100).toFixed(0):null;
  return(<Panel mb="10px" border="rgba(99,102,241,0.15)" bg="rgba(99,102,241,0.03)"><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}><div style={{display:"flex",alignItems:"center",gap:"6px",flexWrap:"wrap"}}><span style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#818cf8",fontFamily:"'Barlow Condensed',sans-serif"}}>📋 History</span>{wins>0&&<Tag color="#4ade80">{wins}W</Tag>}{losses>0&&<Tag color="#f87171">{losses}L</Tag>}{wr&&<Tag color="#818cf8">{wr}% Rate</Tag>}</div><span style={{color:"#2a2a2a",fontSize:"10px"}}>{open?"▲":"▼"}</span></div>
  {open&&<div style={{marginTop:"9px"}}>{history.map((h,i)=><div key={i} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:"6px",padding:"7px 9px",marginBottom:"3px"}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"3px"}}><span style={{fontSize:"8px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif"}}>{h.date} · {h.legs?.length}-leg · {h.combinedProb}%</span><Tag color={h.result==="WIN"?"#4ade80":h.result==="LOSS"?"#f87171":"#f59e0b"}>{h.result}</Tag></div><div style={{display:"flex",flexWrap:"wrap",gap:"2px"}}>{h.legs?.map((l,j)=><div key={j} style={{background:"rgba(255,255,255,0.04)",borderRadius:"3px",padding:"2px 5px",fontSize:"8px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif"}}>{abb(l.awayTeam)}@{abb(l.homeTeam)} {l.betType}:{l.pick}</div>)}</div></div>)}<button onClick={onClear} style={{marginTop:"3px",padding:"3px 8px",borderRadius:"3px",border:"1px solid rgba(248,113,113,0.14)",background:"rgba(248,113,113,0.04)",color:"#f87171",fontSize:"8px",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif"}}>Clear</button></div>}
  </Panel>);
}

// ── Auto Parlay Suggester ─────────────────────────────────────────────────────
function ParlayAutoSuggester({analyzedGames,onApplySuggestion}){
  const [sug,setSug]=useState(null);const [loading,setLoading]=useState(false);
  if(analyzedGames.length<2)return null;
  async function suggest(){
    setLoading(true);setSug(null);
    const gStr=analyzedGames.map((g,i)=>`G${i+1}: ${abb(g.awayTeam)}@${abb(g.homeTeam)} Risk:${g.result.parlayRisk} WinProb:${g.result.winProb}% Conf:${g.result.confidence} CPOE:${g.cpoeData?.matchupEdge?"Y":"N"} Coach:${g.coachData?.spreadImpact?"Y":"N"} Luck:${g.leverageData?.regressionVerdict?"Y":"N"} GarbageAdj:${g.garbageData?.contaminated?"Y":"N"} Sharp:${g.result.publicBetting?.sharpSide||"?"} RLM:${g.result.publicBetting?.rlm?"Y":"N"} OL:${g.olData?.home?.healthScore||"?"}/${g.olData?.away?.healthScore||"?"} Pressure:${g.pressureData?.matchupEdge?"Y":"N"} LogitEdge:${g.lines?Math.abs(spreadToWinProb(g.lines.spread,g.lines.favTeam,g.homeTeam).homeWin-(g.result.winProb||50)):0}%`).join("\n");
    try{const text=await callClaude({maxTokens:700,prompt:`Best 4-leg parlay optimizer. Prioritize: LOW risk, CPOE edge, regression-verified, sharp/RLM, home dogs, healthy OL, logit divergence >3%, pressure edge. Penalize garbage-time inflated stats, lucky teams, high coaching conservatism on tight spreads.
${gStr}
ONLY JSON: {"parlayLegs":[{"gameIndex":0,"betType":"Spread","pick":"KC -3","reasoning":"why"}],"grade":"A/B/C/D","combinedNote":"2 sentence assessment","legsToAvoid":[{"gameIndex":0,"reason":"why avoid"}]}`});
      const m=text.match(/\{[\s\S]*\}/);if(!m)throw new Error();setSug(JSON.parse(m[0]));}catch{setSug({error:"Could not generate."});}
    setLoading(false);
  }
  const gc=s=>({A:"#4ade80",B:"#86efac",C:"#f59e0b",D:"#f87171"}[s]||"#aaa");
  return(<Panel border="rgba(167,139,250,0.16)" bg="rgba(167,139,250,0.03)" mb="10px"><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"7px"}}><div style={{display:"flex",alignItems:"center",gap:"6px"}}><span style={{fontSize:"11px"}}>🤖</span><span style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#a78bfa",fontFamily:"'Barlow Condensed',sans-serif"}}>Auto Parlay Suggester</span><Tag color="#a78bfa">{analyzedGames.length} analyzed</Tag></div><button onClick={suggest} disabled={loading} style={{padding:"4px 9px",borderRadius:"4px",border:"none",background:loading?"rgba(255,255,255,0.03)":"linear-gradient(135deg,#7c3aed,#5b21b6)",color:loading?"#333":"#fff",fontSize:"9px",fontWeight:700,cursor:loading?"not-allowed":"pointer",fontFamily:"'Barlow Condensed',sans-serif",display:"flex",alignItems:"center",gap:"4px"}}>{loading?<><Spinner/>Building…</>:"✨ Build Best Parlay"}</button></div>
  {sug?.error&&<div style={{fontSize:"10px",color:"#f87171",fontFamily:"'Barlow Condensed',sans-serif"}}>{sug.error}</div>}
  {sug&&!sug.error&&<div style={{animation:"fadeSlideUp 0.3s ease-out"}}><div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"7px"}}><div style={{fontSize:"20px",fontWeight:900,color:gc(sug.grade),fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{sug.grade}</div><div style={{fontSize:"9px",color:"#aaa",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.5",flex:1}}>{sug.combinedNote}</div></div>
  {sug.parlayLegs?.map((leg,i)=>{const g=analyzedGames[leg.gameIndex];if(!g)return null;return(<div key={i} style={{display:"flex",alignItems:"center",gap:"6px",padding:"6px 8px",background:"rgba(167,139,250,0.05)",border:"1px solid rgba(167,139,250,0.1)",borderRadius:"5px",marginBottom:"3px"}}><div style={{width:"14px",height:"14px",borderRadius:"50%",background:"rgba(167,139,250,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"7px",fontWeight:900,color:"#a78bfa",flexShrink:0}}>{i+1}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:"9px",fontWeight:700,color:"#fff",fontFamily:"'Barlow Condensed',sans-serif"}}>{abb(g.awayTeam)}@{abb(g.homeTeam)} — <span style={{color:"#a78bfa"}}>{leg.betType}: {leg.pick}</span></div><div style={{fontSize:"8px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>{leg.reasoning}</div></div><Tag color={RISK_COLORS[g.result.parlayRisk]||"#aaa"}>{g.result.parlayRisk}</Tag></div>);})}
  {sug.legsToAvoid?.length>0&&<div style={{marginTop:"5px",padding:"6px 8px",background:"rgba(248,113,113,0.04)",border:"1px solid rgba(248,113,113,0.1)",borderRadius:"4px"}}><div style={{fontSize:"8px",fontWeight:700,letterSpacing:"0.1em",color:"#f87171",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px"}}>AVOID</div>{sug.legsToAvoid.map((l,i)=>{const g=analyzedGames[l.gameIndex];return g?<div key={i} style={{fontSize:"8px",color:"#fca5a5",fontFamily:"'Barlow Condensed',sans-serif"}}>• {abb(g.awayTeam)}@{abb(g.homeTeam)}: {l.reason}</div>:null;})}</div>}
  <button onClick={()=>onApplySuggestion(sug)} style={{marginTop:"7px",width:"100%",padding:"7px",borderRadius:"5px",border:"none",background:"linear-gradient(135deg,#7c3aed,#5b21b6)",color:"#fff",fontSize:"10px",fontWeight:700,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif"}}>Apply These Legs</button></div>}
  </Panel>);
}
// ── Game Analysis Result Card ─────────────────────────────────────────────────
function GameCard({result:r,homeTeam,awayTeam,weather,lines,pressureData,olData,microData,cpoeData,coachData,leverageData,garbageData,onAddToParlay,parlayFull}){

export { WeekSchedule, SavedPresets, KeyNumBadge, QBPanel, ParlayBuilder, HistoryTracker, ParlayAutoSuggester };
