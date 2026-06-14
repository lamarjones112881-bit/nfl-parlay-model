import { useState } from "react";
import { americanToDecimal, decimalToImplied, calcEV, calcKelly } from "../utils/mathUtils.js";
import { Panel, PanelTitle, Tag } from "../components/UIKit.jsx";

function EVKellyPanel({ gameResult, lines }) {
  const [homeOdds,setHomeOdds]=useState("");
  const [awayOdds,setAwayOdds]=useState("");
  const [spreadOdds,setSpreadOdds]=useState("-110");
  const [bankroll,setBankroll]=useState("1000");
  const [activeTab,setActiveTab]=useState("spread");
  if(!gameResult) return null;

  const winProb = activeTab==="spread" ? (gameResult.winProb||50)
                : activeTab==="home_ml" ? (gameResult.homeWin||50)
                : (gameResult.awayWin||50);
  const oddsInput = activeTab==="spread" ? spreadOdds : activeTab==="home_ml" ? homeOdds : awayOdds;
  const decimal = americanToDecimal(oddsInput);
  const implied = decimalToImplied(decimal);
  const ev = calcEV(winProb, decimal);
  const kelly = calcKelly(winProb, decimal);
  const bankrollNum = parseFloat(bankroll)||1000;
  const unitBet = kelly ? (kelly.quarter/100)*bankrollNum : null;
  const evColor = ev===null?"#555":ev>3?"#4ade80":ev>0?"#86efac":ev>-3?"#f59e0b":"#f87171";
  const evGrade = ev===null?"—":ev>5?"STRONG EDGE":ev>2?"EDGE":ev>0?"MARGINAL":ev>-3?"THIN":"-EV";

  return (
    <Panel border={ev>0?"rgba(74,222,128,0.22)":"rgba(248,113,113,0.16)"} bg={ev>0?"rgba(74,222,128,0.03)":"rgba(248,113,113,0.02)"} mb="10px">
      <PanelTitle icon="💎" title="Expected Value + Kelly Criterion" tag={ev!==null?evGrade:undefined} tagColor={evColor}/>
      {/* Bet type tabs */}
      <div style={{display:"flex",gap:"4px",marginBottom:"10px"}}>
        {[["spread","Spread"],["home_ml","Home ML"],["away_ml","Away ML"]].map(([k,l])=>(
          <button key={k} onClick={()=>setActiveTab(k)} style={{padding:"4px 9px",borderRadius:"4px",border:`1px solid ${activeTab===k?"rgba(74,222,128,0.35)":"rgba(255,255,255,0.07)"}`,background:activeTab===k?"rgba(74,222,128,0.08)":"transparent",color:activeTab===k?"#4ade80":"#555",fontSize:"9px",fontWeight:700,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif"}}>{l}</button>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"7px",marginBottom:"10px"}}>
        {/* Odds input */}
        <div>
          <label style={{display:"block",fontSize:"8px",fontWeight:700,letterSpacing:"0.09em",textTransform:"uppercase",color:"#555",marginBottom:"3px",fontFamily:"'Barlow Condensed',sans-serif"}}>Book Odds</label>
          <input value={activeTab==="spread"?spreadOdds:activeTab==="home_ml"?homeOdds:awayOdds} onChange={e=>{const v=e.target.value;activeTab==="spread"?setSpreadOdds(v):activeTab==="home_ml"?setHomeOdds(v):setAwayOdds(v);}} placeholder="-110" style={{width:"100%",padding:"7px 9px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"5px",color:"#fff",fontSize:"13px",fontWeight:700,outline:"none",fontFamily:"'Barlow Condensed',sans-serif"}}/>
          <div style={{fontSize:"7px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"2px"}}>American format (e.g. -110, +120)</div>
        </div>
        {/* Bankroll */}
        <div>
          <label style={{display:"block",fontSize:"8px",fontWeight:700,letterSpacing:"0.09em",textTransform:"uppercase",color:"#555",marginBottom:"3px",fontFamily:"'Barlow Condensed',sans-serif"}}>Bankroll ($)</label>
          <input value={bankroll} onChange={e=>setBankroll(e.target.value)} placeholder="1000" type="number" style={{width:"100%",padding:"7px 9px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"5px",color:"#fff",fontSize:"13px",fontWeight:700,outline:"none",fontFamily:"'Barlow Condensed',sans-serif"}}/>
          <div style={{fontSize:"7px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"2px"}}>Total available capital</div>
        </div>
        {/* Model win prob */}
        <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"5px",padding:"7px 9px",textAlign:"center"}}>
          <div style={{fontSize:"8px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px",letterSpacing:"0.09em",textTransform:"uppercase"}}>Model Win Prob</div>
          <div style={{fontSize:"20px",fontWeight:900,color:"#c084fc",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{winProb}%</div>
          <div style={{fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"2px"}}>from 17-signal stack</div>
        </div>
      </div>
      {/* Results grid */}
      {decimal&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:"5px",marginBottom:"10px"}}>
        {[
          ["Book Implied",implied?`${implied.toFixed(1)}%`:"—","#aaa","from your odds"],
          ["Edge",implied?`${(winProb-implied).toFixed(1)}%`:"—",winProb-(implied||winProb)>0?"#4ade80":"#f87171","model vs book"],
          ["EV",ev!==null?`${ev>0?"+":""}${ev}%`:"—",evColor,"per $100 bet"],
          ["¼ Kelly",kelly?`${kelly.quarter}%`:"—",kelly?.quarter>0?"#4ade80":"#f87171","of bankroll"],
        ].map(([l,v,c,s])=>(
          <div key={l} style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${c}18`,borderRadius:"6px",padding:"8px 6px",textAlign:"center"}}>
            <div style={{fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px"}}>{l}</div>
            <div style={{fontSize:"15px",fontWeight:900,color:c,fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{v}</div>
            <div style={{fontSize:"6px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"2px"}}>{s}</div>
          </div>
        ))}
      </div>}
      {/* Kelly bet size */}
      {kelly&&unitBet!=null&&<div style={{background:ev>0?"rgba(74,222,128,0.06)":"rgba(248,113,113,0.05)",border:`1px solid ${ev>0?"rgba(74,222,128,0.18)":"rgba(248,113,113,0.14)"}`,borderRadius:"7px",padding:"10px 13px",display:"flex",alignItems:"center",gap:"12px"}}>
        <div style={{flex:1}}>
          <div style={{fontSize:"9px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:ev>0?"#4ade80":"#f87171",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px"}}>
            {ev>0?"✓ POSITIVE EV BET":"✗ NEGATIVE EV BET"}
          </div>
          <div style={{fontSize:"10px",color:ev>0?"#86efac":"#fca5a5",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.5"}}>
            {ev>0?`¼ Kelly suggests betting $${unitBet.toFixed(0)} (${kelly.quarter}% of bankroll). Full Kelly = ${kelly.full}% — never use full Kelly in sports betting.`:`At these odds, this bet loses money long-term. The book has ${(implied-(winProb)).toFixed(1)}% edge over you. Wait for better number or pass.`}
          </div>
        </div>
        {ev>0&&<div style={{textAlign:"center",flexShrink:0}}>
          <div style={{fontSize:"9px",color:"#4ade80",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px"}}>BET SIZE</div>
          <div style={{fontSize:"22px",fontWeight:900,color:"#4ade80",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>${unitBet.toFixed(0)}</div>
          <div style={{fontSize:"7px",color:"#4ade80",fontFamily:"'Barlow Condensed',sans-serif"}}>¼ Kelly</div>
        </div>}
      </div>}
      {/* Log Bet shortcut from EV panel */}
      {ev>0 && kelly && unitBet!=null && (
        <button onClick={()=>{
          const dec=decimal||1.909;
          const wonEst=parseFloat((parseFloat(bankroll||1000)*kelly.quarter/100*(dec-1)).toFixed(2));
          if(window._onLogBet) window._onLogBet({units:parseFloat((parseFloat(bankroll||1000)*kelly.quarter/100).toFixed(2)),odds:oddsInput,result:"WIN",unitsWon:wonEst,note:"From EV panel — "+activeTab});
        }}
        style={{width:"100%",marginBottom:"7px",padding:"7px",borderRadius:"5px",border:"1px solid rgba(74,222,128,0.25)",background:"rgba(74,222,128,0.07)",color:"#4ade80",fontSize:"10px",fontWeight:700,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif"}}>
          📋 Pre-fill Bankroll Entry from ¼ Kelly
        </button>
      )}
      <div style={{marginTop:"7px",fontSize:"8px",color:"#1a1a2a",fontFamily:"'Barlow Condensed',sans-serif"}}>EV = (model_prob × decimal_odds) - 1 · Kelly = (bp-q)/b · Always use ¼ Kelly to reduce variance</div>
    </Panel>
  );
}

// ── Bankroll / Unit Tracker ───────────────────────────────────────────────
function BankrollPanel({ unitHistory, onAddUnit, onClearUnits, startingBankroll, onSetBankroll }) {

export default EVKellyPanel;
