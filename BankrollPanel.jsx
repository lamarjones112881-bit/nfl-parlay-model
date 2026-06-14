import { useState, useEffect } from "react";
import { Panel, PanelTitle, Tag } from "../components/UIKit.jsx";

function BankrollPanel({ unitHistory, onAddUnit, onClearUnits, startingBankroll, onSetBankroll }) {
  const [open,setOpen]=useState(false);
  const [units,setUnits]=useState("1");
  const [odds,setOdds]=useState("-110");
  const [result,setResult]=useState("WIN");
  const [note,setNote]=useState("");
  const totalUnits = unitHistory?.reduce((s,e)=>s+(e.unitsWon||0),0)||0;
  const totalBets  = unitHistory?.length||0;
  const wins = unitHistory?.filter(e=>e.result==="WIN").length||0;
  const winRate = totalBets>0?Math.round(wins/totalBets*100):null;
  const roi = totalBets>0?parseFloat((totalUnits/totalBets*100).toFixed(1)):null;

  function submit(){
    const u=parseFloat(units)||1, dec=americanToDecimal(odds)||1.909;
    const wonUnits = result==="WIN" ? u*(dec-1) : result==="LOSS" ? -u : 0;
    onAddUnit({units:u,odds,decimal:dec,result,unitsWon:parseFloat(wonUnits.toFixed(2)),note,date:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"})});
    setUnits("1");setOdds("-110");setNote("");
  }

  // Running balance for sparkline
  let running=0;
  const balanceLine=(unitHistory||[]).slice().reverse().map(e=>{running+=e.unitsWon||0;return parseFloat(running.toFixed(2));});

  return(
    <Panel border="rgba(251,191,36,0.18)" bg="rgba(251,191,36,0.02)" mb="10px">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        <div style={{display:"flex",alignItems:"center",gap:"7px"}}>
          <span style={{fontSize:"11px"}}>💰</span>
          <span style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#fbbf24",fontFamily:"'Barlow Condensed',sans-serif"}}>Bankroll / Unit Tracker</span>
          {totalBets>0&&<Tag color={totalUnits>=0?"#4ade80":"#f87171"}>{totalUnits>=0?"+":""}{totalUnits.toFixed(1)}u</Tag>}
          {roi!==null&&<Tag color={roi>=0?"#4ade80":"#f87171"}>ROI {roi>0?"+":""}{ roi}%</Tag>}
          {winRate!==null&&<Tag color="#fbbf24">{winRate}% W</Tag>}
        </div>
        <span style={{color:"#333",fontSize:"10px"}}>{open?"▲":"▼"}</span>
      </div>
      {open&&(
        <div style={{marginTop:"11px"}}>
          {/* Stats strip */}
          {totalBets>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"5px",marginBottom:"10px"}}>
            {[["Total Units",`${totalUnits>=0?"+":""}${totalUnits.toFixed(1)}u`,totalUnits>=0?"#4ade80":"#f87171"],["Win Rate",winRate!==null?`${winRate}%`:"—",winRate>=53?"#4ade80":winRate>=50?"#f59e0b":"#f87171"],["ROI",roi!==null?`${roi>0?"+":""}${roi}%`:"—",roi>=5?"#4ade80":roi>=0?"#86efac":"#f87171"],["Bets",`${totalBets}`,"#aaa"]].map(([l,v,c])=>(
              <div key={l} style={{background:"rgba(255,255,255,0.04)",borderRadius:"6px",padding:"7px 6px",textAlign:"center"}}>
                <div style={{fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px"}}>{l}</div>
                <div style={{fontSize:"16px",fontWeight:900,color:c,fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{v}</div>
              </div>
            ))}
          </div>}
          {/* P&L sparkline */}
          {balanceLine.length>1&&<div style={{marginBottom:"10px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"6px",padding:"9px 11px"}}>
            <div style={{fontSize:"8px",fontWeight:700,letterSpacing:"0.09em",textTransform:"uppercase",color:"#555",marginBottom:"6px",fontFamily:"'Barlow Condensed',sans-serif"}}>P&L Curve (units)</div>
            <div style={{display:"flex",alignItems:"flex-end",gap:"2px",height:"40px"}}>
              {balanceLine.map((v,i)=>{
                const minV=Math.min(...balanceLine), maxV=Math.max(...balanceLine);
                const range=Math.max(Math.abs(maxV-minV),0.5);
                const h=Math.max(3,((v-minV)/range)*38);
                return <div key={i} style={{flex:1,height:`${h}px`,background:v>=0?"#4ade80":"#f87171",borderRadius:"1px 1px 0 0",opacity:0.7,minWidth:"3px"}} title={`${v>=0?"+":""}${v}u`}/>;
              })}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:"7px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"3px"}}>
              <span>Start</span><span style={{color:totalUnits>=0?"#4ade80":"#f87171",fontWeight:700}}>{totalUnits>=0?"+":""}{ totalUnits.toFixed(1)}u running total</span><span>Now</span>
            </div>
          </div>}
          {/* Log bet */}
          <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"6px",padding:"10px 11px",marginBottom:"8px"}}>
            <div style={{fontSize:"8px",fontWeight:700,letterSpacing:"0.09em",textTransform:"uppercase",color:"#fbbf24",marginBottom:"7px",fontFamily:"'Barlow Condensed',sans-serif"}}>Log Bet</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"6px",marginBottom:"6px"}}>
              {[["Units",units,setUnits,"e.g. 2"],["Odds (American)",odds,setOdds,"e.g. -110"]].map(([l,v,s,ph])=>(
                <div key={l}><label style={{display:"block",fontSize:"7px",fontWeight:700,color:"#444",marginBottom:"2px",fontFamily:"'Barlow Condensed',sans-serif"}}>{l}</label><input value={v} onChange={e=>s(e.target.value)} placeholder={ph} style={{width:"100%",padding:"5px 8px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:"4px",color:"#ddd",fontSize:"12px",outline:"none",fontFamily:"'Barlow Condensed',sans-serif"}}/></div>
              ))}
              <div><label style={{display:"block",fontSize:"7px",fontWeight:700,color:"#444",marginBottom:"2px",fontFamily:"'Barlow Condensed',sans-serif"}}>Result</label>
                <select value={result} onChange={e=>setResult(e.target.value)} style={{width:"100%",padding:"5px 8px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:"4px",color:"#ddd",fontSize:"12px",outline:"none",fontFamily:"'Barlow Condensed',sans-serif"}}>
                  {["WIN","LOSS","PUSH"].map(r=><option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            {/* Unit won preview */}
            {units&&odds&&(()=>{
              const dec=americanToDecimal(odds);
              const won=result==="WIN"?parseFloat(units)*(dec-1):result==="LOSS"?-parseFloat(units):0;
              return <div style={{marginBottom:"5px",fontSize:"9px",color:won>=0?"#4ade80":"#f87171",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700}}>{won>=0?"+":""}{ won.toFixed(2)} units {result==="WIN"?"profit":result==="LOSS"?"loss":"(push)"}</div>;
            })()}
            <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Note (optional)" style={{width:"100%",padding:"4px 8px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"4px",color:"#888",fontSize:"9px",outline:"none",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"5px"}}/>
            <button onClick={submit} style={{width:"100%",padding:"7px",borderRadius:"5px",border:"none",background:"linear-gradient(135deg,#b45309,#92400e)",color:"#fff",fontSize:"10px",fontWeight:700,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif"}}>Log Bet</button>
          </div>
          {/* Recent bets */}
          {unitHistory?.length>0&&<div style={{maxHeight:"150px",overflowY:"auto"}}>
            {unitHistory.slice(0,20).map((e,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:"6px",padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                <span style={{fontSize:"8px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",width:"50px",flexShrink:0}}>{e.date}</span>
                <span style={{fontSize:"9px",color:"#888",fontFamily:"'Barlow Condensed',sans-serif",flex:1}}>{e.units}u @ {e.odds}</span>
                {e.note&&<span style={{fontSize:"8px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{e.note}</span>}
                <Tag color={e.result==="WIN"?"#4ade80":e.result==="LOSS"?"#f87171":"#f59e0b"}>{e.result==="WIN"?"+":""}{e.unitsWon?.toFixed(2)}u</Tag>
              </div>
            ))}
          </div>}
          {unitHistory?.length>0&&<button onClick={onClearUnits} style={{marginTop:"5px",padding:"3px 9px",borderRadius:"3px",border:"1px solid rgba(248,113,113,0.14)",background:"rgba(248,113,113,0.04)",color:"#f87171",fontSize:"8px",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif"}}>Clear Units</button>}
        </div>
      )}
    </Panel>
  );
}

// ── Auto Weather Forecast Panel ───────────────────────────────────────────
function WeatherForecastPanel({ homeTeam, forecastData, forecastLoading, onApplyWeather, currentWeather }) {

export default BankrollPanel;
