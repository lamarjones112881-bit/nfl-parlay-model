// ── Signal & Cache Utilities ────────────────────────────────────────────────
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
// ═══════════════════════════════════════════════════════════════════════════
// THREE NEW FEATURES:
//   1. Weather Severity Scoring — continuous 0-100 scale replaces binary
//   2. Head-to-Head Matchup Database — franchise vs franchise ATS history
//   3. Opponent-Adjusted Stats — SOS-corrected PPG/PAPG
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// 1. WEATHER SEVERITY ENGINE
// Continuous 0-100 score from real forecast data.
// Replaces the binary 4-category system with calibrated adjustments.
// ═══════════════════════════════════════════════════════════════════════════

function calcWeatherSeverity(tempF, windMph, precipPct) {

export { cacheKey, cacheGet, cacheSet, detectContradictions, calcCLV, calcCompScore, detectSteamMove };
