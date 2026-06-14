import { useState } from "react";
import { Panel, PanelTitle, Tag } from "../components/UIKit.jsx";

function SeasonDashboard({ backtestHistory, clvHistory, parlayHistory, signalWeights }) {
  const [open, setOpen] = useState(false);
  const hasData = (backtestHistory?.length || 0) + (clvHistory?.length || 0) + (parlayHistory?.length || 0) > 0;
  if (!hasData) return null;

  // Weekly breakdown from backtest
  const weeklyData = backtestHistory?.reduce((acc, g) => {
    const week = g.week || g.date || "Unknown";
    if (!acc[week]) acc[week] = { atsW:0,atsL:0,totW:0,totL:0 };
    if (g.spreadCorrect) acc[week].atsW++; else acc[week].atsL++;
    if (g.totalCorrect) acc[week].totW++; else acc[week].totL++;
    return acc;
  }, {}) || {};

  // Signal performance from backtest
  const signalPerf = {};
  backtestHistory?.forEach(g => {
    if (g.signals) {
      Object.entries(g.signals).forEach(([sig, fired]) => {
        if (!signalPerf[sig]) signalPerf[sig] = { wins:0, total:0 };
        signalPerf[sig].total++;
        if (g.spreadCorrect) signalPerf[sig].wins++;
      });
    }
  });

  // Overall stats
  const totalBT = backtestHistory?.length || 0;
  const atsW = backtestHistory?.filter(g=>g.spreadCorrect).length || 0;
  const totW = backtestHistory?.filter(g=>g.totalCorrect).length || 0;
  const atsRate = totalBT > 0 ? Math.round(atsW/totalBT*100) : null;
  const totRate = totalBT > 0 ? Math.round(totW/totalBT*100) : null;
  const avgCLV = clvHistory?.length ? (clvHistory.reduce((s,e)=>s+parseFloat(e.diff||0),0)/clvHistory.length).toFixed(2) : null;
  const parlayW = parlayHistory?.filter(h=>h.result==="WIN").length || 0;
  const parlayL = parlayHistory?.filter(h=>h.result==="LOSS").length || 0;
  const parlayRate = parlayW+parlayL > 0 ? Math.round(parlayW/(parlayW+parlayL)*100) : null;
  const highConfBT = backtestHistory?.filter(g=>g.confidence==="HIGH") || [];
  const highConfATS = highConfBT.length > 0 ? Math.round(highConfBT.filter(g=>g.spreadCorrect).length/highConfBT.length*100) : null;

  // CLV trend (last 10)
  const recentCLV = clvHistory?.slice(0,10) || [];
  const clvTrend = recentCLV.length >= 3 ? (() => {
    const recent3 = recentCLV.slice(0,3).reduce((s,e)=>s+parseFloat(e.diff||0),0)/3;
    const older = recentCLV.slice(3).reduce((s,e)=>s+parseFloat(e.diff||0),0)/(recentCLV.length-3||1);
    return recent3 > older ? "improving" : recent3 < older ? "declining" : "stable";
  })() : null;

  return (
    <Panel border="rgba(34,197,94,0.18)" bg="rgba(34,197,94,0.02)" mb="10px">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        <div style={{display:"flex",alignItems:"center",gap:"7px"}}>
          <span style={{fontSize:"11px"}}>🏆</span>
          <span style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#22c55e",fontFamily:"'Barlow Condensed',sans-serif"}}>Season Analytics Dashboard</span>
          {atsRate!=null && <Tag color={atsRate>=53?"#4ade80":"#f87171"}>ATS {atsRate}%</Tag>}
          {avgCLV && <Tag color={parseFloat(avgCLV)>0?"#4ade80":"#f87171"}>CLV {parseFloat(avgCLV)>0?"+":""}{avgCLV}</Tag>}
          {parlayRate!=null && <Tag color={parlayRate>=35?"#4ade80":"#f87171"}>Parlays {parlayRate}%</Tag>}
        </div>
        <span style={{color:"#333",fontSize:"10px"}}>{open?"▲":"▼"}</span>
      </div>
      {open && (
        <div style={{marginTop:"12px"}}>
          {/* Top-line metrics */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"5px",marginBottom:"12px"}}>
            {[
              ["ATS Rate",atsRate!=null?`${atsRate}%`:"—",atsRate>=53?"#4ade80":atsRate>=50?"#f59e0b":"#f87171",`${atsW}/${totalBT} games`],
              ["Total Rate",totRate!=null?`${totRate}%`:"—",totRate>=53?"#4ade80":totRate>=50?"#f59e0b":"#f87171",`${totW}/${totalBT} games`],
              ["HIGH ATS",highConfATS!=null?`${highConfATS}%`:"—",highConfATS>=60?"#4ade80":highConfATS>=52?"#f59e0b":"#f87171",`${highConfBT.length} HIGH picks`],
              ["Parlay W%",parlayRate!=null?`${parlayRate}%`:"—",parlayRate>=35?"#4ade80":"#f87171",`${parlayW}W-${parlayL}L`],
            ].map(([l,v,c,s])=>(
              <div key={l} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"7px",padding:"9px 6px",textAlign:"center"}}>
                <div style={{fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px"}}>{l}</div>
                <div style={{fontSize:"18px",fontWeight:900,color:c,fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{v}</div>
                <div style={{fontSize:"7px",color:"#2a2a2a",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"2px"}}>{s}</div>
              </div>
            ))}
          </div>

          {/* CLV trend */}
          {avgCLV && (
            <div style={{marginBottom:"10px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"7px",padding:"10px 12px"}}>
              <div style={{fontSize:"9px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#14b8a6",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"7px"}}>📈 Closing Line Value Trend</div>
              <div style={{display:"flex",gap:"6px",marginBottom:"6px",flexWrap:"wrap"}}>
                {[
                  ["Avg CLV",`${parseFloat(avgCLV)>0?"+":""}${avgCLV}`,parseFloat(avgCLV)>0?"#4ade80":"#f87171"],
                  ["Positive CLV %",`${Math.round(clvHistory.filter(e=>parseFloat(e.diff)>0).length/clvHistory.length*100)}%`,Math.round(clvHistory.filter(e=>parseFloat(e.diff)>0).length/clvHistory.length*100)>=55?"#4ade80":"#f59e0b"],
                  ["Trend",clvTrend||"—",clvTrend==="improving"?"#4ade80":clvTrend==="declining"?"#f87171":"#f59e0b"],
                  ["Entries",`${clvHistory.length}`,"#888"],
                ].map(([l,v,c])=>(
                  <div key={l} style={{background:"rgba(255,255,255,0.04)",borderRadius:"5px",padding:"4px 9px",textAlign:"center"}}>
                    <div style={{fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>{l}</div>
                    <div style={{fontSize:"12px",fontWeight:800,color:c,fontFamily:"'Barlow Condensed',sans-serif"}}>{v}</div>
                  </div>
                ))}
              </div>
              {/* Mini sparkline-style CLV bars */}
              <div style={{display:"flex",gap:"3px",alignItems:"flex-end",height:"28px"}}>
                {recentCLV.slice(0,10).reverse().map((e,i)=>{
                  const v=parseFloat(e.diff||0);
                  const h=Math.max(3,Math.min(28,Math.abs(v)*5+8));
                  return(
                    <div key={i} style={{flex:1,height:`${h}px`,borderRadius:"2px 2px 0 0",background:v>0?"#4ade80":"#f87171",opacity:0.7,flexShrink:0,minWidth:"6px"}} title={`${v>0?"+":""}${v}`}/>
                  );
                })}
              </div>
              <div style={{fontSize:"7px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"3px"}}>Last {recentCLV.length} entries (oldest → newest)</div>
            </div>
          )}

          {/* Weekly backtest */}
          {Object.keys(weeklyData).length > 0 && (
            <div style={{marginBottom:"10px"}}>
              <div style={{fontSize:"9px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#22c55e",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"6px"}}>Weekly ATS Breakdown</div>
              <div style={{maxHeight:"140px",overflowY:"auto"}}>
                {Object.entries(weeklyData).map(([week,d])=>{
                  const wATS=d.atsW+d.atsL>0?Math.round(d.atsW/(d.atsW+d.atsL)*100):50;
                  return(
                    <div key={week} style={{display:"flex",alignItems:"center",gap:"8px",padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                      <span style={{fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",width:"80px",flexShrink:0}}>{week}</span>
                      <div style={{flex:1,height:"5px",borderRadius:"3px",background:"rgba(255,255,255,0.05)",overflow:"hidden"}}>
                        <div style={{width:`${wATS}%`,height:"100%",background:wATS>=53?"#4ade80":wATS>=50?"#f59e0b":"#f87171",transition:"width 0.5s ease"}}/>
                      </div>
                      <span style={{fontSize:"9px",fontWeight:700,color:wATS>=53?"#4ade80":wATS>=50?"#f59e0b":"#f87171",fontFamily:"'Barlow Condensed',sans-serif",width:"35px",textAlign:"right"}}>{d.atsW}-{d.atsL}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bet type breakdown */}
          {totalBT > 0 && (() => {
            const byType = backtestHistory.reduce((acc,g)=>{ const t=g.betType||"Spread"; if(!acc[t])acc[t]={w:0,l:0};if(g.spreadCorrect||g.totalCorrect)acc[t].w++;else acc[t].l++;return acc; },{});
            return(
              <div>
                <div style={{fontSize:"9px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#6366f1",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"5px"}}>By Bet Type</div>
                <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
                  {Object.entries(byType).map(([t,d])=>{
                    const r=d.w+d.l>0?Math.round(d.w/(d.w+d.l)*100):50;
                    return(
                      <div key={t} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"5px",padding:"5px 9px",textAlign:"center"}}>
                        <div style={{fontSize:"8px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>{t}</div>
                        <div style={{fontSize:"14px",fontWeight:900,color:r>=53?"#4ade80":r>=50?"#f59e0b":"#f87171",fontFamily:"'Barlow Condensed',sans-serif"}}>{r}%</div>
                        <div style={{fontSize:"7px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif"}}>{d.w}W-{d.l}L</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </Panel>
  );
}

// ── Steam Move Alert ──────────────────────────────────────────────────────────
function SteamMoveAlert({lineMove}){

export default SeasonDashboard;
