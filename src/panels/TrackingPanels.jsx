import { useState, useEffect } from "react";
import { Panel, PanelTitle, Tag } from "../components/UIKit.jsx";

// SteamMoveAlert, ContradictionPanel, SignalWeightPanel, CalibrationPanel, CLVPanel, BacktestPanel
function SteamMoveAlert({lineMove}){
  const steam=detectSteamMove(lineMove);if(!steam)return null;
  const color=steam.isSteam?(steam.severity==="EXTREME"?"#ef4444":"#f87171"):"#f59e0b";
  return(<div style={{background:`${color}0d`,border:`1px solid ${color}22`,borderRadius:"7px",padding:"8px 12px",marginBottom:"8px",animation:"fadeSlideUp 0.3s ease-out"}}><div style={{display:"flex",alignItems:"center",gap:"8px"}}><div style={{width:"7px",height:"7px",borderRadius:"50%",background:color,flexShrink:0,boxShadow:`0 0 7px ${color}`,animation:steam.isSteam?"pulse 1s infinite":"none"}}/><div style={{flex:1}}><div style={{fontSize:"9px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color,fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px"}}>{steam.severity} LINE MOVEMENT — {steam.movement} PTS</div><div style={{fontSize:"9px",color:`${color}bb`,fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.4"}}>{steam.alert}</div>{steam.sharpSide&&<div style={{marginTop:"3px",display:"flex",gap:"5px",alignItems:"center"}}><Tag color="#4ade80">Sharp: {steam.sharpSide}</Tag></div>}</div></div></div>);
}

// ── Contradiction Panel ───────────────────────────────────────────────────────
function ContradictionPanel({contradictions,alignments}){
  if(!contradictions?.length&&!alignments?.length)return null;
  const [open,setOpen]=useState(true);
  const sc=s=>s==="HIGH"?"#f87171":s==="MEDIUM"?"#f59e0b":"#888";
  return(
    <Panel border={contradictions?.length?"rgba(248,113,113,0.18)":"rgba(74,222,128,0.15)"} bg="rgba(0,0,0,0.2)" mb="10px">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",marginBottom:open?"11px":"0"}} onClick={()=>setOpen(o=>!o)}>
        <div style={{display:"flex",alignItems:"center",gap:"7px"}}>
          <span style={{fontSize:"11px"}}>⚡</span>
          <span style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#fff",fontFamily:"'Barlow Condensed',sans-serif"}}>Signal Contradiction Detector</span>
          {contradictions?.length>0&&<Tag color="#f87171">{contradictions.length} conflict{contradictions.length>1?"s":""}</Tag>}
          {alignments?.length>0&&<Tag color="#4ade80">{alignments.length} aligned</Tag>}
        </div>
        <span style={{color:"#333",fontSize:"10px"}}>{open?"▲":"▼"}</span>
      </div>
      {open&&<div>
        {contradictions?.length>0&&<div style={{marginBottom:"7px"}}><div style={{fontSize:"8px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#f87171",marginBottom:"4px",fontFamily:"'Barlow Condensed',sans-serif"}}>⚠ SIGNAL CONFLICTS</div>{contradictions.map((c,i)=><div key={i} style={{background:"rgba(248,113,113,0.04)",border:"1px solid rgba(248,113,113,0.1)",borderRadius:"5px",padding:"6px 9px",marginBottom:"3px"}}><div style={{display:"flex",alignItems:"center",gap:"5px",marginBottom:"2px"}}><Tag color={sc(c.severity)}>{c.severity}</Tag><span style={{fontSize:"8px",color:"#666",fontFamily:"'Barlow Condensed',sans-serif"}}>{c.signal1} vs {c.signal2}</span></div><div style={{fontSize:"9px",color:"#fca5a5",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.4"}}>{c.desc}</div></div>)}</div>}
        {alignments?.length>0&&<div><div style={{fontSize:"8px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#4ade80",marginBottom:"4px",fontFamily:"'Barlow Condensed',sans-serif"}}>✓ SIGNAL ALIGNMENTS</div>{alignments.map((a,i)=><div key={i} style={{background:"rgba(74,222,128,0.03)",border:"1px solid rgba(74,222,128,0.09)",borderRadius:"5px",padding:"6px 9px",marginBottom:"3px"}}><div style={{fontSize:"8px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"1px"}}>{a.signal1} + {a.signal2}</div><div style={{fontSize:"9px",color:"#86efac",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.4"}}>{a.desc}</div></div>)}</div>}
      </div>}
    </Panel>
  );
}

// ── Signal Weight Panel ───────────────────────────────────────────────────────
function SignalWeightPanel({weights,onUpdateWeights,calibrationStats}){
  const [open,setOpen]=useState(false);
  const [lw,setLw]=useState({...weights});
  const total=Object.values(lw).reduce((s,v)=>s+v,0);
  const isValid=Math.abs(total-100)<=1;
  const SIG_COLORS={cpoe:"#ec4899",pressure:"#fb923c",olDegradation:"#6366f1",garbageFilter:"#f59e0b",luckRegression:"#8b5cf6",marketEnsemble:"#a78bfa",coaching:"#14b8a6",microContext:"#38bdf8",weather:"#4ade80"};
  return(
    <Panel border="rgba(250,204,21,0.14)" bg="rgba(250,204,21,0.02)" mb="10px">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        <div style={{display:"flex",alignItems:"center",gap:"7px"}}>
          <span style={{fontSize:"11px"}}>⚖️</span>
          <span style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#facc15",fontFamily:"'Barlow Condensed',sans-serif"}}>Signal Weight Calibration</span>
          <Tag color={isValid?"#4ade80":"#f87171"}>{total}%</Tag>
          {calibrationStats?.totalGames>0&&<Tag color="#a78bfa">{calibrationStats.totalGames} tracked</Tag>}
        </div>
        <span style={{color:"#333",fontSize:"10px"}}>{open?"▲":"▼"}</span>
      </div>
      {open&&<div style={{marginTop:"11px"}}>
        <div style={{fontSize:"9px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"9px",lineHeight:"1.5"}}>Adjust signal contribution weights. Must sum to 100. Recalibrate based on which signals are actually predicting your results.</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"5px",marginBottom:"8px"}}>
          {Object.entries(lw).map(([key,val])=>(
            <div key={key} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"5px",padding:"7px 9px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"3px"}}>
                <span style={{fontSize:"8px",fontWeight:700,color:SIG_COLORS[key]||"#aaa",fontFamily:"'Barlow Condensed',sans-serif",textTransform:"uppercase",letterSpacing:"0.05em"}}>{key.replace(/([A-Z])/g," $1").trim()}</span>
                <span style={{fontSize:"12px",fontWeight:900,color:"#fff",fontFamily:"'Barlow Condensed',sans-serif"}}>{val}%</span>
              </div>
              <input type="range" min={1} max={30} value={val} onChange={e=>setLw(w=>({...w,[key]:parseInt(e.target.value)}))} style={{width:"100%",accentColor:SIG_COLORS[key]||"#aaa",height:"3px"}}/>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:"5px"}}>
          <button onClick={()=>{if(isValid)onUpdateWeights(lw);}} disabled={!isValid} style={{flex:1,padding:"7px",borderRadius:"5px",border:"none",background:isValid?"linear-gradient(135deg,#ca8a04,#92400e)":"rgba(255,255,255,0.04)",color:isValid?"#fff":"#333",fontSize:"9px",fontWeight:700,cursor:isValid?"pointer":"not-allowed",fontFamily:"'Barlow Condensed',sans-serif"}}>{isValid?"Save Weights":`Need 100% (${total}%)`}</button>
          <button onClick={()=>{setLw({...DEFAULT_WEIGHTS});onUpdateWeights(DEFAULT_WEIGHTS);}} style={{padding:"7px 10px",borderRadius:"5px",border:"1px solid rgba(255,255,255,0.07)",background:"rgba(255,255,255,0.03)",color:"#555",fontSize:"9px",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif"}}>Reset</button>
        </div>
      </div>}
    </Panel>
  );
}

// ── Calibration Tracker Panel ─────────────────────────────────────────────────
function CalibrationPanel({calibration}){
  if(!calibration||calibration.total<3)return null;
  const [open,setOpen]=useState(false);
  return(
    <Panel border="rgba(167,139,250,0.16)" bg="rgba(167,139,250,0.03)" mb="10px">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        <div style={{display:"flex",alignItems:"center",gap:"7px"}}>
          <span style={{fontSize:"11px"}}>📊</span>
          <span style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#a78bfa",fontFamily:"'Barlow Condensed',sans-serif"}}>Confidence Calibration</span>
          <Tag color="#a78bfa">{calibration.total} games</Tag>
          {calibration.overallRate!=null&&<Tag color={calibration.overallRate>=55?"#4ade80":"#f87171"}>{calibration.overallRate}% win rate</Tag>}
        </div>
        <span style={{color:"#333",fontSize:"10px"}}>{open?"▲":"▼"}</span>
      </div>
      {open&&<div style={{marginTop:"11px"}}>
        <div style={{fontSize:"9px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"9px",lineHeight:"1.5"}}>Tracks whether model confidence levels predict actual outcomes. When HIGH says 65%+ but only hits 50%, the label is miscalibrated.</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"5px",marginBottom:"8px"}}>
          {["HIGH","MEDIUM","LOW"].map(lvl=>{
            const d=calibration.byConfidence?.[lvl];const expected=lvl==="HIGH"?65:lvl==="MEDIUM"?55:45;
            if(!d||d.total===0)return <div key={lvl} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"6px",padding:"9px 7px",textAlign:"center"}}><div style={{fontSize:"8px",color:lvl==="HIGH"?"#4ade80":lvl==="MEDIUM"?"#f59e0b":"#f87171",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px"}}>{lvl}</div><div style={{fontSize:"10px",color:"#2a2a2a",fontFamily:"'Barlow Condensed',sans-serif"}}>No data</div></div>;
            const wr=Math.round(d.wins/d.total*100),cal=Math.abs(wr-expected)<=8;
            return(<div key={lvl} style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${cal?"rgba(74,222,128,0.14)":"rgba(248,113,113,0.14)"}`,borderRadius:"6px",padding:"9px 7px",textAlign:"center"}}><div style={{fontSize:"8px",fontWeight:700,color:lvl==="HIGH"?"#4ade80":lvl==="MEDIUM"?"#f59e0b":"#f87171",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px"}}>{lvl}</div><div style={{fontSize:"20px",fontWeight:900,color:wr>=expected?"#4ade80":"#f87171",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{wr}%</div><div style={{fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"2px"}}>{d.wins}W-{d.total-d.wins}L</div><div style={{fontSize:"7px",fontWeight:700,color:cal?"#4ade80":"#f87171",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"2px"}}>{cal?"✓ CALIBRATED":"⚠ MISCAL"}</div><div style={{fontSize:"6px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif"}}>exp ~{expected}%</div></div>);
          })}
        </div>
        {calibration.byBetType&&<div><div style={{fontSize:"8px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#444",marginBottom:"4px",fontFamily:"'Barlow Condensed',sans-serif"}}>By Bet Type</div><div style={{display:"flex",gap:"4px",flexWrap:"wrap"}}>{Object.entries(calibration.byBetType).map(([bt,d])=>d?.total>0&&<div key={bt} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"4px",padding:"4px 8px",textAlign:"center"}}><div style={{fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>{bt}</div><div style={{fontSize:"12px",fontWeight:800,color:Math.round(d.wins/d.total*100)>=52?"#4ade80":"#f87171",fontFamily:"'Barlow Condensed',sans-serif"}}>{Math.round(d.wins/d.total*100)}%</div><div style={{fontSize:"6px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif"}}>{d.wins}-{d.total-d.wins}</div></div>)}</div></div>}
      </div>}
    </Panel>
  );
}

// ── CLV Panel ─────────────────────────────────────────────────────────────────
function CLVPanel({clvHistory,onAddCLV,onClearCLV,modelSpread,lines,homeTeam,awayTeam}){
  const [open,setOpen]=useState(false);
  const [closingSpread,setClosingSpread]=useState("");
  if(!modelSpread&&!clvHistory?.length)return null;
  const avgCLV=clvHistory?.length?(clvHistory.reduce((s,e)=>s+parseFloat(e.diff||0),0)/clvHistory.length).toFixed(2):null;
  const posRate=clvHistory?.length?Math.round(clvHistory.filter(e=>parseFloat(e.diff)>0).length/clvHistory.length*100):null;
  return(
    <Panel border="rgba(20,184,166,0.16)" bg="rgba(20,184,166,0.03)" mb="10px">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        <div style={{display:"flex",alignItems:"center",gap:"7px"}}>
          <span style={{fontSize:"11px"}}>📈</span>
          <span style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#14b8a6",fontFamily:"'Barlow Condensed',sans-serif"}}>Closing Line Value (CLV)</span>
          {avgCLV&&<Tag color={parseFloat(avgCLV)>0?"#4ade80":"#f87171"}>Avg {parseFloat(avgCLV)>0?"+":""}{avgCLV}</Tag>}
          {posRate&&<Tag color={posRate>=55?"#4ade80":"#f59e0b"}>{posRate}% positive</Tag>}
        </div>
        <span style={{color:"#333",fontSize:"10px"}}>{open?"▲":"▼"}</span>
      </div>
      {open&&<div style={{marginTop:"11px"}}>
        <div style={{fontSize:"9px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"9px",lineHeight:"1.5"}}>CLV measures if your model gets better numbers than where the line closes. Consistent positive CLV = your model is beating the market. The only true proof of edge.</div>
        {modelSpread&&lines&&homeTeam&&awayTeam&&(
          <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"6px",padding:"9px 11px",marginBottom:"9px"}}>
            <div style={{fontSize:"8px",fontWeight:700,color:"#14b8a6",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"6px",textTransform:"uppercase",letterSpacing:"0.08em"}}>Record CLV: {abb(awayTeam)} @ {abb(homeTeam)}</div>
            <div style={{display:"flex",gap:"7px",alignItems:"flex-end",marginBottom:"6px"}}>
              <div style={{flex:1}}><div style={{fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px"}}>MODEL SPREAD</div><div style={{fontSize:"14px",fontWeight:900,color:"#4ade80",fontFamily:"'Barlow Condensed',sans-serif"}}>{lines.favTeam?abb(lines.favTeam):""} -{modelSpread}</div></div>
              <div style={{flex:1}}><div style={{fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px"}}>CLOSING SPREAD</div><input value={closingSpread} onChange={e=>setClosingSpread(e.target.value)} placeholder="e.g. 4.5" type="number" step="0.5" style={{width:"100%",padding:"5px 7px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"4px",color:"#ddd",fontSize:"13px",outline:"none",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700}}/></div>
              {closingSpread&&(()=>{const clv=calcCLV(modelSpread,closingSpread);return<div style={{flex:1,textAlign:"center"}}><div style={{fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px"}}>CLV</div><div style={{fontSize:"18px",fontWeight:900,color:clv?.direction==="positive"?"#4ade80":"#f87171",fontFamily:"'Barlow Condensed',sans-serif"}}>{parseFloat(clv?.diff)>0?"+":""}{clv?.diff}</div></div>})()}
            </div>
            <button onClick={()=>{if(closingSpread){const clv=calcCLV(modelSpread,closingSpread);onAddCLV({homeTeam,awayTeam,modelSpread,closingSpread,diff:clv?.diff,direction:clv?.direction,date:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"})});setClosingSpread("");}}} disabled={!closingSpread} style={{width:"100%",padding:"6px",borderRadius:"4px",border:"none",background:closingSpread?"linear-gradient(135deg,#0f766e,#0d9488)":"rgba(255,255,255,0.04)",color:closingSpread?"#fff":"#333",fontSize:"9px",fontWeight:700,cursor:closingSpread?"pointer":"not-allowed",fontFamily:"'Barlow Condensed',sans-serif"}}>Save CLV Entry</button>
          </div>
        )}
        {clvHistory?.length>0&&(
          <>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"5px",marginBottom:"7px"}}>
              {[["AVG CLV",avgCLV?`${parseFloat(avgCLV)>0?"+":""}${avgCLV}`:"—",parseFloat(avgCLV)>0?"#4ade80":"#f87171"],["POSITIVE%",posRate?`${posRate}%`:"—",posRate>=55?"#4ade80":"#f59e0b"],["VERDICT",parseFloat(avgCLV)>0.5?"BEATING":parseFloat(avgCLV)>0?"SLIGHT EDGE":"BELOW",parseFloat(avgCLV)>0.3?"#4ade80":parseFloat(avgCLV)>0?"#f59e0b":"#f87171"]].map(([l,v,c])=>(
                <div key={l} style={{background:"rgba(255,255,255,0.04)",borderRadius:"5px",padding:"6px 7px",textAlign:"center"}}><div style={{fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px"}}>{l}</div><div style={{fontSize:"12px",fontWeight:900,color:c,fontFamily:"'Barlow Condensed',sans-serif"}}>{v}</div></div>
              ))}
            </div>
            <div style={{maxHeight:"130px",overflowY:"auto"}}>
              {clvHistory.map((e,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:"5px",padding:"3px 0",borderBottom:"1px solid rgba(255,255,255,0.03)"}}><span style={{fontSize:"8px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",flex:1}}>{abb(e.awayTeam||"")}@{abb(e.homeTeam||"")} {e.date||""}</span><span style={{fontSize:"8px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif"}}>{e.modelSpread}→{e.closingSpread}</span><Tag color={parseFloat(e.diff)>0?"#4ade80":"#f87171"}>{parseFloat(e.diff)>0?"+":""}{e.diff}</Tag></div>)}
            </div>
            <button onClick={onClearCLV} style={{marginTop:"5px",padding:"3px 9px",borderRadius:"3px",border:"1px solid rgba(248,113,113,0.14)",background:"rgba(248,113,113,0.04)",color:"#f87171",fontSize:"8px",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif"}}>Clear CLV History</button>
          </>
        )}
      </div>}
    </Panel>
  );
}

// ── Backtest Engine Panel ─────────────────────────────────────────────────────
function BacktestPanel({backtestHistory,onAddResult,onClearBacktest,modelSpread,modelTotal,modelTotalLean,homeTeam,awayTeam,confidence}){
  const [open,setOpen]=useState(false);
  const [form,setForm]=useState({s1:"",s2:""});
  const total=backtestHistory?.length||0;
  const atsW=backtestHistory?.filter(g=>g.spreadCorrect).length||0;
  const totW=backtestHistory?.filter(g=>g.totalCorrect).length||0;
  const atsR=total>0?Math.round(atsW/total*100):null;
  const totR=total>0?Math.round(totW/total*100):null;
  const hcG=backtestHistory?.filter(g=>g.confidence==="HIGH")||[];
  const hcATS=hcG.length>0?Math.round(hcG.filter(g=>g.spreadCorrect).length/hcG.length*100):null;
  function submit(){
    if(!form.s1||!form.s2)return;
    const hScore=parseFloat(form.s2),aScore=parseFloat(form.s1),sp=parseFloat(modelSpread||0);
    const margin=hScore-aScore,atsCover=(margin+sp)>0,atsPush=(margin+sp)===0;
    const actualTotal=hScore+aScore,projTotal=parseFloat(modelTotal||0);
    const totOver=actualTotal>projTotal;
    onAddResult({homeTeam,awayTeam,confidence,modelSpread:sp,actualMargin:margin,projTotal,actualTotal,spreadCorrect:atsCover&&!atsPush,totalCorrect:totOver===(modelTotalLean?.toUpperCase()==="OVER"),atsResult:atsCover?"COVER":atsPush?"PUSH":"NO COVER",totalResult:totOver?"OVER":"UNDER",date:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"}),actualScoreStr:`${abb(awayTeam)} ${aScore} – ${hScore} ${abb(homeTeam)}`});
    setForm({s1:"",s2:""});
  }
  return(
    <Panel border="rgba(34,197,94,0.16)" bg="rgba(34,197,94,0.02)" mb="10px">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        <div style={{display:"flex",alignItems:"center",gap:"7px"}}>
          <span style={{fontSize:"11px"}}>🧪</span>
          <span style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#22c55e",fontFamily:"'Barlow Condensed',sans-serif"}}>Historical Backtest Engine</span>
          {total>0&&<Tag color="#22c55e">{total} games</Tag>}
          {atsR!=null&&<Tag color={atsR>=53?"#4ade80":"#f87171"}>ATS {atsR}%</Tag>}
          {hcATS!=null&&<Tag color={hcATS>=60?"#4ade80":"#f59e0b"}>HIGH {hcATS}%</Tag>}
        </div>
        <span style={{color:"#333",fontSize:"10px"}}>{open?"▲":"▼"}</span>
      </div>
      {open&&<div style={{marginTop:"11px"}}>
        <div style={{fontSize:"9px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"9px",lineHeight:"1.5"}}>Log actual results to measure model accuracy over time. Tracks ATS%, total hit rate, and HIGH confidence accuracy — the only way to know if the 12 signals are adding real edge.</div>
        {homeTeam&&awayTeam&&modelSpread&&(
          <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"6px",padding:"9px 11px",marginBottom:"9px"}}>
            <div style={{fontSize:"8px",fontWeight:700,color:"#22c55e",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"6px",textTransform:"uppercase",letterSpacing:"0.08em"}}>Log Result: {abb(awayTeam)} @ {abb(homeTeam)}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px",marginBottom:"6px"}}>
              {[[`${abb(awayTeam)} Score`,"s1"],[`${abb(homeTeam)} Score`,"s2"]].map(([lbl,key])=>(
                <div key={key}><div style={{fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px"}}>{lbl}</div><input type="number" value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} placeholder="0" style={{width:"100%",padding:"5px 8px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:"4px",color:"#ddd",fontSize:"14px",outline:"none",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700}}/></div>
              ))}
            </div>
            {form.s1&&form.s2&&(()=>{
              const h=parseFloat(form.s2),a=parseFloat(form.s1),sp=parseFloat(modelSpread||0);
              const margin=h-a,cover=(margin+sp)>0;
              const actual=h+a,over=actual>parseFloat(modelTotal||0);
              const totCorrect=over===(modelTotalLean?.toUpperCase()==="OVER");
              return(<div style={{display:"flex",gap:"5px",marginBottom:"5px"}}>
                <div style={{flex:1,background:"rgba(255,255,255,0.04)",borderRadius:"4px",padding:"4px 6px",textAlign:"center"}}><div style={{fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>ATS</div><div style={{fontSize:"10px",fontWeight:700,color:cover?"#4ade80":"#f87171",fontFamily:"'Barlow Condensed',sans-serif"}}>{cover?"✓ COVER":"✗ NO COVER"}</div></div>
                <div style={{flex:1,background:"rgba(255,255,255,0.04)",borderRadius:"4px",padding:"4px 6px",textAlign:"center"}}><div style={{fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>TOTAL</div><div style={{fontSize:"10px",fontWeight:700,color:totCorrect?"#4ade80":"#f87171",fontFamily:"'Barlow Condensed',sans-serif"}}>{over?"OVER":"UNDER"} {totCorrect?"✓":"✗"}</div></div>
                <div style={{flex:1,background:"rgba(255,255,255,0.04)",borderRadius:"4px",padding:"4px 6px",textAlign:"center"}}><div style={{fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>CONF</div><div style={{fontSize:"10px",fontWeight:700,color:confidence==="HIGH"?"#4ade80":confidence==="MEDIUM"?"#f59e0b":"#f87171",fontFamily:"'Barlow Condensed',sans-serif"}}>{confidence||"—"}</div></div>
              </div>);
            })()}
            <button onClick={submit} disabled={!form.s1||!form.s2} style={{width:"100%",padding:"6px",borderRadius:"4px",border:"none",background:form.s1&&form.s2?"linear-gradient(135deg,#15803d,#166534)":"rgba(255,255,255,0.04)",color:form.s1&&form.s2?"#fff":"#333",fontSize:"9px",fontWeight:700,cursor:form.s1&&form.s2?"pointer":"not-allowed",fontFamily:"'Barlow Condensed',sans-serif"}}>Save to Backtest</button>
          </div>
        )}
        {total>0&&(
          <>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"5px",marginBottom:"7px"}}>
              {[["ATS Rate",atsR!=null?`${atsR}%`:"—",atsR>=53?"#4ade80":atsR>=50?"#f59e0b":"#f87171",`${atsW}/${total}`],["Total Rate",totR!=null?`${totR}%`:"—",totR>=53?"#4ade80":totR>=50?"#f59e0b":"#f87171",`${totW}/${total}`],["HIGH ATS",hcATS!=null?`${hcATS}%`:"—",hcATS>=60?"#4ade80":hcATS>=52?"#f59e0b":"#f87171",`${hcG.length} games`]].map(([l,v,c,s])=>(
                <div key={l} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"6px",padding:"8px 6px",textAlign:"center"}}><div style={{fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px"}}>{l}</div><div style={{fontSize:"18px",fontWeight:900,color:c,fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{v}</div><div style={{fontSize:"7px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"2px"}}>{s}</div></div>
              ))}
            </div>
            <div style={{maxHeight:"160px",overflowY:"auto"}}>
              {backtestHistory.map((g,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:"5px",padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
                  <span style={{fontSize:"8px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",width:"55px",flexShrink:0}}>{g.date}</span>
                  <span style={{fontSize:"8px",color:"#aaa",fontFamily:"'Barlow Condensed',sans-serif",flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{g.actualScoreStr}</span>
                  <Tag color={g.confidence==="HIGH"?"#4ade80":g.confidence==="MEDIUM"?"#f59e0b":"#f87171"}>{g.confidence?.charAt(0)||"?"}</Tag>
                  <Tag color={g.spreadCorrect?"#4ade80":"#f87171"}>{g.spreadCorrect?"✓":"✗"} ATS</Tag>
                  <Tag color={g.totalCorrect?"#4ade80":"#f87171"}>{g.totalCorrect?"✓":"✗"} TOT</Tag>
                </div>
              ))}
            </div>
            <button onClick={onClearBacktest} style={{marginTop:"5px",padding:"3px 9px",borderRadius:"3px",border:"1px solid rgba(248,113,113,0.14)",background:"rgba(248,113,113,0.04)",color:"#f87171",fontSize:"8px",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif"}}>Clear Backtest</button>
          </>
        )}
      </div>}
    </Panel>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function NFLParlayModel(){

export { SteamMoveAlert, ContradictionPanel, SignalWeightPanel, CalibrationPanel, CLVPanel, BacktestPanel };
