import { useState, useEffect, useRef } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────
const NFL_TEAMS = [
  "Arizona Cardinals","Atlanta Falcons","Baltimore Ravens","Buffalo Bills",
  "Carolina Panthers","Chicago Bears","Cincinnati Bengals","Cleveland Browns",
  "Dallas Cowboys","Denver Broncos","Detroit Lions","Green Bay Packers",
  "Houston Texans","Indianapolis Colts","Jacksonville Jaguars","Kansas City Chiefs",
  "Las Vegas Raiders","Los Angeles Chargers","Los Angeles Rams","Miami Dolphins",
  "Minnesota Vikings","New England Patriots","New Orleans Saints","New York Giants",
  "New York Jets","Philadelphia Eagles","Pittsburgh Steelers","San Francisco 49ers",
  "Seattle Seahawks","Tampa Bay Buccaneers","Tennessee Titans","Washington Commanders"
];
const DIVISIONS = {
  "NFC East":["Dallas Cowboys","New York Giants","Philadelphia Eagles","Washington Commanders"],
  "NFC North":["Chicago Bears","Detroit Lions","Green Bay Packers","Minnesota Vikings"],
  "NFC South":["Atlanta Falcons","Carolina Panthers","New Orleans Saints","Tampa Bay Buccaneers"],
  "NFC West":["Arizona Cardinals","Los Angeles Rams","San Francisco 49ers","Seattle Seahawks"],
  "AFC East":["Buffalo Bills","Miami Dolphins","New England Patriots","New York Jets"],
  "AFC North":["Baltimore Ravens","Cincinnati Bengals","Cleveland Browns","Pittsburgh Steelers"],
  "AFC South":["Houston Texans","Indianapolis Colts","Jacksonville Jaguars","Tennessee Titans"],
  "AFC West":["Denver Broncos","Kansas City Chiefs","Las Vegas Raiders","Los Angeles Chargers"]
};
const getDivision = t => Object.entries(DIVISIONS).find(([,ts])=>ts.includes(t))?.[0]||null;
const isDivisional = (a,b) => { const da=getDivision(a),db=getDivision(b); return da&&db&&da===db; };
const TEAM_ABBR = {
  "Arizona Cardinals":"ARI","Atlanta Falcons":"ATL","Baltimore Ravens":"BAL","Buffalo Bills":"BUF",
  "Carolina Panthers":"CAR","Chicago Bears":"CHI","Cincinnati Bengals":"CIN","Cleveland Browns":"CLE",
  "Dallas Cowboys":"DAL","Denver Broncos":"DEN","Detroit Lions":"DET","Green Bay Packers":"GB",
  "Houston Texans":"HOU","Indianapolis Colts":"IND","Jacksonville Jaguars":"JAX","Kansas City Chiefs":"KC",
  "Las Vegas Raiders":"LV","Los Angeles Chargers":"LAC","Los Angeles Rams":"LAR","Miami Dolphins":"MIA",
  "Minnesota Vikings":"MIN","New England Patriots":"NE","New Orleans Saints":"NO","New York Giants":"NYG",
  "New York Jets":"NYJ","Philadelphia Eagles":"PHI","Pittsburgh Steelers":"PIT","San Francisco 49ers":"SF",
  "Seattle Seahawks":"SEA","Tampa Bay Buccaneers":"TB","Tennessee Titans":"TEN","Washington Commanders":"WAS"
};
const TEAM_COLORS = {
  "Arizona Cardinals":"#97233F","Atlanta Falcons":"#A71930","Baltimore Ravens":"#241773","Buffalo Bills":"#00338D",
  "Carolina Panthers":"#0085CA","Chicago Bears":"#0B162A","Cincinnati Bengals":"#FB4F14","Cleveland Browns":"#311D00",
  "Dallas Cowboys":"#003594","Denver Broncos":"#FB4F14","Detroit Lions":"#0076B6","Green Bay Packers":"#203731",
  "Houston Texans":"#03202F","Indianapolis Colts":"#002C5F","Jacksonville Jaguars":"#006778","Kansas City Chiefs":"#E31837",
  "Las Vegas Raiders":"#333333","Los Angeles Chargers":"#0080C6","Los Angeles Rams":"#003594","Miami Dolphins":"#008E97",
  "Minnesota Vikings":"#4F2683","New England Patriots":"#002244","New Orleans Saints":"#B3995D","New York Giants":"#0B2265",
  "New York Jets":"#125740","Philadelphia Eagles":"#004C54","Pittsburgh Steelers":"#FFB612","San Francisco 49ers":"#AA0000",
  "Seattle Seahawks":"#002244","Tampa Bay Buccaneers":"#D50A0A","Tennessee Titans":"#0C2340","Washington Commanders":"#5A1414"
};
const STADIUM_CTX = {
  "Kansas City Chiefs":{turf:"grass",altitude:909,noise:"HIGH",indoor:false},
  "Buffalo Bills":{turf:"grass",altitude:570,noise:"HIGH",indoor:false},
  "Baltimore Ravens":{turf:"grass",altitude:146,noise:"HIGH",indoor:false},
  "San Francisco 49ers":{turf:"grass",altitude:15,noise:"MED",indoor:false},
  "Philadelphia Eagles":{turf:"grass",altitude:40,noise:"ELITE",indoor:false},
  "Pittsburgh Steelers":{turf:"grass",altitude:1060,noise:"HIGH",indoor:false},
  "Green Bay Packers":{turf:"grass",altitude:660,noise:"HIGH",indoor:false},
  "Seattle Seahawks":{turf:"field_turf",altitude:175,noise:"ELITE",indoor:false},
  "Dallas Cowboys":{turf:"field_turf",altitude:430,noise:"MED",indoor:true},
  "Las Vegas Raiders":{turf:"field_turf",altitude:2030,noise:"MED",indoor:true},
  "New Orleans Saints":{turf:"field_turf",altitude:6,noise:"HIGH",indoor:true},
  "Atlanta Falcons":{turf:"field_turf",altitude:1050,noise:"MED",indoor:true},
  "Arizona Cardinals":{turf:"field_turf",altitude:1086,noise:"LOW",indoor:true},
  "Los Angeles Rams":{turf:"field_turf",altitude:102,noise:"LOW",indoor:true},
  "Los Angeles Chargers":{turf:"field_turf",altitude:102,noise:"LOW",indoor:true},
  "Indianapolis Colts":{turf:"field_turf",altitude:718,noise:"MED",indoor:true},
  "Minnesota Vikings":{turf:"field_turf",altitude:830,noise:"HIGH",indoor:true},
  "Detroit Lions":{turf:"field_turf",altitude:600,noise:"MED",indoor:true},
  "Denver Broncos":{turf:"grass",altitude:5280,noise:"HIGH",indoor:false},
  "Miami Dolphins":{turf:"grass",altitude:6,noise:"LOW",indoor:false},
  "Tennessee Titans":{turf:"grass",altitude:597,noise:"MED",indoor:false},
  "Jacksonville Jaguars":{turf:"grass",altitude:12,noise:"LOW",indoor:false},
  "Tampa Bay Buccaneers":{turf:"grass",altitude:14,noise:"MED",indoor:false},
  "Carolina Panthers":{turf:"grass",altitude:765,noise:"MED",indoor:false},
  "Washington Commanders":{turf:"grass",altitude:20,noise:"MED",indoor:false},
  "New York Giants":{turf:"field_turf",altitude:3,noise:"MED",indoor:false},
  "New York Jets":{turf:"field_turf",altitude:3,noise:"MED",indoor:false},
  "New England Patriots":{turf:"field_turf",altitude:30,noise:"HIGH",indoor:false},
  "Cleveland Browns":{turf:"grass",altitude:653,noise:"HIGH",indoor:false},
  "Cincinnati Bengals":{turf:"grass",altitude:483,noise:"MED",indoor:false},
  "Chicago Bears":{turf:"grass",altitude:594,noise:"HIGH",indoor:false},
  "Houston Texans":{turf:"field_turf",altitude:43,noise:"MED",indoor:true},
};
const EMPTY_STATS = { wins:"",losses:"",ppg:"",papg:"",passYds:"",rushYds:"" };
const abb = t => TEAM_ABBR[t]||t.split(" ").pop();
const tc  = t => TEAM_COLORS[t]||"#4a9eff";
const BET_TYPES   = ["Spread","Moneyline","Over","Under"];
const RISK_COLORS = { LOW:"#4ade80",MEDIUM:"#f59e0b",HIGH:"#f87171","VERY HIGH":"#ef4444" };
const HIST_KEY        = "nfl_parlay_history_v4";
const PRESETS_KEY     = "nfl_game_presets_v1";
const BACKTEST_KEY    = "nfl_backtest_v1";
const CLV_KEY         = "nfl_clv_v1";
const CALIBRATION_KEY = "nfl_calibration_v1";
const WEIGHTS_KEY     = "nfl_signal_weights_v1";
const SEASON_KEY      = "nfl_season_analytics_v1";
const POWER_KEY       = "nfl_power_rankings_v1";
const PENDING_KEY     = "nfl_pending_games_v1";

// ═══════════════════════════════════════════════════════════════════════════
// FIVE NEW FEATURES: EV + Kelly · Bankroll Tracker · Weather Forecast
//                   Line Shopping · Injury Impact Quantifier
// ═══════════════════════════════════════════════════════════════════════════

const BANKROLL_KEY  = "nfl_bankroll_v1";
const UNITS_KEY     = "nfl_units_v1";
const WEATHER_CACHE_KEY = "nfl_weather_v1";

// ── Outdoor stadium coordinates (for weather fetch) ───────────────────────
const OUTDOOR_STADIUMS = {
  "Buffalo Bills":        {city:"Buffalo",lat:42.77,lon:-78.79},
  "Green Bay Packers":    {city:"Green Bay",lat:44.50,lon:-88.06},
  "Kansas City Chiefs":   {city:"Kansas City",lat:39.05,lon:-94.48},
  "Baltimore Ravens":     {city:"Baltimore",lat:39.28,lon:-76.62},
  "Pittsburgh Steelers":  {city:"Pittsburgh",lat:40.44,lon:-80.01},
  "Cleveland Browns":     {city:"Cleveland",lat:41.50,lon:-81.69},
  "Cincinnati Bengals":   {city:"Cincinnati",lat:39.09,lon:-84.51},
  "Denver Broncos":       {city:"Denver",lat:39.74,lon:-105.02},
  "Seattle Seahawks":     {city:"Seattle",lat:47.59,lon:-122.33},
  "San Francisco 49ers":  {city:"Santa Clara",lat:37.40,lon:-121.97},
  "Miami Dolphins":       {city:"Miami",lat:25.95,lon:-80.24},
  "New England Patriots": {city:"Foxborough",lat:42.09,lon:-71.26},
  "New York Giants":      {city:"East Rutherford",lat:40.81,lon:-74.07},
  "New York Jets":        {city:"East Rutherford",lat:40.81,lon:-74.07},
  "Philadelphia Eagles":  {city:"Philadelphia",lat:39.90,lon:-75.17},
  "Washington Commanders":{city:"Landover",lat:38.91,lon:-76.86},
  "Carolina Panthers":    {city:"Charlotte",lat:35.23,lon:-80.85},
  "Tampa Bay Buccaneers": {city:"Tampa",lat:27.98,lon:-82.50},
  "Jacksonville Jaguars": {city:"Jacksonville",lat:30.32,lon:-81.64},
  "Tennessee Titans":     {city:"Nashville",lat:36.17,lon:-86.77},
  "Chicago Bears":        {city:"Chicago",lat:41.86,lon:-87.62},
  "Detroit Lions":        {city:"Detroit",lat:42.34,lon:-83.05},
};

// ── EV & Kelly math ───────────────────────────────────────────────────────
function americanToDecimal(odds) {
  const o = parseFloat(odds);
  if(isNaN(o)) return null;
  return o > 0 ? (o/100)+1 : (100/Math.abs(o))+1;
}
function decimalToImplied(decimal) {
  if(!decimal||decimal<=1) return null;
  return (1/decimal)*100;
}
function calcEV(modelWinPct, decimalOdds) {
  if(!modelWinPct||!decimalOdds) return null;
  const p = modelWinPct/100;
  const q = 1-p;
  const ev = (p*(decimalOdds-1) - q)*100;
  return parseFloat(ev.toFixed(2));
}
function calcKelly(modelWinPct, decimalOdds, fraction=0.25) {
  if(!modelWinPct||!decimalOdds||decimalOdds<=1) return null;
  const p = modelWinPct/100;
  const b = decimalOdds-1;
  const kelly = (b*p - (1-p)) / b;
  const quarterKelly = kelly * fraction;
  return { full:parseFloat((kelly*100).toFixed(2)), quarter:parseFloat((quarterKelly*100).toFixed(2)), recommended:parseFloat((quarterKelly*100).toFixed(2)) };
}

// ── Injury impact table ───────────────────────────────────────────────────
const INJURY_IMPACT = {
  QB: { starter:{out:-3.8,doubtful:-2.2,questionable:-1.0}, label:"QB" },
  LT: { starter:{out:-0.9,doubtful:-0.5,questionable:-0.2}, label:"LT" },
  RT: { starter:{out:-0.6,doubtful:-0.3,questionable:-0.1}, label:"RT" },
  LG: { starter:{out:-0.5,doubtful:-0.3,questionable:-0.1}, label:"LG" },
  RG: { starter:{out:-0.5,doubtful:-0.3,questionable:-0.1}, label:"RG" },
  C:  { starter:{out:-0.5,doubtful:-0.3,questionable:-0.1}, label:"C"  },
  RB: { starter:{out:-0.8,doubtful:-0.5,questionable:-0.2}, label:"RB" },
  WR: { starter:{out:-0.7,doubtful:-0.4,questionable:-0.2}, label:"WR" },
  TE: { starter:{out:-0.5,doubtful:-0.3,questionable:-0.1}, label:"TE" },
  EDGE:{ starter:{out:-0.7,doubtful:-0.4,questionable:-0.1}, label:"Edge" },
  CB: { starter:{out:-0.6,doubtful:-0.3,questionable:-0.1}, label:"CB" },
  S:  { starter:{out:-0.4,doubtful:-0.2,questionable:-0.1}, label:"S"  },
  LB: { starter:{out:-0.4,doubtful:-0.2,questionable:-0.1}, label:"LB" },
};

function parseInjuryImpact(injuryText, teamName) {
  if(!injuryText||!teamName) return {total:0,items:[],grade:"OK"};
  const lines = injuryText.split('\n').filter(l=>l.includes(teamName)||l.includes(abb(teamName)));
  const section = [];
  let inSection=false;
  injuryText.split('\n').forEach(l=>{
    if(l.toLowerCase().includes(teamName.toLowerCase())) inSection=true;
    if(inSection) section.push(l);
    // Stop at next team heading
    if(inSection && l.trim().endsWith("Injuries:") && !l.toLowerCase().includes(teamName.toLowerCase())) inSection=false;
  });
  const text = section.join(' ').toLowerCase();
  let total=0;
  const items=[];
  Object.entries(INJURY_IMPACT).forEach(([pos,data])=>{
    const posReg=new RegExp(`\\b${pos.toLowerCase()}\\b`);
    if(!posReg.test(text)) return;
    let status='questionable', impact=0;
    if(/\bout\b/.test(text)&&posReg.test(text.slice(Math.max(0,text.search(posReg)-50),text.search(posReg)+100))) { status='out'; impact=data.starter.out; }
    else if(/doubtful/.test(text)) { status='doubtful'; impact=data.starter.doubtful; }
    else { status='questionable'; impact=data.starter.questionable; }
    if(impact!==0){ total+=impact; items.push({pos:data.label,status,impact}); }
  });
  const grade = total<=-3?"CRITICAL":total<=-1.5?"SIGNIFICANT":total<=-0.5?"MINOR":"OK";
  return {total:parseFloat(total.toFixed(1)),items,grade};
}

// ─────────────────────────────────────────────────────────────────────────
// UI COMPONENTS
// ─────────────────────────────────────────────────────────────────────────

// ── EV + Kelly Panel ──────────────────────────────────────────────────────
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
      <div style={{marginTop:"7px",fontSize:"8px",color:"#1a1a2a",fontFamily:"'Barlow Condensed',sans-serif"}}>EV = (model_prob × decimal_odds) - 1 · Kelly = (bp-q)/b · Always use ¼ Kelly to reduce variance</div>
    </Panel>
  );
}

// ── Bankroll / Unit Tracker ───────────────────────────────────────────────
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
  if(!homeTeam) return null;
  const isIndoor = STADIUM_CTX[homeTeam]?.indoor;
  const hasOutdoor = !!OUTDOOR_STADIUMS[homeTeam];
  if(isIndoor) return null; // dome teams don't need forecast
  if(!hasOutdoor&&!forecastData&&!forecastLoading) return null;
  const suggested = forecastData?.suggested;
  const isApplied = currentWeather===suggested;
  return(
    <div style={{display:"flex",alignItems:"center",gap:"8px",padding:"7px 11px",background:forecastData?"rgba(56,189,248,0.05)":"rgba(255,255,255,0.02)",border:`1px solid ${forecastData?"rgba(56,189,248,0.18)":"rgba(255,255,255,0.06)"}`,borderRadius:"7px",marginBottom:"9px",flexWrap:"wrap"}}>
      <span style={{fontSize:"12px"}}>{forecastLoading?"⏳":forecastData?.icon||"🌤"}</span>
      <div style={{flex:1}}>
        <div style={{fontSize:"9px",fontWeight:700,color:"#38bdf8",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px",letterSpacing:"0.08em",textTransform:"uppercase"}}>
          {forecastLoading?"Fetching game-day forecast…":forecastData?`${forecastData.location} — ${forecastData.description}`:"Outdoor game — fetch forecast"}
        </div>
        {forecastData&&<div style={{fontSize:"9px",color:"#7dd3fc",fontFamily:"'Barlow Condensed',sans-serif"}}>
          {forecastData.tempF}°F · Wind {forecastData.windMph}mph · Precip {forecastData.precipPct}% · Model category: <span style={{fontWeight:700,color:"#38bdf8"}}>{suggested?.toUpperCase()}</span>
        </div>}
      </div>
      {forecastData&&suggested&&(
        <button onClick={()=>onApplyWeather(suggested)} style={{padding:"5px 10px",borderRadius:"5px",border:`1px solid ${isApplied?"rgba(74,222,128,0.3)":"rgba(56,189,248,0.3)"}`,background:isApplied?"rgba(74,222,128,0.08)":"rgba(56,189,248,0.08)",color:isApplied?"#4ade80":"#38bdf8",fontSize:"9px",fontWeight:700,cursor:isApplied?"default":"pointer",fontFamily:"'Barlow Condensed',sans-serif",flexShrink:0}}>
          {isApplied?"✓ Applied":"Apply Forecast"}
        </button>
      )}
    </div>
  );
}

// ── Line Shopping Panel ───────────────────────────────────────────────────
function LineShoppingPanel({ ensemble, lines, gameResult, homeTeam, awayTeam }) {
  if(!ensemble?.books?.length) return null;
  const books=ensemble.books;
  const pickDir = gameResult?.winner ? (gameResult.winner===homeTeam?"home":"away") : null;
  // Best spread for each side
  const bestHomeSpread = pickDir==="home" ? books.reduce((best,b)=>b.spread<(best?.spread||99)?b:best,null) : null;
  const bestAwaySpread = pickDir==="away" ? books.reduce((best,b)=>b.spread>(best?.spread||-99)?b:best,null) : null;
  const bestTotal = books.reduce((best,b)=>b.total>(best?.total||0)?b:best,null);
  const spreadRange = books.length>1?Math.max(...books.map(b=>b.spread||0))-Math.min(...books.map(b=>b.spread||0)):0;
  const halfPtValue = spreadRange>=0.5?"Worth shopping":null;
  return(
    <Panel border="rgba(16,185,129,0.18)" bg="rgba(16,185,129,0.02)" mb="10px">
      <PanelTitle icon="🛒" title="Line Shopping" tag={spreadRange>=0.5?"Best Line Available":undefined} tagColor="#10b981"/>
      <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(books.length,4)},1fr)`,gap:"5px",marginBottom:"8px"}}>
        {books.map((b,i)=>{
          const isBestSpread=(pickDir==="home"&&b===bestHomeSpread)||(pickDir==="away"&&b===bestAwaySpread);
          const isBestTotal=b===bestTotal;
          return(
            <div key={i} style={{background:isBestSpread||isBestTotal?"rgba(16,185,129,0.08)":"rgba(255,255,255,0.04)",border:`1px solid ${isBestSpread||isBestTotal?"rgba(16,185,129,0.25)":"rgba(255,255,255,0.06)"}`,borderRadius:"7px",padding:"8px 7px",textAlign:"center",position:"relative"}}>
              {(isBestSpread||isBestTotal)&&<div style={{position:"absolute",top:"-6px",left:"50%",transform:"translateX(-50%)",background:"#10b981",borderRadius:"3px",padding:"1px 5px",fontSize:"6px",fontWeight:700,color:"#000",fontFamily:"'Barlow Condensed',sans-serif",whiteSpace:"nowrap"}}>{isBestSpread?"BEST SPREAD":"BEST TOTAL"}</div>}
              <div style={{fontSize:"8px",fontWeight:700,color:isBestSpread||isBestTotal?"#10b981":"#555",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"4px"}}>{b.book}</div>
              <div style={{fontSize:"13px",fontWeight:900,color:"#4ade80",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{b.favTeam?abb(b.favTeam):""} -{b.spread||"?"}</div>
              <div style={{fontSize:"11px",fontWeight:700,color:"#c084fc",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"2px"}}>{b.total||"—"}</div>
            </div>
          );
        })}
      </div>
      {/* Shopping edge */}
      <div style={{display:"flex",gap:"7px",flexWrap:"wrap"}}>
        {spreadRange>=0.5&&<div style={{flex:1,background:"rgba(16,185,129,0.05)",border:"1px solid rgba(16,185,129,0.14)",borderRadius:"6px",padding:"7px 10px"}}>
          <div style={{fontSize:"8px",fontWeight:700,color:"#10b981",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px",textTransform:"uppercase",letterSpacing:"0.08em"}}>Spread Divergence: {spreadRange.toFixed(1)} pts</div>
          <div style={{fontSize:"9px",color:"#6ee7b7",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.4"}}>{spreadRange>=1?"Significant divergence — shop for best number. A half-point off a key number is worth +3-4% cover rate.":"Get the best available spread. Even 0.5pt matters on key numbers -3/-7."}</div>
        </div>}
        {pickDir&&(bestHomeSpread||bestAwaySpread)&&<div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"6px",padding:"7px 10px",textAlign:"center",flexShrink:0}}>
          <div style={{fontSize:"8px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px"}}>BEST BOOK FOR YOUR PICK</div>
          <div style={{fontSize:"13px",fontWeight:900,color:"#10b981",fontFamily:"'Barlow Condensed',sans-serif"}}>{(bestHomeSpread||bestAwaySpread)?.book}</div>
          <div style={{fontSize:"9px",color:"#4ade80",fontFamily:"'Barlow Condensed',sans-serif"}}>{pickDir==="home"?abb(homeTeam):abb(awayTeam)} -{(bestHomeSpread||bestAwaySpread)?.spread}</div>
        </div>}
      </div>
    </Panel>
  );
}

// ── Injury Impact Panel ───────────────────────────────────────────────────
function InjuryImpactPanel({ injuries, homeTeam, awayTeam, lines }) {
  if(!injuries||(!homeTeam&&!awayTeam)) return null;
  const homeImpact = parseInjuryImpact(injuries, homeTeam);
  const awayImpact = parseInjuryImpact(injuries, awayTeam);
  const totalImpact = homeImpact.total - awayImpact.total; // net vs spread
  const hasImpact = Math.abs(homeImpact.total)>0.3||Math.abs(awayImpact.total)>0.3;
  if(!hasImpact) return null;
  const gradeColor = g=>g==="CRITICAL"?"#ef4444":g==="SIGNIFICANT"?"#f87171":g==="MINOR"?"#f59e0b":"#4ade80";
  return(
    <Panel border={homeImpact.grade==="CRITICAL"||awayImpact.grade==="CRITICAL"?"rgba(239,68,68,0.22)":"rgba(248,113,113,0.16)"} bg="rgba(248,113,113,0.02)" mb="10px">
      <PanelTitle icon="🏥" title="Injury Impact Quantifier" tag={homeImpact.grade!=="OK"||awayImpact.grade!=="OK"?"Active Injuries":undefined} tagColor="#f87171"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"8px"}}>
        {[{team:awayTeam,color:tc(awayTeam),d:awayImpact},{team:homeTeam,color:tc(homeTeam),d:homeImpact}].map(({team,color,d})=>(
          <div key={team} style={{borderTop:`2px solid ${color}33`,paddingTop:"9px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"}}>
              <span style={{fontSize:"9px",fontWeight:800,color,fontFamily:"'Barlow Condensed',sans-serif"}}>{abb(team)}</span>
              <Tag color={gradeColor(d.grade)}>{d.grade}</Tag>
            </div>
            {d.items.length>0?(<>
              {d.items.map((item,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:"6px",padding:"3px 6px",background:"rgba(255,255,255,0.03)",borderRadius:"3px",marginBottom:"2px"}}>
                  <span style={{fontSize:"8px",fontWeight:700,color:"#aaa",fontFamily:"'Barlow Condensed',sans-serif",width:"30px"}}>{item.pos}</span>
                  <Tag color={item.status==="out"?"#ef4444":item.status==="doubtful"?"#f87171":"#f59e0b"}>{item.status}</Tag>
                  <span style={{marginLeft:"auto",fontSize:"9px",fontWeight:700,color:"#f87171",fontFamily:"'Barlow Condensed',sans-serif"}}>{item.impact.toFixed(1)}</span>
                </div>
              ))}
              <div style={{marginTop:"5px",display:"flex",justifyContent:"space-between",padding:"4px 6px",background:"rgba(248,113,113,0.06)",borderRadius:"3px"}}>
                <span style={{fontSize:"8px",fontWeight:700,color:"#888",fontFamily:"'Barlow Condensed',sans-serif"}}>Total impact</span>
                <span style={{fontSize:"11px",fontWeight:900,color:"#f87171",fontFamily:"'Barlow Condensed',sans-serif"}}>{d.total.toFixed(1)} pts</span>
              </div>
            </>):<div style={{fontSize:"9px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif"}}>No key injuries detected</div>}
          </div>
        ))}
      </div>
      {/* Net spread adjustment */}
      {Math.abs(totalImpact)>=0.4&&<div style={{background:"rgba(248,113,113,0.06)",border:"1px solid rgba(248,113,113,0.14)",borderRadius:"6px",padding:"8px 11px",display:"flex",alignItems:"center",gap:"10px"}}>
        <div style={{flex:1}}>
          <div style={{fontSize:"9px",fontWeight:700,color:"#f87171",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px",textTransform:"uppercase",letterSpacing:"0.08em"}}>🏥 Net Injury Spread Adjustment</div>
          <div style={{fontSize:"10px",color:"#fca5a5",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.4"}}>
            Injury stack {totalImpact>0?`favors ${abb(awayTeam)} by ${Math.abs(totalImpact).toFixed(1)} pts`:`favors ${abb(homeTeam)} by ${Math.abs(totalImpact).toFixed(1)} pts`} vs Vegas spread. {lines?.spread?`Current spread ${abb(lines.favTeam||"")} -${lines.spread} — model-adjusted: -${(parseFloat(lines.spread||0)+Math.abs(totalImpact)).toFixed(1)}.`:""} 
          </div>
        </div>
        <div style={{textAlign:"center",flexShrink:0}}>
          <div style={{fontSize:"8px",color:"#f87171",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"1px"}}>NET ADJ</div>
          <div style={{fontSize:"18px",fontWeight:900,color:"#f87171",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{totalImpact>0?"+":""}{totalImpact.toFixed(1)}</div>
        </div>
      </div>}
      <div style={{marginTop:"7px",fontSize:"8px",color:"#1a1a2a",fontFamily:"'Barlow Condensed',sans-serif"}}>Position impact table: QB out=-3.8 · LT out=-0.9 · RB1 out=-0.8 · WR1 out=-0.7 · CB1 out=-0.6</div>
    </Panel>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// ADVANCED SYSTEMS: Monte Carlo · Concept Drift · ML Feature Engine
//                   Automated Mistake Logger · Data Pipeline Watchdog
// ═══════════════════════════════════════════════════════════════════════════

const MISTAKE_KEY    = "nfl_mistakes_v1";
const PIPELINE_KEY   = "nfl_pipeline_v1";
const DRIFT_KEY      = "nfl_drift_v1";
const MC_ITERATIONS  = 10000;
const DRIFT_WINDOW   = 10;   // rolling games to detect drift
const DRIFT_THRESH   = 0.15; // 15%+ drop triggers warning
const STALE_MINS     = 120;  // data older than 2hr flagged stale

// ── Box-Muller normal distribution sampler ────────────────────────────────
function randn() {
  let u=0,v=0;
  while(u===0)u=Math.random();
  while(v===0)v=Math.random();
  return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. MONTE CARLO SIMULATION ENGINE
// Runs 10,000 game simulations and returns full probability distributions.
// Uses the model's win probability + historical NFL score variance.
// ═══════════════════════════════════════════════════════════════════════════
function runMonteCarlo({ homeWinProb=50, vegasSpread=3, modelSpread=3,
                         vegasTotal=44, homeTeam="", weather="dome" }) {
  const isIndoor = STADIUM_CTX[homeTeam]?.indoor || weather==="dome";
  const highAlt   = (STADIUM_CTX[homeTeam]?.altitude||0) > 4000;

  // Calibrated NFL score parameters
  const expectedMargin = (homeWinProb/100 - 0.5) * 16.5;
  const marginSD = isIndoor ? 12.8 : weather==="wind" ? 10.2 : weather==="rain" ? 9.6 : 13.5;
  const totalMean = parseFloat(vegasTotal)||44;
  const totalSD   = isIndoor ? 6.1 : weather==="wind" ? 4.8 : weather==="rain" ? 5.2 : highAlt ? 7.4 : 6.8;
  const cover_line = parseFloat(modelSpread||vegasSpread)||0;

  let coverCount=0, overCount=0, pushCount=0, blowoutCount=0, oneScoreCount=0;
  const margins=[], totals=[];
  const buckets={};

  for(let i=0; i<MC_ITERATIONS; i++){
    const margin = expectedMargin + randn()*marginSD;
    const total  = totalMean + randn()*totalSD;
    margins.push(margin);
    totals.push(total);
    const atsResult = margin + cover_line;
    if(atsResult > 0.5)  coverCount++;
    else if(atsResult < -0.5) { /* no cover */ }
    else pushCount++;
    if(total > totalMean) overCount++;
    if(Math.abs(margin) > 21) blowoutCount++;
    if(Math.abs(margin) <= 8)  oneScoreCount++;
    const b = Math.round(total/7)*7;
    buckets[b]=(buckets[b]||0)+1;
  }
  margins.sort((a,b)=>a-b);
  totals.sort((a,b)=>a-b);
  const p = pct => margins[Math.floor(MC_ITERATIONS*pct)];
  const tp= pct => totals[Math.floor(MC_ITERATIONS*pct)];

  const dist = Object.entries(buckets)
    .sort((a,b)=>+a[0]-+b[0])
    .map(([range,count])=>({range:+range, pct:Math.round(count/MC_ITERATIONS*100)}));

  return {
    coverProb:     Math.round(coverCount/MC_ITERATIONS*100),
    pushProb:      Math.round(pushCount/MC_ITERATIONS*100),
    overProb:      Math.round(overCount/MC_ITERATIONS*100),
    blowoutProb:   Math.round(blowoutCount/MC_ITERATIONS*100),
    oneScoreProb:  Math.round(oneScoreCount/MC_ITERATIONS*100),
    medianMargin:  p(0.50).toFixed(1),
    marginP10:     p(0.10).toFixed(1),
    marginP25:     p(0.25).toFixed(1),
    marginP75:     p(0.75).toFixed(1),
    marginP90:     p(0.90).toFixed(1),
    totalP10:      tp(0.10).toFixed(1),
    totalP25:      tp(0.25).toFixed(1),
    totalMedian:   tp(0.50).toFixed(1),
    totalP75:      tp(0.75).toFixed(1),
    totalP90:      tp(0.90).toFixed(1),
    scoreDistribution: dist,
    iterations:    MC_ITERATIONS,
    params:        { homeWinProb, expectedMargin:expectedMargin.toFixed(1), marginSD:marginSD.toFixed(1), totalMean, totalSD:totalSD.toFixed(1) }
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. CONCEPT DRIFT DETECTOR
// Compares rolling accuracy to baseline. Triggers alert if recent window
// drops 15%+ below historical. Protects against stale learned weights.
// ═══════════════════════════════════════════════════════════════════════════
function detectConceptDrift(history, windowSize=DRIFT_WINDOW) {
  if(!history||history.length < windowSize+5) return null;
  const recent   = history.slice(0, windowSize);
  const baseline = history.slice(windowSize);
  const recentATS   = recent.filter(g=>g.spreadCorrect).length/recent.length;
  const baselineATS = baseline.filter(g=>g.spreadCorrect).length/baseline.length;
  const overallATS  = history.filter(g=>g.spreadCorrect).length/history.length;
  const drift = recentATS - baselineATS;
  const severity = Math.abs(drift)>0.25?"CRITICAL":Math.abs(drift)>DRIFT_THRESH?"WARNING":"STABLE";

  // Detect signal-level drift: which signals changed firing patterns?
  const signalDrift = {};
  Object.keys(DEFAULT_WEIGHTS).forEach(sig=>{
    const recentFired   = recent.filter(g=>g.attribution?.[sig]).length/recent.length;
    const baselineFired = baseline.filter(g=>g.attribution?.[sig]).length/baseline.length;
    const recentAcc     = recent.filter(g=>g.attribution?.[sig]&&g.spreadCorrect).length/Math.max(1,recent.filter(g=>g.attribution?.[sig]).length);
    const baseAcc       = baseline.filter(g=>g.attribution?.[sig]&&g.spreadCorrect).length/Math.max(1,baseline.filter(g=>g.attribution?.[sig]).length);
    if(Math.abs(recentAcc-baseAcc)>0.15&&recent.filter(g=>g.attribution?.[sig]).length>=3){
      signalDrift[sig]={recentAcc:Math.round(recentAcc*100),baseAcc:Math.round(baseAcc*100),direction:recentAcc<baseAcc?"degraded":"improved"};
    }
  });

  return {
    recentRate:    Math.round(recentATS*100),
    baselineRate:  Math.round(baselineATS*100),
    overallRate:   Math.round(overallATS*100),
    drift:         parseFloat(drift.toFixed(3)),
    isDrifting:    Math.abs(drift)>DRIFT_THRESH,
    severity,
    direction:     drift<0?"degrading":"improving",
    signalDrift,
    window:        windowSize,
    totalGames:    history.length,
    recommendation: severity==="CRITICAL"
      ? "Accuracy has dropped sharply. Reset learned weights and recalibrate — NFL landscape may have shifted (QB change, coaching hire, injury wave)."
      : severity==="WARNING"
      ? "Recent accuracy below baseline. Monitor for 3 more games before resetting. Check if degraded signals match recent roster/coaching changes."
      : "Model is stable. No intervention needed."
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. ML FEATURE IMPORTANCE ENGINE
// Computes per-signal accuracy, recommends weight adjustments, auto-selects
// top features. Uses EWMA for recency-weighted importance scoring.
// ═══════════════════════════════════════════════════════════════════════════
function computeFeatureImportance(history) {
  if(!history||history.length<3) return [];
  const alpha = 0.15; // EWMA decay — recent games weight more
  const signalStats = {};

  // Forward pass: compute EWMA accuracy per signal
  [...history].reverse().forEach((game,i)=>{
    if(!game.attribution)return;
    Object.entries(game.attribution).forEach(([sig,fired])=>{
      if(!fired)return;
      if(!signalStats[sig])signalStats[sig]={ewmaAcc:0.5,total:0,wins:0,streak:0};
      const d=signalStats[sig];
      const outcome=game.spreadCorrect?1:0;
      d.ewmaAcc = alpha*outcome+(1-alpha)*d.ewmaAcc;
      d.total++;
      if(game.spreadCorrect)d.wins++;
      d.streak = game.spreadCorrect ? d.streak+1 : 0;
    });
  });

  return Object.entries(signalStats).map(([signal,d])=>{
    const rawAcc = d.total>0 ? d.wins/d.total : 0.5;
    const score  = d.total>=5 ? (0.6*d.ewmaAcc+0.4*rawAcc) : null;
    return {
      signal,
      score:    score!=null?parseFloat((score*100).toFixed(1)):null,
      rawAcc:   Math.round(rawAcc*100),
      ewmaAcc:  Math.round(d.ewmaAcc*100),
      games:    d.total,
      wins:     d.wins,
      streak:   d.streak,
      reliable: d.total>=5,
      recommendation: !score?"insufficient_data"
        : score>=0.58?"increase_weight"
        : score<=0.44?"decrease_weight"
        : "maintain",
      suggestedWeight: !score ? (DEFAULT_WEIGHTS[signal]||10)
        : Math.round(Math.max(WEIGHT_MIN, Math.min(WEIGHT_MAX, (DEFAULT_WEIGHTS[signal]||10) * (score/0.5))))
    };
  }).sort((a,b)=>(b.score||50)-(a.score||50));
}

// Auto-apply ML-suggested weights
function autoCalibrate(featureImportance, currentWeights) {
  const updated = {...currentWeights};
  featureImportance.filter(f=>f.reliable&&f.recommendation!=="insufficient_data").forEach(f=>{
    if(f.suggestedWeight) updated[f.signal]=f.suggestedWeight;
  });
  // Renorm
  const total=Object.values(updated).reduce((s,v)=>s+v,0);
  if(total>0) Object.keys(updated).forEach(k=>{updated[k]=parseFloat(((updated[k]/total)*100).toFixed(2));});
  return updated;
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. AUTOMATED MISTAKE CLASSIFIER
// Categorizes every incorrect prediction by miss-type so you can see
// systematic blind spots in the model over time.
// ═══════════════════════════════════════════════════════════════════════════
const MISS_TYPES = {
  KEY_NUMBER:     { label:"Key Number Push", color:"#f59e0b", desc:"Spread landed on/near -3/-7 — push risk wasn't weighted enough" },
  WEATHER:        { label:"Weather Underweighted", color:"#38bdf8", desc:"Weather conditions caused unexpected scoring shift" },
  SHARP_FADE:     { label:"Sharp Fade Failed", color:"#a78bfa", desc:"RLM/steam move followed but market corrected differently" },
  LUCK_TRAP:      { label:"Luck Trap", color:"#f87171", desc:"Lucky team continued outperforming regression expectation" },
  GARBAGE_TIME:   { label:"Garbage Time Distortion", color:"#fb923c", desc:"Garbage-time stats inflated a blowout — model mispriced" },
  OL_UNDERWEIGHT: { label:"OL Degradation Missed", color:"#6366f1", desc:"OL injury impact was larger than model predicted" },
  PRIME_TIME:     { label:"Prime Time Trap", color:"#ec4899", desc:"Prime time spot disadvantaged one team more than modeled" },
  DIVISIONAL:     { label:"Divisional Dog Bite", color:"#4ade80", desc:"Divisional underdog covered — familiarity factor underweighted" },
  GENERAL:        { label:"General Model Miss", color:"#555", desc:"No dominant attributable cause — noise event" },
};

function classifyMistake(prediction, result, attribution, gameState) {
  if(result.spreadCorrect) return [];
  const cats=[];
  if(attribution?.keyNumber) cats.push("KEY_NUMBER");
  if(attribution?.weather && Math.abs(weatherAdjust(gameState.weather).totalAdj)>=2) cats.push("WEATHER");
  if(attribution?.rlm || attribution?.marketEnsemble) cats.push("SHARP_FADE");
  if(attribution?.luckRegression && result.luckScore>2) cats.push("LUCK_TRAP");
  if(attribution?.garbageFilter && result.garbageContaminated) cats.push("GARBAGE_TIME");
  if(attribution?.olDegradation && result.olRisk) cats.push("OL_UNDERWEIGHT");
  if(attribution?.primeTime) cats.push("PRIME_TIME");
  if(isDivisional(gameState.homeTeam,gameState.awayTeam) && result.homedog) cats.push("DIVISIONAL");
  if(cats.length===0) cats.push("GENERAL");
  return cats;
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. DATA PIPELINE WATCHDOG
// Tracks freshness timestamps per signal, flags stale data, provides
// a real-time health score for the full data stack.
// ═══════════════════════════════════════════════════════════════════════════
function computePipelineHealth(timestamps) {
  if(!timestamps||!Object.keys(timestamps).length) return null;
  const now=Date.now();
  const signals=Object.entries(timestamps);
  const stale=signals.filter(([,ts])=>(now-ts)>STALE_MINS*60*1000);
  const fresh=signals.filter(([,ts])=>(now-ts)<=STALE_MINS*60*1000);
  const healthPct=Math.round(fresh.length/signals.length*100);
  return {
    healthPct,
    fresh:fresh.length, total:signals.length, staleCount:stale.length,
    staleSignals:stale.map(([name,ts])=>({name,ageMin:Math.round((now-ts)/60000)})),
    grade: healthPct>=90?"A":healthPct>=70?"B":healthPct>=50?"C":"D",
    recommendation: stale.length>0?`${stale.length} signal${stale.length>1?"s":""} stale — reload before analysis`:"All data fresh"
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

// ── Monte Carlo Panel ─────────────────────────────────────────────────────
function MonteCarloPanel({ mcResult, running, homeTeam, awayTeam, lines }) {
  if(!mcResult&&!running) return null;
  const [tab, setTab] = useState("summary");
  if(running) return(
    <Panel border="rgba(168,85,247,0.22)" bg="rgba(168,85,247,0.03)" mb="10px">
      <div style={{display:"flex",alignItems:"center",gap:"9px",padding:"6px 0"}}>
        <Spinner/><span style={{fontSize:"10px",fontWeight:700,color:"#a855f7",fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.1em"}}>Running {MC_ITERATIONS.toLocaleString()} Monte Carlo simulations…</span>
      </div>
    </Panel>
  );
  const {coverProb,pushProb,overProb,blowoutProb,oneScoreProb,medianMargin,marginP10,marginP25,marginP75,marginP90,totalP10,totalP25,totalMedian,totalP75,totalP90,scoreDistribution,params}=mcResult;
  const coverColor=coverProb>=55?"#4ade80":coverProb>=50?"#f59e0b":"#f87171";
  const overColor=overProb>=55?"#4ade80":overProb>=50?"#f59e0b":"#f87171";
  const maxDistPct=scoreDistribution?.length?Math.max(...scoreDistribution.map(d=>d.pct)):1;
  const favStr=lines?.favTeam?abb(lines.favTeam):"FAV";

  return(
    <Panel border="rgba(168,85,247,0.22)" bg="rgba(168,85,247,0.03)" mb="10px">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"12px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <span style={{fontSize:"11px"}}>🎲</span>
          <span style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#a855f7",fontFamily:"'Barlow Condensed',sans-serif"}}>Monte Carlo Simulation</span>
          <Tag color="#a855f7">{MC_ITERATIONS.toLocaleString()} runs</Tag>
        </div>
        <div style={{display:"flex",gap:"4px"}}>
          {["summary","distribution","intervals"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:"3px 8px",borderRadius:"4px",border:`1px solid ${tab===t?"rgba(168,85,247,0.4)":"rgba(255,255,255,0.08)"}`,background:tab===t?"rgba(168,85,247,0.12)":"transparent",color:tab===t?"#a855f7":"#444",fontSize:"8px",fontWeight:700,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",textTransform:"capitalize"}}>{t}</button>
          ))}
        </div>
      </div>

      {tab==="summary"&&(
        <>
          {/* Primary metrics */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:"5px",marginBottom:"10px"}}>
            {[
              ["Cover %",`${coverProb}%`,coverColor,`${favStr} covers ATS`,`+${pushProb}% push`],
              ["Over %",`${overProb}%`,overColor,"Total goes over",""],
              ["1-Score Game",`${oneScoreProb}%`,"#38bdf8","≤8 pt margin","high variance"],
              ["Blowout",`${blowoutProb}%`,blowoutProb>25?"#f87171":"#555","21+ pt margin",""],
            ].map(([l,v,c,sub,sub2])=>(
              <div key={l} style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${c}22`,borderRadius:"7px",padding:"8px 7px",textAlign:"center"}}>
                <div style={{fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px"}}>{l}</div>
                <div style={{fontSize:"19px",fontWeight:900,color:c,fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{v}</div>
                <div style={{fontSize:"7px",color:`${c}88`,fontFamily:"'Barlow Condensed',sans-serif",marginTop:"2px"}}>{sub}</div>
                {sub2&&<div style={{fontSize:"6px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"1px"}}>{sub2}</div>}
              </div>
            ))}
          </div>
          {/* Margin fan */}
          <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"7px",padding:"10px 12px",marginBottom:"8px"}}>
            <div style={{fontSize:"8px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#555",marginBottom:"8px",fontFamily:"'Barlow Condensed',sans-serif"}}>Margin Distribution Fan</div>
            <div style={{position:"relative",height:"32px",marginBottom:"6px"}}>
              {/* P10-P90 bar */}
              <div style={{position:"absolute",top:"50%",left:`${(parseFloat(marginP10)+35)/70*100}%`,right:`${100-(parseFloat(marginP90)+35)/70*100}%`,height:"8px",background:"rgba(168,85,247,0.18)",borderRadius:"4px",transform:"translateY(-50%)"}}/>
              {/* P25-P75 bar */}
              <div style={{position:"absolute",top:"50%",left:`${(parseFloat(marginP25)+35)/70*100}%`,right:`${100-(parseFloat(marginP75)+35)/70*100}%`,height:"14px",background:"rgba(168,85,247,0.32)",borderRadius:"4px",transform:"translateY(-50%)"}}/>
              {/* Median line */}
              <div style={{position:"absolute",top:"10%",left:`${(parseFloat(medianMargin)+35)/70*100}%`,width:"2px",height:"80%",background:"#a855f7",borderRadius:"1px"}}/>
              {/* Zero line */}
              <div style={{position:"absolute",top:"5%",left:"50%",width:"1px",height:"90%",background:"rgba(255,255,255,0.15)",borderRadius:"1px"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>
              <span>P10: {marginP10}</span><span>P25: {marginP25}</span><span style={{color:"#a855f7",fontWeight:700}}>Med: {medianMargin}</span><span>P75: {marginP75}</span><span>P90: {marginP90}</span>
            </div>
            <div style={{marginTop:"5px",fontSize:"8px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",textAlign:"center"}}>
              {abb(awayTeam)} @ {abb(homeTeam)} · σ margin = {params.marginSD} pts · {params.totalSD} pts total SD
            </div>
          </div>
        </>
      )}

      {tab==="distribution"&&scoreDistribution?.length>0&&(
        <div>
          <div style={{fontSize:"8px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#555",marginBottom:"8px",fontFamily:"'Barlow Condensed',sans-serif"}}>Score Total Distribution (% of simulations)</div>
          <div style={{display:"flex",alignItems:"flex-end",gap:"3px",height:"80px",marginBottom:"6px"}}>
            {scoreDistribution.filter(d=>d.pct>0).map(d=>{
              const h=(d.pct/maxDistPct)*100;
              const isOver=d.range>parseFloat(lines?.total||44);
              return(
                <div key={d.range} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"1px"}}>
                  <div style={{width:"100%",height:`${h}%`,background:isOver?"rgba(74,222,128,0.6)":"rgba(248,113,113,0.6)",borderRadius:"2px 2px 0 0",minHeight:"2px"}} title={`${d.range} pts: ${d.pct}%`}/>
                  <div style={{fontSize:"6px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",transform:"rotate(-45deg)",transformOrigin:"top left",marginTop:"2px",whiteSpace:"nowrap"}}>{d.range}</div>
                </div>
              );
            })}
          </div>
          <div style={{display:"flex",gap:"10px",justifyContent:"center",marginTop:"14px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"4px"}}><div style={{width:"8px",height:"8px",borderRadius:"1px",background:"rgba(248,113,113,0.6)"}}/><span style={{fontSize:"8px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif"}}>Under {lines?.total||44}</span></div>
            <div style={{display:"flex",alignItems:"center",gap:"4px"}}><div style={{width:"8px",height:"8px",borderRadius:"1px",background:"rgba(74,222,128,0.6)"}}/><span style={{fontSize:"8px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif"}}>Over {lines?.total||44}</span></div>
          </div>
        </div>
      )}

      {tab==="intervals"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
          {[["Margin Confidence Intervals","margin",[[marginP10,marginP90,"80% CI"],[marginP25,marginP75,"50% CI"],[medianMargin,null,"Median"]]],["Total Confidence Intervals","total",[[totalP10,totalP90,"80% CI"],[totalP25,totalP75,"50% CI"],[totalMedian,null,"Median"]]]].map(([title,,rows])=>(
            <div key={title} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"6px",padding:"9px 10px"}}>
              <div style={{fontSize:"8px",fontWeight:700,color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"7px"}}>{title}</div>
              {rows.map(([lo,hi,lbl])=>(
                <div key={lbl} style={{display:"flex",alignItems:"center",gap:"7px",marginBottom:"4px"}}>
                  <span style={{fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",width:"40px"}}>{lbl}</span>
                  <div style={{flex:1,height:"4px",borderRadius:"2px",background:"rgba(255,255,255,0.06)",overflow:"hidden",position:"relative"}}>
                    <div style={{position:"absolute",left:hi?`${(parseFloat(lo)+40)/80*100}%`:"50%",right:hi?`${100-(parseFloat(hi)+40)/80*100}%`:"50%",top:0,bottom:0,background:"rgba(168,85,247,0.5)",borderRadius:"2px"}}/>
                  </div>
                  <span style={{fontSize:"8px",fontWeight:700,color:"#a855f7",fontFamily:"'Barlow Condensed',sans-serif",width:"60px",textAlign:"right"}}>{hi?`${lo} → ${hi}`:lo}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      <div style={{marginTop:"7px",fontSize:"8px",color:"#1a1a2a",fontFamily:"'Barlow Condensed',sans-serif"}}>σ margin calibrated to NFL historical variance · Results are probabilistic not deterministic</div>
    </Panel>
  );
}

// ── Concept Drift Panel ───────────────────────────────────────────────────
function DriftDetectorPanel({ driftResult, onResetWeights }) {
  if(!driftResult) return null;
  const [open,setOpen]=useState(driftResult.isDrifting);
  const {severity,recentRate,baselineRate,drift,direction,recommendation,signalDrift,window:w,totalGames}=driftResult;
  const color=severity==="CRITICAL"?"#ef4444":severity==="WARNING"?"#f59e0b":"#4ade80";
  const driftedSignals=Object.entries(signalDrift||{});
  return(
    <Panel border={`${color}28`} bg={`${color}05`} mb="10px">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <div style={{width:"8px",height:"8px",borderRadius:"50%",background:color,boxShadow:driftResult.isDrifting?`0 0 8px ${color}`:"none",animation:severity==="CRITICAL"?"pulse 1s infinite":"none"}}/>
          <span style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color,fontFamily:"'Barlow Condensed',sans-serif"}}>Concept Drift Detector</span>
          <Tag color={color}>{severity}</Tag>
          {driftResult.isDrifting&&<Tag color={color}>{direction} {Math.abs(Math.round(drift*100))}%</Tag>}
        </div>
        <span style={{color:"#333",fontSize:"10px"}}>{open?"▲":"▼"}</span>
      </div>
      {open&&(
        <div style={{marginTop:"11px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"5px",marginBottom:"10px"}}>
            {[["Recent ATS",`${recentRate}%`,recentRate>=53?"#4ade80":"#f87171",`Last ${w} games`],["Baseline ATS",`${baselineRate}%`,"#888",`Prior ${totalGames-w} games`],["Drift",`${drift>0?"+":""}${(drift*100).toFixed(1)}%`,color,"Recent vs baseline"]].map(([l,v,c,s])=>(
              <div key={l} style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${c}20`,borderRadius:"6px",padding:"8px 7px",textAlign:"center"}}>
                <div style={{fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px"}}>{l}</div>
                <div style={{fontSize:"16px",fontWeight:900,color:c,fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{v}</div>
                <div style={{fontSize:"7px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"2px"}}>{s}</div>
              </div>
            ))}
          </div>
          <div style={{background:`${color}08`,border:`1px solid ${color}18`,borderRadius:"6px",padding:"8px 11px",marginBottom:"8px"}}>
            <div style={{fontSize:"9px",fontWeight:700,color,fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px",textTransform:"uppercase",letterSpacing:"0.08em"}}>Recommendation</div>
            <div style={{fontSize:"10px",color:`${color}cc`,fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.5"}}>{recommendation}</div>
          </div>
          {driftedSignals.length>0&&(
            <div style={{marginBottom:"8px"}}>
              <div style={{fontSize:"8px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#555",marginBottom:"5px",fontFamily:"'Barlow Condensed',sans-serif"}}>Signal-Level Drift</div>
              {driftedSignals.map(([sig,d])=>(
                <div key={sig} style={{display:"flex",alignItems:"center",gap:"7px",padding:"4px 8px",background:"rgba(255,255,255,0.03)",borderRadius:"4px",marginBottom:"3px"}}>
                  <span style={{fontSize:"8px",fontWeight:700,color:"#aaa",fontFamily:"'Barlow Condensed',sans-serif",flex:1,textTransform:"uppercase"}}>{sig.replace(/([A-Z])/g," $1").trim()}</span>
                  <span style={{fontSize:"8px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif"}}>Baseline: {d.baseAcc}%</span>
                  <span style={{fontSize:"10px",fontWeight:700,color:d.direction==="degraded"?"#f87171":"#4ade80",fontFamily:"'Barlow Condensed',sans-serif"}}>Recent: {d.recentAcc}%</span>
                  <Tag color={d.direction==="degraded"?"#f87171":"#4ade80"}>{d.direction}</Tag>
                </div>
              ))}
            </div>
          )}
          {driftResult.isDrifting&&<button onClick={onResetWeights} style={{padding:"6px 12px",borderRadius:"5px",border:`1px solid ${color}30`,background:`${color}0a`,color,fontSize:"9px",fontWeight:700,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif"}}>⚡ Reset Learned Weights</button>}
        </div>
      )}
    </Panel>
  );
}

// ── ML Feature Importance Panel ───────────────────────────────────────────
function FeatureImportancePanel({ features, onAutoCalibrate, onUpdateWeights }) {
  const [open,setOpen]=useState(false);
  if(!features||features.filter(f=>f.reliable).length<2) return null;
  const reliable=features.filter(f=>f.reliable);
  const topPerformers=reliable.filter(f=>f.recommendation==="increase_weight").length;
  const underPerformers=reliable.filter(f=>f.recommendation==="decrease_weight").length;
  const SIG_COLORS={cpoe:"#ec4899",pressure:"#fb923c",olDegradation:"#6366f1",garbageFilter:"#f59e0b",luckRegression:"#8b5cf6",marketEnsemble:"#a78bfa",coaching:"#14b8a6",microContext:"#38bdf8",weather:"#4ade80"};
  return(
    <Panel border="rgba(34,197,94,0.18)" bg="rgba(34,197,94,0.02)" mb="10px">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        <div style={{display:"flex",alignItems:"center",gap:"7px"}}>
          <span style={{fontSize:"11px"}}>🔬</span>
          <span style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#22c55e",fontFamily:"'Barlow Condensed',sans-serif"}}>ML Feature Importance</span>
          <Tag color="#4ade80">{topPerformers} outperforming</Tag>
          {underPerformers>0&&<Tag color="#f87171">{underPerformers} underperforming</Tag>}
        </div>
        <span style={{color:"#333",fontSize:"10px"}}>{open?"▲":"▼"}</span>
      </div>
      {open&&(
        <div style={{marginTop:"11px"}}>
          <div style={{fontSize:"9px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"9px",lineHeight:"1.5"}}>
            EWMA-weighted accuracy per signal (α=0.15 — recent games count more). Scores above 58% → increase weight. Below 44% → decrease. Auto-calibrate applies ML suggestions to all weights at once.
          </div>
          {features.map((f,i)=>{
            if(!f.reliable&&f.games<2) return null;
            const color=SIG_COLORS[f.signal]||"#888";
            const recColor=f.recommendation==="increase_weight"?"#4ade80":f.recommendation==="decrease_weight"?"#f87171":"#555";
            const barW=f.score!=null?(f.score/100)*100:50;
            return(
              <div key={f.signal} style={{display:"flex",alignItems:"center",gap:"8px",padding:"6px 8px",background:"rgba(255,255,255,0.03)",border:`1px solid ${f.reliable?recColor+"22":"rgba(255,255,255,0.05)"}`,borderRadius:"5px",marginBottom:"3px"}}>
                <div style={{width:"16px",height:"16px",borderRadius:"50%",background:color,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"7px",fontWeight:900,color:"#fff",fontFamily:"'Barlow Condensed',sans-serif"}}>{i+1}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:"3px"}}>
                    <span style={{fontSize:"8px",fontWeight:700,color,fontFamily:"'Barlow Condensed',sans-serif",textTransform:"uppercase",letterSpacing:"0.04em"}}>{f.signal.replace(/([A-Z])/g," $1").trim()}</span>
                    <span style={{fontSize:"9px",fontWeight:800,color:f.score!=null?(f.score>58?"#4ade80":f.score<44?"#f87171":"#aaa"):"#333",fontFamily:"'Barlow Condensed',sans-serif"}}>{f.score!=null?`${f.score}%`:"—"}</span>
                  </div>
                  <div style={{height:"3px",borderRadius:"2px",background:"rgba(255,255,255,0.06)",overflow:"hidden"}}>
                    <div style={{width:`${barW}%`,height:"100%",background:f.score!=null?(f.score>58?"#4ade80":f.score<44?"#f87171":"#555"):"rgba(255,255,255,0.15)",borderRadius:"2px",transition:"width 0.5s ease"}}/>
                  </div>
                </div>
                <div style={{display:"flex",gap:"4px",flexShrink:0}}>
                  <span style={{fontSize:"7px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif"}}>{f.wins}W/{f.games}G</span>
                  {f.reliable&&<Tag color={recColor} >{f.recommendation==="increase_weight"?"▲":f.recommendation==="decrease_weight"?"▼":"→"} {f.suggestedWeight}%</Tag>}
                </div>
              </div>
            );
          })}
          <div style={{marginTop:"9px",display:"flex",gap:"6px"}}>
            <button onClick={()=>{ const calibrated=autoCalibrate(features,{}); onAutoCalibrate(calibrated); }} style={{flex:1,padding:"8px",borderRadius:"5px",border:"none",background:"linear-gradient(135deg,#15803d,#166534)",color:"#fff",fontSize:"10px",fontWeight:700,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:"5px"}}>
              🤖 Auto-Calibrate Weights
            </button>
          </div>
          <div style={{marginTop:"5px",fontSize:"8px",color:"#2a2a2a",fontFamily:"'Barlow Condensed',sans-serif"}}>EWMA α=0.15 · Requires 5+ games per signal · Recency-weighted accuracy</div>
        </div>
      )}
    </Panel>
  );
}

// ── Mistake Digest Panel ──────────────────────────────────────────────────
function MistakeDigestPanel({ mistakes }) {
  const [open,setOpen]=useState(false);
  if(!mistakes||mistakes.length<3) return null;
  // Aggregate by type
  const byType={};
  mistakes.forEach(m=>(m.categories||[]).forEach(cat=>{
    if(!byType[cat])byType[cat]={count:0,pct:0};
    byType[cat].count++;
  }));
  const total=mistakes.length;
  Object.keys(byType).forEach(k=>byType[k].pct=Math.round(byType[k].count/total*100));
  const sorted=Object.entries(byType).sort((a,b)=>b[1].count-a[1].count);
  return(
    <Panel border="rgba(248,113,113,0.18)" bg="rgba(248,113,113,0.02)" mb="10px">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        <div style={{display:"flex",alignItems:"center",gap:"7px"}}>
          <span style={{fontSize:"11px"}}>📋</span>
          <span style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#f87171",fontFamily:"'Barlow Condensed',sans-serif"}}>Automated Mistake Log</span>
          <Tag color="#f87171">{total} misses</Tag>
          {sorted[0]&&<Tag color={MISS_TYPES[sorted[0][0]]?.color||"#555"}>Top: {MISS_TYPES[sorted[0][0]]?.label||sorted[0][0]}</Tag>}
        </div>
        <span style={{color:"#333",fontSize:"10px"}}>{open?"▲":"▼"}</span>
      </div>
      {open&&(
        <div style={{marginTop:"11px"}}>
          <div style={{fontSize:"9px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"9px",lineHeight:"1.5"}}>
            Every incorrect prediction is automatically classified by miss-type. Identify systematic blind spots the model has so you can improve signal weighting or flag specific situations as unreliable.
          </div>
          {sorted.map(([type,d])=>{
            const mt=MISS_TYPES[type]||{label:type,color:"#555",desc:""};
            return(
              <div key={type} style={{display:"flex",alignItems:"center",gap:"8px",padding:"7px 10px",background:"rgba(255,255,255,0.03)",border:`1px solid ${mt.color}18`,borderRadius:"5px",marginBottom:"4px"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:"9px",fontWeight:700,color:mt.color,fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px"}}>{mt.label}</div>
                  <div style={{fontSize:"8px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif"}}>{mt.desc}</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:"16px",fontWeight:900,color:mt.color,fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{d.pct}%</div>
                  <div style={{fontSize:"7px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif"}}>{d.count}/{total} misses</div>
                </div>
              </div>
            );
          })}
          <div style={{marginTop:"8px",padding:"8px 10px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"5px"}}>
            <div style={{fontSize:"8px",fontWeight:700,color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"4px",textTransform:"uppercase",letterSpacing:"0.08em"}}>Actionable Insight</div>
            {sorted[0]&&<div style={{fontSize:"10px",color:"#aaa",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.5"}}>
              Your most common miss is <span style={{color:MISS_TYPES[sorted[0][0]]?.color||"#aaa",fontWeight:700}}>{MISS_TYPES[sorted[0][0]]?.label}</span> ({sorted[0][1].pct}% of losses). {MISS_TYPES[sorted[0][0]]?.desc} Consider {sorted[0][0]==="KEY_NUMBER"?"avoiding spreads within 1 of -3 and -7":sorted[0][0]==="SHARP_FADE"?"requiring 2+ confirming signals before following sharp money":"increasing the weight for the relevant counter-signal."}.
            </div>}
          </div>
        </div>
      )}
    </Panel>
  );
}

// ── Data Pipeline Health Panel ────────────────────────────────────────────
function PipelineStatusPanel({ health, onRefresh, isLoading }) {
  if(!health) return null;
  const gradeColor={A:"#4ade80",B:"#86efac",C:"#f59e0b",D:"#f87171"}[health.grade]||"#555";
  return(
    <div style={{display:"flex",alignItems:"center",gap:"8px",padding:"6px 11px",background:"rgba(255,255,255,0.02)",border:`1px solid ${health.staleCount>0?"rgba(245,158,11,0.18)":"rgba(255,255,255,0.05)"}`,borderRadius:"6px",marginBottom:"9px",flexWrap:"wrap"}}>
      <div style={{display:"flex",alignItems:"center",gap:"5px"}}>
        <div style={{width:"22px",height:"22px",borderRadius:"50%",background:`${gradeColor}18`,border:`2px solid ${gradeColor}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:900,color:gradeColor,fontFamily:"'Barlow Condensed',sans-serif",flexShrink:0}}>{health.grade}</div>
        <div>
          <div style={{fontSize:"8px",fontWeight:700,color:gradeColor,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.07em"}}>DATA PIPELINE {health.healthPct}%</div>
          <div style={{fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>{health.fresh}/{health.total} signals fresh · {health.recommendation}</div>
        </div>
      </div>
      {health.staleSignals?.length>0&&(
        <div style={{display:"flex",gap:"3px",flexWrap:"wrap",flex:1}}>
          {health.staleSignals.slice(0,4).map(s=>(
            <div key={s.name} style={{background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.18)",borderRadius:"3px",padding:"2px 6px",fontSize:"7px",color:"#f59e0b",fontFamily:"'Barlow Condensed',sans-serif"}}>{s.name} {s.ageMin}m ago</div>
          ))}
        </div>
      )}
      <button onClick={onRefresh} disabled={isLoading} style={{marginLeft:"auto",padding:"4px 9px",borderRadius:"4px",border:"1px solid rgba(255,255,255,0.07)",background:"rgba(255,255,255,0.04)",color:isLoading?"#222":"#777",fontSize:"8px",cursor:isLoading?"not-allowed":"pointer",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:600,display:"flex",alignItems:"center",gap:"3px",flexShrink:0}}>
        {isLoading?<><Spinner/>…</>:"↻ Refresh"}
      </button>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// SELF-LEARNING ENGINE
// ─────────────────────────────────────────────────────────────────────────
// How it works:
// 1. Every prediction records which signals fired (attribution fingerprint)
// 2. When you log a result, each fired signal's weight shifts up (correct)
//    or down (incorrect) using online gradient descent
// 3. Situation patterns are hashed and their win rates tracked over time
// 4. Per-team bias is measured so the model auto-corrects systematic errors
// 5. All insights feed back into the Claude analysis prompt each game
// ═══════════════════════════════════════════════════════════════════════════

const LEARNING_KEY   = "nfl_learning_v1";
const PATTERN_KEY    = "nfl_patterns_v1";
const TEAM_BIAS_KEY  = "nfl_team_bias_v1";
const LEARNING_RATE  = 0.025;   // conservative per-game nudge
const WEIGHT_MIN     = 3;       // floor — no signal goes dead
const WEIGHT_MAX     = 28;      // ceiling — no signal dominates
const MIN_SAMPLE     = 5;       // min games before weights auto-update

// ── Signal attribution ────────────────────────────────────────────────────
// Records which signals were "active" (had a meaningful value) on a prediction
function attributeSignals(gameResult, signals) {
  const { pressureData, cpoeData, leverageData, garbageData, coachData, olData, microData, lines, splitsData, situationalData, multiData, refData, primeData, weather } = signals;
  return {
    cpoe:          !!(cpoeData?.matchupEdge),
    pressure:      !!(pressureData?.spreadImpact && Math.abs(pressureData.spreadImpact) >= 0.5),
    olDegradation: !!(olData && ((olData.home?.healthScore||100) < 70 || (olData.away?.healthScore||100) < 70)),
    garbageFilter: !!(garbageData?.contaminated || garbageData?.home?.contaminated || garbageData?.away?.contaminated),
    luckRegression:!!(leverageData?.regressionVerdict && (Math.abs(leverageData.home?.luckScore||0) > 1 || Math.abs(leverageData.away?.luckScore||0) > 1)),
    marketEnsemble:!!(gameResult?.publicBetting?.rlm || (gameResult?.publicBetting?.sharpSide)),
    coaching:      !!(coachData?.spreadImpact && Math.abs(coachData.spreadImpact) >= 0.5),
    microContext:  !!(microData?.compositeAdj && Math.abs(microData.compositeAdj) >= 0.5),
    weather:       weather !== "dome" && weather !== "ideal",
    splits:        !!(splitsData?.spreadImpact),
    situational:   !!(situationalData?.home?.offByeATS || situationalData?.home?.homeDogATS),
    multiSeason:   !!(multiData?.home?.trueTalentRank),
    refProfile:    !!(refData?.avgTotal),
    primeTime:     !!(primeData?.isPrimeTime),
    logit:         !!(lines?.spread),
    keyNumber:     !!(lines?.spread && keyNumFlag(lines.spread)),
    rlm:           !!(gameResult?.publicBetting?.rlm),
  };
}

// ── Online gradient descent weight update ─────────────────────────────────
function updateWeightsOnline(currentWeights, attribution, wasCorrect, lr = LEARNING_RATE) {
  const updated = { ...currentWeights };
  Object.keys(DEFAULT_WEIGHTS).forEach(signal => {
    if (!attribution[signal]) return; // signal wasn't active — skip
    const cur = updated[signal] || DEFAULT_WEIGHTS[signal];
    if (wasCorrect) {
      // Signal fired on a win → reinforce it
      updated[signal] = Math.min(WEIGHT_MAX, cur + lr * (WEIGHT_MAX - cur));
    } else {
      // Signal fired on a loss → reduce it slightly
      updated[signal] = Math.max(WEIGHT_MIN, cur - lr * (cur - WEIGHT_MIN));
    }
    updated[signal] = parseFloat(updated[signal].toFixed(2));
  });
  // Renormalize to sum=100
  const total = Object.values(updated).reduce((s, v) => s + v, 0);
  if (total > 0) {
    Object.keys(updated).forEach(k => {
      updated[k] = parseFloat(((updated[k] / total) * 100).toFixed(2));
    });
  }
  return updated;
}

// ── Situation fingerprint ─────────────────────────────────────────────────
function fingerprintGame(signals, gameState) {
  const { weather, lines, primeData, multiData } = signals;
  const isDiv  = isDivisional(gameState.homeTeam, gameState.awayTeam);
  const isDome = STADIUM_CTX[gameState.homeTeam]?.indoor;
  const spread = parseFloat(lines?.spread || 0);
  const spreadBucket = spread <= 2 ? "pick" : spread <= 4 ? "fg" : spread <= 7 ? "td" : "blowout";
  const keyNum = keyNumFlag(spread) ? `key${keyNumFlag(spread).kn}` : "nokey";
  const parts = [
    isDiv ? "div" : "nonDiv",
    isDome ? "dome" : (weather === "wind" || weather === "rain") ? "badWeather" : "outdoor",
    spreadBucket,
    keyNum,
    primeData?.isPrimeTime ? "primeTime" : "regular",
    multiData?.home?.trend || "unknown",
  ];
  return parts.join("|");
}

// ── Team bias detector ────────────────────────────────────────────────────
function computeTeamBias(backtestHistory) {
  const teamStats = {};
  backtestHistory?.forEach(g => {
    [g.homeTeam, g.awayTeam].filter(Boolean).forEach(team => {
      if (!teamStats[team]) teamStats[team] = { wins: 0, total: 0 };
      teamStats[team].total++;
      if (g.spreadCorrect) teamStats[team].wins++;
    });
  });
  const biases = [];
  Object.entries(teamStats).forEach(([team, d]) => {
    if (d.total < 3) return;
    const rate = d.wins / d.total;
    if (rate >= 0.70) biases.push({ team, rate: Math.round(rate * 100), direction: "over-rated", games: d.total, desc: `Model predicts ${abb(team)} too favorably — consider fading` });
    if (rate <= 0.30) biases.push({ team, rate: Math.round(rate * 100), direction: "under-rated", games: d.total, desc: `Model consistently underrates ${abb(team)} — consider backing` });
  });
  return biases.sort((a, b) => Math.abs(50 - a.rate) - Math.abs(50 - b.rate));
}

// ── Pattern win rate lookup ───────────────────────────────────────────────
function lookupPatterns(currentFingerprint, patternMemory) {
  if (!patternMemory || !currentFingerprint) return null;
  const exact = patternMemory[currentFingerprint];
  // Also do partial matches (first 3 components)
  const partial = currentFingerprint.split("|").slice(0, 3).join("|");
  const partialMatches = Object.entries(patternMemory).filter(([k]) => k.startsWith(partial));
  const totalPartial = partialMatches.reduce((s, [, d]) => s + d.total, 0);
  const winsPartial  = partialMatches.reduce((s, [, d]) => s + d.wins, 0);
  return {
    exact: exact || null,
    partial: totalPartial >= 3 ? { wins: winsPartial, total: totalPartial, rate: Math.round(winsPartial / totalPartial * 100) } : null,
    fingerprint: currentFingerprint
  };
}

// ── Generate learning insights for Claude prompt ──────────────────────────
function buildLearningContext(learnedWeights, patternResult, teamBias, backtestHistory, homeTeam, awayTeam) {
  const parts = [];
  if (!backtestHistory?.length) return "";

  // Weight divergences from defaults
  const topSignals = Object.entries(learnedWeights || DEFAULT_WEIGHTS)
    .map(([k, v]) => ({ k, v, diff: v - (DEFAULT_WEIGHTS[k] || 10) }))
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
    .slice(0, 3);

  if (topSignals.some(s => Math.abs(s.diff) >= 2)) {
    const improved = topSignals.filter(s => s.diff >= 2).map(s => s.k);
    const degraded  = topSignals.filter(s => s.diff <= -2).map(s => s.k);
    if (improved.length) parts.push(`LEARNED EDGES: ${improved.join(", ")} signals historically accurate for this model (+weight)`);
    if (degraded.length)  parts.push(`LEARNED WEAKNESSES: ${degraded.join(", ")} signals historically unreliable (-weight)`);
  }

  // Pattern memory
  if (patternResult?.exact?.total >= 3) {
    const e = patternResult.exact;
    parts.push(`PATTERN MEMORY: This exact situation (${patternResult.fingerprint}) has ${e.wins}W-${e.total-e.wins}L (${Math.round(e.wins/e.total*100)}% ATS) historically`);
  } else if (patternResult?.partial?.total >= 5) {
    const p = patternResult.partial;
    parts.push(`SIMILAR PATTERN: Similar game situations have gone ${p.wins}W-${p.total-p.wins}L (${p.rate}% ATS) in model history`);
  }

  // Team bias
  const homeBias = teamBias?.find(b => b.team === homeTeam);
  const awayBias  = teamBias?.find(b => b.team === awayTeam);
  if (homeBias) parts.push(`TEAM BIAS ALERT: ${homeBias.desc} (${homeBias.games} games tracked)`);
  if (awayBias)  parts.push(`TEAM BIAS ALERT: ${awayBias.desc} (${awayBias.games} games tracked)`);

  return parts.length ? `\nSELF-LEARNING CONTEXT (${backtestHistory.length} games tracked):\n${parts.join("\n")}` : "";
}

// ═══════════════════════════════════════════════════════════════════════════
// SELF-LEARNING UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

// ── Learning Engine Dashboard ─────────────────────────────────────────────
function SelfLearningPanel({ learnedWeights, patternMemory, teamBias, backtestHistory, onResetLearning }) {
  const [open, setOpen] = useState(false);
  const hasData = (backtestHistory?.length || 0) >= MIN_SAMPLE;
  const gamesUntilActive = Math.max(0, MIN_SAMPLE - (backtestHistory?.length || 0));

  // Compute weight divergences
  const weightChanges = Object.entries(learnedWeights || DEFAULT_WEIGHTS).map(([k, v]) => ({
    signal: k, learned: v, default: DEFAULT_WEIGHTS[k] || 10,
    diff: parseFloat((v - (DEFAULT_WEIGHTS[k] || 10)).toFixed(2))
  })).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  const SIG_COLORS = { cpoe:"#ec4899",pressure:"#fb923c",olDegradation:"#6366f1",garbageFilter:"#f59e0b",luckRegression:"#8b5cf6",marketEnsemble:"#a78bfa",coaching:"#14b8a6",microContext:"#38bdf8",weather:"#4ade80" };
  const topPatterns = Object.entries(patternMemory || {}).filter(([, d]) => d.total >= 3).sort((a, b) => b[1].total - a[1].total).slice(0, 5);

  return (
    <Panel border="rgba(16,185,129,0.22)" bg="rgba(16,185,129,0.03)" mb="10px">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        <div style={{display:"flex",alignItems:"center",gap:"7px"}}>
          <div style={{width:"8px",height:"8px",borderRadius:"50%",background:hasData?"#10b981":"#555",boxShadow:hasData?"0 0 8px #10b981":"none",animation:hasData?"pulse 2s infinite":"none"}}/>
          <span style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#10b981",fontFamily:"'Barlow Condensed',sans-serif"}}>Self-Learning Engine</span>
          {hasData ? <Tag color="#10b981">ACTIVE — {backtestHistory.length} games</Tag> : <Tag color="#555">{gamesUntilActive} games to activate</Tag>}
          {weightChanges.some(w=>Math.abs(w.diff)>=2) && <Tag color="#facc15">Weights Updated</Tag>}
        </div>
        <span style={{color:"#333",fontSize:"10px"}}>{open?"▲":"▼"}</span>
      </div>
      {open && (
        <div style={{marginTop:"12px"}}>
          {!hasData && (
            <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"7px",padding:"12px",marginBottom:"10px",textAlign:"center"}}>
              <div style={{fontSize:"11px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"5px"}}>Log {gamesUntilActive} more game result{gamesUntilActive!==1?"s":""} in the Backtest Engine to activate learning</div>
              <div style={{height:"4px",borderRadius:"2px",background:"rgba(255,255,255,0.06)",overflow:"hidden",maxWidth:"200px",margin:"0 auto"}}><div style={{width:`${((backtestHistory?.length||0)/MIN_SAMPLE)*100}%`,height:"100%",background:"#10b981",transition:"width 0.5s ease",borderRadius:"2px"}}/></div>
              <div style={{fontSize:"9px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"4px"}}>{backtestHistory?.length||0} / {MIN_SAMPLE} games</div>
            </div>
          )}

          {/* How it works */}
          <div style={{marginBottom:"10px",padding:"9px 11px",background:"rgba(16,185,129,0.04)",border:"1px solid rgba(16,185,129,0.1)",borderRadius:"6px"}}>
            <div style={{fontSize:"9px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#10b981",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"5px"}}>How It Works</div>
            <div style={{fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.6"}}>
              Every prediction logs which signals fired. When you save a result, each active signal's weight shifts +{(LEARNING_RATE*100).toFixed(1)}% (correct) or -{(LEARNING_RATE*100).toFixed(1)}% (wrong). After enough games, the model learns which signals actually predict YOUR parlay outcomes — not just the general market.
            </div>
          </div>

          {/* Signal weight evolution */}
          <div style={{marginBottom:"10px"}}>
            <div style={{fontSize:"9px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#555",marginBottom:"6px",fontFamily:"'Barlow Condensed',sans-serif"}}>Signal Weight Evolution</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px"}}>
              {weightChanges.slice(0,8).map(({ signal, learned, default: def, diff }) => {
                const color = SIG_COLORS[signal] || "#888";
                const diffColor = diff > 2 ? "#4ade80" : diff < -2 ? "#f87171" : "#555";
                return (
                  <div key={signal} style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${Math.abs(diff)>=2?diffColor+"33":"rgba(255,255,255,0.05)"}`,borderRadius:"5px",padding:"6px 8px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"3px"}}>
                      <span style={{fontSize:"8px",fontWeight:700,color,fontFamily:"'Barlow Condensed',sans-serif",textTransform:"uppercase",letterSpacing:"0.04em"}}>{signal.replace(/([A-Z])/g," $1").trim()}</span>
                      <span style={{fontSize:"8px",fontWeight:700,color:diffColor,fontFamily:"'Barlow Condensed',sans-serif"}}>{diff>0?"+":""}{diff}%</span>
                    </div>
                    <div style={{display:"flex",gap:"4px",alignItems:"center"}}>
                      <div style={{flex:1,height:"3px",borderRadius:"2px",background:"rgba(255,255,255,0.05)",overflow:"hidden"}}>
                        <div style={{width:`${(learned/WEIGHT_MAX)*100}%`,height:"100%",background:color,borderRadius:"2px"}}/>
                      </div>
                      <span style={{fontSize:"9px",fontWeight:800,color:"#fff",fontFamily:"'Barlow Condensed',sans-serif",minWidth:"24px",textAlign:"right"}}>{learned}%</span>
                    </div>
                    <div style={{fontSize:"7px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"1px"}}>default: {def}%</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Team bias */}
          {teamBias?.length > 0 && (
            <div style={{marginBottom:"10px"}}>
              <div style={{fontSize:"9px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#555",marginBottom:"5px",fontFamily:"'Barlow Condensed',sans-serif"}}>Team Bias Corrections</div>
              {teamBias.slice(0,4).map((b, i) => (
                <div key={i} style={{display:"flex",alignItems:"center",gap:"8px",padding:"5px 8px",background:b.direction==="over-rated"?"rgba(248,113,113,0.05)":"rgba(74,222,128,0.04)",border:`1px solid ${b.direction==="over-rated"?"rgba(248,113,113,0.12)":"rgba(74,222,128,0.1)"}`,borderRadius:"5px",marginBottom:"3px"}}>
                  <div style={{width:"18px",height:"18px",borderRadius:"50%",background:tc(b.team),flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"7px",fontWeight:900,color:"#fff",fontFamily:"'Barlow Condensed',sans-serif"}}>{abb(b.team).slice(0,2)}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:"9px",fontWeight:700,color:"#ddd",fontFamily:"'Barlow Condensed',sans-serif"}}>{abb(b.team)} — <span style={{color:b.direction==="over-rated"?"#f87171":"#4ade80"}}>{b.rate}% ATS</span> <span style={{fontWeight:400,color:"#444"}}>({b.games} games)</span></div>
                    <div style={{fontSize:"8px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif"}}>{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pattern memory */}
          {topPatterns.length > 0 && (
            <div style={{marginBottom:"10px"}}>
              <div style={{fontSize:"9px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#555",marginBottom:"5px",fontFamily:"'Barlow Condensed',sans-serif"}}>Pattern Memory ({Object.keys(patternMemory||{}).length} situations tracked)</div>
              {topPatterns.map(([fp, d], i) => {
                const rate = Math.round(d.wins / d.total * 100);
                const parts = fp.split("|");
                return (
                  <div key={i} style={{display:"flex",alignItems:"center",gap:"7px",padding:"5px 8px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:"5px",marginBottom:"3px"}}>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",gap:"3px",flexWrap:"wrap",marginBottom:"2px"}}>
                        {parts.map((p, pi) => <span key={pi} style={{fontSize:"7px",background:"rgba(255,255,255,0.06)",borderRadius:"3px",padding:"1px 5px",color:"#888",fontFamily:"'Barlow Condensed',sans-serif"}}>{p}</span>)}
                      </div>
                      <div style={{fontSize:"8px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>{d.wins}W-{d.total-d.wins}L · {d.total} games</div>
                    </div>
                    <div style={{fontSize:"16px",fontWeight:900,color:rate>=55?"#4ade80":rate>=50?"#f59e0b":"#f87171",fontFamily:"'Barlow Condensed',sans-serif",flexShrink:0}}>{rate}%</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Reset button */}
          {hasData && (
            <button onClick={onResetLearning} style={{padding:"5px 12px",borderRadius:"5px",border:"1px solid rgba(248,113,113,0.18)",background:"rgba(248,113,113,0.05)",color:"#f87171",fontSize:"9px",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif"}}>
              Reset Learning Data
            </button>
          )}
        </div>
      )}
    </Panel>
  );
}

// ── Pattern Match Alert (fires on current game) ───────────────────────────
function PatternMatchAlert({ currentFingerprint, patternResult }) {
  if (!patternResult || (!patternResult.exact && !patternResult.partial)) return null;
  const match = patternResult.exact?.total >= 3 ? patternResult.exact : patternResult.partial;
  if (!match || match.total < 3) return null;
  const rate = Math.round(match.wins / match.total * 100);
  const color = rate >= 58 ? "#4ade80" : rate <= 42 ? "#f87171" : "#f59e0b";
  const isExact = !!(patternResult.exact?.total >= 3);
  return (
    <div style={{background:`${color}0d`,border:`1px solid ${color}25`,borderRadius:"7px",padding:"9px 12px",marginBottom:"9px",animation:"fadeSlideUp 0.3s ease-out"}}>
      <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
        <span style={{fontSize:"14px"}}>🧠</span>
        <div style={{flex:1}}>
          <div style={{fontSize:"9px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color,fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px"}}>
            {isExact ? "EXACT PATTERN MATCH" : "SIMILAR PATTERN MATCH"} — {match.wins}W-{match.total-match.wins}L
          </div>
          <div style={{fontSize:"10px",color:`${color}cc`,fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.4"}}>
            {isExact ? "This exact game situation" : "Similar situations"} {match.total >= 10 ? "across a strong sample of " : "in "}{match.total} tracked game{match.total!==1?"s":""} has an ATS win rate of <span style={{fontWeight:900}}>{rate}%</span>{rate>=58?" — historically profitable situation":rate<=42?" — historically bad situation":" — roughly break-even"}.
          </div>
          <div style={{display:"flex",gap:"3px",marginTop:"4px",flexWrap:"wrap"}}>
            {(currentFingerprint||"").split("|").map((p,i) => <span key={i} style={{fontSize:"7px",background:"rgba(255,255,255,0.06)",borderRadius:"2px",padding:"1px 5px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif"}}>{p}</span>)}
          </div>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontSize:"24px",fontWeight:900,color,fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{rate}%</div>
          <div style={{fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>ATS WIN RATE</div>
        </div>
      </div>
    </div>
  );
}

// ── Parlay Correlation Matrix ─────────────────────────────────────────────────
function buildCorrelationMatrix(legs, weather) {
  if (!legs || legs.length < 2) return null;
  const matrix = [];
  for (let i = 0; i < legs.length; i++) {
    for (let j = i + 1; j < legs.length; j++) {
      const a = legs[i], b = legs[j];
      let corr = 0, reason = "";
      const aOutdoor = !STADIUM_CTX[a.homeTeam]?.indoor;
      const bOutdoor = !STADIUM_CTX[b.homeTeam]?.indoor;
      if (aOutdoor && bOutdoor && (weather === "wind" || weather === "rain" || weather === "cold")) {
        if ((a.betType==="Under"||a.betType==="Over") && (b.betType==="Under"||b.betType==="Over")) {
          const sameDir = a.betType === b.betType;
          corr += sameDir ? 0.18 : -0.12;
          reason += sameDir ? "Both outdoor totals in bad weather — positively correlated. " : "Outdoor totals leaning opposite in same weather — negatively correlated. ";
        }
      }
      if (isDivisional(a.homeTeam,a.awayTeam) && isDivisional(b.homeTeam,b.awayTeam) && getDivision(a.homeTeam)===getDivision(b.homeTeam)) {
        corr += 0.08; reason += "Same division games — slight scoring correlation. ";
      }
      const aIsDog = a.homedog || (a.betType==="Moneyline" && a.pick?.includes("+"));
      const bIsDog = b.homedog || (b.betType==="Moneyline" && b.pick?.includes("+"));
      if (aIsDog && bIsDog) { corr -= 0.05; reason += "Both dog picks — slight negative correlation. "; }
      if (STADIUM_CTX[a.homeTeam]?.indoor && STADIUM_CTX[b.homeTeam]?.indoor && a.betType===b.betType && (a.betType==="Over"||a.betType==="Under")) {
        corr += 0.04; reason += "Both dome totals — minimal positive correlation. ";
      }
      if (a.rlm && b.rlm) { corr += 0.09; reason += "Both legs have RLM — sharp money week tends to hit multiple games. "; }
      if (!reason) reason = "Largely independent — minimal cross-leg correlation.";
      matrix.push({ legA:i, legB:j, labelA:`${abb(a.awayTeam)}@${abb(a.homeTeam)} ${a.betType}`, labelB:`${abb(b.awayTeam)}@${abb(b.homeTeam)} ${b.betType}`, correlation:parseFloat(corr.toFixed(3)), direction:corr>0.05?"positive":corr<-0.05?"negative":"neutral", strength:Math.abs(corr)>0.15?"STRONG":Math.abs(corr)>0.08?"MODERATE":"WEAK", reason:reason.trim() });
    }
  }
  const baseProb = legs.reduce((p,l)=>p*(l.winProb||55)/100,1)*100;
  const totalCorr = matrix.reduce((s,m)=>s+m.correlation,0);
  const adjustedProb = Math.max(1,Math.min(99,baseProb*(1+totalCorr)));
  return { matrix, baseProb:baseProb.toFixed(1), adjustedProb:adjustedProb.toFixed(1), totalCorr:totalCorr.toFixed(3) };
}

// ── Model vs Vegas Divergence ─────────────────────────────────────────────────
function calcDivergence(modelSpread, vegasSpread, modelFav, vegasFav) {
  if (!modelSpread || !vegasSpread) return null;
  const mS = parseFloat(modelSpread), vS = parseFloat(vegasSpread);
  if (isNaN(mS) || isNaN(vS)) return null;
  const sameFav = modelFav && vegasFav && (modelFav===vegasFav || abb(modelFav||"")===abb(vegasFav||""));
  const diff = sameFav ? mS - vS : mS + vS;
  const absDiff = Math.abs(diff);
  return { diff:diff.toFixed(1), absDiff, direction:diff>0?"model_heavier_fav":"model_lighter_fav", isSignificant:absDiff>=2.0, isExtreme:absDiff>=3.5, grade:absDiff>=3.5?"EXTREME":absDiff>=2.5?"STRONG":absDiff>=1.5?"MODERATE":"MINOR" };
}
const KEY_NUMBERS     = [3,7,10,14,6,1];

// ── Signal weight defaults (sum = 100) ───────────────────────────────────────
const DEFAULT_WEIGHTS = { cpoe:18, pressure:15, olDegradation:14, garbageFilter:12, luckRegression:11, marketEnsemble:10, coaching:8, microContext:7, weather:5 };

// ── Session cache ─────────────────────────────────────────────────────────────
const SESSION_CACHE = new Map();
const CACHE_TTL = 30*60*1000;
function cacheKey(h,a,t){return `${h}|${a}|${t}`;}
function cacheGet(h,a,t){const k=cacheKey(h,a,t),e=SESSION_CACHE.get(k);if(!e)return null;if(Date.now()-e.ts>CACHE_TTL){SESSION_CACHE.delete(k);return null;}return e.data;}
function cacheSet(h,a,t,d){SESSION_CACHE.set(cacheKey(h,a,t),{data:d,ts:Date.now()});}

// ── Cross-signal contradiction detector ──────────────────────────────────────
function detectContradictions(signals){
  const{pressureData,cpoeData,leverageData,garbageData,coachData,olData,lines,weather}=signals;
  const contradictions=[],alignments=[];
  if(cpoeData&&leverageData){
    const ce=cpoeData.matchupEdge?.toLowerCase();
    if(ce?.includes("home")&&(leverageData.home?.luckScore||0)>2) contradictions.push({severity:"HIGH",signal1:"CPOE",signal2:"Luck Regression",desc:"CPOE favors home but luck regression shows they're riding variance — edge may evaporate as luck normalizes"});
    if(ce?.includes("away")&&(leverageData.away?.luckScore||0)>2) contradictions.push({severity:"HIGH",signal1:"CPOE",signal2:"Luck Regression",desc:"CPOE favors away team but regression flags them as lucky — unreliable edge"});
  }
  if(olData&&pressureData){
    const homeOLBad=(olData.home?.healthScore||100)<55;
    const homePressEdge=pressureData.matchupEdge?.toLowerCase().includes("home");
    if(homeOLBad&&homePressEdge) contradictions.push({severity:"MEDIUM",signal1:"OL Health",signal2:"Pressure Rate",desc:"Pressure edge for home but OL is degraded — pass rush advantage overstated"});
    if((olData.home?.healthScore||100)>80&&!homePressEdge) alignments.push({signal1:"OL Health",signal2:"Pressure Rate",desc:"OL healthy + pass rush generating pressure — offensive edge confirmed by both signals"});
  }
  if(garbageData&&lines){
    if(garbageData.contaminated) contradictions.push({severity:"HIGH",signal1:"Garbage Filter",signal2:"Season Stats",desc:"Garbage-time contaminated stats — raw PPG unreliable, use adjusted figures only"});
  }
  if(coachData&&lines){
    const sp=parseFloat(lines.spread||0),ha=coachData.home?.aggressivenessIndex||50,aa=coachData.away?.aggressivenessIndex||50;
    if(sp<=4&&Math.abs(ha-aa)>=30) alignments.push({signal1:"Coaching",signal2:"Close Spread",desc:`Close game (${sp}pts) with aggressive vs conservative coach mismatch — late-game decisions likely decisive`});
    if(sp>=7&&ha<35) contradictions.push({severity:"LOW",signal1:"Coaching",signal2:"Spread Size",desc:"Large spread but conservative home coach — backdoor cover risk elevated"});
  }
  if(lines?.lineMove){
    const s=(lines.lineMove?.summary||"").toLowerCase();
    if(s.includes("sharp")||s.includes("steam")) alignments.push({signal1:"Line Movement",signal2:"Market Ensemble",desc:"Coordinated sharp action confirmed by both line movement and multi-book consensus"});
  }
  if(pressureData&&weather!=="dome"&&weather!=="ideal"){
    const pe=pressureData.matchupEdge?.toLowerCase();
    if(weather==="wind"&&pe?.includes("pass rush")) alignments.push({signal1:"Pressure Rate",signal2:"Weather",desc:"Pass rush edge amplified by wind — pressure team has double advantage"});
    if(weather==="rain"&&pe) contradictions.push({severity:"LOW",signal1:"Pressure Rate",signal2:"Weather",desc:"Rain reduces pass rush effectiveness — pressure advantage partially negated"});
  }
  return{contradictions,alignments};
}

// ── CLV Calculator ────────────────────────────────────────────────────────────
function calcCLV(modelSpread,closingSpread){
  if(!modelSpread||!closingSpread)return null;
  const diff=parseFloat(closingSpread)-parseFloat(modelSpread);
  return{diff:diff.toFixed(1),hasCLV:Math.abs(diff)>=0.5,direction:diff>0?"positive":"negative"};
}

// ── Composite score calculator ────────────────────────────────────────────────
function calcCompScore(signals,weights,ensembleBooks){
  const{pressureData,cpoeData,leverageData,garbageData,coachData,olData,microData,weather}=signals;
  const w=weights||DEFAULT_WEIGHTS;let score=0,maxScore=0,breakdown=[];
  const add=(label,value,max,weight)=>{const wt=(Math.min(parseFloat(value)||0,max)/max)*weight;score+=wt;maxScore+=weight;breakdown.push({label,value:parseFloat(value||0).toFixed(1),weight,weighted:wt.toFixed(1)});};
  if(cpoeData){add("CPOE",Math.min(10,Math.abs(cpoeData.home?.cpoe||0)+Math.abs(cpoeData.away?.cpoe||0)),10,w.cpoe);}
  if(pressureData){add("Pressure",Math.min(10,Math.abs(pressureData.spreadImpact||0)*2+(pressureData.matchupEdge?3:0)),10,w.pressure);}
  if(olData){add("OL",Math.min(10,Math.abs(100-(olData.home?.healthScore||100))/5+Math.abs(100-(olData.away?.healthScore||100))/5),10,w.olDegradation);}
  if(garbageData){add("Garbage",garbageData.contaminated?7:(garbageData.home?.contaminated||garbageData.away?.contaminated?5:2),10,w.garbageFilter);}
  if(leverageData){add("Luck",Math.min(10,Math.abs(leverageData.home?.luckScore||0)+Math.abs(leverageData.away?.luckScore||0)),10,w.luckRegression);}
  const books=ensembleBooks||[];const div=books.length?Math.max(...books.map(b=>b.spread||0))-Math.min(...books.map(b=>b.spread||0)):0;
  add("Ensemble",Math.min(10,div*3),10,w.marketEnsemble);
  if(coachData){add("Coaching",Math.min(10,Math.abs((coachData.home?.aggressivenessIndex||50)-(coachData.away?.aggressivenessIndex||50))/10),10,w.coaching);}
  if(microData){add("Micro",Math.min(10,Math.abs(microData.compositeAdj||0)*2),10,w.microContext);}
  const wAdj=weatherAdjust(weather);add("Weather",Math.abs(wAdj.totalAdj),5,w.weather);
  return{score:maxScore>0?parseFloat((score/maxScore*100).toFixed(1)):50,breakdown};
}

// ── Steam Move Detector ───────────────────────────────────────────────────────
function detectSteamMove(lineMove){
  if(!lineMove)return null;
  try{
    const open=parseFloat((lineMove.open||"").replace(/[^\d.]/g,""));
    const current=parseFloat((lineMove.current||"").replace(/[^\d.]/g,""));
    if(isNaN(open)||isNaN(current))return null;
    const movement=Math.abs(current-open);
    if(movement>=1.5)return{movement:movement.toFixed(1),isSteam:true,sharpSide:lineMove.sharpSide,alert:`🚨 STEAM MOVE: Line moved ${movement.toFixed(1)} pts — coordinated sharp action. One of the strongest mechanical signals in sports betting.`,severity:movement>=2.5?"EXTREME":movement>=2.0?"STRONG":"MODERATE"};
    if(movement>=1.0)return{movement:movement.toFixed(1),isSteam:false,sharpSide:lineMove.sharpSide,alert:`⚡ Significant line movement: ${movement.toFixed(1)} pts — watch for continuation.`,severity:"WATCH"};
  }catch{return null;}
  return null;
}

// ── Weather model ─────────────────────────────────────────────────────────────
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
async function callClaude({prompt,useSearch=false,maxTokens=900}){
  const body={model:"claude-sonnet-4-20250514",max_tokens:maxTokens,messages:[{role:"user",content:prompt}]};
  if(useSearch) body.tools=[{type:"web_search_20250305",name:"web_search"}];
  const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  const data=await res.json();
  if(data.error) throw new Error(data.error.message);
  return data.content?.filter(b=>b.type==="text").map(b=>b.text).join("")||"";
}
// ── Shared UI atoms ───────────────────────────────────────────────────────────
function Spinner(){return <span style={{width:"10px",height:"10px",border:"1.5px solid rgba(255,255,255,0.2)",borderTopColor:"#aaa",borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite"}}/>;}
function Tag({children,color="#555"}){return <span style={{fontSize:"9px",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color,background:`${color}18`,border:`1px solid ${color}33`,borderRadius:"4px",padding:"2px 6px",fontFamily:"'Barlow Condensed',sans-serif"}}>{children}</span>;}
function Panel({children,mb="12px",border="rgba(255,255,255,0.07)",bg="rgba(255,255,255,0.03)"}){return <div style={{background:bg,border:`1px solid ${border}`,borderRadius:"12px",padding:"16px",marginBottom:mb}}>{children}</div>;}
function PanelTitle({icon,title,tag,tagColor="#4ade80"}){return <div style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",color:"#666",marginBottom:"12px",fontFamily:"'Barlow Condensed',sans-serif",display:"flex",alignItems:"center",gap:"7px"}}>{icon} {title}{tag&&<Tag color={tagColor}>{tag}</Tag>}</div>;}
function Skel({cols=3}){return <div style={{display:"grid",gridTemplateColumns:`repeat(${cols},1fr)`,gap:"6px"}}>{Array(cols).fill(0).map((_,i)=><div key={i} style={{background:"rgba(255,255,255,0.04)",borderRadius:"6px",padding:"10px",textAlign:"center"}}><div style={{height:"7px",width:"55%",background:"rgba(255,255,255,0.07)",borderRadius:"3px",margin:"0 auto 5px",animation:"pulse 1s infinite"}}/><div style={{height:"16px",width:"70%",background:"rgba(255,255,255,0.07)",borderRadius:"3px",margin:"0 auto",animation:"pulse 1s infinite"}}/></div>)}</div>;}
function WinBar({homeWin,awayWin,homeTeam,awayTeam}){
  const [a,setA]=useState(false);
  useEffect(()=>{setTimeout(()=>setA(true),120);},[homeWin,awayWin]);
  return(<div><div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}><span style={{fontSize:"11px",color:"#aaa",fontFamily:"'Barlow Condensed',sans-serif"}}>{abb(awayTeam)} {awayWin}%</span><span style={{fontSize:"11px",color:"#aaa",fontFamily:"'Barlow Condensed',sans-serif"}}>{homeWin}% {abb(homeTeam)}</span></div><div style={{height:"9px",borderRadius:"5px",background:"rgba(255,255,255,0.06)",overflow:"hidden",display:"flex"}}><div style={{width:a?`${awayWin}%`:"50%",background:tc(awayTeam),transition:"width 1.2s cubic-bezier(0.16,1,0.3,1)",opacity:0.9}}/><div style={{width:a?`${homeWin}%`:"50%",background:tc(homeTeam),transition:"width 1.2s cubic-bezier(0.16,1,0.3,1)",opacity:0.9}}/></div></div>);
}
function StatFld({label,value,onChange,hl}){return(<div><label style={{display:"block",fontSize:"9px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:hl?"#6ee7b7":"#444",marginBottom:"3px",fontFamily:"'Barlow Condensed',sans-serif",transition:"color 0.4s"}}>{label}</label><input type="number" value={value} onChange={e=>onChange(e.target.value)} placeholder="—" style={{width:"100%",padding:"7px 9px",background:hl?"rgba(74,222,128,0.06)":"rgba(255,255,255,0.04)",border:`1px solid ${hl?"rgba(74,222,128,0.25)":"rgba(255,255,255,0.08)"}`,borderRadius:"5px",color:hl?"#d1fae5":"#ddd",fontSize:"12px",outline:"none",fontFamily:"'Barlow Condensed',sans-serif",boxSizing:"border-box",transition:"all 0.4s"}}/></div>);}

// ── Logit Transform Panel ─────────────────────────────────────────────────────
function LogitPanel({lines,homeTeam,awayTeam,modelWinProb}){
  if(!lines||!homeTeam||!awayTeam) return null;
  const {homeWin,awayWin}=spreadToWinProb(lines.spread,lines.favTeam,homeTeam);
  const modelHome=modelWinProb||homeWin;
  const divergence=Math.abs(modelHome-homeWin);
  const homeEdge=modelHome>homeWin?homeTeam:awayTeam;
  const edgeSize=divergence.toFixed(1);
  const hasSigEdge=divergence>=3;
  return(
    <Panel border={hasSigEdge?"rgba(167,139,250,0.25)":"rgba(255,255,255,0.07)"} bg={hasSigEdge?"rgba(167,139,250,0.04)":"rgba(255,255,255,0.03)"} mb="10px">
      <PanelTitle icon="📐" title="Logit Win Probability Map" tag={hasSigEdge?"EDGE DETECTED":undefined} tagColor="#a78bfa"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"7px",marginBottom:"10px"}}>
        <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"7px",padding:"10px 8px",textAlign:"center"}}>
          <div style={{fontSize:"8px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px",fontWeight:700,letterSpacing:"0.1em"}}>MARKET IMPLIED</div>
          <div style={{fontSize:"11px",color:"#aaa",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px"}}>{abb(awayTeam)} / {abb(homeTeam)}</div>
          <div style={{fontSize:"15px",fontWeight:900,color:"#c084fc",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{awayWin}% / {homeWin}%</div>
          <div style={{fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"3px"}}>from spread {lines.favTeam?abb(lines.favTeam):""} -{lines.spread}</div>
        </div>
        <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"7px",padding:"10px 8px",textAlign:"center"}}>
          <div style={{fontSize:"8px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px",fontWeight:700,letterSpacing:"0.1em"}}>MODEL OUTPUT</div>
          <div style={{fontSize:"11px",color:"#aaa",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px"}}>{abb(awayTeam)} / {abb(homeTeam)}</div>
          <div style={{fontSize:"15px",fontWeight:900,color:"#4ade80",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{100-modelHome}% / {modelHome}%</div>
          <div style={{fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"3px"}}>from full signal ensemble</div>
        </div>
        <div style={{background:hasSigEdge?"rgba(167,139,250,0.08)":"rgba(255,255,255,0.04)",border:`1px solid ${hasSigEdge?"rgba(167,139,250,0.22)":"rgba(255,255,255,0.06)"}`,borderRadius:"7px",padding:"10px 8px",textAlign:"center"}}>
          <div style={{fontSize:"8px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px",fontWeight:700,letterSpacing:"0.1em"}}>DIVERGENCE</div>
          <div style={{fontSize:"20px",fontWeight:900,color:hasSigEdge?"#a78bfa":"#555",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{edgeSize}%</div>
          <div style={{fontSize:"7px",fontWeight:700,color:hasSigEdge?"#a78bfa":"#444",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"3px"}}>{hasSigEdge?`MODEL FAVORS ${abb(homeEdge)}`:"NO SIGNIFICANT EDGE"}</div>
        </div>
      </div>
      {hasSigEdge&&(
        <div style={{background:"rgba(167,139,250,0.06)",border:"1px solid rgba(167,139,250,0.14)",borderRadius:"6px",padding:"8px 11px"}}>
          <div style={{fontSize:"9px",fontWeight:700,color:"#a78bfa",fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.1em",marginBottom:"3px"}}>📐 LOGIT EDGE SIGNAL</div>
          <div style={{fontSize:"10px",color:"#c4b5fd",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.5"}}>
            Model assigns {abb(homeEdge)} a {edgeSize}% higher win probability than the market implies from the spread. When model-vs-market divergence exceeds 3%, it historically correlates with a {(parseFloat(edgeSize)*0.8).toFixed(1)}% edge on the moneyline. Favor {abb(homeEdge)}.
          </div>
        </div>
      )}
      <div style={{marginTop:"7px",fontSize:"8px",color:"#1e1e28",fontFamily:"'Barlow Condensed',sans-serif"}}>Logit transform: σ(spread × 0.15) mapped to win probability · Divergence = model vs market mismatch</div>
    </Panel>
  );
}

// ── Garbage Time Filter Panel ─────────────────────────────────────────────────
function GarbageTimePanel({garbageData,loading,homeTeam,awayTeam}){
  if(!garbageData&&!loading) return null;
  return(
    <Panel border="rgba(251,146,60,0.18)" bg="rgba(251,146,60,0.03)" mb="10px">
      <PanelTitle icon="🗑️" title="Garbage-Time Signal Filter" tag={loading?"loading…":garbageData?.contaminated?"STATS SANITIZED":"CLEAN"} tagColor={loading?"#f59e0b":garbageData?.contaminated?"#fb923c":"#4ade80"}/>
      {loading&&<Skel cols={2}/>}
      {garbageData&&!loading&&(
        <>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"8px"}}>
            {[{team:awayTeam,d:garbageData.away},{team:homeTeam,d:garbageData.home}].map(({team,d})=>d?(
              <div key={team} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"7px",padding:"9px 10px"}}>
                <div style={{fontSize:"9px",fontWeight:800,color:tc(team),fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"6px"}}>{abb(team)}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"3px"}}>
                  {[
                    ["Raw PPG",d.rawPPG,"#aaa"],
                    ["Garbage-Adj PPG",d.adjustedPPG,d.adjustedPPG<d.rawPPG?"#f59e0b":"#4ade80"],
                    ["Garbage Pts",d.garbagePoints,"#f87171"],
                    ["Real PPG",d.adjustedPPG,d.contaminated?"#f59e0b":"#4ade80"],
                  ].map(([lbl,v,c])=>(
                    <div key={lbl} style={{background:"rgba(255,255,255,0.03)",borderRadius:"4px",padding:"4px 5px",textAlign:"center"}}>
                      <div style={{fontSize:"7px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"1px",lineHeight:"1.2"}}>{lbl}</div>
                      <div style={{fontSize:"12px",fontWeight:800,color:c,fontFamily:"'Barlow Condensed',sans-serif"}}>{v!=null?v:"—"}</div>
                    </div>
                  ))}
                </div>
                {d.contaminated&&<div style={{marginTop:"5px",fontSize:"9px",color:"#fb923c",fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",lineHeight:"1.4"}}>⚠ Stats inflated by garbage time</div>}
                {d.note&&<div style={{marginTop:"3px",fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",lineHeight:"1.4"}}>{d.note}</div>}
              </div>
            ):null)}
          </div>
          {garbageData.spreadImpact&&(
            <div style={{background:"rgba(251,146,60,0.06)",border:"1px solid rgba(251,146,60,0.14)",borderRadius:"6px",padding:"8px 11px"}}>
              <div style={{fontSize:"9px",fontWeight:700,color:"#fb923c",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px"}}>🗑️ Sanitized Spread Impact</div>
              <div style={{fontSize:"10px",color:"#fed7aa",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.5"}}>{garbageData.spreadImpact}</div>
            </div>
          )}
        </>
      )}
    </Panel>
  );
}

// ── Leverage Regression Panel ─────────────────────────────────────────────────
function LeveragePanel({leverageData,loading,homeTeam,awayTeam}){
  if(!leverageData&&!loading) return null;
  const getLuckColor=luck=>luck>2?"#f87171":luck<-2?"#4ade80":"#f59e0b";
  const getLuckLabel=luck=>luck>3?"VERY LUCKY":luck>1?"LUCKY":luck<-3?"VERY UNLUCKY":luck<-1?"UNLUCKY":"NEUTRAL";
  return(
    <Panel border="rgba(99,102,241,0.2)" bg="rgba(99,102,241,0.03)" mb="10px">
      <PanelTitle icon="🎲" title="Leverage Regression (Luck Filter)" tag={loading?"loading…":"live"} tagColor={loading?"#f59e0b":"#6366f1"}/>
      {loading&&<Skel cols={2}/>}
      {leverageData&&!loading&&(
        <>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"8px"}}>
            {[{team:awayTeam,d:leverageData.away},{team:homeTeam,d:leverageData.home}].map(({team,d})=>d?(
              <div key={team} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"7px",padding:"9px 10px"}}>
                <div style={{fontSize:"9px",fontWeight:800,color:tc(team),fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"7px",display:"flex",alignItems:"center",gap:"5px"}}>
                  {abb(team)}
                  <Tag color={getLuckColor(d.luckScore||0)}>{getLuckLabel(d.luckScore||0)}</Tag>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"3px",marginBottom:"5px"}}>
                  {[
                    ["Turnover Luck",d.turnoverLuck,d.turnoverLuck>1?"#f87171":d.turnoverLuck<-1?"#4ade80":"#f59e0b"],
                    ["Fumble Rec%",d.fumbleRecovery,d.fumbleRecovery>55?"#f87171":d.fumbleRecovery<45?"#4ade80":"#f59e0b"],
                    ["EPA/Drive",d.epaDrive,d.epaDrive>0.3?"#4ade80":d.epaDrive<-0.1?"#f87171":"#f59e0b"],
                    ["Regressed W-L",d.regressedRecord,"#c084fc"],
                  ].map(([lbl,v,c])=>(
                    <div key={lbl} style={{background:"rgba(255,255,255,0.03)",borderRadius:"4px",padding:"4px 5px",textAlign:"center"}}>
                      <div style={{fontSize:"7px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"1px",lineHeight:"1.2"}}>{lbl}</div>
                      <div style={{fontSize:"12px",fontWeight:800,color:c,fontFamily:"'Barlow Condensed',sans-serif"}}>{v!=null?v:"—"}</div>
                    </div>
                  ))}
                </div>
                {d.note&&<div style={{fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",lineHeight:"1.4"}}>{d.note}</div>}
              </div>
            ):null)}
          </div>
          {leverageData.regressionVerdict&&(
            <div style={{background:"rgba(99,102,241,0.07)",border:"1px solid rgba(99,102,241,0.16)",borderRadius:"6px",padding:"8px 11px"}}>
              <div style={{fontSize:"9px",fontWeight:700,color:"#818cf8",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px"}}>🎲 Regression Verdict</div>
              <div style={{fontSize:"10px",color:"#c7d2fe",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.5"}}>{leverageData.regressionVerdict}</div>
            </div>
          )}
        </>
      )}
    </Panel>
  );
}

// ── Coaching Aggressiveness Index Panel ───────────────────────────────────────
function CoachingPanel({coachData,loading,homeTeam,awayTeam}){
  if(!coachData&&!loading) return null;
  const getAggrColor=idx=>idx>=75?"#4ade80":idx>=55?"#f59e0b":"#f87171";
  const getAggrLabel=idx=>idx>=80?"AGGRESSIVE":idx>=60?"ABOVE AVG":idx>=40?"AVERAGE":idx>=25?"CONSERVATIVE":"ULTRA CONSERVATIVE";
  return(
    <Panel border="rgba(20,184,166,0.2)" bg="rgba(20,184,166,0.03)" mb="10px">
      <PanelTitle icon="🧠" title="Coaching Aggressiveness Index" tag={loading?"loading…":"live"} tagColor={loading?"#f59e0b":"#14b8a6"}/>
      {loading&&<Skel cols={2}/>}
      {coachData&&!loading&&(
        <>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"8px"}}>
            {[{team:awayTeam,d:coachData.away},{team:homeTeam,d:coachData.home}].map(({team,d})=>d?(
              <div key={team} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"7px",padding:"9px 10px"}}>
                <div style={{fontSize:"9px",fontWeight:800,color:tc(team),fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"5px"}}>{d.coachName||abb(team)}</div>
                {/* Aggressiveness bar */}
                <div style={{marginBottom:"7px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:"3px"}}>
                    <span style={{fontSize:"8px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>AGGRESSIVENESS INDEX</span>
                    <span style={{fontSize:"10px",fontWeight:800,color:getAggrColor(d.aggressivenessIndex||50),fontFamily:"'Barlow Condensed',sans-serif"}}>{d.aggressivenessIndex||"—"}</span>
                  </div>
                  <div style={{height:"5px",borderRadius:"3px",background:"rgba(255,255,255,0.06)",overflow:"hidden"}}>
                    <div style={{width:`${d.aggressivenessIndex||0}%`,height:"100%",background:getAggrColor(d.aggressivenessIndex||50),transition:"width 0.8s ease",borderRadius:"3px"}}/>
                  </div>
                  <div style={{fontSize:"7px",color:getAggrColor(d.aggressivenessIndex||50),fontFamily:"'Barlow Condensed',sans-serif",marginTop:"2px",fontWeight:700}}>{getAggrLabel(d.aggressivenessIndex||50)}</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"3px"}}>
                  {[
                    ["4th Down Go%",d.fourthDownGo,d.fourthDownGo>60?"#4ade80":d.fourthDownGo>40?"#f59e0b":"#f87171"],
                    ["2-Pt Rate",d.twoPtRate,d.twoPtRate>20?"#4ade80":d.twoPtRate>10?"#f59e0b":"#f87171"],
                    ["Fake Punt/FG",d.trickPlayRate,d.trickPlayRate>5?"#4ade80":"#f59e0b"],
                    ["Clock Mgmt",d.clockMgmt,"#c084fc"],
                  ].map(([lbl,v,c])=>(
                    <div key={lbl} style={{background:"rgba(255,255,255,0.03)",borderRadius:"4px",padding:"4px 5px",textAlign:"center"}}>
                      <div style={{fontSize:"7px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"1px",lineHeight:"1.2"}}>{lbl}</div>
                      <div style={{fontSize:"11px",fontWeight:800,color:c,fontFamily:"'Barlow Condensed',sans-serif"}}>{v!=null?(typeof v==="number"?`${v}%`:v):"—"}</div>
                    </div>
                  ))}
                </div>
                {d.note&&<div style={{marginTop:"5px",fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",lineHeight:"1.4"}}>{d.note}</div>}
              </div>
            ):null)}
          </div>
          {coachData.matchupNote&&(
            <div style={{background:"rgba(20,184,166,0.06)",border:"1px solid rgba(20,184,166,0.14)",borderRadius:"6px",padding:"8px 11px"}}>
              <div style={{fontSize:"9px",fontWeight:700,color:"#14b8a6",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px"}}>🧠 Coaching Matchup Edge</div>
              <div style={{fontSize:"10px",color:"#99f6e4",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.5"}}>{coachData.matchupNote}</div>
            </div>
          )}
          {coachData.spreadImpact&&<div style={{marginTop:"6px",display:"flex",gap:"7px",alignItems:"center"}}><div style={{fontSize:"8px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>COACHING SPREAD ADJ:</div><Tag color="#14b8a6">{coachData.spreadImpact>0?"+":""}{coachData.spreadImpact} pts</Tag><div style={{fontSize:"9px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",flex:1}}>{coachData.spreadAdjNote}</div></div>}
        </>
      )}
    </Panel>
  );
}

// ── CPOE Panel ────────────────────────────────────────────────────────────────
function CPOEPanel({cpoeData,loading,homeTeam,awayTeam}){
  if(!cpoeData&&!loading) return null;
  const getCpoeColor=c=>c>5?"#4ade80":c>0?"#86efac":c>-5?"#f59e0b":"#f87171";
  const getCpoeLabel=c=>c>8?"ELITE":c>4?"ABOVE AVG":c>0?"AVERAGE":c>-4?"BELOW AVG":"POOR";
  return(
    <Panel border="rgba(236,72,153,0.2)" bg="rgba(236,72,153,0.03)" mb="10px">
      <PanelTitle icon="🎯" title="CPOE — Completion % Over Expected" tag={loading?"loading…":"live"} tagColor={loading?"#f59e0b":"#ec4899"}/>
      {loading&&<Skel cols={2}/>}
      {cpoeData&&!loading&&(
        <>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"8px"}}>
            {[{team:awayTeam,d:cpoeData.away},{team:homeTeam,d:cpoeData.home}].map(({team,d})=>d?(
              <div key={team} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"7px",padding:"9px 10px"}}>
                <div style={{fontSize:"9px",fontWeight:800,color:tc(team),fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"5px"}}>{d.qbName||abb(team)} QB</div>
                {/* CPOE gauge */}
                <div style={{textAlign:"center",marginBottom:"7px"}}>
                  <div style={{fontSize:"24px",fontWeight:900,color:getCpoeColor(d.cpoe||0),fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{d.cpoe!=null?(d.cpoe>0?"+":"")+d.cpoe:"+0.0"}</div>
                  <div style={{fontSize:"8px",fontWeight:700,color:getCpoeColor(d.cpoe||0),fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.1em"}}>{getCpoeLabel(d.cpoe||0)}</div>
                  <div style={{fontSize:"7px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"1px"}}>CPOE (% above expected)</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"3px"}}>
                  {[
                    ["Comp %",d.compPct,"#aaa"],
                    ["Expected %",d.expectedCompPct,"#555"],
                    ["xEPA/play",d.xEPA,(d.xEPA||0)>0.2?"#4ade80":(d.xEPA||0)>0?"#f59e0b":"#f87171"],
                    ["vs Def CPOE",d.vsDefCPOE,getCpoeColor(-(d.vsDefCPOE||0))],
                  ].map(([lbl,v,c])=>(
                    <div key={lbl} style={{background:"rgba(255,255,255,0.03)",borderRadius:"4px",padding:"4px 5px",textAlign:"center"}}>
                      <div style={{fontSize:"7px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"1px",lineHeight:"1.2"}}>{lbl}</div>
                      <div style={{fontSize:"11px",fontWeight:800,color:c,fontFamily:"'Barlow Condensed',sans-serif"}}>{v!=null?(typeof v==="number"&&lbl.includes("%")?`${v}%`:v):"—"}</div>
                    </div>
                  ))}
                </div>
                {d.note&&<div style={{marginTop:"5px",fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",lineHeight:"1.4"}}>{d.note}</div>}
              </div>
            ):null)}
          </div>
          {cpoeData.matchupEdge&&(
            <div style={{background:"rgba(236,72,153,0.06)",border:"1px solid rgba(236,72,153,0.14)",borderRadius:"6px",padding:"8px 11px"}}>
              <div style={{fontSize:"9px",fontWeight:700,color:"#ec4899",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px"}}>🎯 CPOE Matchup Edge</div>
              <div style={{fontSize:"10px",color:"#fbcfe8",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.5"}}>{cpoeData.matchupEdge}</div>
            </div>
          )}
          {cpoeData.totalImpact&&<div style={{marginTop:"6px",display:"flex",gap:"7px",alignItems:"center"}}><div style={{fontSize:"8px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>TOTAL IMPACT:</div><Tag color="#ec4899">{cpoeData.totalImpact>0?"+":""}{cpoeData.totalImpact} pts</Tag><div style={{fontSize:"9px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",flex:1}}>{cpoeData.totalImpactNote}</div></div>}
        </>
      )}
    </Panel>
  );
}
// ── Pressure Rate Panel ───────────────────────────────────────────────────────
function PressurePanel({pressureData,loading,homeTeam,awayTeam}){
  if(!pressureData&&!loading) return null;
  return(
    <Panel border="rgba(251,146,60,0.2)" bg="rgba(251,146,60,0.03)" mb="10px">
      <PanelTitle icon="🔥" title="Pressure Rate Matchup" tag={loading?"loading…":"live"} tagColor={loading?"#f59e0b":"#fb923c"}/>
      {loading&&<Skel cols={2}/>}
      {pressureData&&!loading&&(
        <>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"8px"}}>
            {[{team:awayTeam,color:tc(awayTeam),d:pressureData.away},{team:homeTeam,color:tc(homeTeam),d:pressureData.home}].map(({team,color,d})=>d?(
              <div key={team} style={{borderTop:`2px solid ${color}33`,paddingTop:"9px"}}>
                <div style={{fontSize:"10px",fontWeight:800,color,fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"7px"}}>{abb(team)}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px"}}>
                  {[["Pressure Allowed%",d.pressureAllowed,d.pressureAllowed>35?"#f87171":d.pressureAllowed>28?"#f59e0b":"#4ade80"],["Pass Rush Win%",d.passRushWin,d.passRushWin>55?"#4ade80":d.passRushWin>42?"#f59e0b":"#f87171"],["Sack Rate",d.sackRate,d.sackRate>8?"#4ade80":d.sackRate>5?"#f59e0b":"#f87171"],["Hurry Rate",d.hurryRate,d.hurryRate>15?"#f87171":d.hurryRate>10?"#f59e0b":"#4ade80"]].map(([lbl,val,color])=>(
                    <div key={lbl} style={{background:"rgba(255,255,255,0.04)",borderRadius:"5px",padding:"5px 7px",textAlign:"center"}}>
                      <div style={{fontSize:"7px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px",lineHeight:"1.2"}}>{lbl}</div>
                      <div style={{fontSize:"13px",fontWeight:900,color,fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{val!=null?`${val}%`:"—"}</div>
                    </div>
                  ))}
                </div>
                {d.note&&<div style={{fontSize:"9px",color:"#666",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"5px",fontStyle:"italic",lineHeight:"1.4"}}>{d.note}</div>}
              </div>
            ):null)}
          </div>
          {pressureData.matchupEdge&&<div style={{background:"rgba(251,146,60,0.06)",border:"1px solid rgba(251,146,60,0.15)",borderRadius:"7px",padding:"9px 12px",marginBottom:"6px"}}><div style={{fontSize:"9px",fontWeight:700,color:"#fb923c",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"4px"}}>🔥 Pressure Edge</div><div style={{fontSize:"11px",color:"#fed7aa",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.5"}}>{pressureData.matchupEdge}</div></div>}
          {pressureData.spreadImpact&&<div style={{display:"flex",gap:"8px",alignItems:"center"}}><div style={{fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif"}}>PRESSURE SPREAD ADJ:</div><Tag color="#fb923c">{pressureData.spreadImpact>0?"+":""}{pressureData.spreadImpact} pts</Tag></div>}
        </>
      )}
    </Panel>
  );
}

// ── Market Ensemble Panel ─────────────────────────────────────────────────────
function MarketEnsemblePanel({ensemble,loading,homeTeam,awayTeam}){
  if(!ensemble&&!loading) return null;
  const books=ensemble?.books||[];
  const consensusSpread=books.length?(books.reduce((s,b)=>s+(b.spread||0),0)/books.length).toFixed(1):null;
  const spreadDiv=books.length?Math.max(...books.map(b=>b.spread||0))-Math.min(...books.map(b=>b.spread||0)):0;
  const totalDiv=books.length?Math.max(...books.map(b=>b.total||0))-Math.min(...books.map(b=>b.total||0)):0;
  return(
    <Panel border="rgba(139,92,246,0.2)" bg="rgba(139,92,246,0.03)" mb="10px">
      <PanelTitle icon="📡" title="Market Ensemble" tag={loading?"loading…":"multi-book"} tagColor={loading?"#f59e0b":"#8b5cf6"}/>
      {loading&&<Skel cols={3}/>}
      {ensemble&&!loading&&(
        <>
          {books.length>0&&(
            <div style={{marginBottom:"9px"}}>
              <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(books.length,4)},1fr)`,gap:"5px",marginBottom:"7px"}}>
                {books.map((b,i)=><div key={i} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"7px",padding:"7px 6px",textAlign:"center"}}><div style={{fontSize:"8px",fontWeight:700,color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px"}}>{b.book}</div><div style={{fontSize:"12px",fontWeight:900,color:"#4ade80",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{b.favTeam?abb(b.favTeam):""} -{b.spread||"?"}</div><div style={{fontSize:"10px",fontWeight:700,color:"#c084fc",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"2px"}}>{b.total||"—"}</div></div>)}
              </div>
              <div style={{display:"flex",gap:"6px"}}>
                <div style={{flex:1,background:"rgba(139,92,246,0.07)",border:"1px solid rgba(139,92,246,0.16)",borderRadius:"5px",padding:"6px 9px",textAlign:"center"}}><div style={{fontSize:"8px",color:"#7c3aed",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,marginBottom:"2px"}}>CONSENSUS</div><div style={{fontSize:"13px",fontWeight:900,color:"#a78bfa",fontFamily:"'Barlow Condensed',sans-serif"}}>{consensusSpread?`${ensemble.favTeam?abb(ensemble.favTeam):""} -${consensusSpread}`:"—"}</div></div>
                <div style={{flex:1,background:"rgba(139,92,246,0.07)",border:"1px solid rgba(139,92,246,0.16)",borderRadius:"5px",padding:"6px 9px",textAlign:"center"}}><div style={{fontSize:"8px",color:"#7c3aed",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,marginBottom:"2px"}}>SPREAD DIV</div><div style={{fontSize:"13px",fontWeight:900,color:spreadDiv>=1.5?"#f87171":spreadDiv>=0.5?"#f59e0b":"#4ade80",fontFamily:"'Barlow Condensed',sans-serif"}}>{spreadDiv.toFixed(1)} pts</div></div>
                <div style={{flex:1,background:"rgba(139,92,246,0.07)",border:"1px solid rgba(139,92,246,0.16)",borderRadius:"5px",padding:"6px 9px",textAlign:"center"}}><div style={{fontSize:"8px",color:"#7c3aed",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,marginBottom:"2px"}}>TOTAL DIV</div><div style={{fontSize:"13px",fontWeight:900,color:totalDiv>=2?"#f87171":totalDiv>=1?"#f59e0b":"#4ade80",fontFamily:"'Barlow Condensed',sans-serif"}}>{totalDiv.toFixed(1)} pts</div></div>
              </div>
            </div>
          )}
          {ensemble.sharpConsensus&&<div style={{background:"rgba(74,222,128,0.05)",border:"1px solid rgba(74,222,128,0.12)",borderRadius:"6px",padding:"7px 10px",marginBottom:"6px"}}><div style={{fontSize:"9px",fontWeight:700,color:"#4ade80",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px"}}>📡 Sharp Consensus</div><div style={{fontSize:"10px",color:"#86efac",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.5"}}>{ensemble.sharpConsensus}</div></div>}
          {ensemble.exploit&&<div style={{background:spreadDiv>=1.5?"rgba(248,113,113,0.05)":"rgba(251,191,36,0.04)",border:`1px solid ${spreadDiv>=1.5?"rgba(248,113,113,0.16)":"rgba(251,191,36,0.13)"}`,borderRadius:"6px",padding:"7px 10px"}}><div style={{fontSize:"9px",fontWeight:700,color:spreadDiv>=1.5?"#f87171":"#fbbf24",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px"}}>{spreadDiv>=1.5?"⚠ DIVERGENCE — EXPLOIT":"💡 Market Insight"}</div><div style={{fontSize:"10px",color:"#ddd",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.5"}}>{ensemble.exploit}</div></div>}
        </>
      )}
    </Panel>
  );
}

// ── OL Degradation Panel ──────────────────────────────────────────────────────
function OLPanel({olData,loading,homeTeam,awayTeam}){
  if(!olData&&!loading) return null;
  const gc=s=>s>=75?"#4ade80":s>=55?"#f59e0b":s>=35?"#f87171":"#ef4444";
  const gl=s=>s>=75?"HEALTHY":s>=55?"DEGRADED":s>=35?"CRITICAL":"CRIPPLED";
  return(
    <Panel border="rgba(99,102,241,0.2)" bg="rgba(99,102,241,0.03)" mb="10px">
      <PanelTitle icon="🛡️" title="OL Degradation Index" tag={loading?"loading…":"live"} tagColor={loading?"#f59e0b":"#6366f1"}/>
      {loading&&<Skel cols={2}/>}
      {olData&&!loading&&(
        <>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"8px"}}>
            {[{team:awayTeam,color:tc(awayTeam),d:olData.away},{team:homeTeam,color:tc(homeTeam),d:olData.home}].map(({team,color,d})=>d?(
              <div key={team} style={{borderTop:`2px solid ${color}33`,paddingTop:"9px"}}>
                <div style={{fontSize:"10px",fontWeight:800,color,fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"8px"}}>{abb(team)}</div>
                <div style={{background:"rgba(255,255,255,0.04)",borderRadius:"7px",padding:"8px",textAlign:"center",marginBottom:"6px"}}>
                  <div style={{fontSize:"8px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px"}}>OL HEALTH</div>
                  <div style={{fontSize:"22px",fontWeight:900,color:gc(d.healthScore||75),fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{d.healthScore||"—"}</div>
                  <div style={{fontSize:"8px",fontWeight:700,color:gc(d.healthScore||75),fontFamily:"'Barlow Condensed',sans-serif"}}>{gl(d.healthScore||75)}</div>
                  <div style={{height:"4px",borderRadius:"2px",background:"rgba(255,255,255,0.06)",overflow:"hidden",marginTop:"4px"}}><div style={{width:`${d.healthScore||0}%`,height:"100%",background:gc(d.healthScore||75),borderRadius:"2px"}}/></div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"3px"}}>
                  {[["Out",d.startersOut,(d.startersOut||0)>1?"#f87171":(d.startersOut||0)>0?"#f59e0b":"#4ade80"],["Sack Trend",d.sackRateTrend,d.sackRateTrend==="up"?"#f87171":d.sackRateTrend==="down"?"#4ade80":"#f59e0b"],["PFF Grade",d.avgPFFGrade,(d.avgPFFGrade||65)>=70?"#4ade80":(d.avgPFFGrade||65)>=62?"#f59e0b":"#f87171"],["Run Blk",d.runBlockRank?(` #${d.runBlockRank}`):"—",(d.runBlockRank||16)<=10?"#4ade80":(d.runBlockRank||16)<=21?"#f59e0b":"#f87171"]].map(([lbl,v,c])=>(
                    <div key={lbl} style={{background:"rgba(255,255,255,0.03)",borderRadius:"3px",padding:"4px 5px",textAlign:"center"}}><div style={{fontSize:"7px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"1px"}}>{lbl}</div><div style={{fontSize:"11px",fontWeight:800,color:c,fontFamily:"'Barlow Condensed',sans-serif"}}>{v!=null?v:"—"}</div></div>
                  ))}
                </div>
                {d.keyInjuries?.length>0&&<div style={{marginTop:"5px"}}>{d.keyInjuries.map((inj,i)=><div key={i} style={{fontSize:"9px",color:"#f87171",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.4"}}>• {inj}</div>)}</div>}
              </div>
            ):null)}
          </div>
          {(olData.spreadImpact||olData.totalImpact)&&<div style={{display:"flex",gap:"6px"}}>{olData.spreadImpact&&<div style={{flex:1,background:"rgba(99,102,241,0.07)",border:"1px solid rgba(99,102,241,0.14)",borderRadius:"5px",padding:"6px 9px"}}><div style={{fontSize:"8px",color:"#818cf8",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,marginBottom:"2px"}}>SPREAD IMPACT</div><div style={{fontSize:"10px",color:"#c7d2fe",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.4"}}>{olData.spreadImpact}</div></div>}{olData.totalImpact&&<div style={{flex:1,background:"rgba(99,102,241,0.07)",border:"1px solid rgba(99,102,241,0.14)",borderRadius:"5px",padding:"6px 9px"}}><div style={{fontSize:"8px",color:"#818cf8",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,marginBottom:"2px"}}>TOTAL IMPACT</div><div style={{fontSize:"10px",color:"#c7d2fe",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.4"}}>{olData.totalImpact}</div></div>}</div>}
        </>
      )}
    </Panel>
  );
}

// ── Micro-Context Panel ───────────────────────────────────────────────────────
function MicroContextPanel({homeTeam,awayTeam,weather,microData,microLoading}){
  if(!homeTeam||!awayTeam) return null;
  const staticMods=getMicroModifiers(homeTeam,weather);
  const totalStaticAdj=staticMods.reduce((s,m)=>s+(m.spreadAdj||0),0);
  return(
    <Panel border="rgba(56,189,248,0.18)" bg="rgba(56,189,248,0.03)" mb="10px">
      <PanelTitle icon="🔬" title="Micro-Contextual Modifiers" tag={microLoading?"loading…":microData?"live":"static"} tagColor={microLoading?"#f59e0b":"#38bdf8"}/>
      {staticMods.length>0&&<div style={{marginBottom:"8px"}}>{staticMods.map((mod,i)=><div key={i} style={{display:"flex",alignItems:"flex-start",gap:"7px",padding:"5px 8px",background:"rgba(255,255,255,0.03)",borderRadius:"5px",marginBottom:"3px",border:`1px solid ${mod.color}1a`}}><div style={{width:"5px",height:"5px",borderRadius:"50%",background:mod.color,flexShrink:0,marginTop:"3px"}}/><div style={{fontSize:"10px",color:"#bbb",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.4",flex:1}}>{mod.impact}</div>{mod.spreadAdj!==0&&<Tag color={mod.color}>{mod.spreadAdj>0?"+":""}{mod.spreadAdj}</Tag>}</div>)}{totalStaticAdj!==0&&<div style={{textAlign:"right",fontSize:"8px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>Static adj: {totalStaticAdj>0?"+":""}{totalStaticAdj} pts to home spread</div>}</div>}
      {microLoading&&<Skel cols={2}/>}
      {microData&&!microLoading&&(
        <div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px",marginBottom:"8px"}}>
            {[["✈️ Travel",microData.travelPenalty,microData.travelColor||"#f59e0b"],["😴 Rest",microData.restEdge,microData.restColor||"#4ade80"],["📅 Week",microData.weekSpot,"#38bdf8"],["🎯 Desperation",microData.desperationIndex,"#f59e0b"],["🔊 Crowd",microData.crowdAdvantage,"#4ade80"],["🌱 Turf",microData.turfRisk,"#f87171"]].filter(([,v])=>v).map(([lbl,val,c])=>(
              <div key={lbl} style={{background:"rgba(255,255,255,0.03)",borderRadius:"5px",padding:"5px 7px"}}><div style={{fontSize:"8px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"1px"}}>{lbl}</div><div style={{fontSize:"9px",color:c,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:600,lineHeight:"1.3"}}>{val}</div></div>
            ))}
          </div>
          {microData.compositeAdj!=null&&<div style={{display:"flex",alignItems:"center",gap:"10px",padding:"7px 11px",background:"rgba(56,189,248,0.06)",border:"1px solid rgba(56,189,248,0.13)",borderRadius:"6px"}}><div style={{flex:1}}><div style={{fontSize:"8px",color:"#38bdf8",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,letterSpacing:"0.08em"}}>COMPOSITE MICRO ADJ</div><div style={{fontSize:"10px",color:"#7dd3fc",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"1px"}}>{microData.compositeNote}</div></div><div style={{fontSize:"18px",fontWeight:900,color:"#38bdf8",fontFamily:"'Barlow Condensed',sans-serif",flexShrink:0}}>{microData.compositeAdj>0?"+":""}{microData.compositeAdj}</div></div>}
        </div>
      )}
    </Panel>
  );
}
// ── Week Schedule ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
// AUTO-FETCH RESULTS ENGINE
// Stores every game you analyze as "pending". After games end, one button
// fetches all final scores, calculates ATS/total results, and auto-logs
// everything to the backtest — triggering the self-learning update.
// ═══════════════════════════════════════════════════════════════════════════

// ── Fetch final score for a single game ──────────────────────────────────
async function fetchFinalScore(awayTeam, homeTeam, gameDate) {
  const text = await callClaude({
    useSearch: true,
    maxTokens: 400,
    prompt: `Search for the final score of the NFL game: ${awayTeam} at ${homeTeam}${gameDate ? ` on ${gameDate}` : ""} in the 2025-26 NFL season.
Return ONLY JSON (no markdown):
{"found":true,"awayScore":N,"homeScore":N,"awayTeam":"${awayTeam}","homeTeam":"${homeTeam}","gameDate":"e.g. Dec 8","finalStatus":"Final"}
If the game has not been played yet or score is unavailable: {"found":false,"awayTeam":"${awayTeam}","homeTeam":"${homeTeam}"}`
  });
  const m = text.match(/\{[\s\S]*?\}/);
  if (!m) return { found: false, awayTeam, homeTeam };
  return JSON.parse(m[0]);
}

// ── Auto-Results Panel ────────────────────────────────────────────────────
function AutoResultsPanel({ pendingGames, onFetchResults, onDismiss, fetching, fetchProgress }) {
  const [open, setOpen] = useState(false);
  if (!pendingGames?.length) return null;

  return (
    <Panel border="rgba(56,189,248,0.22)" bg="rgba(56,189,248,0.03)" mb="10px">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <div style={{width:"8px",height:"8px",borderRadius:"50%",background:"#38bdf8",boxShadow:"0 0 8px #38bdf8",animation:"pulse 2s infinite",flexShrink:0}}/>
          <span style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#38bdf8",fontFamily:"'Barlow Condensed',sans-serif"}}>Auto-Fetch Results</span>
          <Tag color="#38bdf8">{pendingGames.length} game{pendingGames.length>1?"s":""} pending</Tag>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"7px"}}>
          {!fetching && <button onClick={e=>{e.stopPropagation();onFetchResults();}} style={{padding:"6px 13px",borderRadius:"6px",border:"none",background:"linear-gradient(135deg,#0369a1,#0284c7)",color:"#fff",fontSize:"10px",fontWeight:700,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",display:"flex",alignItems:"center",gap:"5px"}}>
            ⚡ Fetch All Scores
          </button>}
          {fetching && <div style={{display:"flex",alignItems:"center",gap:"6px",color:"#38bdf8",fontSize:"9px",fontFamily:"'Barlow Condensed',sans-serif"}}><Spinner/>Fetching {fetchProgress}…</div>}
          <span style={{color:"#333",fontSize:"10px"}}>{open?"▲":"▼"}</span>
        </div>
      </div>

      {open && (
        <div style={{marginTop:"11px"}}>
          <div style={{fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"9px",lineHeight:"1.6"}}>
            These games were analyzed by the model but results haven't been logged yet. Hit <strong style={{color:"#38bdf8"}}>Fetch All Scores</strong> after the games finish — the model will search for final scores, calculate ATS and total results, and auto-log everything to the backtest engine. Self-learning updates trigger automatically.
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"3px"}}>
            {pendingGames.map((g, i) => (
              <div key={i} style={{display:"flex",alignItems:"center",gap:"8px",padding:"7px 10px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"6px"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:"10px",fontWeight:700,fontFamily:"'Barlow Condensed',sans-serif",color:"#ddd"}}>
                    <span style={{color:tc(g.awayTeam)}}>{abb(g.awayTeam)}</span>
                    <span style={{color:"#333",margin:"0 5px"}}>@</span>
                    <span style={{color:tc(g.homeTeam)}}>{abb(g.homeTeam)}</span>
                  </div>
                  <div style={{display:"flex",gap:"6px",marginTop:"2px",flexWrap:"wrap"}}>
                    {g.analyzedAt && <span style={{fontSize:"8px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>Analyzed {g.analyzedAt}</span>}
                    {g.modelSpread && <span style={{fontSize:"8px",color:"#4ade80",fontFamily:"'Barlow Condensed',sans-serif"}}>Model: {g.favTeam?abb(g.favTeam):""} -{g.modelSpread}</span>}
                    {g.confidence && <Tag color={g.confidence==="HIGH"?"#4ade80":g.confidence==="MEDIUM"?"#f59e0b":"#f87171"}>{g.confidence}</Tag>}
                  </div>
                </div>
                <button onClick={()=>onDismiss(i)} title="Remove from pending" style={{background:"none",border:"none",color:"#444",fontSize:"12px",cursor:"pointer",padding:"2px 4px",flexShrink:0}}>✕</button>
              </div>
            ))}
          </div>
          <div style={{marginTop:"8px",fontSize:"8px",color:"#2a2a2a",fontFamily:"'Barlow Condensed',sans-serif"}}>
            Results auto-dismissed after 7 days · Requires games to have finished · Fetches one at a time
          </div>
        </div>
      )}
    </Panel>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// POWER RANKINGS TRACKER
// Three-layer view: Live Consensus · Model-Derived · Divergence Board
// Model ratings auto-update from backtest history every time you log a result
// ═══════════════════════════════════════════════════════════════════════════

// ── Compute model-derived ratings from backtest history ───────────────────
function computeModelRatings(backtestHistory) {
  if (!backtestHistory?.length) return {};
  const teamStats = {};

  backtestHistory.forEach(g => {
    [
      { team: g.homeTeam, isHome: true,  won: g.spreadCorrect, margin: g.actualMargin,   predictedWin: g.homeWin  },
      { team: g.awayTeam, isHome: false, won: g.spreadCorrect, margin: -(g.actualMargin||0), predictedWin: g.awayWin },
    ].filter(t => t.team).forEach(({ team, won, margin, predictedWin }) => {
      if (!teamStats[team]) teamStats[team] = { atsW:0, atsL:0, margins:[], predictedWins:[], results:[] };
      const d = teamStats[team];
      if (won) d.atsW++; else d.atsL++;
      if (margin != null) d.margins.push(margin);
      if (predictedWin != null) d.predictedWins.push(predictedWin);
      d.results.push({ won, margin, date: g.date });
    });
  });

  const ratings = {};
  Object.entries(teamStats).forEach(([team, d]) => {
    const total    = d.atsW + d.atsL;
    const atsPct   = total > 0 ? d.atsW / total : 0.5;
    const avgMargin= d.margins.length ? d.margins.reduce((s,v)=>s+v,0)/d.margins.length : 0;
    const avgPredWin=d.predictedWins.length ? d.predictedWins.reduce((s,v)=>s+v,0)/d.predictedWins.length : 50;
    // Recent form: last 3 games
    const recent   = d.results.slice(-3);
    const recentATS= recent.length ? recent.filter(r=>r.won).length/recent.length : 0.5;
    // Composite: 40% ATS, 30% margin, 20% predicted win%, 10% recent form
    const composite = (atsPct*40) + (Math.min(Math.max(avgMargin/14+0.5,0),1)*30) + ((avgPredWin/100)*20) + (recentATS*10);
    ratings[team] = {
      composite: parseFloat(composite.toFixed(1)),
      atsPct:   Math.round(atsPct*100),
      atsW: d.atsW, atsL: d.atsL,
      avgMargin: parseFloat(avgMargin.toFixed(1)),
      avgPredWin: Math.round(avgPredWin),
      recentATS: Math.round(recentATS*100),
      games: total,
      trend: recentATS > atsPct + 0.1 ? "hot" : recentATS < atsPct - 0.1 ? "cold" : "neutral",
    };
  });
  return ratings;
}

// ── Power Rankings Panel ──────────────────────────────────────────────────
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
                Teams where the model's ranking differs from consensus by 3+ spots. These are your best potential edges — the market may be mispricing teams your model knows differently.
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
  if (!splitsData && !loading) return null;
  return (
    <Panel border="rgba(56,189,248,0.18)" bg="rgba(56,189,248,0.03)" mb="10px">
      <PanelTitle icon="🏠" title="Home / Away Performance Splits" tag={loading?"loading…":"live"} tagColor={loading?"#f59e0b":"#38bdf8"}/>
      {loading && <Skel cols={2}/>}
      {splitsData && !loading && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
          {[{team:awayTeam,color:tc(awayTeam),d:splitsData.away,label:"Away (visiting)"},{team:homeTeam,color:tc(homeTeam),d:splitsData.home,label:"Home (hosting)"}].map(({team,color,d,label})=>d?(
            <div key={team} style={{borderTop:`2px solid ${color}33`,paddingTop:"9px"}}>
              <div style={{fontSize:"9px",fontWeight:800,color,fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"6px"}}>{abb(team)} <span style={{fontSize:"7px",color:"#444",fontWeight:400}}>{label}</span></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px"}}>
                {[
                  ["Home W-L",d.homeRecord,"#4ade80"],
                  ["Home ATS",d.homeATS,parseFloat((d.homeATS||"0-0").split("-")[0])/(parseFloat((d.homeATS||"1-1").split("-")[0])+parseFloat((d.homeATS||"1-1").split("-")[1])||1)>0.5?"#4ade80":"#f87171"],
                  ["Away W-L",d.awayRecord,"#f59e0b"],
                  ["Away ATS",d.awayATS,parseFloat((d.awayATS||"0-0").split("-")[0])/(parseFloat((d.awayATS||"1-1").split("-")[0])+parseFloat((d.awayATS||"1-1").split("-")[1])||1)>0.5?"#4ade80":"#f87171"],
                  ["Home PPG",d.homePPG,"#4ade80"],
                  ["Away PPG",d.awayPPG,"#f59e0b"],
                ].map(([lbl,v,c])=>(
                  <div key={lbl} style={{background:"rgba(255,255,255,0.04)",borderRadius:"5px",padding:"5px 6px",textAlign:"center"}}>
                    <div style={{fontSize:"7px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px"}}>{lbl}</div>
                    <div style={{fontSize:"11px",fontWeight:800,color:c,fontFamily:"'Barlow Condensed',sans-serif"}}>{v||"—"}</div>
                  </div>
                ))}
              </div>
              {d.splitNote && <div style={{fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"5px",fontStyle:"italic",lineHeight:"1.4"}}>{d.splitNote}</div>}
            </div>
          ):null)}
        </div>
      )}
      {splitsData?.spreadImpact && <div style={{marginTop:"8px",background:"rgba(56,189,248,0.05)",border:"1px solid rgba(56,189,248,0.12)",borderRadius:"5px",padding:"7px 10px",fontSize:"10px",color:"#7dd3fc",fontFamily:"'Barlow Condensed',sans-serif"}}>{splitsData.spreadImpact}</div>}
    </Panel>
  );
}

// ── Referee Tendency Panel ────────────────────────────────────────────────────
function RefPanel({ refData, loading }) {
  if (!refData && !loading) return null;
  return (
    <Panel border="rgba(168,85,247,0.18)" bg="rgba(168,85,247,0.03)" mb="10px">
      <PanelTitle icon="🦺" title="Referee Crew Profile" tag={loading?"loading…":refData?.crewName?"live":"fetched"} tagColor={loading?"#f59e0b":"#a855f7"}/>
      {loading && <Skel cols={3}/>}
      {refData && !loading && (
        <>
          {refData.crewName && (
            <div style={{marginBottom:"10px",padding:"7px 10px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"6px"}}>
              <div style={{fontSize:"8px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px"}}>CREW / REFEREE</div>
              <div style={{fontSize:"14px",fontWeight:800,color:"#a855f7",fontFamily:"'Barlow Condensed',sans-serif"}}>{refData.crewName}</div>
            </div>
          )}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"6px",marginBottom:"8px"}}>
            {[
              ["Avg Total/G",refData.avgTotal,parseFloat(refData.avgTotal||44)>46?"#4ade80":parseFloat(refData.avgTotal||44)<42?"#f87171":"#f59e0b","vs league avg 44.5"],
              ["Penalties/G",refData.penaltiesPerGame,parseFloat(refData.penaltiesPerGame||6)>8?"#f87171":parseFloat(refData.penaltiesPerGame||6)<5?"#4ade80":"#f59e0b","league avg ~6.5/g"],
              ["Over Rate",refData.overRate?`${refData.overRate}%`:null,parseFloat(refData.overRate||50)>54?"#4ade80":parseFloat(refData.overRate||50)<46?"#f87171":"#aaa","past 3 seasons"],
              ["Yards/G",refData.yardsPerGame,parseFloat(refData.yardsPerGame||340)>360?"#4ade80":parseFloat(refData.yardsPerGame||340)<320?"#f87171":"#aaa","total yds/game"],
              ["Home W-ATS",refData.homeTeamATS,parseFloat((refData.homeTeamATS||"50%"))>53?"#4ade80":"#aaa","home team covers"],
              ["Crew Rank",refData.crewRank?`#${refData.crewRank}`:null,"#c084fc","of 17 crews"],
            ].filter(([,v])=>v!=null).map(([lbl,v,c,sub])=>(
              <div key={lbl} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"6px",padding:"8px 7px",textAlign:"center"}}>
                <div style={{fontSize:"7px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px"}}>{lbl}</div>
                <div style={{fontSize:"14px",fontWeight:900,color:c,fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{v}</div>
                <div style={{fontSize:"6px",color:"#2a2a2a",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"2px"}}>{sub}</div>
              </div>
            ))}
          </div>
          {refData.totalImpact && (
            <div style={{background:"rgba(168,85,247,0.06)",border:"1px solid rgba(168,85,247,0.14)",borderRadius:"6px",padding:"8px 10px"}}>
              <div style={{fontSize:"9px",fontWeight:700,color:"#a855f7",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px",textTransform:"uppercase",letterSpacing:"0.08em"}}>🦺 Total Impact</div>
              <div style={{fontSize:"10px",color:"#d8b4fe",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.5"}}>{refData.totalImpact}</div>
            </div>
          )}
        </>
      )}
      <div style={{marginTop:"7px",fontSize:"8px",color:"#1a1a2a",fontFamily:"'Barlow Condensed',sans-serif"}}>Crews announced Wednesday · Refresh mid-week for accuracy</div>
    </Panel>
  );
}

// ── Prime Time Performance Panel ─────────────────────────────────────────────
function PrimeTimePanel({ primeData, loading, homeTeam, awayTeam }) {
  if (!primeData && !loading) return null;
  return (
    <Panel border="rgba(236,72,153,0.18)" bg="rgba(236,72,153,0.03)" mb="10px">
      <PanelTitle icon="🌙" title="Prime Time Performance" tag={loading?"loading…":"live"} tagColor={loading?"#f59e0b":"#ec4899"}/>
      {loading && <Skel cols={2}/>}
      {primeData && !loading && (
        <>
          {primeData.isPrimeTime && (
            <div style={{marginBottom:"9px",display:"flex",gap:"5px"}}>
              <Tag color="#ec4899">{primeData.gameType||"Prime Time"}</Tag>
              {primeData.network && <Tag color="#a78bfa">{primeData.network}</Tag>}
            </div>
          )}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
            {[{team:awayTeam,color:tc(awayTeam),d:primeData.away},{team:homeTeam,color:tc(homeTeam),d:primeData.home}].map(({team,color,d})=>d?(
              <div key={team} style={{borderTop:`2px solid ${color}33`,paddingTop:"9px"}}>
                <div style={{fontSize:"9px",fontWeight:800,color,fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"6px"}}>{abb(team)}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"3px"}}>
                  {[
                    ["PT Record",d.primeRecord,d.primeRecord?.split("-")[0]>d.primeRecord?.split("-")[1]?"#4ade80":"#f87171"],
                    ["PT ATS",d.primeATS,parseFloat((d.primeATS||"0-0").split("-")[0])/(parseFloat((d.primeATS||"1-1").split("-")[0])+parseFloat((d.primeATS||"1-1").split("-")[1])||1)>0.5?"#4ade80":"#f87171"],
                    ["Avg Pts PT",d.avgPtsPT,"#c084fc"],
                    ["Last 5 PT",d.last5PT,d.last5PT?.includes("W")?"#4ade80":"#f87171"],
                  ].map(([lbl,v,c])=>(
                    <div key={lbl} style={{background:"rgba(255,255,255,0.04)",borderRadius:"4px",padding:"4px 5px",textAlign:"center"}}>
                      <div style={{fontSize:"7px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"1px"}}>{lbl}</div>
                      <div style={{fontSize:"11px",fontWeight:800,color:c,fontFamily:"'Barlow Condensed',sans-serif"}}>{v||"—"}</div>
                    </div>
                  ))}
                </div>
                {d.note && <div style={{fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"4px",fontStyle:"italic"}}>{d.note}</div>}
              </div>
            ):null)}
          </div>
          {primeData.atsNote && <div style={{marginTop:"8px",background:"rgba(236,72,153,0.05)",border:"1px solid rgba(236,72,153,0.12)",borderRadius:"5px",padding:"7px 10px",fontSize:"10px",color:"#fbcfe8",fontFamily:"'Barlow Condensed',sans-serif"}}>{primeData.atsNote}</div>}
        </>
      )}
    </Panel>
  );
}

// ── Multi-Season Regression Baseline Panel ────────────────────────────────────
function MultiSeasonPanel({ multiData, loading, homeTeam, awayTeam }) {
  if (!multiData && !loading) return null;
  return (
    <Panel border="rgba(99,102,241,0.18)" bg="rgba(99,102,241,0.03)" mb="10px">
      <PanelTitle icon="📅" title="Multi-Season Regression Baseline" tag={loading?"loading…":"3-season"} tagColor={loading?"#f59e0b":"#6366f1"}/>
      {loading && <Skel cols={2}/>}
      {multiData && !loading && (
        <>
          <div style={{marginBottom:"8px",fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.5"}}>
            Weighted 3-season true talent baseline: recent season 50% weight, prior 30%, 2 seasons ago 20%. More stable than single-season sample — reduces impact of hot/cold streaks.
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
            {[{team:awayTeam,color:tc(awayTeam),d:multiData.away},{team:homeTeam,color:tc(homeTeam),d:multiData.home}].map(({team,color,d})=>d?(
              <div key={team} style={{borderTop:`2px solid ${color}33`,paddingTop:"9px"}}>
                <div style={{fontSize:"9px",fontWeight:800,color,fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"6px"}}>{abb(team)}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"3px",marginBottom:"5px"}}>
                  {[
                    ["Weighted W%",d.weightedWinPct?`${d.weightedWinPct}%`:null,parseFloat(d.weightedWinPct||50)>55?"#4ade80":parseFloat(d.weightedWinPct||50)<45?"#f87171":"#f59e0b"],
                    ["Weighted ATS%",d.weightedAtsPct?`${d.weightedAtsPct}%`:null,parseFloat(d.weightedAtsPct||50)>53?"#4ade80":parseFloat(d.weightedAtsPct||50)<47?"#f87171":"#aaa"],
                    ["3-Yr Avg PPG",d.avgPPG3yr,"#c084fc"],
                    ["3-Yr Avg PAPG",d.avgPAPG3yr,"#f59e0b"],
                    ["True Talent Rank",d.trueTalentRank?`#${d.trueTalentRank}`:null,(d.trueTalentRank||16)<=10?"#4ade80":(d.trueTalentRank||16)<=21?"#f59e0b":"#f87171"],
                    ["Trend",d.trend,d.trend==="improving"?"#4ade80":d.trend==="declining"?"#f87171":"#f59e0b"],
                  ].filter(([,v])=>v!=null).map(([lbl,v,c])=>(
                    <div key={lbl} style={{background:"rgba(255,255,255,0.04)",borderRadius:"4px",padding:"4px 5px",textAlign:"center"}}>
                      <div style={{fontSize:"7px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"1px"}}>{lbl}</div>
                      <div style={{fontSize:"11px",fontWeight:800,color:c,fontFamily:"'Barlow Condensed',sans-serif"}}>{v}</div>
                    </div>
                  ))}
                </div>
                {d.note && <div style={{fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic"}}>{d.note}</div>}
              </div>
            ):null)}
          </div>
          {multiData.baselineNote && <div style={{marginTop:"8px",background:"rgba(99,102,241,0.06)",border:"1px solid rgba(99,102,241,0.14)",borderRadius:"5px",padding:"7px 10px",fontSize:"10px",color:"#c7d2fe",fontFamily:"'Barlow Condensed',sans-serif"}}>{multiData.baselineNote}</div>}
        </>
      )}
    </Panel>
  );
}

// ── Situational ATS Panel ─────────────────────────────────────────────────────
function SituationalATSPanel({ situationalData, loading, homeTeam, awayTeam }) {
  if (!situationalData && !loading) return null;
  return (
    <Panel border="rgba(234,179,8,0.18)" bg="rgba(234,179,8,0.02)" mb="10px">
      <PanelTitle icon="📋" title="Situational ATS Database" tag={loading?"loading…":"live"} tagColor={loading?"#f59e0b":"#eab308"}/>
      {loading && <Skel cols={2}/>}
      {situationalData && !loading && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
          {[{team:awayTeam,color:tc(awayTeam),d:situationalData.away},{team:homeTeam,color:tc(homeTeam),d:situationalData.home}].map(({team,color,d})=>d?(
            <div key={team} style={{borderTop:`2px solid ${color}33`,paddingTop:"9px"}}>
              <div style={{fontSize:"9px",fontWeight:800,color,fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"7px"}}>{abb(team)} Situational ATS</div>
              <div style={{display:"flex",flexDirection:"column",gap:"3px"}}>
                {[
                  ["Off Bye Week",d.offByeATS,d.offByeRecord],
                  ["As Home Dog",d.homeDogATS,d.homeDogRecord],
                  ["Div Games",d.divisionalATS,d.divisionalRecord],
                  ["Short Rest (<6 days)",d.shortRestATS,d.shortRestRecord],
                  ["After SU Loss",d.afterLossATS,d.afterLossRecord],
                  ["Prime Time",d.primeTimeATS,d.primeTimeRecord],
                  ["Cold Weather",d.coldWeatherATS,d.coldWeatherRecord],
                ].filter(([,v])=>v).map(([lbl,pct,rec])=>{
                  const pctNum = parseFloat(pct||"50");
                  const pctColor = pctNum >= 60 ? "#4ade80" : pctNum >= 53 ? "#86efac" : pctNum <= 40 ? "#f87171" : pctNum <= 47 ? "#fca5a5" : "#888";
                  return (
                    <div key={lbl} style={{display:"flex",alignItems:"center",gap:"6px",padding:"4px 6px",background:"rgba(255,255,255,0.03)",borderRadius:"4px"}}>
                      <div style={{fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",flex:1}}>{lbl}</div>
                      {rec && <div style={{fontSize:"9px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>{rec}</div>}
                      <div style={{fontSize:"11px",fontWeight:800,color:pctColor,fontFamily:"'Barlow Condensed',sans-serif",flexShrink:0,minWidth:"36px",textAlign:"right"}}>{pct}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ):null)}
        </div>
      )}
    </Panel>
  );
}

// ── Season-Long Analytics Dashboard ──────────────────────────────────────────
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
  const [homeTeam,setHomeTeam]=useState("");const [awayTeam,setAwayTeam]=useState("");
  const [venue,setVenue]=useState("home");const [weather,setWeather]=useState("dome");
  const [homeStats,setHomeStats]=useState(EMPTY_STATS);const [awayStats,setAwayStats]=useState(EMPTY_STATS);
  const [homeHL,setHomeHL]=useState(false);const [awayHL,setAwayHL]=useState(false);
  const [statsStatus,setStatsStatus]=useState("noTeams");
  const [injuries,setInjuries]=useState("");const [injuryStatus,setInjuryStatus]=useState("noTeams");
  const [lines,setLines]=useState(null);const [linesStatus,setLinesStatus]=useState("noTeams");const [lineMove,setLineMove]=useState(null);
  const [formData,setFormData]=useState(null);const [formStatus,setFormStatus]=useState("noTeams");
  const [rankData,setRankData]=useState(null);const [rankStatus,setRankStatus]=useState("noTeams");
  const [pressureData,setPressureData]=useState(null);const [pressureStatus,setPressureStatus]=useState("noTeams");
  const [ensembleData,setEnsembleData]=useState(null);const [ensembleStatus,setEnsembleStatus]=useState("noTeams");
  const [olData,setOlData]=useState(null);const [olStatus,setOlStatus]=useState("noTeams");
  const [microData,setMicroData]=useState(null);const [microStatus,setMicroStatus]=useState("noTeams");
  // NEW state
  const [garbageData,setGarbageData]=useState(null);const [garbageStatus,setGarbageStatus]=useState("noTeams");
  const [leverageData,setLeverageData]=useState(null);const [leverageStatus,setLeverageStatus]=useState("noTeams");
  const [coachData,setCoachData]=useState(null);const [coachStatus,setCoachStatus]=useState("noTeams");
  const [cpoeData,setCpoeData]=useState(null);const [cpoeStatus,setCpoeStatus]=useState("noTeams");
  const [dataLoading,setDataLoading]=useState(false);
  const [loading,setLoading]=useState(false);const [gameResult,setGameResult]=useState(null);const [error,setError]=useState(null);
  const [parlayLegs,setParlayLegs]=useState([]);const [parlayAnalysis,setParlayAnalysis]=useState(null);const [analyzingParlay,setAnalyzingParlay]=useState(false);
  const [history,setHistory]=useState([]);const [analyzedGames,setAnalyzedGames]=useState([]);
  // ── Backend analytics state ───────────────────────────────────────────────
  const [signalWeights,setSignalWeights]=useState({...DEFAULT_WEIGHTS});
  const [backtestHistory,setBacktestHistory]=useState([]);
  const [clvHistory,setClvHistory]=useState([]);
  const [calibration,setCalibration]=useState(null);
  const [contradictions,setContradictions]=useState([]);
  const [alignments,setAlignments]=useState([]);
  // ── Mobile / fullscreen ───────────────────────────────────────────────────
  const [isFullscreen,setIsFullscreen]=useState(false);
  const [isMobile,setIsMobile]=useState(window.innerWidth<600);
  useEffect(()=>{
    const onFS=()=>setIsFullscreen(!!document.fullscreenElement);
    const onResize=()=>setIsMobile(window.innerWidth<600);
    document.addEventListener('fullscreenchange',onFS);
    window.addEventListener('resize',onResize);
    return()=>{document.removeEventListener('fullscreenchange',onFS);window.removeEventListener('resize',onResize);};
  },[]);
  function toggleFullscreen(){
    if(!document.fullscreenElement){
      (document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen||document.documentElement.mozRequestFullScreen)?.call(document.documentElement);
    } else {
      (document.exitFullscreen||document.webkitExitFullscreen||document.mozCancelFullScreen)?.call(document);
    }
  }
  // ── New feature state ─────────────────────────────────────────────────────
  const [splitsData,setSplitsData]=useState(null);const [splitsStatus,setSplitsStatus]=useState("noTeams");
  const [refData,setRefData]=useState(null);const [refStatus,setRefStatus]=useState("noTeams");
  const [primeData,setPrimeData]=useState(null);const [primeStatus,setPrimeStatus]=useState("noTeams");
  const [multiData,setMultiData]=useState(null);const [multiStatus,setMultiStatus]=useState("noTeams");
  const [situationalData,setSituationalData]=useState(null);const [situationalStatus,setSituationalStatus]=useState("noTeams");
  // ── Self-learning state ───────────────────────────────────────────────────
  const [learnedWeights,setLearnedWeights]=useState({...DEFAULT_WEIGHTS});
  const [patternMemory,setPatternMemory]=useState({});
  const [teamBias,setTeamBias]=useState([]);
  const [currentFingerprint,setCurrentFingerprint]=useState(null);
  const [patternResult,setPatternResult]=useState(null);
  // ── Advanced systems state ────────────────────────────────────────────────
  const [mcResult,setMcResult]=useState(null);
  const [mcRunning,setMcRunning]=useState(false);
  const [driftResult,setDriftResult]=useState(null);
  const [featureImportance,setFeatureImportance]=useState([]);
  const [mistakes,setMistakes]=useState([]);
  const [fetchTimestamps,setFetchTimestamps]=useState({});
  const [pipelineHealth,setPipelineHealth]=useState(null);
  // ── 5 New features state ──────────────────────────────────────────────────
  const [unitHistory,setUnitHistory]=useState([]);
  const [forecastData,setForecastData]=useState(null);
  const [forecastLoading,setForecastLoading]=useState(false);
  // ── Auto-fetch results state ──────────────────────────────────────────────
  const [pendingGames,setPendingGames]=useState([]);
  const [fetchingResults,setFetchingResults]=useState(false);
  const [fetchProgress,setFetchProgress]=useState("");
  const prevTeams=useRef({home:"",away:""});
  const lastAttributionRef=useRef(null);

  useEffect(()=>{
    (async()=>{
      try{const r=await window.storage.get(HIST_KEY);if(r)setHistory(JSON.parse(r.value));}catch{}
      try{const r=await window.storage.get(BACKTEST_KEY);if(r){const h=JSON.parse(r.value);setBacktestHistory(h);setFeatureImportance(computeFeatureImportance(h));setDriftResult(detectConceptDrift(h));}}catch{}
      try{const r=await window.storage.get(CLV_KEY);if(r)setClvHistory(JSON.parse(r.value));}catch{}
      try{const r=await window.storage.get(WEIGHTS_KEY);if(r)setSignalWeights(JSON.parse(r.value));}catch{}
      try{const r=await window.storage.get(CALIBRATION_KEY);if(r)setCalibration(JSON.parse(r.value));}catch{}
      try{const r=await window.storage.get(LEARNING_KEY);if(r)setLearnedWeights(JSON.parse(r.value));}catch{}
      try{const r=await window.storage.get(PATTERN_KEY);if(r)setPatternMemory(JSON.parse(r.value));}catch{}
      try{const r=await window.storage.get(MISTAKE_KEY);if(r)setMistakes(JSON.parse(r.value));}catch{}
      try{const r=await window.storage.get(UNITS_KEY);if(r)setUnitHistory(JSON.parse(r.value));}catch{}
      try{const r=await window.storage.get(PENDING_KEY);if(r){
        // Auto-expire games older than 7 days
        const cutoff=Date.now()-7*24*60*60*1000;
        const active=JSON.parse(r.value).filter(g=>!g.analyzedTs||g.analyzedTs>cutoff);
        setPendingGames(active);
        if(active.length!==JSON.parse(r.value).length) await window.storage.set(PENDING_KEY,JSON.stringify(active));
      }}catch{}
    })();
  },[]);

  useEffect(()=>{
    if(!homeTeam||!awayTeam)return;
    if(homeTeam!==prevTeams.current.home||awayTeam!==prevTeams.current.away){
      prevTeams.current={home:homeTeam,away:awayTeam};setGameResult(null);setError(null);
      setMcResult(null);setForecastData(null);
      loadAllData();
      // Auto-fetch weather for outdoor stadiums
      if(!STADIUM_CTX[homeTeam]?.indoor&&OUTDOOR_STADIUMS[homeTeam]){
        fetchWeatherForecast(homeTeam);
      }
    }
  },[homeTeam,awayTeam]);

  async function loadAllData(){
    setDataLoading(true);
    setHomeStats(EMPTY_STATS);setAwayStats(EMPTY_STATS);setHomeHL(false);setAwayHL(false);
    setInjuries("");setLines(null);setLineMove(null);setFormData(null);setRankData(null);
    setPressureData(null);setEnsembleData(null);setOlData(null);setMicroData(null);
    setGarbageData(null);setLeverageData(null);setCoachData(null);setCpoeData(null);
    setContradictions([]);setAlignments([]);
    setSplitsData(null);setRefData(null);setPrimeData(null);setMultiData(null);setSituationalData(null);
    [setStatsStatus,setInjuryStatus,setLinesStatus,setFormStatus,setRankStatus,
     setPressureStatus,setEnsembleStatus,setOlStatus,setMicroStatus,
     setGarbageStatus,setLeverageStatus,setCoachStatus,setCpoeStatus,
     setSplitsStatus,setRefStatus,setPrimeStatus,setMultiStatus,setSituationalStatus].forEach(s=>s("loading"));

    // ── Check session cache first (avoids re-fetching within 30 min) ─────────
    const cached = {
      stats:    cacheGet(homeTeam,awayTeam,"stats"),
      inj:      cacheGet(homeTeam,awayTeam,"inj"),
      formrank: cacheGet(homeTeam,awayTeam,"formrank"),
      lines:    cacheGet(homeTeam,awayTeam,"lines"),
      pressure: cacheGet(homeTeam,awayTeam,"pressure"),
      ensemble: cacheGet(homeTeam,awayTeam,"ensemble"),
      ol:       cacheGet(homeTeam,awayTeam,"ol"),
      micro:    cacheGet(homeTeam,awayTeam,"micro"),
      garbage:  cacheGet(homeTeam,awayTeam,"garbage"),
      leverage: cacheGet(homeTeam,awayTeam,"leverage"),
      coach:    cacheGet(homeTeam,awayTeam,"coach"),
      cpoe:     cacheGet(homeTeam,awayTeam,"cpoe"),
      splits:   cacheGet(homeTeam,awayTeam,"splits"),
      ref:      cacheGet(homeTeam,awayTeam,"ref"),
      primesite:cacheGet(homeTeam,awayTeam,"prime"),
      multi:    cacheGet(homeTeam,awayTeam,"multi"),
      sit:      cacheGet(homeTeam,awayTeam,"sit"),
    };
    const needsFetch = k => !cached[k];

    const [statsR,injR,formRR,linesR,pressR,ensR,olR,microR,garbR,levR,coachR,cpoeR,splitsR,refR,primeR,multiR,sitR]=await Promise.allSettled([
      needsFetch("stats")    ? fetchStatsData()    : Promise.resolve(cached.stats),
      needsFetch("inj")      ? fetchInjuryData()   : Promise.resolve(cached.inj),
      needsFetch("formrank") ? fetchFormRankData()  : Promise.resolve(cached.formrank),
      needsFetch("lines")    ? fetchLinesData()     : Promise.resolve(cached.lines),
      needsFetch("pressure") ? fetchPressureData()  : Promise.resolve(cached.pressure),
      needsFetch("ensemble") ? fetchEnsembleData()  : Promise.resolve(cached.ensemble),
      needsFetch("ol")       ? fetchOLData()        : Promise.resolve(cached.ol),
      needsFetch("micro")    ? fetchMicroData()     : Promise.resolve(cached.micro),
      needsFetch("garbage")  ? fetchGarbageData()   : Promise.resolve(cached.garbage),
      needsFetch("leverage") ? fetchLeverageData()  : Promise.resolve(cached.leverage),
      needsFetch("coach")    ? fetchCoachData()     : Promise.resolve(cached.coach),
      needsFetch("cpoe")     ? fetchCPOEData()      : Promise.resolve(cached.cpoe),
      needsFetch("splits")   ? fetchSplitsData()    : Promise.resolve(cached.splits),
      needsFetch("ref")      ? fetchRefData()       : Promise.resolve(cached.ref),
      needsFetch("prime")    ? fetchPrimeData()     : Promise.resolve(cached.primesite),
      needsFetch("multi")    ? fetchMultiSeasonData(): Promise.resolve(cached.multi),
      needsFetch("sit")      ? fetchSituationalData(): Promise.resolve(cached.sit),
    ]);

    if(statsR.status==="fulfilled")  applyStats(statsR.value);       else setStatsStatus("error");
    if(injR.status==="fulfilled")    applyInjuries(injR.value);      else setInjuryStatus("error");
    if(formRR.status==="fulfilled")  applyFormRank(formRR.value);    else{setFormStatus("error");setRankStatus("error");}
    if(linesR.status==="fulfilled")  applyLines(linesR.value);       else setLinesStatus("error");
    if(pressR.status==="fulfilled")  applyPressure(pressR.value);    else setPressureStatus("error");
    if(ensR.status==="fulfilled")    applyEnsemble(ensR.value);      else setEnsembleStatus("error");
    if(olR.status==="fulfilled")     applyOL(olR.value);             else setOlStatus("error");
    if(microR.status==="fulfilled")  applyMicro(microR.value);       else setMicroStatus("error");
    if(garbR.status==="fulfilled")   applyGarbage(garbR.value);      else setGarbageStatus("error");
    if(levR.status==="fulfilled")    applyLeverage(levR.value);      else setLeverageStatus("error");
    if(coachR.status==="fulfilled")  applyCoach(coachR.value);       else setCoachStatus("error");
    if(cpoeR.status==="fulfilled")   applyCPOE(cpoeR.value);         else setCpoeStatus("error");
    if(splitsR.status==="fulfilled") applySplits(splitsR.value);     else setSplitsStatus("error");
    if(refR.status==="fulfilled")    applyRef(refR.value);           else setRefStatus("error");
    if(primeR.status==="fulfilled")  applyPrime(primeR.value);       else setPrimeStatus("error");
    if(multiR.status==="fulfilled")  applyMulti(multiR.value);       else setMultiStatus("error");
    if(sitR.status==="fulfilled")    applySituational(sitR.value);   else setSituationalStatus("error");

    // ── Write successful results to session cache ─────────────────────────────
    if(statsR.status==="fulfilled")   cacheSet(homeTeam,awayTeam,"stats",statsR.value);
    if(injR.status==="fulfilled")     cacheSet(homeTeam,awayTeam,"inj",injR.value);
    if(formRR.status==="fulfilled")   cacheSet(homeTeam,awayTeam,"formrank",formRR.value);
    if(linesR.status==="fulfilled")   cacheSet(homeTeam,awayTeam,"lines",linesR.value);
    if(pressR.status==="fulfilled")   cacheSet(homeTeam,awayTeam,"pressure",pressR.value);
    if(ensR.status==="fulfilled")     cacheSet(homeTeam,awayTeam,"ensemble",ensR.value);
    if(olR.status==="fulfilled")      cacheSet(homeTeam,awayTeam,"ol",olR.value);
    if(microR.status==="fulfilled")   cacheSet(homeTeam,awayTeam,"micro",microR.value);
    if(garbR.status==="fulfilled")    cacheSet(homeTeam,awayTeam,"garbage",garbR.value);
    if(levR.status==="fulfilled")     cacheSet(homeTeam,awayTeam,"leverage",levR.value);
    if(coachR.status==="fulfilled")   cacheSet(homeTeam,awayTeam,"coach",coachR.value);
    if(cpoeR.status==="fulfilled")    cacheSet(homeTeam,awayTeam,"cpoe",cpoeR.value);
    if(splitsR.status==="fulfilled")  cacheSet(homeTeam,awayTeam,"splits",splitsR.value);
    if(refR.status==="fulfilled")     cacheSet(homeTeam,awayTeam,"ref",refR.value);
    if(primeR.status==="fulfilled")   cacheSet(homeTeam,awayTeam,"prime",primeR.value);
    if(multiR.status==="fulfilled")   cacheSet(homeTeam,awayTeam,"multi",multiR.value);
    if(sitR.status==="fulfilled")     cacheSet(homeTeam,awayTeam,"sit",sitR.value);

    // ── Update pipeline timestamps and compute health ─────────────────────
    const now=Date.now();
    const ts={};
    const signalMap=[["stats",statsR],["injuries",injR],["form",formRR],["lines",linesR],["pressure",pressR],["ensemble",ensR],["ol",olR],["micro",microR],["garbage",garbR],["leverage",levR],["coach",coachR],["cpoe",cpoeR],["splits",splitsR],["ref",refR],["prime",primeR],["multi",multiR],["situational",sitR]];
    signalMap.forEach(([name,r])=>{if(r.status==="fulfilled")ts[name]=now;});
    setFetchTimestamps(ts);
    setPipelineHealth(computePipelineHealth(ts));

    setDataLoading(false);
  }

  // ── Fetch helpers ─────────────────────────────────────────────────────────
  async function fetchStatsData(){return callClaude({useSearch:true,prompt:`Search 2025-26 NFL season stats for ${homeTeam} and ${awayTeam}: W-L, PPG, pts allowed/g, passing yds/g, rushing yds/g.\nONLY JSON: {"home":{"wins":N,"losses":N,"ppg":N,"papg":N,"passYds":N,"rushYds":N},"away":{...}}`});}
  function applyStats(text){try{const m=text.match(/\{[\s\S]*\}/);if(!m)throw new Error();const p=JSON.parse(m[0]);const s=v=>(v&&v!==0)?String(v):"";setHomeStats({wins:s(p.home?.wins),losses:s(p.home?.losses),ppg:s(p.home?.ppg),papg:s(p.home?.papg),passYds:s(p.home?.passYds),rushYds:s(p.home?.rushYds)});setAwayStats({wins:s(p.away?.wins),losses:s(p.away?.losses),ppg:s(p.away?.ppg),papg:s(p.away?.papg),passYds:s(p.away?.passYds),rushYds:s(p.away?.rushYds)});setStatsStatus("success");setHomeHL(true);setAwayHL(true);setTimeout(()=>{setHomeHL(false);setAwayHL(false);},3000);}catch{setStatsStatus("error");}}
  async function fetchInjuryData(){return callClaude({useSearch:true,prompt:`Current NFL injury report for ${homeTeam} and ${awayTeam}. Out/Doubtful/Questionable only.\nPlain text: "${homeTeam} Injuries:\n[Player] ([Pos]) — [Status] ([Injury])\n${awayTeam} Injuries:\n[Player] ([Pos]) — [Status] ([Injury])"`});}
  function applyInjuries(text){if(text.trim()){setInjuries(text.trim());setInjuryStatus("success");}else setInjuryStatus("error");}
  async function fetchFormRankData(){return callClaude({useSearch:true,maxTokens:1100,prompt:`Search 2025-26 NFL data for ${homeTeam} and ${awayTeam}: last 5 W/L+ATS, avg pts L5, streak, off/def rank, RZ%, 3rd down%.\nONLY JSON: {"form":{"home":{"results":[{"result":"W","ats":"C"},...],"l5Record":"3-2","l5ATS":"3-2","avgPtsL5":N,"streak":"W2","note":""},"away":{...}},"rankings":{"home":{"offRank":N,"defRank":N,"rzOff":N,"rzDef":N,"thirdOff":N,"thirdDef":N},"away":{...}}}`});}
  function applyFormRank(text){try{const m=text.match(/\{[\s\S]*\}/);if(!m)throw new Error();const p=JSON.parse(m[0]);if(p.form){setFormData(p.form);setFormStatus("success");}else setFormStatus("error");if(p.rankings){setRankData(p.rankings);setRankStatus("success");}else setRankStatus("error");}catch{setFormStatus("error");setRankStatus("error");}}
  async function fetchLinesData(){return callClaude({useSearch:true,maxTokens:900,prompt:`Search sportsbook lines for ${awayTeam} @ ${homeTeam}. Model lines.\nONLY JSON: {"awayScore":N,"homeScore":N,"spread":N,"favTeam":"full name","total":N,"totalLean":"over/under","awayML":"+/-NNN","homeML":"+/-NNN","spreadConfidence":"Low/Medium/High","totalConfidence":"Low/Medium/High","lineMove":{"open":"KC -3","current":"KC -4.5","sharpSide":"name","summary":"1 sentence"}}`});}
  function applyLines(text){try{const m=text.match(/\{[\s\S]*\}/);if(!m)throw new Error();const p=JSON.parse(m[0]);const{lineMove:lm,...lo}=p;setLines(lo);setLinesStatus("success");if(lm?.open)setLineMove(lm);}catch{setLinesStatus("error");}}
  async function fetchPressureData(){return callClaude({useSearch:true,maxTokens:800,prompt:`Search 2025-26 NFL pressure rate stats for ${homeTeam} and ${awayTeam}: pressure allowed%, pass rush win%, sack rate%, hurry rate%.\nONLY JSON: {"home":{"pressureAllowed":N,"passRushWin":N,"sackRate":N,"hurryRate":N,"note":""},"away":{...},"matchupEdge":"which team has pressure advantage and why","spreadImpact":N,"spreadAdjNote":""}`});}
  function applyPressure(text){try{const m=text.match(/\{[\s\S]*\}/);if(!m)throw new Error();setPressureData(JSON.parse(m[0]));setPressureStatus("success");}catch{setPressureStatus("error");}}
  async function fetchEnsembleData(){return callClaude({useSearch:true,maxTokens:800,prompt:`Search DraftKings, FanDuel, Caesars, BetMGM lines for ${awayTeam} @ ${homeTeam}.\nONLY JSON: {"books":[{"book":"DraftKings","spread":N,"favTeam":"full name","total":N},...],"favTeam":"consensus fav","sharpConsensus":"where sharp money is","exploit":"market edge or insight"}`});}
  function applyEnsemble(text){try{const m=text.match(/\{[\s\S]*\}/);if(!m)throw new Error();setEnsembleData(JSON.parse(m[0]));setEnsembleStatus("success");}catch{setEnsembleStatus("error");}}
  async function fetchOLData(){return callClaude({useSearch:true,maxTokens:900,prompt:`Search 2025-26 NFL OL data for ${homeTeam} and ${awayTeam}: starter availability, sack rate trend, PFF grade, run block rank, key OL injuries. OL Health Score 0-100.\nONLY JSON: {"home":{"healthScore":N,"startersOut":N,"sackRateTrend":"up/down/stable","avgPFFGrade":N,"runBlockRank":N,"keyInjuries":[],"note":""},"away":{...},"spreadImpact":"","totalImpact":""}`});}
  function applyOL(text){try{const m=text.match(/\{[\s\S]*\}/);if(!m)throw new Error();setOlData(JSON.parse(m[0]));setOlStatus("success");}catch{setOlStatus("error");}}
  async function fetchMicroData(){const ctx=STADIUM_CTX[homeTeam]||{};return callClaude({useSearch:true,maxTokens:800,prompt:`Search contextual factors for ${awayTeam} @ ${homeTeam}: travel distance/timezone, days rest each team, week spot, desperation, crowd advantage.\nONLY JSON: {"travelPenalty":"","travelColor":"#f59e0b","restEdge":"","restColor":"#4ade80","turfRisk":null,"weekSpot":"","desperationIndex":"","crowdAdvantage":null,"compositeAdj":N,"compositeNote":""}`});}
  function applyMicro(text){try{const m=text.match(/\{[\s\S]*\}/);if(!m)throw new Error();setMicroData(JSON.parse(m[0]));setMicroStatus("success");}catch{setMicroStatus("error");}}

  // ── NEW fetch helpers ─────────────────────────────────────────────────────
  async function fetchGarbageData(){return callClaude({useSearch:true,maxTokens:900,prompt:`Search 2025-26 NFL garbage-time stats for ${homeTeam} and ${awayTeam}. Garbage time = plays when win probability <10% or >90% with <5 min remaining. Find: raw PPG, points scored specifically in garbage time, adjusted PPG without garbage time, whether season stats are significantly contaminated.
ONLY JSON: {"home":{"rawPPG":N,"garbagePoints":N,"adjustedPPG":N,"contaminated":bool,"note":"1-line insight"},"away":{...},"spreadImpact":"how garbage-time inflation or deflation affects the model spread prediction","contaminated":bool}`});}
  function applyGarbage(text){try{const m=text.match(/\{[\s\S]*\}/);if(!m)throw new Error();setGarbageData(JSON.parse(m[0]));setGarbageStatus("success");}catch{setGarbageStatus("error");}}

  async function fetchLeverageData(){return callClaude({useSearch:true,maxTokens:900,prompt:`Search 2025-26 NFL luck/regression data for ${homeTeam} and ${awayTeam}. Find: turnover differential vs expected (fumble recovery rate, INT luck), EPA per drive, expected wins vs actual wins (pythagorean expectation), close game record (1-score games).
Luck score: +5 = very lucky, -5 = very unlucky. Based on fumble recovery %, turnover margin vs expected, close-game record.
ONLY JSON: {"home":{"luckScore":N,"turnoverLuck":N,"fumbleRecovery":N,"epaDrive":N,"regressedRecord":"e.g. 6-6","note":"1-line insight"},"away":{...},"regressionVerdict":"which team is over/underperforming their true talent level and why — key for parlay"}`});}
  function applyLeverage(text){try{const m=text.match(/\{[\s\S]*\}/);if(!m)throw new Error();setLeverageData(JSON.parse(m[0]));setLeverageStatus("success");}catch{setLeverageStatus("error");}}

  async function fetchCoachData(){return callClaude({useSearch:true,maxTokens:900,prompt:`Search 2025-26 NFL coaching aggressiveness data for ${homeTeam} and ${awayTeam} head coaches. Find: 4th down go rate (% of 4th down opportunities they go for it), 2-point conversion attempt rate, fake punt/FG rate, clock management tendencies.
Aggressiveness Index 0-100: 80+ = aggressive (goes for it, 2-pt, fake plays), 20- = conservative (always kicks, plays it safe).
ONLY JSON: {"home":{"coachName":"","aggressivenessIndex":N,"fourthDownGo":N,"twoPtRate":N,"trickPlayRate":N,"clockMgmt":"Good/Average/Poor","note":"1-line insight"},"away":{...},"matchupNote":"coaching style matchup edge — how aggressiveness mismatch affects close-game scenarios","spreadImpact":N,"spreadAdjNote":"why aggressiveness impacts the spread"}`});}
  function applyCoach(text){try{const m=text.match(/\{[\s\S]*\}/);if(!m)throw new Error();setCoachData(JSON.parse(m[0]));setCoachStatus("success");}catch{setCoachStatus("error");}}

  async function fetchCPOEData(){return callClaude({useSearch:true,maxTokens:900,prompt:`Search 2025-26 NFL CPOE (Completion Percentage Over Expected) stats for the starting QBs of ${homeTeam} and ${awayTeam}. CPOE measures how much better/worse a QB completes passes vs the expected completion rate based on depth of target, coverage, and receiver separation. Also find xEPA (expected EPA per play) and the opposing defense's CPOE allowed.
ONLY JSON: {"home":{"qbName":"","cpoe":N,"compPct":N,"expectedCompPct":N,"xEPA":N,"vsDefCPOE":N,"note":"1-line insight"},"away":{...},"matchupEdge":"which QB has the CPOE edge vs the opposing defense and why — be specific","totalImpact":N,"totalImpactNote":"how CPOE mismatch shifts the projected total"}`});}
  function applyCPOE(text){try{const m=text.match(/\{[\s\S]*\}/);if(!m)throw new Error();setCpoeData(JSON.parse(m[0]));setCpoeStatus("success");}catch{setCpoeStatus("error");}}

  // ── NEW: Home/Away splits ─────────────────────────────────────────────────
  async function fetchSplitsData(){return callClaude({useSearch:true,maxTokens:900,prompt:`Search 2025-26 NFL season home/away splits for ${homeTeam} and ${awayTeam}: home W-L record, home ATS record, away W-L, away ATS, home PPG, away PPG, home PAPG, away PAPG.
ONLY JSON: {"home":{"homeRecord":"W-L","homeATS":"W-L","awayRecord":"W-L","awayATS":"W-L","homePPG":N,"awayPPG":N,"homePAPG":N,"awayPAPG":N,"splitNote":"key insight about home/away split"},"away":{...},"spreadImpact":"how the home/away split affects this matchup spread"}`});}
  function applySplits(text){try{const m=text.match(/\{[\s\S]*\}/);if(!m)throw new Error();setSplitsData(JSON.parse(m[0]));setSplitsStatus("success");}catch{setSplitsStatus("error");}}

  // ── NEW: Referee profile ──────────────────────────────────────────────────
  async function fetchRefData(){return callClaude({useSearch:true,maxTokens:700,prompt:`Search for the assigned referee crew for ${awayTeam} @ ${homeTeam} this week in the 2025-26 NFL season. Find referee/crew chief name, their average total points per game officiated this season, average penalties per game, over/under rate for games they officiate, and any notable tendencies.
ONLY JSON: {"crewName":"","avgTotal":N,"penaltiesPerGame":N,"overRate":N,"yardsPerGame":N,"homeTeamATS":"55%","crewRank":N,"totalImpact":"how this crew affects the total for this game"}`});}
  function applyRef(text){try{const m=text.match(/\{[\s\S]*\}/);if(!m)throw new Error();setRefData(JSON.parse(m[0]));setRefStatus("success");}catch{setRefStatus("error");}}

  // ── NEW: Prime time performance ───────────────────────────────────────────
  async function fetchPrimeData(){return callClaude({useSearch:true,maxTokens:800,prompt:`Search for prime time game information for ${awayTeam} @ ${homeTeam}: is this a Thursday Night Football, Sunday Night Football, or Monday Night Football game? Find each team's prime time record ATS this season and career, average points scored in prime time, last 5 prime time game results.
ONLY JSON: {"isPrimeTime":bool,"gameType":"TNF/SNF/MNF or null","network":"NBC/ESPN/Prime Video or null","home":{"primeRecord":"W-L","primeATS":"W-L","avgPtsPT":N,"last5PT":"e.g. W W L W L","note":""},"away":{...},"atsNote":"overall prime time ATS insight for this matchup"}`});}
  function applyPrime(text){try{const m=text.match(/\{[\s\S]*\}/);if(!m)throw new Error();setPrimeData(JSON.parse(m[0]));setPrimeStatus("success");}catch{setPrimeStatus("error");}}

  // ── NEW: Multi-season regression ──────────────────────────────────────────
  async function fetchMultiSeasonData(){return callClaude({useSearch:true,maxTokens:900,prompt:`Search historical NFL data for ${homeTeam} and ${awayTeam} over the last 3 seasons (2022-23, 2023-24, 2024-25). Calculate a weighted win percentage (most recent season 50% weight, prior 30%, 2 seasons ago 20%), weighted ATS percentage, 3-year average PPG and PAPG, and true talent rank 1-32. Identify team trajectory trend.
ONLY JSON: {"home":{"weightedWinPct":N,"weightedAtsPct":N,"avgPPG3yr":N,"avgPAPG3yr":N,"trueTalentRank":N,"trend":"improving/declining/stable","note":"key multi-season insight"},"away":{...},"baselineNote":"how multi-season baseline changes the prediction vs single-season view"}`});}
  function applyMulti(text){try{const m=text.match(/\{[\s\S]*\}/);if(!m)throw new Error();setMultiData(JSON.parse(m[0]));setMultiStatus("success");}catch{setMultiStatus("error");}}

  // ── NEW: Situational ATS ──────────────────────────────────────────────────
  async function fetchSituationalData(){return callClaude({useSearch:true,maxTokens:1000,prompt:`Search historical ATS records for ${homeTeam} and ${awayTeam} in specific situations over the last 3 seasons: off bye week, as home underdog, divisional games, short rest (<6 days), after straight-up loss, prime time, and cold weather games. Include W-L record and ATS percentage for each situation.
ONLY JSON: {"home":{"offByeATS":"58%","offByeRecord":"7-5","homeDogATS":"62%","homeDogRecord":"5-3","divisionalATS":"51%","divisionalRecord":"12-11","shortRestATS":"44%","shortRestRecord":"4-5","afterLossATS":"53%","afterLossRecord":"16-14","primeTimeATS":"55%","primeTimeRecord":"6-5","coldWeatherATS":"60%","coldWeatherRecord":"6-4"},"away":{...}}`});}
  function applySituational(text){try{const m=text.match(/\{[\s\S]*\}/);if(!m)throw new Error();setSituationalData(JSON.parse(m[0]));setSituationalStatus("success");}catch{setSituationalStatus("error");}}

  // ── Auto weather forecast ─────────────────────────────────────────────────
  async function fetchWeatherForecast(team){
    const stadium=OUTDOOR_STADIUMS[team];
    if(!stadium)return;
    setForecastLoading(true);setForecastData(null);
    try{
      const text=await callClaude({useSearch:true,maxTokens:600,prompt:`Search for the weather forecast for ${stadium.city} on game day for the upcoming NFL game at ${team}'s stadium. Find the temperature in Fahrenheit, wind speed in mph, and precipitation probability for Sunday (or game day).
ONLY JSON: {"location":"${stadium.city}","tempF":N,"windMph":N,"precipPct":N,"description":"e.g. Partly cloudy, 42°F","icon":"emoji weather icon","suggested":"dome/ideal/cold/wind/rain","reasoning":"why this weather category"}
Rules: cold=temp<35F. wind=windMph>=20. rain=precipPct>=40. ideal=everything else. dome only for indoor stadiums.`});
      const m=text.match(/\{[\s\S]*\}/);
      if(m)setForecastData(JSON.parse(m[0]));
    }catch(e){console.error("Weather forecast failed",e);}
    setForecastLoading(false);
  }

  // ── Bankroll unit management ──────────────────────────────────────────────
  async function addUnit(entry){
    const newH=[entry,...unitHistory].slice(0,500);
    setUnitHistory(newH);
    try{await window.storage.set(UNITS_KEY,JSON.stringify(newH));}catch{}
  }
  async function clearUnits(){
    setUnitHistory([]);
    try{await window.storage.delete(UNITS_KEY);}catch{}
  }

  // ── Auto-fetch all pending game results ───────────────────────────────────
  async function fetchAllResults(){
    if(!pendingGames.length||fetchingResults) return;
    setFetchingResults(true);
    const remaining=[...pendingGames];
    const completed=[];

    for(let i=0;i<remaining.length;i++){
      const g=remaining[i];
      setFetchProgress(`${abb(g.awayTeam)} @ ${abb(g.homeTeam)} (${i+1}/${remaining.length})`);
      try{
        const score=await fetchFinalScore(g.awayTeam,g.homeTeam,g.analyzedAt);
        if(score.found){
          // Calculate ATS and total results
          const hScore=parseFloat(score.homeScore),aScore=parseFloat(score.awayScore);
          const sp=parseFloat(g.modelSpread||0);
          const margin=hScore-aScore;
          const atsCover=(margin+sp)>0.5,atsPush=Math.abs(margin+sp)<=0.5;
          const actualTotal=hScore+aScore,projTotal=parseFloat(g.modelTotal||44);
          const totOver=actualTotal>projTotal;
          const totCorrect=totOver===(g.modelTotalLean?.toUpperCase()==="OVER");
          // Auto-log to backtest
          const resultEntry={
            homeTeam:g.homeTeam,awayTeam:g.awayTeam,
            confidence:g.confidence,
            modelSpread:sp,actualMargin:margin,
            projTotal,actualTotal,
            spreadCorrect:atsCover&&!atsPush,
            totalCorrect:totCorrect,
            atsResult:atsCover?"COVER":atsPush?"PUSH":"NO COVER",
            totalResult:totOver?"OVER":"UNDER",
            date:score.gameDate||g.analyzedAt,
            actualScoreStr:`${abb(g.awayTeam)} ${aScore} – ${hScore} ${abb(g.homeTeam)}`,
            autoFetched:true,
          };
          await addBacktestResult(resultEntry);
          completed.push(g.awayTeam+"|"+g.homeTeam);
        }
      }catch(e){console.error("fetchResult failed",g.awayTeam,"@",g.homeTeam,e);}
      // Small delay to avoid rate limiting
      if(i<remaining.length-1) await new Promise(r=>setTimeout(r,800));
    }

    // Remove successfully fetched games from pending
    const stillPending=remaining.filter(g=>!completed.includes(g.awayTeam+"|"+g.homeTeam));
    setPendingGames(stillPending);
    try{await window.storage.set(PENDING_KEY,JSON.stringify(stillPending));}catch{}
    setFetchingResults(false);
    setFetchProgress("");
  }

  async function dismissPending(index){
    const updated=pendingGames.filter((_,i)=>i!==index);
    setPendingGames(updated);
    try{await window.storage.set(PENDING_KEY,JSON.stringify(updated));}catch{}
  }

  // ── Deep analysis ────────────────────────────────────────────────────────
  async function runAnalysis(){
    if(!homeTeam||!awayTeam)return;
    setLoading(true);setGameResult(null);setError(null);
    const bs=(t,s)=>{const p=[];if(s.wins||s.losses)p.push(`${s.wins}W-${s.losses}L`);if(s.ppg)p.push(`PPG:${s.ppg}`);if(s.papg)p.push(`PAPG:${s.papg}`);if(s.passYds)p.push(`Pass:${s.passYds}`);if(s.rushYds)p.push(`Rush:${s.rushYds}`);return p.length?`${t}: ${p.join(", ")}`:t;};
    const fd=(t,k)=>{const d=formData?.[k];return d?`${t} L5:${d.l5Record} ATS:${d.l5ATS} Streak:${d.streak} AvgPts:${d.avgPtsL5}`:""};
    const rd=(t,k)=>{const d=rankData?.[k];return d?`${t} Off#${d.offRank} Def#${d.defRank} RZOff:${d.rzOff}% 3rdOff:${d.thirdOff}%`:""};
    const lc=lines?`Lines: ${abb(lines.favTeam||"")} -${lines.spread} O/U:${lines.total}(${lines.totalLean}) ML:${abb(awayTeam)}${lines.awayML}/${abb(homeTeam)}${lines.homeML}`:"";
    const lm=lineMove?`LineMove: ${lineMove.open}→${lineMove.current} Sharp:${lineMove.sharpSide}`:"";
    const adj=weatherAdjust(weather);
    const logitWP=lines?spreadToWinProb(lines.spread,lines.favTeam,homeTeam):{homeWin:50,awayWin:50};
    const pressCtx=pressureData?`PRESSURE: ${abb(awayTeam)} pressure allowed:${pressureData.away?.pressureAllowed||"?"}% vs ${abb(homeTeam)} rush win:${pressureData.home?.passRushWin||"?"}%. Edge:${pressureData.matchupEdge||""} Adj:${pressureData.spreadImpact||0}pts`:"";
    const ensCtx=ensembleData?`MARKET: Consensus ${ensembleData.favTeam?abb(ensembleData.favTeam):""}-${(()=>{const b=ensembleData.books||[];return b.length?(b.reduce((s,b)=>s+(b.spread||0),0)/b.length).toFixed(1):"?"})()}. Sharp:${ensembleData.sharpConsensus||""}`:"";
    const olCtx=olData?`OL: ${abb(homeTeam)} health:${olData.home?.healthScore||"?"} (${olData.home?.startersOut||0} out). ${abb(awayTeam)} health:${olData.away?.healthScore||"?"} (${olData.away?.startersOut||0} out). ${olData.spreadImpact||""}`:"";
    const microCtx=microData?`MICRO: Travel:${microData.travelPenalty||"N/A"}. Rest:${microData.restEdge||"N/A"}. Week:${microData.weekSpot||""}. Adj:${microData.compositeAdj||0}pts`:"";
    const garbCtx=garbageData?`GARBAGE-TIME FILTER: ${abb(homeTeam)} adj PPG:${garbageData.home?.adjustedPPG||"?"}(raw:${garbageData.home?.rawPPG||"?"},${garbageData.home?.contaminated?"CONTAMINATED":"clean"}). ${abb(awayTeam)} adj PPG:${garbageData.away?.adjustedPPG||"?"}(${garbageData.away?.contaminated?"CONTAMINATED":"clean"}). ${garbageData.spreadImpact||""}`:"";
    const levCtx=leverageData?`LUCK REGRESSION: ${abb(homeTeam)} luck:${leverageData.home?.luckScore||0}(EPA/drive:${leverageData.home?.epaDrive||"?"},fumbleRec:${leverageData.home?.fumbleRecovery||"?"}%,regressed:${leverageData.home?.regressedRecord||"?"}). ${abb(awayTeam)} luck:${leverageData.away?.luckScore||0}(regressed:${leverageData.away?.regressedRecord||"?"}). Verdict:${leverageData.regressionVerdict||""}`:"";
    const coachCtx=coachData?`COACHING INDEX: ${abb(homeTeam)} coach:${coachData.home?.coachName||"?"} aggr:${coachData.home?.aggressivenessIndex||"?"}/100(4th:${coachData.home?.fourthDownGo||"?"}%,2pt:${coachData.home?.twoPtRate||"?"}%). ${abb(awayTeam)} coach:${coachData.away?.coachName||"?"} aggr:${coachData.away?.aggressivenessIndex||"?"}/100. Matchup:${coachData.matchupNote||""} Adj:${coachData.spreadImpact||0}pts`:"";
    const cpoeCtx=cpoeData?`CPOE: ${abb(homeTeam)} QB ${cpoeData.home?.qbName||""} CPOE:${cpoeData.home?.cpoe||"?"} vs def. ${abb(awayTeam)} QB ${cpoeData.away?.qbName||""} CPOE:${cpoeData.away?.cpoe||"?"}. Edge:${cpoeData.matchupEdge||""} Total impact:${cpoeData.totalImpact||0}pts`:"";
    const logitCtx=`LOGIT TRANSFORM: Market implies ${abb(homeTeam)} ${logitWP.homeWin}% win prob from spread. Compare to model output for divergence signal.`;
    const splitsCtx=splitsData?`HOME/AWAY SPLITS: ${abb(homeTeam)} home record:${splitsData.home?.homeRecord||"?"} ATS:${splitsData.home?.homeATS||"?"}. ${abb(awayTeam)} away record:${splitsData.away?.awayRecord||"?"} ATS:${splitsData.away?.awayATS||"?"}. ${splitsData.spreadImpact||""}`:"";
    const refCtx=refData?`REFEREE CREW: ${refData.crewName||"Unknown"} avg total:${refData.avgTotal||"?"} penalties/g:${refData.penaltiesPerGame||"?"} over rate:${refData.overRate||"?"}%. ${refData.totalImpact||""}`:"";
    const primeCtx=primeData?.isPrimeTime?`PRIME TIME (${primeData.gameType||""}): ${abb(homeTeam)} PT ATS:${primeData.home?.primeATS||"?"} ${primeData.home?.last5PT||""}. ${abb(awayTeam)} PT ATS:${primeData.away?.primeATS||"?"}. ${primeData.atsNote||""}`:"";
    const multiCtx=multiData?`MULTI-SEASON BASELINE: ${abb(homeTeam)} weighted win%:${multiData.home?.weightedWinPct||"?"}% ATS%:${multiData.home?.weightedAtsPct||"?"}% rank:#${multiData.home?.trueTalentRank||"?"} trend:${multiData.home?.trend||"?"}. ${abb(awayTeam)} weighted win%:${multiData.away?.weightedWinPct||"?"}% ATS%:${multiData.away?.weightedAtsPct||"?"}% rank:#${multiData.away?.trueTalentRank||"?"}. ${multiData.baselineNote||""}`:"";
    const sitCtx=situationalData?`SITUATIONAL ATS: ${abb(homeTeam)} off-bye:${situationalData.home?.offByeATS||"?"} div:${situationalData.home?.divisionalATS||"?"} home-dog:${situationalData.home?.homeDogATS||"?"}. ${abb(awayTeam)} away-short-rest:${situationalData.away?.shortRestATS||"?"} after-loss:${situationalData.away?.afterLossATS||"?"}`:"";
    // ── Build learning context from model's history ───────────────────────
    const fp=fingerprintGame({weather,lines,primeData,multiData},{homeTeam,awayTeam});
    const pr=lookupPatterns(fp,patternMemory);
    setCurrentFingerprint(fp); setPatternResult(pr);
    const tb=computeTeamBias(backtestHistory);
    setTeamBias(tb);
    const learningCtx=buildLearningContext(learnedWeights,pr,tb,backtestHistory,homeTeam,awayTeam);
    const divNote=isDivisional(homeTeam,awayTeam)?`DIVISIONAL (${getDivision(homeTeam)})`:"";
    const existingLegs=parlayLegs.length>0?`EXISTING LEGS: ${parlayLegs.map((l,i)=>`L${i+1}:${abb(l.awayTeam)}@${abb(l.homeTeam)} ${l.betType}:${l.pick}`).join(", ")}`:"";

    const prompt=`Elite NFL parlay handicapper. 17 signal layers + self-learning context. ONE wrong leg kills the ticket. Synthesize ALL signals below.

MATCHUP: ${awayTeam} @ ${homeTeam}
Venue:${venue==="home"?homeTeam+" home":venue==="away"?awayTeam+" home":"Neutral"} Weather:${weather==="dome"?"Dome":weather==="cold"?"Cold<35F":weather==="wind"?"Wind20+":weather==="rain"?"Rain/Snow":"Ideal"}
${divNote} ${adj.note?`WEATHER: ${adj.note}`:""}

STATS (raw): ${bs(homeTeam,homeStats)} | ${bs(awayTeam,awayStats)}
FORM: ${fd(homeTeam,"home")} | ${fd(awayTeam,"away")}
RANKINGS: ${rd(homeTeam,"home")} | ${rd(awayTeam,"away")}
${injuries?`INJURIES: ${injuries}`:""}
${lc} ${lm}
${pressCtx}
${ensCtx}
${olCtx}
${microCtx}
${garbCtx}
${levCtx}
${coachCtx}
${cpoeCtx}
${logitCtx}
${splitsCtx}
${refCtx}
${primeCtx}
${multiCtx}
${sitCtx}
${learningCtx}
${existingLegs}

Return ONLY JSON (no markdown):
{
  "homeWin":N,"awayWin":N,
  "predictedScore":"KC 27 - LV 17",
  "spreadPick":"KC -4.5",
  "total":N,"totalLean":"over/under","totalWinProb":N,
  "winProb":N,"confidence":"LOW/MEDIUM/HIGH",
  "winner":"full team name",
  "parlayRisk":"LOW/MEDIUM/HIGH/VERY HIGH",
  "publicBetting":{"awayBetPct":N,"awayMoneyPct":N,"rlm":bool,"rlmNote":"","sharpSide":"team name","note":""},
  "qbMatchup":{"homeQB":{"name":"","team":"${homeTeam}","rating":N,"tds":N,"ints":N,"vsDefRating":N,"note":""},"awayQB":{...},"edge":"home/away/even","note":""},
  "situations":{"flags":["situational risk"],"edges":["situational edge"]},
  "edges":["edge1 — must reference specific signal data","edge2","edge3"],
  "flags":["flag1 — must reference specific signal data","flag2"],
  "analysis":"500-600 words integrating ALL 17 signals. Structure: 1) Win prob + logit validation 2) Spread with all composite adjustments (pressure+OL+coach+micro+weather+splits+situational) 3) Total with CPOE+weather+ref crew adj 4) Garbage-time filtered stats 5) Luck regression verdict 6) Multi-season baseline vs single-season 7) Coaching aggressiveness in close-game scenarios 8) CPOE matchup 9) Market ensemble + RLM 10) Home/away splits relevance 11) Situational ATS spots 12) Referee crew total impact 13) Prime time factor if applicable 14) Final parlay recommendation with specific bet"
}

COMPOSITE SPREAD ADJ (apply all layers):
1. Base spread
2. Pressure rate mismatch (${pressureData?.spreadImpact||0}pts)
3. OL degradation
4. Weather (${adj.spreadAdj}pts)
5. Micro-context (${microData?.compositeAdj||0}pts)
6. Coaching aggressiveness (${coachData?.spreadImpact||0}pts)
7. Market ensemble divergence → toward sharp side
8. CPOE total impact (${cpoeData?.totalImpact||0}pts on total)
9. Garbage-time filter (use adjusted PPG not raw)
10. Luck regression (regressed record, not actual W-L)
11. Logit transform validation (flag if model diverges >3% from market-implied prob)

RISK: LOW=65%+ all signals aligned sharp no luck no garbage contamination OL healthy; MEDIUM=55-64%; HIGH=50-54% any red flag; VERY HIGH=<50% multiple risk signals.`;

    try{
      const text=await callClaude({prompt,useSearch:true,maxTokens:1800});
      const m=text.match(/\{[\s\S]*\}/);if(!m)throw new Error("No JSON");
      const result=JSON.parse(m[0]);
      setGameResult(result);
      // ── Save to pending games for auto-result fetch ───────────────────────
      const pendingEntry={
        awayTeam,homeTeam,
        modelSpread:lines?.spread,
        favTeam:lines?.favTeam,
        modelTotal:result.total||lines?.total,
        modelTotalLean:result.totalLean||lines?.totalLean,
        confidence:result.confidence,
        analyzedAt:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"}),
        analyzedTs:Date.now(),
      };
      const updatedPending=[pendingEntry,...pendingGames.filter(g=>!(g.homeTeam===homeTeam&&g.awayTeam===awayTeam))].slice(0,20);
      setPendingGames(updatedPending);
      try{await window.storage.set(PENDING_KEY,JSON.stringify(updatedPending));}catch{}
      // ── Run Monte Carlo simulation in the background ───────────────────────
      setMcRunning(true);
      setTimeout(()=>{
        try{
          const mc=runMonteCarlo({homeWinProb:result.winProb||50,vegasSpread:lines?.spread||3,modelSpread:parseFloat((result.spreadPick||"").replace(/[^0-9.]/g,""))||lines?.spread||3,vegasTotal:result.total||lines?.total||44,homeTeam,weather});
          setMcResult(mc);
        }catch(e){console.error("MC error",e);}
        setMcRunning(false);
      },50);
      // ── Capture signal attribution for self-learning ──────────────────────
      const rawSignals={pressureData,cpoeData,leverageData,garbageData,coachData,olData,microData,lines,splitsData,situationalData,multiData,refData,primeData,weather};
      lastAttributionRef.current = attributeSignals(result, rawSignals);
      // ── Run contradiction detection ────────────────────────────────────────
      const ctSignals={pressureData,cpoeData,leverageData,garbageData,coachData,olData,lines,weather};
      const{contradictions:ct,alignments:al}=detectContradictions(ctSignals);
      setContradictions(ct);setAlignments(al);
      setAnalyzedGames(prev=>{
        const filtered=prev.filter(g=>!(g.homeTeam===homeTeam&&g.awayTeam===awayTeam));
        return [...filtered,{homeTeam,awayTeam,result,lines,weather,venue,pressureData,olData,microData,cpoeData,coachData,leverageData,garbageData}].slice(0,8);
      });
    }catch(e){setError(e.message||"Analysis failed.");}
    setLoading(false);
  }

  // ── Backend analytics management functions ────────────────────────────────
  async function saveSignalWeights(w){
    setSignalWeights(w);
    try{await window.storage.set(WEIGHTS_KEY,JSON.stringify(w));}catch{}
  }

  async function addBacktestResult(result){
    const newH=[result,...backtestHistory].slice(0,100);
    setBacktestHistory(newH);
    // ── Rebuild calibration ───────────────────────────────────────────────
    const cal=buildCalibration(newH);
    setCalibration(cal);
    try{await window.storage.set(BACKTEST_KEY,JSON.stringify(newH));}catch{}
    try{await window.storage.set(CALIBRATION_KEY,JSON.stringify(cal));}catch{}

    // ── Auto-classify mistake ─────────────────────────────────────────────
    if(!result.spreadCorrect){
      const cats=classifyMistake(result,result,lastAttributionRef.current||{},{homeTeam,awayTeam,weather});
      const mistakeEntry={...result,categories:cats,date:new Date().toLocaleDateString()};
      const newMistakes=[mistakeEntry,...mistakes].slice(0,200);
      setMistakes(newMistakes);
      try{await window.storage.set(MISTAKE_KEY,JSON.stringify(newMistakes));}catch{}
    }

    // ── Recompute drift and feature importance ────────────────────────────
    const drift=detectConceptDrift(newH);
    setDriftResult(drift);
    setFeatureImportance(computeFeatureImportance(newH));

    // ── Self-learning: only activates after MIN_SAMPLE games ──────────────
    if(newH.length < MIN_SAMPLE) return;
    const attribution = lastAttributionRef.current;
    if(!attribution) return;
    const updatedWeights = updateWeightsOnline(learnedWeights, attribution, result.spreadCorrect);
    setLearnedWeights(updatedWeights);
    try{await window.storage.set(LEARNING_KEY,JSON.stringify(updatedWeights));}catch{}
    if(currentFingerprint){
      const updatedMemory = { ...patternMemory };
      if(!updatedMemory[currentFingerprint])updatedMemory[currentFingerprint]={wins:0,total:0};
      updatedMemory[currentFingerprint].total++;
      if(result.spreadCorrect)updatedMemory[currentFingerprint].wins++;
      setPatternMemory(updatedMemory);
      try{await window.storage.set(PATTERN_KEY,JSON.stringify(updatedMemory));}catch{}
    }
    setTeamBias(computeTeamBias(newH));
  }

  async function clearBacktest(){
    setBacktestHistory([]);setCalibration(null);
    try{await window.storage.delete(BACKTEST_KEY);}catch{}
    try{await window.storage.delete(CALIBRATION_KEY);}catch{}
  }

  async function resetLearning(){
    setLearnedWeights({...DEFAULT_WEIGHTS});
    setPatternMemory({});
    setTeamBias([]);
    lastAttributionRef.current=null;
    try{await window.storage.delete(LEARNING_KEY);}catch{}
    try{await window.storage.delete(PATTERN_KEY);}catch{}
  }

  async function clearMistakes(){
    setMistakes([]);
    try{await window.storage.delete(MISTAKE_KEY);}catch{}
  }

  async function applyAutoCalibration(calibratedWeights){
    setLearnedWeights(calibratedWeights);
    setSignalWeights(calibratedWeights);
    try{await window.storage.set(LEARNING_KEY,JSON.stringify(calibratedWeights));}catch{}
    try{await window.storage.set(WEIGHTS_KEY,JSON.stringify(calibratedWeights));}catch{}
  }

  async function addCLVEntry(entry){
    const newH=[entry,...clvHistory].slice(0,100);
    setClvHistory(newH);
    try{await window.storage.set(CLV_KEY,JSON.stringify(newH));}catch{}
  }

  async function clearCLV(){
    setClvHistory([]);
    try{await window.storage.delete(CLV_KEY);}catch{}
  }

  // Build calibration stats from backtest history
  function buildCalibration(hist){
    const byConf={HIGH:{wins:0,total:0},MEDIUM:{wins:0,total:0},LOW:{wins:0,total:0}};
    const byBetType={Spread:{wins:0,total:0},Moneyline:{wins:0,total:0},Over:{wins:0,total:0},Under:{wins:0,total:0}};
    let totalW=0,totalG=0;
    hist.forEach(g=>{
      const conf=g.confidence||"MEDIUM";
      if(byConf[conf]){byConf[conf].total++;if(g.spreadCorrect)byConf[conf].wins++;}
      totalG++;if(g.spreadCorrect)totalW++;
      if(g.betType&&byBetType[g.betType]){byBetType[g.betType].total++;if(g.correct)byBetType[g.betType].wins++;}
    });
    return{byConfidence:byConf,byBetType,total:totalG,overallRate:totalG>0?Math.round(totalW/totalG*100):null};
  }

  async function analyzeParlayLegs(){
    if(parlayLegs.length<2)return;
    setAnalyzingParlay(true);setParlayAnalysis(null);
    const legStr=parlayLegs.map((l,i)=>`Leg ${i+1}: ${l.awayTeam} @ ${l.homeTeam} — ${l.betType}: ${l.pick} (${l.winProb}%, ${l.risk}${l.rlm?" RLM":""}${l.cpoeEdge?" CPOE-EDGE":""}${l.coachEdge?" COACH-EDGE":""}${l.luckRegressed?" LUCK-REGRESSED":""}${l.keyNumFlag?` KEY#${l.keyNumFlag.kn}`:""}${l.divisional?" DIV":""}${l.homedog?" HOMEDOG":""})`).join("\n");
    const combProb=parlayLegs.reduce((a,l)=>a*(l.winProb||55)/100,1)*100;
    try{
      const text=await callClaude({useSearch:true,maxTokens:1100,prompt:`Elite parlay analyst. ${parlayLegs.length}-leg parlay. Real money. Brutal.

${legStr}
Combined: ${combProb.toFixed(1)}%

**Grade:** A-F + reason
**Strongest Leg:** reference CPOE, coaching, luck regression, garbage filter if applicable
**Weakest Leg:** specific bust risk
**Key Number Risk:** any near -3/-7
**Signal Quality:** legs with most complete signal stack vs thin data legs
**Luck Trap Legs:** any leg riding a lucky team likely to regress
**Correlation:** weather/total correlations between legs
**Sharp Action:** RLM + market consensus legs
**Recommendation:** Play all / Swap Leg X / Reduce / Avoid — name specific legs
**Adjusted Probability:** accounting for correlations
**Score:** X/10 — 280 words max.`});
      setParlayAnalysis(text);
    }catch{setParlayAnalysis("Analysis unavailable.");}
    setAnalyzingParlay(false);
  }

  async function saveParlay(result,notes){
    const entry={date:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}),legs:parlayLegs,result,notes,combinedProb:(parlayLegs.reduce((a,l)=>a*(l.winProb||55)/100,1)*100).toFixed(1)};
    const newH=[entry,...history].slice(0,30);setHistory(newH);
    try{await window.storage.set(HIST_KEY,JSON.stringify(newH));}catch{}
  }
  async function clearHistory(){setHistory([]);try{await window.storage.delete(HIST_KEY);}catch{}}
  function applyAutoSuggestion(sug){
    const newLegs=(sug.parlayLegs||[]).map(leg=>{
      const g=analyzedGames[leg.gameIndex];if(!g)return null;
      const r=g.result;const isDiv=isDivisional(g.homeTeam,g.awayTeam);const isHomeDog=g.lines&&g.lines.favTeam&&g.lines.favTeam!==g.homeTeam;
      const winnerIsHome=r.winner&&g.homeTeam.toLowerCase().includes(r.winner.toLowerCase().split(" ").pop());
      return{awayTeam:g.awayTeam,homeTeam:g.homeTeam,betType:leg.betType,pick:leg.pick,pickTeam:winnerIsHome?g.homeTeam:g.awayTeam,winProb:r.winProb||55,risk:r.parlayRisk||"MEDIUM",rlm:r.publicBetting?.rlm,divisional:isDiv,homedog:!!isHomeDog,keyNumFlag:keyNumFlag(g.lines?.spread),cpoeEdge:!!(g.cpoeData?.matchupEdge),coachEdge:!!(g.coachData?.spreadImpact),luckRegressed:!!(g.leverageData?.regressionVerdict)};
    }).filter(Boolean).slice(0,4);
    setParlayLegs(newLegs);setParlayAnalysis(null);
  }

  const addToParlay=leg=>{if(parlayLegs.length<4)setParlayLegs(p=>[...p,leg]);};
  const removeFromParlay=i=>{setParlayLegs(p=>p.filter((_,idx)=>idx!==i));setParlayAnalysis(null);};
  const canAnalyze=homeTeam&&awayTeam;
  const homeColor=tc(homeTeam),awayColor=tc(awayTeam);
  const statusDots=[["📊",statsStatus],["🩹",injuryStatus],["📈",formStatus],["💰",linesStatus],["🔥",pressureStatus],["📡",ensembleStatus],["🛡️",olStatus],["🔬",microStatus],["🗑️",garbageStatus],["🎲",leverageStatus],["🧠",coachStatus],["🎯",cpoeStatus],["🏠",splitsStatus],["📋",situationalStatus],["📅",multiStatus],["🦺",refStatus],["🌙",primeStatus]];

  return(<div style={{minHeight:"100vh",background:"#060610",backgroundImage:"radial-gradient(ellipse at 12% 12%,rgba(25,15,55,0.6) 0%,transparent 50%),radial-gradient(ellipse at 88% 88%,rgba(10,30,10,0.4) 0%,transparent 50%)",fontFamily:"'Barlow Condensed',sans-serif",color:"#fff",padding:"0 0 60px"}}>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;500;600;700;800;900&display=swap');
      *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
      html,body{overscroll-behavior:none;}
      select option{background:#10101f;}
      ::-webkit-scrollbar{width:3px;} ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.07);border-radius:2px;}
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
      @keyframes spin{to{transform:rotate(360deg)}}
      @keyframes fadeSlideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      details summary::-webkit-details-marker{display:none;}
      /* ── Touch targets ── */
      button,select,input,textarea{touch-action:manipulation;}
      button{min-height:36px;}
      select,input{min-height:40px;}
      /* ── Mobile breakpoint ── */
      @media(max-width:600px){
        .nfl-header-subtitle{display:none;}
        .nfl-inner{padding:10px 10px 0!important;}
        .nfl-panel{padding:12px!important;}
        select,input{font-size:16px!important;} /* prevents iOS zoom on focus */
        .nfl-grid-2{grid-template-columns:1fr!important;}
        .nfl-grid-3{grid-template-columns:1fr 1fr!important;}
        .nfl-grid-4{grid-template-columns:1fr 1fr!important;}
        .nfl-stat-grid{grid-template-columns:1fr 1fr!important;}
        .nfl-team-select{font-size:15px!important;}
        .nfl-analyze-btn{font-size:14px!important;padding:15px!important;}
        .nfl-mc-tabs{flex-wrap:wrap;}
      }
      /* ── Fullscreen ── */
      :fullscreen .nfl-fs-hide{display:none!important;}
      :-webkit-full-screen .nfl-fs-hide{display:none!important;}
      :fullscreen .nfl-inner{padding-bottom:env(safe-area-inset-bottom,20px)!important;}
      /* ── Safe area (iPhone notch) ── */
      .nfl-header{padding-left:max(18px,env(safe-area-inset-left))!important;padding-right:max(18px,env(safe-area-inset-right))!important;}
    `}</style>

    {/* Header */}
    <div className="nfl-header" style={{borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"12px 18px",display:"flex",alignItems:"center",gap:"10px",background:"rgba(0,0,0,0.45)",backdropFilter:"blur(20px)",position:"sticky",top:0,zIndex:100}}>
      <div style={{width:"28px",height:"28px",borderRadius:"6px",background:"linear-gradient(135deg,#3b1c08,#1c0e04)",border:"1px solid rgba(251,191,36,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",flexShrink:0}}>🏈</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:"15px",fontWeight:900,letterSpacing:"0.08em",textTransform:"uppercase",lineHeight:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>NFL Parlay Model</div>
        <div className="nfl-header-subtitle" style={{fontSize:"7px",color:"#2a2a2a",letterSpacing:"0.1em",textTransform:"uppercase",marginTop:"1px"}}>17 Signals · EV + Kelly · Bankroll · Weather Forecast · Line Shopping · Injury Impact · Monte Carlo · Self-Learning</div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:"6px",flexShrink:0}}>
        {parlayLegs.length>0&&<div style={{background:"rgba(251,191,36,0.06)",border:"1px solid rgba(251,191,36,0.16)",borderRadius:"5px",padding:"3px 7px",textAlign:"center"}}><div style={{fontSize:"7px",color:"#444"}}>PARLAY</div><div style={{fontSize:"13px",fontWeight:900,color:"#fbbf24",lineHeight:1}}>{parlayLegs.length}/4</div></div>}
        <button onClick={toggleFullscreen} title={isFullscreen?"Exit Full Screen":"Full Screen"} style={{width:"32px",height:"32px",borderRadius:"6px",border:"1px solid rgba(255,255,255,0.12)",background:"rgba(255,255,255,0.06)",color:"#888",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",flexShrink:0,transition:"all 0.15s"}}
          onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.12)";e.currentTarget.style.color="#fff";}}
          onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.06)";e.currentTarget.style.color="#888";}}>
          {isFullscreen?"⊠":"⛶"}
        </button>
      </div>
    </div>

    <div className="nfl-inner" style={{maxWidth:"780px",margin:"0 auto",padding:"16px 14px 0"}}>
      {/* ── Weekly Best Bet ─── */}
      <WeeklyPick onLoadMatchup={(away,home)=>{setAwayTeam(away);setHomeTeam(home);}}/>
      {/* ── Auto-fetch results (shows when pending games exist) ─── */}
      <AutoResultsPanel pendingGames={pendingGames} onFetchResults={fetchAllResults} onDismiss={dismissPending} fetching={fetchingResults} fetchProgress={fetchProgress}/>
      <HistoryTracker history={history} onClear={clearHistory}/>
      {/* ── Advanced systems panels ─── */}
      <DriftDetectorPanel driftResult={driftResult} onResetWeights={resetLearning}/>
      <FeatureImportancePanel features={featureImportance} onAutoCalibrate={applyAutoCalibration} onUpdateWeights={saveSignalWeights}/>
      <MistakeDigestPanel mistakes={mistakes}/>
      {/* ── Self-learning + backend analytics ─── */}
      <SelfLearningPanel learnedWeights={learnedWeights} patternMemory={patternMemory} teamBias={teamBias} backtestHistory={backtestHistory} onResetLearning={resetLearning}/>
      <BankrollPanel unitHistory={unitHistory} onAddUnit={addUnit} onClearUnits={clearUnits}/>
      <CalibrationPanel calibration={calibration}/>
      <SignalWeightPanel weights={signalWeights} onUpdateWeights={saveSignalWeights} calibrationStats={calibration}/>
      <CLVPanel clvHistory={clvHistory} onAddCLV={addCLVEntry} onClearCLV={clearCLV} modelSpread={gameResult?.spreadPick?.replace(/[^\d.]/g,"")||lines?.spread} lines={lines} homeTeam={homeTeam} awayTeam={awayTeam}/>
      <BacktestPanel backtestHistory={backtestHistory} onAddResult={addBacktestResult} onClearBacktest={clearBacktest} modelSpread={lines?.spread} modelTotal={gameResult?.total||lines?.total} modelTotalLean={gameResult?.totalLean||lines?.totalLean} homeTeam={homeTeam} awayTeam={awayTeam} confidence={gameResult?.confidence}/>
      {parlayLegs.length>0&&<ParlayBuilder legs={parlayLegs} onRemove={removeFromParlay} parlayAnalysis={parlayAnalysis} onAnalyze={analyzeParlayLegs} analyzing={analyzingParlay} onSave={saveParlay}/>}
      {analyzedGames.length>=2&&<ParlayAutoSuggester analyzedGames={analyzedGames} onApplySuggestion={applyAutoSuggestion}/>}
      <WeekSchedule onSelectGame={(away,home)=>{setAwayTeam(away);setHomeTeam(home);}}/>
      {/* Auto weather forecast for outdoor games */}
      <WeatherForecastPanel homeTeam={homeTeam} forecastData={forecastData} forecastLoading={forecastLoading} onApplyWeather={setWeather} currentWeather={weather}/>

      {/* Matchup */}
      <Panel mb="10px" border="rgba(255,255,255,0.07)">
        <div style={{fontSize:"8px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#2a2a2a",marginBottom:"7px"}}>{parlayLegs.length>0?`Game ${parlayLegs.length+1} of 4`:"Analyze Game"}</div>
        <SavedPresets onLoad={p=>{setAwayTeam(p.away);setHomeTeam(p.home);setVenue(p.venue||"home");setWeather(p.weather||"dome");}} currentHome={homeTeam} currentAway={awayTeam} currentVenue={venue} currentWeather={weather}/>
        <div style={{display:"flex",gap:"8px",alignItems:"center",marginBottom:"8px"}}>
          <div style={{flex:1}}><label style={{display:"block",fontSize:"8px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#555",marginBottom:"5px",fontFamily:"'Barlow Condensed',sans-serif"}}>Away Team</label><select value={awayTeam} onChange={e=>setAwayTeam(e.target.value)} style={{width:"100%",padding:"10px 12px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"7px",color:"#fff",fontSize:"13px",cursor:"pointer",outline:"none",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:600,appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='7' viewBox='0 0 10 7'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23888' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 10px center"}}><option value="">— Select —</option>{NFL_TEAMS.filter(t=>t!==homeTeam).map(t=><option key={t} value={t}>{t}</option>)}</select></div>
          <div style={{fontSize:"13px",fontWeight:900,color:"#1a1a28",paddingTop:"19px",flexShrink:0}}>@</div>
          <div style={{flex:1}}><label style={{display:"block",fontSize:"8px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#555",marginBottom:"5px",fontFamily:"'Barlow Condensed',sans-serif"}}>Home Team</label><select value={homeTeam} onChange={e=>setHomeTeam(e.target.value)} style={{width:"100%",padding:"10px 12px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"7px",color:"#fff",fontSize:"13px",cursor:"pointer",outline:"none",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:600,appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='7' viewBox='0 0 10 7'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23888' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 10px center"}}><option value="">— Select —</option>{NFL_TEAMS.filter(t=>t!==awayTeam).map(t=><option key={t} value={t}>{t}</option>)}</select></div>
        </div>
        {(homeTeam||awayTeam)&&<div style={{display:"flex",gap:"3px",marginBottom:"8px"}}>{awayTeam&&<div style={{flex:1,height:"2px",borderRadius:"1px",background:awayColor,opacity:0.4}}/>}{homeTeam&&<div style={{flex:1,height:"2px",borderRadius:"1px",background:homeColor,opacity:0.4}}/>}</div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"7px"}}>
          {[["Venue",venue,setVenue,[["home","🏟 Home Field"],["away","✈️ Away Field"],["neutral","⚖️ Neutral"]]],["Weather",weather,setWeather,[["dome","☁️ Dome/Indoor"],["ideal","🌤 Ideal"],["cold","❄️ Cold <35°F"],["wind","💨 Windy 20+mph"],["rain","🌧 Rain/Snow"]]]].map(([lbl,val,setter,opts])=>(
            <div key={lbl}><label style={{display:"block",fontSize:"8px",fontWeight:700,letterSpacing:"0.09em",textTransform:"uppercase",color:"#2a2a2a",marginBottom:"3px"}}>{lbl}</label><select value={val} onChange={e=>setter(e.target.value)} style={{width:"100%",padding:"7px 9px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"5px",color:"#bbb",fontSize:"12px",outline:"none",fontFamily:"'Barlow Condensed',sans-serif",appearance:"none",cursor:"pointer"}}>{opts.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>
          ))}
        </div>
      </Panel>

      {/* Data status */}
      {/* ── Pipeline health + data status ── */}
      {(homeTeam&&awayTeam)&&<PipelineStatusPanel health={pipelineHealth} onRefresh={loadAllData} isLoading={dataLoading}/>}
      {(homeTeam&&awayTeam)&&<div style={{display:"flex",alignItems:"center",gap:"5px",marginBottom:"9px",padding:"5px 10px",background:"rgba(255,255,255,0.015)",border:"1px solid rgba(255,255,255,0.04)",borderRadius:"6px",flexWrap:"wrap"}}>
        <span style={{fontSize:"8px",fontWeight:700,color:dataLoading?"#f59e0b":"#555",fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.07em"}}>{dataLoading?"Loading 17 signals in parallel…":"Signals"}</span>
        {statusDots.map(([icon,st],i)=><div key={i} style={{display:"flex",alignItems:"center",gap:"2px"}}><span style={{fontSize:"8px"}}>{icon}</span><div style={{width:"4px",height:"4px",borderRadius:"50%",background:st==="success"?"#4ade80":st==="loading"?"#f59e0b":st==="error"?"#f87171":"#1a1a2a",animation:st==="loading"?"pulse 1s infinite":"none"}}/></div>)}
      </div>}

      {/* Lines */}
      {(homeTeam&&awayTeam)&&<Panel border={lines?"rgba(192,132,252,0.12)":"rgba(255,255,255,0.06)"} mb="10px"><PanelTitle icon="💰" title="Lines & Projections" tag={linesStatus==="success"?"live":linesStatus==="loading"?"…":undefined}/>{linesStatus==="loading"&&<Skel cols={3}/>}{lines&&(<><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"5px",marginBottom:"5px"}}><div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:"6px",padding:"8px 6px",textAlign:"center"}}><div style={{fontSize:"7px",color:"#1a1a2a",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px",fontWeight:700,letterSpacing:"0.09em"}}>SPREAD</div><div style={{fontSize:"14px",fontWeight:900,color:"#4ade80",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{lines.favTeam?abb(lines.favTeam):"?"} -{lines.spread||"?"}</div>{keyNumFlag(lines.spread)&&<div style={{fontSize:"7px",color:"#f59e0b",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"2px",fontWeight:700}}>⚠ KEY #{keyNumFlag(lines.spread).kn}</div>}</div><div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:"6px",padding:"8px 6px",textAlign:"center"}}><div style={{fontSize:"7px",color:"#1a1a2a",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px",fontWeight:700,letterSpacing:"0.09em"}}>TOTAL O/U</div><div style={{fontSize:"14px",fontWeight:900,color:"#c084fc",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{lines.total||"?"}</div><div style={{fontSize:"7px",fontWeight:700,color:lines.totalLean==="over"?"#4ade80":"#f87171",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"2px"}}>LEAN {(lines.totalLean||"").toUpperCase()}{weatherAdjust(weather).note?` →${(parseFloat(lines.total||0)+weatherAdjust(weather).totalAdj).toFixed(1)}`:""}</div></div><div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:"6px",padding:"8px 6px",textAlign:"center"}}><div style={{fontSize:"7px",color:"#1a1a2a",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px",fontWeight:700,letterSpacing:"0.09em"}}>SCORE</div><div style={{fontSize:"11px",fontWeight:900,color:"#fff",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1.3}}>{abb(awayTeam)} {lines.awayScore}<br/>{abb(homeTeam)} {lines.homeScore}</div></div></div><div style={{display:"flex",gap:"4px",marginBottom:lineMove?"5px":"0"}}>{[[awayTeam,lines.awayML,awayColor],[homeTeam,lines.homeML,homeColor]].map(([t,ml,c])=><div key={t} style={{flex:1,display:"flex",justifyContent:"space-between",alignItems:"center",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.04)",borderRadius:"4px",padding:"4px 7px"}}><span style={{fontSize:"9px",fontWeight:700,color:c,fontFamily:"'Barlow Condensed',sans-serif"}}>{abb(t)}</span><span style={{fontSize:"12px",fontWeight:900,color:"#fff",fontFamily:"'Barlow Condensed',sans-serif"}}>{ml||"—"}</span></div>)}</div>{lineMove&&<div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.04)",borderRadius:"4px",padding:"5px 8px",display:"flex",gap:"8px",alignItems:"center",flexWrap:"wrap"}}><span style={{fontSize:"8px",color:"#4ade80",fontWeight:700,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.09em"}}>📈 MOVE</span><span style={{fontSize:"9px",color:"#aaa",fontFamily:"'Barlow Condensed',sans-serif"}}>{lineMove.open} → {lineMove.current}</span><span style={{fontSize:"8px",color:"#fbbf24",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700}}>Sharp: {lineMove.sharpSide}</span></div>}</> )}<div style={{marginTop:"6px",fontSize:"8px",color:"#101018",fontFamily:"'Barlow Condensed',sans-serif"}}>AI projections · Entertainment only</div></Panel>}

      {/* All signal panels */}
      {(homeTeam&&awayTeam)&&lines&&<LogitPanel lines={lines} homeTeam={homeTeam} awayTeam={awayTeam} modelWinProb={gameResult?.winProb}/>}
      {lineMove&&<SteamMoveAlert lineMove={lineMove}/>}
      {(homeTeam&&awayTeam)&&<PressurePanel pressureData={pressureData} loading={pressureStatus==="loading"} homeTeam={homeTeam} awayTeam={awayTeam}/>}
      {(homeTeam&&awayTeam)&&<MarketEnsemblePanel ensemble={ensembleData} loading={ensembleStatus==="loading"} homeTeam={homeTeam} awayTeam={awayTeam}/>}
      {(homeTeam&&awayTeam)&&<OLPanel olData={olData} loading={olStatus==="loading"} homeTeam={homeTeam} awayTeam={awayTeam}/>}
      {(homeTeam&&awayTeam)&&<GarbageTimePanel garbageData={garbageData} loading={garbageStatus==="loading"} homeTeam={homeTeam} awayTeam={awayTeam}/>}
      {(homeTeam&&awayTeam)&&<LeveragePanel leverageData={leverageData} loading={leverageStatus==="loading"} homeTeam={homeTeam} awayTeam={awayTeam}/>}
      {(homeTeam&&awayTeam)&&<CoachingPanel coachData={coachData} loading={coachStatus==="loading"} homeTeam={homeTeam} awayTeam={awayTeam}/>}
      {(homeTeam&&awayTeam)&&<CPOEPanel cpoeData={cpoeData} loading={cpoeStatus==="loading"} homeTeam={homeTeam} awayTeam={awayTeam}/>}
      {(homeTeam&&awayTeam)&&<MicroContextPanel homeTeam={homeTeam} awayTeam={awayTeam} weather={weather} microData={microData} microLoading={microStatus==="loading"}/>}
      {(contradictions.length>0||alignments.length>0)&&<ContradictionPanel contradictions={contradictions} alignments={alignments}/>}
      {/* ── 8 New Feature Panels ── */}
      {(homeTeam&&awayTeam)&&<SplitsPanel splitsData={splitsData} loading={splitsStatus==="loading"} homeTeam={homeTeam} awayTeam={awayTeam}/>}
      {(homeTeam&&awayTeam)&&<SituationalATSPanel situationalData={situationalData} loading={situationalStatus==="loading"} homeTeam={homeTeam} awayTeam={awayTeam}/>}
      {(homeTeam&&awayTeam)&&<MultiSeasonPanel multiData={multiData} loading={multiStatus==="loading"} homeTeam={homeTeam} awayTeam={awayTeam}/>}
      {(homeTeam&&awayTeam)&&<RefPanel refData={refData} loading={refStatus==="loading"}/>}
      {(homeTeam&&awayTeam)&&<PrimeTimePanel primeData={primeData} loading={primeStatus==="loading"} homeTeam={homeTeam} awayTeam={awayTeam}/>}
      {parlayLegs.length>=2&&<CorrelationMatrixPanel legs={parlayLegs} weather={weather}/>}
      {gameResult&&lines&&<DivergenceAlert lines={lines} gameResult={gameResult}/>}
      <SeasonDashboard backtestHistory={backtestHistory} clvHistory={clvHistory} parlayHistory={history} signalWeights={signalWeights}/>
      <PowerRankingsPanel backtestHistory={backtestHistory} onLoadMatchup={(away,home)=>{setAwayTeam(away);setHomeTeam(home);}}/>

      {/* Form + Rankings */}
      {(homeTeam&&awayTeam)&&(formData||rankData||formStatus==="loading")&&<Panel mb="10px"><PanelTitle icon="📈" title="Form & Rankings" tag={formStatus==="success"&&rankStatus==="success"?"live":undefined}/>{(formStatus==="loading"||rankStatus==="loading")&&<Skel cols={2}/>}{(formData||rankData)&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"9px"}}>{[{team:awayTeam,color:awayColor,fk:"away",rk:"away"},{team:homeTeam,color:homeColor,fk:"home",rk:"home"}].map(({team,color,fk,rk})=>{const fd=formData?.[fk],rd=rankData?.[rk];return(<div key={team} style={{borderTop:`2px solid ${color}28`,paddingTop:"8px"}}><div style={{fontSize:"9px",fontWeight:800,color,fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"6px"}}>{abb(team)}</div>{fd&&<div style={{marginBottom:"6px"}}><div style={{display:"flex",gap:"3px",marginBottom:"4px",flexWrap:"wrap"}}>{(fd.results||[]).map((r,i)=><div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"1px"}}><div style={{width:"15px",height:"15px",borderRadius:"50%",background:r.result==="W"?"#16a34a":"#dc2626",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"7px",fontWeight:900,color:"#fff",fontFamily:"'Barlow Condensed',sans-serif"}}>{r.result}</div><div style={{fontSize:"6px",fontWeight:700,color:r.ats==="C"?"#4ade80":"#f87171",fontFamily:"'Barlow Condensed',sans-serif"}}>{r.ats||""}</div></div>)}</div><div style={{display:"flex",gap:"3px",flexWrap:"wrap"}}>{[[fd.l5Record,"L5"],[fd.l5ATS,"ATS"],[fd.streak,"STK"]].map(([v,l])=>v?<div key={l} style={{background:"rgba(255,255,255,0.04)",borderRadius:"3px",padding:"2px 5px",textAlign:"center"}}><div style={{fontSize:"6px",color:"#1a1a2a",fontFamily:"'Barlow Condensed',sans-serif"}}>{l}</div><div style={{fontSize:"10px",fontWeight:800,color:"#ddd",fontFamily:"'Barlow Condensed',sans-serif"}}>{v}</div></div>:null)}</div>{fd.note&&<div style={{fontSize:"8px",color:"#2a2a2a",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"2px",fontStyle:"italic"}}>{fd.note}</div>}</div>}{rd&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"3px"}}>{[["OFF",rd.offRank,"rank"],["DEF",rd.defRank,"rank"],["RZ Off",rd.rzOff,"%"],["RZ Def",rd.rzDef,"%"],["3rd Off",rd.thirdOff,"%"],["3rd Def",rd.thirdDef,"%"]].map(([lbl,v,unit])=>{const isRk=unit==="rank",num=parseFloat(v)||0;const c=isRk?(num<=10?"#4ade80":num<=21?"#f59e0b":"#f87171"):(num>=60?"#4ade80":num>=45?"#f59e0b":"#f87171");return <div key={lbl} style={{background:"rgba(255,255,255,0.03)",borderRadius:"3px",padding:"3px 4px",textAlign:"center"}}><div style={{fontSize:"6px",color:"#1a1a2a",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"1px"}}>{lbl}</div><div style={{fontSize:"10px",fontWeight:800,color:c,fontFamily:"'Barlow Condensed',sans-serif"}}>{isRk?`#${v||"?"}`:v?`${v}%`:"—"}</div></div>;})}</div>}</div>);})}</div>}</Panel>}

      {/* Stats */}
      <Panel mb="10px"><PanelTitle icon="📊" title="Team Stats" tag={statsStatus==="success"?"live":statsStatus==="loading"?"loading…":undefined}/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>{[{team:awayTeam||"Away",s:awayStats,set:setAwayStats,c:awayColor,hl:awayHL},{team:homeTeam||"Home",s:homeStats,set:setHomeStats,c:homeColor,hl:homeHL}].map(({team,s,set,c,hl})=><div key={team} style={{borderTop:`2px solid ${c}28`,paddingTop:"8px"}}><div style={{fontSize:"9px",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:c,marginBottom:"6px",opacity:0.85}}>{abb(team)}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px"}}>{[["Wins","wins"],["Losses","losses"],["PPG","ppg"],["Pts Allow/G","papg"],["Pass Yds/G","passYds"],["Rush Yds/G","rushYds"]].map(([lbl,key])=><StatFld key={key} label={lbl} value={s[key]} onChange={v=>set(prev=>({...prev,[key]:v}))} hl={hl}/>)}</div></div>)}</div><div style={{marginTop:"6px",fontSize:"8px",color:"#1a1a28",fontFamily:"'Barlow Condensed',sans-serif"}}>Auto-fetched · Edit to override</div></Panel>

      {/* Injuries */}
      <Panel mb="13px"><PanelTitle icon="🩹" title="Injury Report" tag={injuryStatus==="success"?"live":injuryStatus==="loading"?"loading…":undefined}/><textarea value={injuries} onChange={e=>setInjuries(e.target.value)} placeholder={injuryStatus==="loading"?"Fetching…":injuryStatus==="noTeams"?"Select both teams…":"None found — add manually"} rows={injuries?Math.min(7,injuries.split("\n").length+1):3} style={{width:"100%",padding:"7px 9px",background:injuryStatus==="success"?"rgba(74,222,128,0.025)":"rgba(255,255,255,0.018)",border:`1px solid ${injuryStatus==="success"?"rgba(74,222,128,0.13)":injuryStatus==="error"?"rgba(248,113,113,0.13)":"rgba(255,255,255,0.06)"}`,borderRadius:"5px",color:"#aaa",fontSize:"10px",outline:"none",resize:"vertical",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.5"}}/></Panel>
      {/* Injury impact quantifier — auto-parses injury text to point values */}
      <InjuryImpactPanel injuries={injuries} homeTeam={homeTeam} awayTeam={awayTeam} lines={lines}/>


      {/* Pattern match alert — fires when current game matches learned history */}
      {patternResult&&<PatternMatchAlert currentFingerprint={currentFingerprint} patternResult={patternResult}/>}

      {/* Analyze button */}
      <button onClick={runAnalysis} disabled={!canAnalyze||loading} style={{width:"100%",padding:"13px",borderRadius:"8px",border:"none",background:canAnalyze&&!loading?"linear-gradient(135deg,#16a34a,#15803d)":"rgba(255,255,255,0.04)",color:canAnalyze&&!loading?"#fff":"#1a1a2a",fontSize:"13px",fontWeight:900,letterSpacing:"0.12em",textTransform:"uppercase",cursor:canAnalyze&&!loading?"pointer":"not-allowed",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"13px",boxShadow:canAnalyze&&!loading?"0 0 20px rgba(22,163,74,0.15)":"none",transition:"all 0.2s"}}>
        {loading?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"8px"}}><span style={{width:"12px",height:"12px",border:"2px solid rgba(255,255,255,0.2)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite"}}/>Running 17-Signal Analysis…</span>:`Analyze Game${parlayLegs.length>0?` (Leg ${parlayLegs.length+1})`:""}`}
      </button>

      {error&&<div style={{background:"rgba(239,68,68,0.05)",border:"1px solid rgba(239,68,68,0.13)",borderRadius:"6px",padding:"8px 11px",color:"#fca5a5",fontSize:"10px",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"10px"}}>⚠ {error}</div>}
      {gameResult&&<GameCard result={gameResult} homeTeam={homeTeam} awayTeam={awayTeam} weather={weather} lines={lines} pressureData={pressureData} olData={olData} microData={microData} cpoeData={cpoeData} coachData={coachData} leverageData={leverageData} garbageData={garbageData} onAddToParlay={addToParlay} parlayFull={parlayLegs.length>=4}/>}
      {/* Monte Carlo always renders when result or simulation is running */}
      {(mcResult||mcRunning)&&<MonteCarloPanel mcResult={mcResult} running={mcRunning} homeTeam={homeTeam} awayTeam={awayTeam} lines={lines}/>}
      {/* EV Calculator + Kelly — appears after analysis */}
      {gameResult&&<EVKellyPanel gameResult={gameResult} lines={lines}/>}
      {/* Line Shopping — shows best available line across books */}
      {gameResult&&ensembleData&&<LineShoppingPanel ensemble={ensembleData} lines={lines} gameResult={gameResult} homeTeam={homeTeam} awayTeam={awayTeam}/>}
      <div style={{textAlign:"center",marginTop:"22px",fontSize:"8px",color:"#0e0e1a",letterSpacing:"0.08em",fontFamily:"'Barlow Condensed',sans-serif"}}>FOR ENTERTAINMENT PURPOSES ONLY · NOT FINANCIAL OR BETTING ADVICE</div>
    </div>
  </div>);
}
